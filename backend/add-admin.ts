import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('hasło123', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        imie: 'Admin',
        rola: 'WLASCICIEL',
        aktywny: true,
      },
    });

    console.log('✓ Admin user created successfully!');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: hasło123`);
    console.log(`  Role: ${admin.rola}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('✓ Admin user already exists');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
