'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../lib/prisma');
const { logAiUsage } = require('./aiUsageLog');

const MODEL = 'claude-haiku-4-5-20251001';

function sanitizeForPrompt(text) {
  return text.replace(/[<>{}]/g, '').trim().slice(0, 100);
}

async function matchItemsToOffers(items) {
  if (!items.length) return;

  const now = new Date();
  const offers = await prisma.flyerOffer.findMany({
    where: { validUntil: { gte: now } },
  });
  if (!offers.length) return;

  const offerList = offers
    .map((o, i) => `${i}|${o.dealerName}|${sanitizeForPrompt(o.name)}|${(o.priceOre / 100).toFixed(2)} DKK`)
    .join('\n');

  const itemList = items
    .map((it, i) => `${i}|${sanitizeForPrompt(it.name)}`)
    .join('\n');

  const prompt = `You are a grocery matching assistant. Match each shopping list item (Portuguese) to the best offer from Danish supermarket flyers.

Shopping list items (index|name):
${itemList}

Available offers (index|store|product|price):
${offerList}

For each item, return the best matching offer index, or -1 if no reasonable match exists. Consider semantic similarity across languages (PT→DA). Only match if genuinely the same product category.

Respond with JSON array only, one entry per item, in order:
[{"itemIndex":0,"offerIndex":5},{"itemIndex":1,"offerIndex":-1},...]`;

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  await logAiUsage({
    model: MODEL,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    itemsProcessed: items.length,
  });

  const text = response.content[0].text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return;

  const matches = JSON.parse(jsonMatch[0]);
  const now2 = new Date();

  await Promise.all(
    matches.map(async ({ itemIndex, offerIndex }) => {
      const item = items[itemIndex];
      const offer = offerIndex >= 0 ? offers[offerIndex] : null;
      if (!item) return;
      await prisma.shoppingListItem.update({
        where: { id: item.id },
        data: {
          matchedOfferId: offer?.id ?? null,
          matchedAt: now2,
        },
      });
    })
  );
}

module.exports = { matchItemsToOffers };
