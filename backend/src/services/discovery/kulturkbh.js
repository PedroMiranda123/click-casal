'use strict';

// kulturkbh.dk — Copenhagen culture events, page-rendered HTML (no JS execution needed)
// Categories: Talks, Exhibitions, Music, Literature, Film, Food & Drink, Theatre, Active

const BASE_URL = 'https://www.kulturkbh.dk/en/events/';

async function fetch() {
  const res = await globalThis.fetch(BASE_URL, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'Mozilla/5.0 (compatible; click-casal/1.0)' },
  });
  if (!res.ok) throw new Error(`kulturkbh HTTP ${res.status}`);
  const html = await res.text();

  const events = [];
  // Extract event cards — adjust selectors if HTML changes
  // Pattern: look for structured data in <script type="application/ld+json"> blocks first (most reliable)
  const ldJsonMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const match of ldJsonMatches) {
    try {
      const obj = JSON.parse(match[1]);
      const items = Array.isArray(obj) ? obj : [obj];
      for (const item of items) {
        if (item['@type'] !== 'Event') continue;
        const startAt = item.startDate ? new Date(item.startDate) : null;
        if (!startAt || isNaN(startAt) || startAt < new Date()) continue;

        const externalId = item.url
          ? `kkbh_${Buffer.from(item.url).toString('base64').slice(0, 24)}`
          : `kkbh_${Buffer.from(item.name ?? '').toString('base64').slice(0, 24)}`;

        events.push({
          source: 'kulturkbh',
          externalId,
          title: item.name ?? 'Untitled',
          description: item.description ?? null,
          venueName: item.location?.name ?? null,
          city: 'Copenhagen',
          startAt,
          url: item.url ?? null,
          imageUrl: item.image ?? null,
          category: item.eventAttendanceMode ?? null,
          kind: 'EVENT',
        });
      }
    } catch {
      // malformed JSON block — skip
    }
  }

  // Fallback: if ld+json yields nothing, log it so we know to add HTML parsing
  if (events.length === 0) {
    console.warn('[kulturkbh] no ld+json Event blocks found — page structure may have changed');
  }

  return events;
}

module.exports = { fetch };
