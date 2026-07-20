'use strict';

const ticketmaster = require('./ticketmaster');
const hiddenNordvest = require('./hiddenNordvest');
const nvAndMore = require('./nvAndMore');
const kulturkbh = require('./kulturkbh');
const tmdb = require('./tmdb');

/**
 * Fetch raw suggestions from all sources, failing independently.
 * Returns a flat array of normalized suggestion objects.
 */
async function fetchAllSuggestions() {
  const sources = [
    { name: 'ticketmaster', fn: ticketmaster.fetch },
    { name: 'hidden_nordvest', fn: hiddenNordvest.fetch },
    { name: 'nv_and_more', fn: nvAndMore.fetch },
    { name: 'kulturkbh', fn: kulturkbh.fetch },
    { name: 'tmdb', fn: tmdb.fetch },
  ];

  const results = await Promise.allSettled(sources.map(s => s.fn()));

  const all = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      all.push(...r.value);
    } else {
      console.error(`[discovery] ${sources[i].name} failed:`, r.reason?.message);
    }
  }

  console.log(`[discovery] fetched ${all.length} raw suggestions across ${sources.length} sources`);
  return all;
}

module.exports = { fetchAllSuggestions };
