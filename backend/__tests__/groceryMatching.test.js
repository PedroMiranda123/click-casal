jest.mock('../src/lib/prisma');

const prisma = require('../src/lib/prisma');
const { findDanishTerms, matchItemsToOffers } = require('../src/services/groceryMatching');

function makeOffer(overrides = {}) {
  return {
    id: 'offer-1',
    externalId: 'ext-1',
    dealerId: 'd1',
    dealerName: 'Netto',
    name: 'Arla mælk 1L',
    priceOre: 1295,
    prePriceOre: null,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  };
}

function makeItem(overrides = {}) {
  return {
    id: 'item-1',
    userId: 'user-1',
    name: 'leite',
    checked: false,
    matchedOfferId: null,
    matchedAt: null,
    matchNote: null,
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

// ─── findDanishTerms ───────────────────────────────────────────────────────────

describe('findDanishTerms', () => {
  it('matches exact PT term', () => {
    expect(findDanishTerms('leite')).toMatchObject({ da: ['mælk'] });
  });

  it('is case-insensitive', () => {
    expect(findDanishTerms('LEITE')).toMatchObject({ da: ['mælk'] });
    expect(findDanishTerms('Ovos')).toMatchObject({ da: ['æg'] });
  });

  it('strips accents (pão → pao)', () => {
    expect(findDanishTerms('pao')).toMatchObject({ da: ['brød'] });
    expect(findDanishTerms('cafe')).toMatchObject({ da: ['kaffe'] });
  });

  it('matches full multi-word phrase over single word', () => {
    // "peito de frango" should match before a single "frango" fallback
    const result = findDanishTerms('peito de frango');
    expect(result).not.toBeNull();
    expect(result.da).toContain('kyllingebryst');
    expect(result.matchedPt).toBe('peito de frango');
  });

  it('falls back to single word when full phrase has no hit', () => {
    // "frango grelhado" — no full-phrase entry, but "frango" word matches
    const result = findDanishTerms('frango grelhado');
    expect(result).not.toBeNull();
    expect(result.da).toContain('kylling');
  });

  it('returns null for unknown term', () => {
    expect(findDanishTerms('quinoa orgânica')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(findDanishTerms('')).toBeNull();
  });
});

// ─── matchItemsToOffers ────────────────────────────────────────────────────────

describe('matchItemsToOffers', () => {
  it('does nothing when items list is empty', async () => {
    await matchItemsToOffers([]);
    expect(prisma.flyerOffer.findMany).not.toHaveBeenCalled();
  });

  it('sets matchedOfferId to null when no offers in DB', async () => {
    prisma.flyerOffer.findMany.mockResolvedValue([]);
    prisma.shoppingListItem.update.mockResolvedValue({});

    await matchItemsToOffers([makeItem()]);
    // No update since there are no offers to match against
    expect(prisma.shoppingListItem.update).not.toHaveBeenCalled();
  });

  it('matches leite → mælk → Netto offer and picks it', async () => {
    const offer = makeOffer({ name: 'Arla mælk 1L', dealerName: 'Netto', priceOre: 1295 });
    prisma.flyerOffer.findMany.mockResolvedValue([offer]);
    prisma.shoppingListItem.update.mockResolvedValue({});

    await matchItemsToOffers([makeItem({ name: 'leite' })]);

    expect(prisma.shoppingListItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: expect.objectContaining({
        matchedOfferId: 'offer-1',
        matchNote: expect.stringContaining('mælk'),
      }),
    });
  });

  it('picks the cheapest offer among multiple matches', async () => {
    const expensive = makeOffer({ id: 'offer-a', name: 'mælk 1L', priceOre: 1595, dealerName: 'Meny' });
    const cheap    = makeOffer({ id: 'offer-b', name: 'mælk 0.5L', priceOre: 895,  dealerName: 'Netto' });
    prisma.flyerOffer.findMany.mockResolvedValue([expensive, cheap]);
    prisma.shoppingListItem.update.mockResolvedValue({});

    await matchItemsToOffers([makeItem({ name: 'leite' })]);

    expect(prisma.shoppingListItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: expect.objectContaining({ matchedOfferId: 'offer-b' }),
    });
  });

  it('sets matchedOfferId to null when no offer name contains the Danish term', async () => {
    // Offer exists but name doesn't contain "mælk"
    const offer = makeOffer({ name: 'Kaffe melange 500g' });
    prisma.flyerOffer.findMany.mockResolvedValue([offer]);
    prisma.shoppingListItem.update.mockResolvedValue({});

    await matchItemsToOffers([makeItem({ name: 'leite' })]);

    expect(prisma.shoppingListItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: expect.objectContaining({ matchedOfferId: null }),
    });
  });

  it('sets matchedOfferId to null when item has no dictionary entry', async () => {
    prisma.flyerOffer.findMany.mockResolvedValue([makeOffer()]);
    prisma.shoppingListItem.update.mockResolvedValue({});

    await matchItemsToOffers([makeItem({ name: 'quinoa' })]);

    expect(prisma.shoppingListItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: expect.objectContaining({ matchedOfferId: null }),
    });
  });

  it('includes matchNote with Danish term and store name', async () => {
    const offer = makeOffer({ name: 'Arla mælk 1L', dealerName: 'Rema 1000', priceOre: 1195 });
    prisma.flyerOffer.findMany.mockResolvedValue([offer]);
    prisma.shoppingListItem.update.mockResolvedValue({});

    await matchItemsToOffers([makeItem({ name: 'leite' })]);

    const call = prisma.shoppingListItem.update.mock.calls[0][0];
    expect(call.data.matchNote).toMatch(/mælk/);
    expect(call.data.matchNote).toMatch(/Rema 1000/);
  });

  it('matches peito de frango to kyllingebryst offer', async () => {
    const offer = makeOffer({ id: 'offer-k', name: 'Kyllingebryst 500g', dealerName: '365discount', priceOre: 3995 });
    prisma.flyerOffer.findMany.mockResolvedValue([offer]);
    prisma.shoppingListItem.update.mockResolvedValue({});

    await matchItemsToOffers([makeItem({ name: 'peito de frango' })]);

    expect(prisma.shoppingListItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: expect.objectContaining({ matchedOfferId: 'offer-k' }),
    });
  });
});
