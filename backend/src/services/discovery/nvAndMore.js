'use strict';

// NV & More — nordvestandmore.com/events
// Uses Next.js RSC streaming endpoint with _rsc param to get a cleaner response
// Events are embedded as JSON in the RSC payload

const PAGE_URL = 'https://nordvestandmore.com/events?period=next-week';

function extractEvents(html) {
  const events = [];
  const seen = new Set();

  // Find the events array by looking for objects with the known event shape
  // Pattern: {"id":"uuid","slug":"...","title":"...","date":"YYYY-MM-DD"
  const pattern = /"id":"([0-9a-f-]{36})","slug":"([^"]+)","title":"([^"]+)","description":(?:"((?:[^"\\]|\\.)*)"|(\$\w+)),"date":"(\d{4}-\d{2}-\d{2}(?:T[^"]+)?)"(?:[^}]*)"notionUrl":"([^"]*)"(?:[^}]*)"ownEvent":(true|false)/g;

  let m;
  while ((m = pattern.exec(html)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);

    const slug = m[2];
    const title = m[3];
    const description = m[4] ?? null;
    const dateStr = m[6];
    const notionUrl = m[7];

    const startAt = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
    if (isNaN(startAt.getTime()) || startAt < new Date()) continue;

    events.push({
      source: 'nv_and_more',
      externalId: `nv_${id}`,
      title: title.slice(0, 500),
      description: description?.replace(/\\n/g, ' ').replace(/\\"/g, '"').slice(0, 2000) ?? null,
      venueName: null,
      city: 'Copenhagen',
      startAt,
      url: notionUrl?.startsWith('http') ? notionUrl : `https://nordvestandmore.com/events/${slug}`,
      imageUrl: null,
      category: null,
      kind: 'EVENT',
    });
  }

  console.log(`[nv_and_more] extracted ${events.length} events`);
  return events;
}

async function fetch() {
  const res = await globalThis.fetch(PAGE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; click-casal/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
      'Next-Router-State-Tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22events%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
      'RSC': '1',
    },
  });
  if (!res.ok) throw new Error(`NV & More HTTP ${res.status}`);
  const html = await res.text();
  return extractEvents(html);
}

module.exports = { fetch };
