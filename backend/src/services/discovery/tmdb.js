'use strict';

// TMDB "Now Playing" — region=DK
// Docs: https://developer.themoviedb.org/reference/movie-now-playing-list
// Requires: TMDB_API_KEY in env

const TMDB_KEY = process.env.TMDB_API_KEY;
const BASE = 'https://api.themoviedb.org/3';

async function fetch() {
  if (!TMDB_KEY) {
    console.warn('[tmdb] TMDB_API_KEY not set — skipping');
    return [];
  }

  const params = new URLSearchParams({
    api_key: TMDB_KEY,
    language: 'pt-BR',
    region: 'DK',
    page: '1',
  });

  const res = await globalThis.fetch(`${BASE}/movie/now_playing?${params}`);
  if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);

  const data = await res.json();
  const movies = data?.results ?? [];

  return movies.map(m => ({
    source: 'tmdb',
    externalId: `tmdb_${m.id}`,
    title: m.title,
    description: m.overview ?? null,
    venueName: null,
    city: null,
    startAt: new Date(m.release_date ?? Date.now()),
    url: `https://www.themoviedb.org/movie/${m.id}`,
    imageUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    category: null,
    kind: 'MOVIE',
  }));
}

module.exports = { fetch };
