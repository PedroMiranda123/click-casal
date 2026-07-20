'use strict';

// Requires: TICKETMASTER_API_KEY in env
// Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/

const TICKETMASTER_KEY = process.env.TICKETMASTER_API_KEY;
const BASE = 'https://app.ticketmaster.com/discovery/v2/events.json';

async function fetch() {
  if (!TICKETMASTER_KEY) {
    console.warn('[ticketmaster] TICKETMASTER_API_KEY not set — skipping');
    return [];
  }

  const params = new URLSearchParams({
    apikey: TICKETMASTER_KEY,
    countryCode: 'DK',
    city: 'Copenhagen',
    size: '50',
    sort: 'date,asc',
  });

  const res = await globalThis.fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`Ticketmaster HTTP ${res.status}`);

  const data = await res.json();
  const events = data?._embedded?.events ?? [];

  return events.map(e => ({
    source: 'ticketmaster',
    externalId: `tm_${e.id}`,
    title: e.name,
    description: e.info ?? e.pleaseNote ?? null,
    venueName: e._embedded?.venues?.[0]?.name ?? null,
    city: e._embedded?.venues?.[0]?.city?.name ?? 'Copenhagen',
    startAt: new Date(e.dates?.start?.dateTime ?? e.dates?.start?.localDate),
    url: e.url ?? null,
    imageUrl: e.images?.find(img => img.ratio === '16_9' && img.width > 500)?.url ?? null,
    category: e.classifications?.[0]?.segment?.name ?? null,
    kind: 'EVENT',
  }));
}

module.exports = { fetch };
