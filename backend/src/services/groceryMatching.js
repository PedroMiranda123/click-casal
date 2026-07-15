'use strict';

const prisma = require('../lib/prisma');
const { GROCERY_TERMS } = require('../data/groceryTerms');

function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // strip diacritics
}

// Build a lookup: normalized PT phrase → { da: string[], originalPt: string }
// Longer phrases come first so "peito de frango" matches before "frango"
const LOOKUP = [];
for (const entry of GROCERY_TERMS) {
  for (const pt of entry.pt) {
    LOOKUP.push({ normPt: normalize(pt), da: entry.da, originalPt: pt });
  }
}
LOOKUP.sort((a, b) => b.normPt.length - a.normPt.length);

function findDanishTerms(label) {
  const normLabel = normalize(label);

  // 1. Full-phrase match (e.g. "peito de frango")
  for (const { normPt, da, originalPt } of LOOKUP) {
    if (normLabel === normPt) return { da, matchedPt: originalPt };
  }
  // Also try full-phrase substring match within the label
  for (const { normPt, da, originalPt } of LOOKUP) {
    if (normLabel.includes(normPt)) return { da, matchedPt: originalPt };
  }

  // 2. Word-by-word fallback — match any word in the label
  const words = normLabel.split(/\s+/);
  for (const word of words) {
    for (const { normPt, da, originalPt } of LOOKUP) {
      if (word === normPt) return { da, matchedPt: originalPt };
    }
  }

  return null;
}

async function matchItemsToOffers(items) {
  if (!items.length) return;

  const now = new Date();
  const offers = await prisma.flyerOffer.findMany({
    where: { validUntil: { gte: now } },
  });
  if (!offers.length) return;

  await Promise.all(
    items.map(item => matchSingleItem(item, offers))
  );
}

async function matchSingleItem(item, offers) {
  const lookup = findDanishTerms(item.name);
  if (!lookup) {
    await prisma.shoppingListItem.update({
      where: { id: item.id },
      data: { matchedOfferId: null, matchedAt: new Date() },
    });
    return;
  }

  // Find all offers whose productName contains the Danish term as a whole word
  const normDa = lookup.da.map(t => normalize(t));
  const matching = offers.filter(o => {
    const normName = normalize(o.name);
    return normDa.some(da => {
      // Escape regex special chars in the term, then require word boundaries
      const escaped = da.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?<![a-zæøå])${escaped}(?![a-zæøå])`, 'i').test(normName);
    });
  });

  if (!matching.length) {
    await prisma.shoppingListItem.update({
      where: { id: item.id },
      data: { matchedOfferId: null, matchedAt: new Date() },
    });
    return;
  }

  // Pick cheapest
  const best = matching.reduce((a, b) => (a.priceOre <= b.priceOre ? a : b));

  const usedDa = lookup.da.find(da => normalize(best.name).includes(normalize(da))) ?? lookup.da[0];
  const matchNote = `Encontrado como "${usedDa}" na ${best.dealerName}`;

  await prisma.shoppingListItem.update({
    where: { id: item.id },
    data: {
      matchedOfferId: best.id,
      matchedAt: new Date(),
      matchNote,
    },
  });
}

module.exports = { matchItemsToOffers, findDanishTerms };
