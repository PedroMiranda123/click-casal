'use strict';

// kulturkbh.dk — Copenhagen culture events
// API: https://kulturkbh.dk/events-list.json (no auth required, public JSON feed)
// Fields: date, t (time), title, desc, type, url, location/addr, price, img

const API_URL = 'https://kulturkbh.dk/events-list.json';

const TYPE_CATEGORY = {
  musik: 'Music',
  foredrag: 'Talk',
  udstilling: 'Exhibition',
  litteratur: 'Literature',
  film: 'Film',
  mad: 'Food & Drink',
  teater: 'Theatre',
  active: 'Active',
  festival: 'Festival',
};

async function fetch() {
  const res = await globalThis.fetch(`${API_URL}?v=${Date.now()}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; click-casal/1.0)' },
  });
  if (!res.ok) throw new Error(`kulturkbh HTTP ${res.status}`);

  const events = await res.json();
  const now = new Date();
  const results = [];
  const seen = new Set();

  for (const e of events) {
    if (!e.date || !e.title) continue;

    // Build startAt from date + time
    const timeStr = e.t ? e.t.trim() : '00:00';
    const startAt = new Date(`${e.date}T${timeStr || '00:00'}:00`);
    if (isNaN(startAt.getTime())) continue;
    if (startAt < now) continue;

    const url = e.url ?? null;
    const externalId = `kkbh_${e.src ?? 'x'}_${e.date}_${e.title.slice(0, 30).replace(/\s+/g, '_')}`;

    if (seen.has(externalId)) continue;
    seen.add(externalId);

    results.push({
      source: 'kulturkbh',
      externalId,
      title: e.title.slice(0, 500),
      description: e.desc?.slice(0, 2000) ?? null,
      venueName: (e.location ?? e.addr ?? null)?.slice(0, 200),
      city: 'Copenhagen',
      startAt,
      url,
      imageUrl: e.img?.startsWith('http') ? e.img.slice(0, 1000) : null,
      category: TYPE_CATEGORY[e.type] ?? e.type ?? null,
      kind: 'EVENT',
    });
  }

  console.log(`[kulturkbh] found ${results.length} events`);
  return results;
}

module.exports = { fetch };
