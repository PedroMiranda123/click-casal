'use strict';

const prisma = require('../lib/prisma');

async function logAiUsage({ model, inputTokens, outputTokens, itemsProcessed }) {
  await prisma.aiUsageLog.create({
    data: { model, inputTokens, outputTokens, itemsProcessed },
  });
}

module.exports = { logAiUsage };
