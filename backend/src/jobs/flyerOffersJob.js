const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { refreshFlyerOffers } = require('../services/flyerOffers');
const { matchItemsToOffers } = require('../services/groceryMatching');

async function runFlyerOffersJob() {
  try {
    console.log('[flyer-cron] Starting flyer offers refresh...');
    const count = await refreshFlyerOffers();
    console.log(`[flyer-cron] Upserted ${count} offers.`);

    console.log('[flyer-cron] Running dictionary matching for unchecked items...');
    const items = await prisma.shoppingListItem.findMany({ where: { checked: false } });
    if (items.length) {
      await matchItemsToOffers(items);
      console.log(`[flyer-cron] Matched ${items.length} items.`);
    } else {
      console.log('[flyer-cron] No items to match.');
    }

    console.log('[flyer-cron] Job completed successfully.');
  } catch (err) {
    console.error('[flyer-cron] Job failed:', err.message);
  }
}

function startFlyerOffersCron() {
  cron.schedule('0 4 * * 1', () => {
    runFlyerOffersJob().catch(err => console.error('[flyer-cron] uncaught error:', err.message));
  }, { timezone: 'Europe/Copenhagen' });
  console.log('[flyer-cron] scheduled for 4am Monday Europe/Copenhagen');
}

module.exports = { startFlyerOffersCron, runFlyerOffersJob };
