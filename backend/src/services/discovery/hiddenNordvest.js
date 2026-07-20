'use strict';

// Source: Hidden Nordvest public Google Calendar iCal feed
// URL: https://calendar.google.com/calendar/ical/hidden.nordvest%40gmail.com/public/basic.ics
// No auth required — public feed.

const ICAL_URL = 'https://calendar.google.com/calendar/ical/hidden.nordvest%40gmail.com/public/basic.ics';

// Minimal iCal parser — no dependency, handles VEVENT blocks only
function parseIcal(text) {
  const events = [];
  const blocks = text.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const get = (key) => {
      const m = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return m ? m[1].trim() : null;
    };
    const rawDtstart = get('DTSTART');
    if (!rawDtstart) continue;

    // Parse YYYYMMDDTHHMMSSZ or YYYYMMDD
    let startAt;
    if (rawDtstart.length >= 15) {
      startAt = new Date(
        `${rawDtstart.slice(0,4)}-${rawDtstart.slice(4,6)}-${rawDtstart.slice(6,8)}T${rawDtstart.slice(9,11)}:${rawDtstart.slice(11,13)}:${rawDtstart.slice(13,15)}Z`
      );
    } else {
      startAt = new Date(`${rawDtstart.slice(0,4)}-${rawDtstart.slice(4,6)}-${rawDtstart.slice(6,8)}T20:00:00Z`);
    }
    if (isNaN(startAt)) continue;
    if (startAt < new Date()) continue; // skip past events

    const uid = get('UID');
    const summary = get('SUMMARY');
    const description = get('DESCRIPTION');
    const url = get('URL') ?? get('LOCATION');

    if (!uid || !summary) continue;

    events.push({
      source: 'hidden_nordvest',
      externalId: `hn_${uid}`,
      title: summary,
      description: description ?? null,
      venueName: 'Hidden Nordvest',
      city: 'Copenhagen',
      startAt,
      url: url?.startsWith('http') ? url : null,
      imageUrl: null,
      category: 'Community',
      kind: 'EVENT',
    });
  }
  return events;
}

async function fetch() {
  const res = await globalThis.fetch(ICAL_URL);
  if (!res.ok) throw new Error(`Hidden Nordvest iCal HTTP ${res.status}`);
  const text = await res.text();
  return parseIcal(text);
}

module.exports = { fetch };
