'use strict';

// NV & More — nordvestandmore.com/events
// Data is embedded as JSON inside a Next.js RSC streaming payload.
// No separate API; events array is injected server-side into the page response.

const PAGE_URL = 'https://nordvestandmore.com/events?period=next-week';

function extractEvents(html) {
  const lines = html.split('\n');
  for (const line of lines) {
    if (!line.includes('"linkedLocations"') || !line.includes('"tags"')) continue;

    const eventPattern = /\{"id":"([^"]+)","slug":"([^"]+)","title":"([^"]+)","description":([^,]+(?:,(?!"date")[^,]+)*),"date":"([^"]+)","endDate":"([^"]*)","endTime":"([^"]*)","location":"([^"]*)","organizer":"([^"]*)","source":"[^"]*","instagramHandle":"[^"]*","sourceType":"[^"]*","price":[^,]+,"currency":"[^"]*","maxSpots":[^,]+,"bookedSpots":[^,]+,"eventType":"[^"]*","tags":\[([^\]]*)\],"coverImage":"[^"]*","isRecurring":[^,]+,"recurrenceRule":"[^"]*","stripeProductId":"[^"]*","stripePriceId":"[^"]*","notionUrl":"([^"]*)","ownEvent":[^,]+,"linkedLocations":\[([^\]]*)\]\}/g;

    const events = [];
    let m;
    while ((m = eventPattern.exec(line)) !== null) {
      const startAt = new Date(m[5]);
      if (isNaN(startAt) || startAt < new Date()) continue;

      let tags = [];
      try { tags = JSON.parse(`[${m[10]}]`); } catch {}

      let venueName = m[8] || null;
      if (!venueName && m[12]) {
        const locName = m[12].match(/"name":"([^"]+)"/);
        if (locName) venueName = locName[1];
      }

      let description = null;
      try {
        const raw = m[4].trim();
        if (raw.startsWith('"') && raw.endsWith('"')) {
          description = raw.slice(1, -1).replace(/\\n/g, ' ').trim().slice(0, 2000);
        }
      } catch {}

      events.push({
        source: 'nv_and_more',
        externalId: `nv_${m[1]}`,
        title: m[3],
        description,
        venueName: venueName?.slice(0, 200) ?? null,
        city: 'Copenhagen',
        startAt,
        url: `https://nordvestandmore.com/events/${m[2]}`,
        imageUrl: null,
        category: tags[0] ?? null,
        kind: 'EVENT',
      });
    }
    if (events.length > 0) return events;
  }
  return [];
}

async function fetch() {
  const res = await globalThis.fetch(PAGE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; click-casal/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`NV & More HTTP ${res.status}`);
  const html = await res.text();
  const events = extractEvents(html);
  console.log(`[nv_and_more] found ${events.length} events`);
  return events;
}

module.exports = { fetch };
