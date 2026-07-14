module.exports = {
  user: {
    findUnique: jest.fn(),
  },
  paymentMethod: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  exchangeRate: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  $queryRaw: jest.fn(),
};
