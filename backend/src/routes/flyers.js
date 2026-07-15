'use strict';

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const { STORES } = require('../config/stores');

const router = Router();
router.use(authenticate);

const TJEK_BASE = 'https://squid-api.tjek.com/v2';
const TJEK_TOKEN = '152000596c6e45d9983eab0c14afebea';
const TJEK_HEADERS = {
  'X-Token': TJEK_TOKEN,
  'User-Agent': 'Mozilla/5.0 (compatible; ClickCasal/1.0)',
};

async function tjek(path) {
  const res = await fetch(`${TJEK_BASE}${path}`, { headers: TJEK_HEADERS });
  if (!res.ok) throw new Error(`Tjek ${res.status}: ${path}`);
  return res.json();
}

// GET /flyers/offers?dealer_id=9ba51
// Returns up to 200 offers for a single store.
router.get('/offers', async (req, res) => {
  const { dealer_id } = req.query;
  const store = STORES.find(s => s.dealerId === dealer_id);
  if (!store) return res.status(400).json({ error: 'Unknown dealer_id' });

  try {
    const offers = await tjek(`/offers?dealer_ids=${dealer_id}&limit=100`);
    res.json(offers.map(o => ({
      id: o.id,
      name: o.heading,
      description: o.description ?? null,
      priceOre: Math.round((o.pricing?.price ?? 0) * 100),
      prePriceOre: o.pricing?.pre_price != null ? Math.round(o.pricing.pre_price * 100) : null,
      validFrom: o.run_from,
      validUntil: o.run_till,
      imageUrl: o.images?.view ?? null,
      dealerName: store.dealerName,
      dealerColor: store.color,
    })));
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: 'Failed to fetch offers' });
  }
});

// GET /flyers/catalogs
// Returns the current catalog (cover + metadata) for all stores.
router.get('/catalogs', async (req, res) => {
  try {
    const dealerIds = STORES.map(s => s.dealerId).join(',');
    const catalogs = await tjek(`/catalogs?dealer_ids=${dealerIds}&limit=20`);
    // Keep only the most recent catalog per dealer
    const seen = new Set();
    const deduped = catalogs.filter(c => {
      if (seen.has(c.dealer_id)) return false;
      seen.add(c.dealer_id);
      return true;
    });
    const storeMap = Object.fromEntries(STORES.map(s => [s.dealerId, s]));
    res.json(deduped.map(c => ({
      id: c.id,
      dealerId: c.dealer_id,
      dealerName: storeMap[c.dealer_id]?.dealerName ?? c.branding?.name,
      dealerColor: storeMap[c.dealer_id]?.color ?? '#888',
      label: c.label,
      runFrom: c.run_from,
      runTill: c.run_till,
      pageCount: c.page_count,
      offerCount: c.offer_count,
      coverThumb: c.images?.thumb ?? null,
      coverView: c.images?.view ?? null,
    })));
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: 'Failed to fetch catalogs' });
  }
});

// GET /flyers/catalogs/:id/pages
// Returns all page image URLs for a given catalog.
router.get('/catalogs/:id/pages', async (req, res) => {
  try {
    const pages = await tjek(`/catalogs/${req.params.id}/pages`);
    res.json(pages);
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: 'Failed to fetch pages' });
  }
});

module.exports = router;
