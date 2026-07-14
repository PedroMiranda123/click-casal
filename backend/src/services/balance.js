const prisma = require('../lib/prisma');

async function getBalanceDkk({ before } = {}) {
  const rows = before
    ? await prisma.$queryRaw`
        SELECT COALESCE(SUM(CASE WHEN "type" = 'INCOME' THEN "amountDkk" ELSE -"amountDkk" END), 0)::bigint AS balance
        FROM "Transaction"
        WHERE "occurredAt" < ${before}
      `
    : await prisma.$queryRaw`
        SELECT COALESCE(SUM(CASE WHEN "type" = 'INCOME' THEN "amountDkk" ELSE -"amountDkk" END), 0)::bigint AS balance
        FROM "Transaction"
      `;

  return Number(rows[0].balance);
}

module.exports = { getBalanceDkk };
