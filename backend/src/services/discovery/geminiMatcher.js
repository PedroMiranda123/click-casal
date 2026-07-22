'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

const MAX_ITEMS_PER_BATCH = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function scoreItems(items, pedroInterests, anaInterests) {
  if (!GEMINI_KEY) {
    console.warn('[gemini] GEMINI_API_KEY not set — skipping');
    return {};
  }

  const results = {};
  for (let i = 0; i < items.length; i += MAX_ITEMS_PER_BATCH) {
    const batch = items.slice(i, i + MAX_ITEMS_PER_BATCH);
    try {
      const batchResults = await scoreBatch(batch, pedroInterests, anaInterests);
      Object.assign(results, batchResults);
    } catch (err) {
      console.error(`[gemini] batch ${Math.floor(i / MAX_ITEMS_PER_BATCH) + 1} failed after retries:`, err.message);
      // Skip batch, continue with next
    }
  }
  return results;
}

async function scoreBatch(batch, pedroInterests, anaInterests) {
  // Use numeric indices as the id sent to Gemini — avoids the model truncating or
  // mangling long/special-char externalIds when it echoes them back.
  const itemsJson = batch.map((item, i) => ({
    id: String(i),
    title: sanitize(item.title),
    description: item.description ? sanitize(item.description) : null,
    category: sanitize(item.category),
    kind: item.kind,
  }));

  const prompt = `You are a relevance scorer and translator for a Brazilian couple living in Copenhagen.

Pedro's interests: ${JSON.stringify(pedroInterests.map(sanitize))}
Ana's interests: ${JSON.stringify(anaInterests.map(sanitize))}

For each item below:
1. If the item has a title, translate it to natural Brazilian Portuguese (PT-BR). Keep proper nouns, venue names and place names in the original language.
2. If the item has a non-null description, translate it to PT-BR. If description is null, set description_pt to null.
3. Decide if it is relevant for Pedro and/or Ana based on their interests. Be generous — if there is a plausible connection, mark as relevant.

Reply ONLY with a JSON object. No prose. No markdown fences.

Format:
{
  "results": [
    { "id": "0", "pedro": { "relevant": true, "reason": "short reason in PT-BR" }, "ana": { "relevant": false, "reason": null } },
    ...
  ]
}

Items:
${JSON.stringify(itemsJson, null, 2)}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
  };

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await globalThis.fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 503 || res.status === 429) {
        const retryAfter = res.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY_MS * attempt;
        console.warn(`[gemini] HTTP ${res.status} on attempt ${attempt}/${MAX_RETRIES}, retrying in ${delay}ms`);
        await sleep(delay);
        lastError = new Error(`Gemini HTTP ${res.status}`);
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API HTTP ${res.status}: ${err.slice(0, 300)}`);
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map(p => p.text ?? '').join('');
      const inputTokens = data?.usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = data?.usageMetadata?.candidatesTokenCount ?? 0;

      await prisma.aiUsageLog.create({
        data: {
          provider: 'gemini',
          model: GEMINI_MODEL,
          service: 'event-discovery',
          inputTokens,
          outputTokens,
        },
      });

      const parsed = parseJSON(text);
      const scoredItems = parsed?.results ?? [];

      const map = {};
      for (const scored of scoredItems) {
        if (!scored.id) continue;
        const pedroRelevant = scored.pedro?.relevant === true;
        const anaRelevant = scored.ana?.relevant === true;
        map[scored.id] = {
          pedro: { relevant: pedroRelevant, reason: sanitize(scored.pedro?.reason) },
          ana: { relevant: anaRelevant, reason: sanitize(scored.ana?.reason) },
          title_pt: scored.title_pt ? sanitize(scored.title_pt) : null,
          description_pt: scored.description_pt ? sanitize(scored.description_pt) : null,
        };
      }

      return map;

    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      console.warn(`[gemini] attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}, retrying...`);
      await sleep(RETRY_DELAY_MS * attempt);
      lastError = err;
    }
  }

  const data = await res.json();
  console.log('[gemini] raw response keys:', Object.keys(data));
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map(p => p.text ?? '')
    .join('');
  console.log('[gemini] extracted text length:', text.length, 'preview:', text.slice(0, 200));
  const inputTokens = data?.usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = data?.usageMetadata?.candidatesTokenCount ?? 0;

  // Log raw response for debugging
  if (!text) {
    console.error('[gemini] empty response, raw data:', JSON.stringify(data).slice(0, 500));
  }

  // Log usage
  await prisma.aiUsageLog.create({
    data: {
      provider: 'gemini',
      model: GEMINI_MODEL,
      service: 'event-discovery',
      inputTokens,
      outputTokens,
    },
  });

  // Parse response
  const parsed = parseJSON(text);
  const scoredItems = parsed?.results ?? [];

  const map = {};
  for (const scored of scoredItems) {
    if (scored.id == null) continue;
    const idx = Number(scored.id);
    if (!Number.isFinite(idx) || idx < 0 || idx >= batch.length) continue;
    const originalItem = batch[idx];

    const pedroRelevant = scored.pedro?.relevant === true;
    const anaRelevant = scored.ana?.relevant === true;
    if (!pedroRelevant && !anaRelevant) continue; // neither cares — don't store
    map[originalItem.externalId] = {
      pedro: { relevant: pedroRelevant, reason: sanitize(scored.pedro?.reason) },
      ana: { relevant: anaRelevant, reason: sanitize(scored.ana?.reason) },
    };
  }

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitize(str) {
  if (!str) return null;
  return String(str).replace(/[<>{}]/g, '').trim().slice(0, 500);
}

function parseJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  try { return JSON.parse(text.trim()); } catch {}
  throw new Error('Could not parse JSON from Gemini response');
}

module.exports = { scoreItems };
