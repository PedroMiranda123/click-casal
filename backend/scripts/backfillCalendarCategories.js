require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Aniversário', color: '#E879A0', icon: '🎂' },
  { name: 'Vencimento', color: '#F59E0B', icon: '💳' },
  { name: 'Esporte', color: '#3B82F6', icon: '⚽' },
  { name: 'Exercício', color: '#8B5CF6', icon: '🏋️' },
  { name: 'Geral', color: '#6B7280', icon: '📌' },
];

const TYPE_TO_CATEGORY_NAME = {
  BIRTHDAY: 'Aniversário',
  PAYMENT_DUE: 'Vencimento',
  SPORTS: 'Esporte',
  EXERCISE: 'Exercício',
  GENERAL: 'Geral',
};

async function main() {
  console.log('🔄 Starting calendar category backfill...\n');

  // Create or fetch categories (idempotent)
  const categories = {};
  for (const cat of CATEGORIES) {
    let existing = await prisma.calendarCategory.findFirst({ where: { name: cat.name } });
    if (!existing) {
      existing = await prisma.calendarCategory.create({ data: cat });
      console.log(`✅ Created category: ${cat.name}`);
    } else {
      console.log(`ℹ️  Category already exists: ${cat.name}`);
    }
    categories[cat.name] = existing.id;
  }

  console.log(`\n📊 Total categories: ${Object.keys(categories).length}\n`);

  // Update events with categoryId
  let updated = 0;
  const events = await prisma.calendarEvent.findMany();

  for (const event of events) {
    const categoryName = TYPE_TO_CATEGORY_NAME[event.type];
    if (!categoryName) {
      console.warn(`⚠️  Unknown type: ${event.type} for event ${event.id}`);
      continue;
    }

    const categoryId = categories[categoryName];
    await prisma.calendarEvent.update({
      where: { id: event.id },
      data: { categoryId },
    });
    updated++;
  }

  console.log(`✅ Updated ${updated} events with categoryId\n`);
  console.log('🎉 Backfill complete!');
}

main()
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
