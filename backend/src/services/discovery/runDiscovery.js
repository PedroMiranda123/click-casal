'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { fetchAllSuggestions } = require('./index');
const { scoreItems } = require('./geminiMatcher');

/**
 * Main weekly job:
 * 1. Fetch suggestions from all sources
 * 2. Deduplicate against existing externalIds
 * 3. Score new items against both users' interests via Gemini
 * 4. Persist relevant items + their relevance rows
 */
async function runDiscovery() {
  console.log('[discovery] job started at', new Date().toISOString());

  // 1. Load both users and their interests
  const users = await prisma.user.findMany({
    include: { interests: true },
    orderBy: { createdAt: 'asc' }, // Pedro first (first seeded user), Ana second
  });

  if (users.length < 2) {
    console.error('[discovery] expected 2 users, found', users.length, '— aborting');
    return { error: 'user count mismatch' };
  }

  const [pedro, ana] = users;
  const pedroInterests = pedro.interests.map(i => i.label);
  const anaInterests = ana.interests.map(i => i.label);

  // 2. Fetch from all sources
  const rawItems = await fetchAllSuggestions();

  // 3. Deduplicate: filter out externalIds already in the DB
  const existingIds = new Set(
    (await prisma.eventSuggestion.findMany({ select: { externalId: true } }))
      .map(s => s.externalId)
  );
  const newItems = rawItems.filter(item => !existingIds.has(item.externalId));
  console.log(`[discovery] ${newItems.length} new items after dedup (${rawItems.length} fetched, ${existingIds.size} already known)`);

  if (newItems.length === 0) {
    console.log('[discovery] nothing new — done');
    return { created: 0 };
  }

  // 4. Store ALL new items first
  let created = 0;
  const storedItems = [];
  for (const item of newItems) {
    try {
      const suggestion = await prisma.eventSuggestion.upsert({
        where: { externalId: item.externalId },
        update: {},
        create: {
          source: item.source,
          externalId: item.externalId,
          title: item.title.slice(0, 500),
          description: item.description?.slice(0, 2000) ?? null,
          venueName: item.venueName?.slice(0, 200) ?? null,
          city: item.city?.slice(0, 100) ?? null,
          startAt: item.startAt,
          url: item.url?.slice(0, 1000) ?? null,
          imageUrl: item.imageUrl?.slice(0, 1000) ?? null,
          category: item.category?.slice(0, 100) ?? null,
          kind: item.kind,
          status: 'NEW',
        },
      });
      storedItems.push({ item, suggestion });
      created++;
    } catch (err) {
      console.error('[discovery] failed to store item', item.externalId, err.message);
    }
  }
  console.log(`[discovery] stored ${created} items`);

  // 5. Score via Gemini and create relevance rows (best effort — failures don't block)
  if (storedItems.length > 0 && (pedroInterests.length > 0 || anaInterests.length > 0)) {
    try {
      const scores = await scoreItems(storedItems.map(s => s.item), pedroInterests, anaInterests);
      console.log('[discovery] Gemini scored', Object.keys(scores).length, 'items as relevant');

      for (const { item, suggestion } of storedItems) {
        const score = scores[item.externalId];
        if (!score) continue;

        const relevanceData = [];
        if (score.pedro?.relevant) {
          relevanceData.push({ eventSuggestionId: suggestion.id, userId: pedro.id, reason: score.pedro.reason });
        }
        if (score.ana?.relevant) {
          relevanceData.push({ eventSuggestionId: suggestion.id, userId: ana.id, reason: score.ana.reason });
        }

        if (relevanceData.length > 0) {
          await prisma.eventSuggestionRelevance.createMany({
            data: relevanceData,
            skipDuplicates: true,
          });
        }
      }
    } catch (err) {
      console.error('[discovery] Gemini scoring failed (events already stored):', err.message);
    }
  }

  console.log(`[discovery] job done — ${created} new suggestions stored`);
  return { created };
}

module.exports = { runDiscovery };
