// Expand a single event into occurrences within [from, to]
function expandOccurrences(event, from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const startAt = new Date(event.startAt);

  if (event.recurrence === 'NONE') {
    if (startAt >= fromDate && startAt <= toDate) return [event];
    return [];
  }

  if (event.recurrence === 'YEARLY') {
    const results = [];
    const startYear = fromDate.getUTCFullYear();
    const endYear = toDate.getUTCFullYear();
    for (let year = startYear; year <= endYear; year++) {
      const occurrence = new Date(Date.UTC(year, startAt.getUTCMonth(), startAt.getUTCDate()));
      if (occurrence < startAt) continue; // before the event's origin date
      if (occurrence >= fromDate && occurrence <= toDate) {
        results.push({ ...event, startAt: occurrence });
      }
    }
    return results;
  }

  if (event.recurrence === 'WEEKLY') {
    const results = [];
    // Iterate UTC days so weekday computation is timezone-independent
    const current = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()));
    const end = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate()));
    while (current <= end) {
      const weekday = current.getUTCDay(); // 0=Sun..6=Sat
      if (current >= startAt && event.recurrenceDays.includes(weekday)) {
        results.push({ ...event, startAt: new Date(current) });
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return results;
  }

  return [];
}

module.exports = { expandOccurrences };
