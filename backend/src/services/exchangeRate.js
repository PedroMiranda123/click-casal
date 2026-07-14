const prisma = require('../lib/prisma');

// ECB reference rates (which Frankfurter serves) cover both BRL and DKK,
// go back to 1999, require no API key, and are free to use without limits.
// NOTE: chosen from documented provider behavior; this session's outbound
// network access could not reach the provider to verify live, so confirm
// with one real request once deployed before relying on it in production.
const PROVIDER_BASE_URL = 'https://api.frankfurter.app';

class ExchangeRateUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExchangeRateUnavailableError';
  }
}

function toDateOnlyString(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

async function fetchRateFromProvider(dateOnly, from, to) {
  const url = `${PROVIDER_BASE_URL}/${dateOnly}?from=${from}&to=${to}`;

  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new ExchangeRateUnavailableError(`Exchange rate provider request failed: ${err.message}`);
  }

  if (!response.ok) {
    throw new ExchangeRateUnavailableError(`Exchange rate provider returned status ${response.status}`);
  }

  let body;
  try {
    body = await response.json();
  } catch (err) {
    throw new ExchangeRateUnavailableError('Exchange rate provider returned an invalid response');
  }

  const rate = body?.rates?.[to];
  if (typeof rate !== 'number') {
    throw new ExchangeRateUnavailableError(`Exchange rate provider had no rate for ${from} -> ${to}`);
  }

  return { rate, actualDate: body.date };
}

async function getRate(date, from, to) {
  if (from === to) {
    return 1;
  }

  const dateOnly = toDateOnlyString(date);
  const dateKey = new Date(`${dateOnly}T00:00:00.000Z`);

  const cached = await prisma.exchangeRate.findUnique({
    where: {
      date_fromCurrency_toCurrency: {
        date: dateKey,
        fromCurrency: from,
        toCurrency: to,
      },
    },
  });
  if (cached) {
    return Number(cached.rate);
  }

  const { rate, actualDate } = await fetchRateFromProvider(dateOnly, from, to);
  const note =
    actualDate && actualDate !== dateOnly
      ? `Fallback rate from ${actualDate} (no rate available for ${dateOnly})`
      : null;

  const saved = await prisma.exchangeRate.upsert({
    where: {
      date_fromCurrency_toCurrency: {
        date: dateKey,
        fromCurrency: from,
        toCurrency: to,
      },
    },
    update: {},
    create: {
      date: dateKey,
      fromCurrency: from,
      toCurrency: to,
      rate,
      note,
    },
  });

  return Number(saved.rate);
}

module.exports = { getRate, ExchangeRateUnavailableError };
