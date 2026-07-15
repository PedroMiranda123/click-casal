'use strict';

const { refreshFlyerOffers } = require('../src/services/flyerOffers');
const { matchItemsToOffers } = require('../src/services/groceryMatching');
const prisma = require('../src/lib/prisma');

async function run() {
  console.log('[flyer] Fetching offers...');
  const count = await refreshFlyerOffers();
  console.log(`[flyer] Upserted ${count} offers.`);

  console.log('[flyer] Running dictionary matching for all unchecked items...');
  const items = await prisma.shoppingListItem.findMany({ where: { checked: false } });
  if (items.length) {
    await matchItemsToOffers(items);
    console.log(`[flyer] Matched ${items.length} items.`);
  } else {
    console.log('[flyer] No items to match.');
  }

  await prisma.$disconnect();
}

run().catch(err => {
  console.error('[flyer] Fatal:', err);
  process.exit(1);
});
