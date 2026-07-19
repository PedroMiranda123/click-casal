require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const BCRYPT_COST_FACTOR = 12;

const PAYMENT_METHODS = [
  { name: 'Lunar', type: 'DEBIT' },
  { name: 'Nubank Cartão', type: 'CREDIT' },
  { name: 'C6 Cartão', type: 'CREDIT' },
];

const CATEGORIES = [
  { name: 'Supermercado', icon: 'shopping-cart', color: '#4CAF50' },
  { name: 'Delivery / Restaurante', icon: 'utensils', color: '#FF9800' },
  { name: 'Transporte', icon: 'car', color: '#2196F3' },
  { name: 'Moradia', icon: 'home', color: '#795548' },
  { name: 'Contas', icon: 'file-text', color: '#607D8B' },
  { name: 'Saúde', icon: 'heart-pulse', color: '#F44336' },
  { name: 'Academia / Esportes', icon: 'dumbbell', color: '#009688' },
  { name: 'Lazer / Entretenimento', icon: 'film', color: '#9C27B0' },
  { name: 'Vestuário', icon: 'shirt', color: '#E91E63' },
  { name: 'Viagem', icon: 'plane', color: '#00BCD4' },
  { name: 'Pet', icon: 'paw-print', color: '#8BC34A' },
  { name: 'Outros', icon: 'more-horizontal', color: '#9E9E9E' },
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function seedUsers() {
  const users = [
    {
      name: requireEnv('SEED_USER_1_NAME'),
      email: requireEnv('SEED_USER_1_EMAIL'),
      password: requireEnv('SEED_USER_1_PASSWORD'),
    },
    {
      name: requireEnv('SEED_USER_2_NAME'),
      email: requireEnv('SEED_USER_2_EMAIL'),
      password: requireEnv('SEED_USER_2_PASSWORD'),
    },
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_COST_FACTOR);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, passwordHash },
      create: { name: user.name, email: user.email, passwordHash },
    });
  }
}

// PaymentMethod.name and Category.name have no unique constraint in the
// schema, so upsert-by-name is emulated with findFirst + create/update.
async function upsertByName(model, entries) {
  for (const entry of entries) {
    const existing = await prisma[model].findFirst({ where: { name: entry.name } });
    if (existing) {
      await prisma[model].update({ where: { id: existing.id }, data: entry });
    } else {
      await prisma[model].create({ data: entry });
    }
  }
}

async function seedStartingBalance() {
  // Idempotent: only insert if no transactions exist yet
  const count = await prisma.transaction.count();
  if (count > 0) return;

  const firstUser = await prisma.user.findFirst();
  if (!firstUser) throw new Error('No users found — run seedUsers first');

  const lunar = await prisma.paymentMethod.findFirst({ where: { name: 'Lunar' } });
  if (!lunar) throw new Error('Lunar payment method not found — run upsertByName first');

  await prisma.transaction.create({
    data: {
      userId: firstUser.id,
      paymentMethodId: lunar.id,
      categoryId: null,
      type: 'INCOME',
      originalAmount: 999851, // 9.998,51 DKK in øre
      originalCurrency: 'DKK',
      amountDkk: 999851,
      exchangeRate: null,
      description: 'Saldo inicial',
      occurredAt: new Date(),
    },
  });
}

// --- Manutenção do AP ---
const MAINTENANCE_TASKS = require('../src/data/maintenanceTasks');

async function seedMaintenanceTasks() {
  console.log('Seeding maintenance tasks...');
  for (const task of MAINTENANCE_TASKS) {
    const existing = await prisma.maintenanceTask.findFirst({
      where: { title: task.title },
    });
    if (!existing) {
      await prisma.maintenanceTask.create({ data: task });
    }
  }
  console.log(`✅ ${MAINTENANCE_TASKS.length} maintenance tasks seeded.`);
}

async function main() {
  await seedUsers();
  await upsertByName('paymentMethod', PAYMENT_METHODS);
  await upsertByName(
    'category',
    CATEGORIES.map((c) => ({ ...c, isDefault: true }))
  );
  await seedStartingBalance();
  await seedMaintenanceTasks();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
