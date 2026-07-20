'use strict';

// Hidden Nordvest — Google Calendar public JSON API
// Discovered via devtools on calendar.google.com
// Uses a public browser-level API key (same key sent to all visitors)
// Returns up to 250 events per call, paginated via nextPageToken

const CALENDAR_ID = 'hidden.nordvest%40gmail.com';
const API_KEY = 'AIzaSyDOtGM5jr8bNp1utVpG2_gSRH03RNGBkI8';
const BASE = 'https://clients6.google.com/calendar/v3/calendars';

async function fetch() {
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(); // next 60 days

  const params = new URLSearchParams({
    calendarId: decodeURIComponent(CALENDAR_ID),
    singleEvents: 'true',
    eventTypes: 'default',
    timeZone: 'Europe/Copenhagen',
    maxResults: '250',
    sanitizeHtml: 'true',
    timeMin,
    timeMax,
    key: API_KEY,
  });

  const res = await globalThis.fetch(
    `${BASE}/${CALENDAR_ID}/events?${params}`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; click-casal/1.0)' } }
  );

  if (!res.ok) throw new Error(`Hidden Nordvest API HTTP ${res.status}`);

  const data = await res.json();
  const items = data?.items ?? [];

  const events = items
    .filter(e => e.status === 'confirmed' && e.summary)
    .map(e => {
      const startRaw = e.start?.dateTime ?? e.start?.date;
      const startAt = startRaw ? new Date(startRaw) : null;
      if (!startAt || isNaN(startAt.getTime())) return null;

      // Use iCalUID as stable externalId (deduplicates recurring events by occurrence)
      const externalId = `hn_${(e.iCalUID ?? e.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)}`;

      return {
        source: 'hidden_nordvest',
        externalId,
        title: e.summary.slice(0, 500),
        description: e.description?.slice(0, 2000) ?? null,
        venueName: e.location?.slice(0, 200) ?? null,
        city: 'Copenhagen',
        startAt,
        url: e.htmlLink ?? null,
        imageUrl: null,
        category: 'Community',
        kind: 'EVENT',
      };
    })
    .filter(Boolean);

  console.log(`[hidden_nordvest] found ${events.length} events`);
  return events;
}

module.exports = { fetch };
