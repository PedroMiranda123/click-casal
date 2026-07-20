'use strict';

// Requires: GEMINI_API_KEY in env
// Uses gemini-1.5-flash — fast and cheap for batch scoring.
// Every call is logged to AiUsageLog per the project convention.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

const MAX_ITEMS_PER_BATCH = 30; // stay well inside context limits

/**
 * Given a list of normalized suggestion objects and two user interest tag arrays,
 * returns a map: { [externalId]: { pedro: { relevant: bool, reason: string }, ana: { relevant: bool, reason: string } } }
 *
 * Items where both users have relevant=false are excluded from the result map.
 */
async function scoreItems(items, pedroInterests, anaInterests) {
  if (!GEMINI_KEY) {
    console.warn('[gemini] GEMINI_API_KEY not set — skipping AI matching, no suggestions will be stored');
    return {};
  }

  const results = {};

  // Chunk into batches
  for (let i = 0; i < items.length; i += MAX_ITEMS_PER_BATCH) {
    const batch = items.slice(i, i + MAX_ITEMS_PER_BATCH);
    const batchResults = await scoreBatch(batch, pedroInterests, anaInterests);
    Object.assign(results, batchResults);
  }

  return results;
}

async function scoreBatch(batch, pedroInterests, anaInterests) {
  const itemsJson = batch.map(item => ({
    id: item.externalId,
    title: sanitize(item.title),
    description: sanitize(item.description),
    category: sanitize(item.category),
    kind: item.kind,
  }));

  const prompt = `You are a relevance scorer for a couple's event/movie recommendation feed.

Pedro's interests: ${JSON.stringify(pedroInterests.map(sanitize))}
Ana's interests: ${JSON.stringify(anaInterests.map(sanitize))}

For each item below, decide if it is relevant for Pedro and/or Ana based on their interests.
Be generous — if there is a plausible connection, mark as relevant.
Reply ONLY with a JSON object. No prose. No markdown fences.

Format:
{
  "results": [
    { "id": "<externalId>", "pedro": { "relevant": true, "reason": "short reason in PT-BR" }, "ana": { "relevant": false, "reason": null } },
    ...
  ]
}

Items:
${JSON.stringify(itemsJson, null, 2)}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
  };

  const res = await globalThis.fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API HTTP ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const inputTokens = data?.usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = data?.usageMetadata?.candidatesTokenCount ?? 0;

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
    if (!scored.id) continue;
    const pedroRelevant = scored.pedro?.relevant === true;
    const anaRelevant = scored.ana?.relevant === true;
    if (!pedroRelevant && !anaRelevant) continue; // neither cares — don't store
    map[scored.id] = {
      pedro: { relevant: pedroRelevant, reason: sanitize(scored.pedro?.reason) },
      ana: { relevant: anaRelevant, reason: sanitize(scored.ana?.reason) },
    };
  }

  return map;
}

function sanitize(str) {
  if (!str) return null;
  // Remove any characters that could be prompt injections
  return String(str).replace(/[<>{}]/g, '').trim().slice(0, 500);
}

function parseJSON(text) {
  // Strip markdown fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  try { return JSON.parse(text.trim()); } catch {}
  throw new Error('Could not parse JSON from Gemini response');
}

module.exports = { scoreItems };
