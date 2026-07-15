'use strict';

const prisma = require('../lib/prisma');

const TJEK_API = 'https://squid-api.tjek.com/v2/offers';
const TJEK_TOKEN = '152000596c6e45d9983eab0c14afebea';

const STORES = [
  { dealerId: '9ba51',  dealerName: 'Netto' },
  { dealerId: '11deC',  dealerName: 'REMA 1000' },
  { dealerId: 'DWZE1w', dealerName: '365discount' },
  { dealerId: '267e1m', dealerName: 'MENY' },
];

async function fetchOffersForDealer({ dealerId, dealerName }) {
  const url = `${TJEK_API}?dealer_ids=${dealerId}&limit=100`;
  const res = await fetch(url, {
    headers: {
      'X-Token': TJEK_TOKEN,
      'User-Agent': 'Mozilla/5.0 (compatible; ClickCasal/1.0)',
    },
  });
  if (!res.ok) throw new Error(`Tjek API ${res.status} for ${dealerName}`);
  const offers = await res.json();
  return offers.map(o => ({
    externalId: o.id,
    dealerId,
    dealerName,
    name: o.heading,
    priceOre: Math.round((o.pricing?.price ?? 0) * 100),
    prePriceOre: o.pricing?.pre_price != null ? Math.round(o.pricing.pre_price * 100) : null,
    validFrom: new Date(o.run_from),
    validUntil: new Date(o.run_till),
  }));
}

async function refreshFlyerOffers() {
  const results = await Promise.allSettled(STORES.map(fetchOffersForDealer));
  const allOffers = results.flatMap((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[flyer] Skipping ${STORES[i].dealerName}: ${r.reason?.message ?? r.reason}`);
      return [];
    }
    return r.value;
  });

  // Upsert all fetched offers
  await Promise.all(
    allOffers.map(offer =>
      prisma.flyerOffer.upsert({
        where: { externalId: offer.externalId },
        update: {
          name: offer.name,
          priceOre: offer.priceOre,
          prePriceOre: offer.prePriceOre,
          validFrom: offer.validFrom,
          validUntil: offer.validUntil,
          fetchedAt: new Date(),
        },
        create: offer,
      })
    )
  );

  // Delete expired offers that are no longer active
  const activeIds = allOffers.map(o => o.externalId);
  await prisma.flyerOffer.deleteMany({
    where: {
      dealerId: { in: STORES.map(s => s.dealerId) },
      externalId: { notIn: activeIds },
    },
  });

  return allOffers.length;
}

module.exports = { refreshFlyerOffers };
