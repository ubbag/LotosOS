import { prisma } from './shared/prisma';

async function main() {
  console.log('Updating W_TRAKCIE to "W TRAKCIE"...');

  const result = await prisma.$executeRaw`
    UPDATE rezerwacje
    SET status = 'W TRAKCIE'
    WHERE status = 'W_TRAKCIE'
  `;

  console.log(`✅ Updated ${result} records`);
}

main()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
