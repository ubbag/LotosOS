import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Admin and System Users
  console.log('Creating admin and system users...');
  const passwordHash = await bcrypt.hash('haslo123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lotosspa.pl' },
    update: {},
    create: {
      email: 'admin@lotosspa.pl',
      passwordHash,
      imie: 'Admin',
      rola: 'WLASCICIEL',
      aktywny: true,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create SYSTEM user for automated operations
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@lotosspa.internal' },
    update: {},
    create: {
      email: 'system@lotosspa.internal',
      passwordHash: await bcrypt.hash(Math.random().toString(36), 10),
      imie: 'System',
      rola: 'WLASCICIEL',
      aktywny: false, // System user should not be able to login
    },
  });
  console.log('✅ System user created:', systemUser.email);

  // 2. Create Categories (Kategorie)
  console.log('\nCreating categories...');
  await prisma.kategoria.upsert({
    where: { nazwa: 'RELAKSACYJNY' },
    update: {},
    create: { nazwa: 'RELAKSACYJNY', aktywna: true, kolejnosc: 1 },
  });
  await prisma.kategoria.upsert({
    where: { nazwa: 'TERAPEUTYCZNY' },
    update: {},
    create: { nazwa: 'TERAPEUTYCZNY', aktywna: true, kolejnosc: 2 },
  });
  await prisma.kategoria.upsert({
    where: { nazwa: 'SPORTOWY' },
    update: {},
    create: { nazwa: 'SPORTOWY', aktywna: true, kolejnosc: 3 },
  });
  await prisma.kategoria.upsert({
    where: { nazwa: 'INNE' },
    update: {},
    create: { nazwa: 'INNE', aktywna: true, kolejnosc: 99 },
  });
  console.log('✅ Created 4 categories');

  // 3. Create Therapists (Masażyści)
  console.log('\nCreating therapists...');
  const therapists = await Promise.all([
    prisma.masazysta.create({
      data: {
        imie: 'Anna',
        nazwisko: 'Kowalska',
        specjalizacje: JSON.stringify(['Masaż klasyczny', 'Masaż relaksacyjny']),
        jezyki: JSON.stringify(['Polski', 'Angielski']),
        aktywny: true,
        kolejnosc: 1,
      },
    }),
    prisma.masazysta.create({
      data: {
        imie: 'Maria',
        nazwisko: 'Nowak',
        specjalizacje: JSON.stringify(['Masaż tajski', 'Masaż sportowy']),
        jezyki: JSON.stringify(['Polski']),
        aktywny: true,
        kolejnosc: 2,
      },
    }),
    prisma.masazysta.create({
      data: {
        imie: 'Katarzyna',
        nazwisko: 'Wiśniewska',
        specjalizacje: JSON.stringify(['Masaż leczniczy', 'Masaż tkanek głębokich']),
        jezyki: JSON.stringify(['Polski', 'Niemiecki']),
        aktywny: true,
        kolejnosc: 3,
      },
    }),
  ]);
  console.log(`✅ Created ${therapists.length} therapists`);

  // 3. Create Cabinets (Gabinety)
  console.log('\nCreating cabinets...');
  const cabinet1 = await prisma.gabinet.upsert({
    where: { numer: '1' },
    update: { notatki: 'Stół do masażu tajskiego' },
    create: { numer: '1', nazwa: 'Gabinet 1', notatki: 'Stół do masażu tajskiego', aktywny: true },
  });
  const cabinet2 = await prisma.gabinet.upsert({
    where: { numer: '2' },
    update: { notatki: 'Stół do masażu sportowego' },
    create: { numer: '2', nazwa: 'Gabinet 2', notatki: 'Stół do masażu sportowego', aktywny: true },
  });
  const cabinet3 = await prisma.gabinet.upsert({
    where: { numer: '3' },
    update: { notatki: 'Gabinet z laserem na podczerwień' },
    create: { numer: '3', nazwa: 'Gabinet 3', notatki: 'Gabinet z laserem na podczerwień', aktywny: true },
  });
  const cabinets = [cabinet1, cabinet2, cabinet3];
  console.log(`✅ Created/Updated ${cabinets.length} cabinets with notes`);

  // 4. Create Services (Usługi)
  console.log('\nCreating services...');

  const masazKlasyczny = await prisma.usluga.create({
    data: {
      nazwa: 'Masaż Klasyczny',
      kategoria: {
        connect: {
          nazwa: 'RELAKSACYJNY',
        },
      },
      opis: 'Klasyczny masaż relaksacyjny całego ciała',
      aktywna: true,
      kolejnosc: 1,
      wariantyUslugi: {
        create: [
          { czasMinut: 30, cenaRegularna: 80 },
          { czasMinut: 60, cenaRegularna: 150 },
          { czasMinut: 90, cenaRegularna: 200 },
        ],
      },
    },
    include: { wariantyUslugi: true },
  });

  await prisma.usluga.create({
    data: {
      nazwa: 'Masaż Tajski',
      kategoria: {
        connect: {
          nazwa: 'TERAPEUTYCZNY',
        },
      },
      opis: 'Tradycyjny masaż tajski z rozciąganiem',
      aktywna: true,
      kolejnosc: 2,
      wariantyUslugi: {
        create: [
          { czasMinut: 60, cenaRegularna: 180 },
          { czasMinut: 90, cenaRegularna: 250 },
        ],
      },
    },
    include: { wariantyUslugi: true },
  });

  await prisma.usluga.create({
    data: {
      nazwa: 'Masaż Sportowy',
      kategoria: {
        connect: {
          nazwa: 'SPORTOWY',
        },
      },
      opis: 'Masaż sportowy dla aktywnych osób',
      aktywna: true,
      kolejnosc: 3,
      wariantyUslugi: {
        create: [
          { czasMinut: 45, cenaRegularna: 120 },
          { czasMinut: 60, cenaRegularna: 160 },
        ],
      },
    },
    include: { wariantyUslugi: true },
  });

  console.log('✅ Created 3 services with variants');

  // 5. Create Add-ons (Dopłaty)
  console.log('\nCreating add-ons...');
  const addons = await Promise.all([
    prisma.doplata.create({
      data: { nazwa: 'Aromaterapia', cena: 20, aktywna: true },
    }),
    prisma.doplata.create({
      data: { nazwa: 'Gorące kamienie', cena: 30, aktywna: true },
    }),
    prisma.doplata.create({
      data: { nazwa: 'Peeling ciała', cena: 40, aktywna: true },
    }),
  ]);
  console.log(`✅ Created ${addons.length} add-ons`);

  // 6. Create Clients (Klienci)
  console.log('\nCreating clients...');
  const clients = await Promise.all([
    prisma.klient.create({
      data: {
        imie: 'Jan',
        nazwisko: 'Kowalski',
        telefon: '+48123456789',
        email: 'jan.kowalski@example.com',
        aktywny: true,
      },
    }),
    prisma.klient.create({
      data: {
        imie: 'Anna',
        nazwisko: 'Nowak',
        telefon: '+48987654321',
        email: 'anna.nowak@example.com',
        aktywny: true,
      },
    }),
    prisma.klient.create({
      data: {
        imie: 'Piotr',
        nazwisko: 'Wiśniewski',
        telefon: '+48111222333',
        email: 'piotr.wisniewski@example.com',
        aktywny: true,
      },
    }),
    prisma.klient.create({
      data: {
        imie: 'Ewa',
        nazwisko: 'Dąbrowska',
        telefon: '+48444555666',
        email: 'ewa.dabrowska@example.com',
        aktywny: true,
      },
    }),
    prisma.klient.create({
      data: {
        imie: 'Tomasz',
        nazwisko: 'Lewandowski',
        telefon: '+48777888999',
        aktywny: true,
      },
    }),
  ]);
  console.log(`✅ Created ${clients.length} clients`);

  // 7. Create Package Definitions (Pakiety)
  console.log('\nCreating package definitions...');
  const packages = await Promise.all([
    prisma.pakietDefinicja.create({
      data: {
        nazwa: 'Pakiet 5 godzin',
        liczbaGodzin: 5,
        cena: 400,
        waznoscDni: 60,
        aktywny: true,
      },
    }),
    prisma.pakietDefinicja.create({
      data: {
        nazwa: 'Pakiet 10 godzin',
        liczbaGodzin: 10,
        cena: 750,
        waznoscDni: 90,
        aktywny: true,
      },
    }),
    prisma.pakietDefinicja.create({
      data: {
        nazwa: 'Pakiet 20 godzin',
        liczbaGodzin: 20,
        cena: 1400,
        waznoscDni: 120,
        aktywny: true,
      },
    }),
  ]);
  console.log(`✅ Created ${packages.length} package definitions`);

  // 8. Create Work Schedule for Therapists
  console.log('\nCreating work schedules...');
  const today = new Date();
  const schedules = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const startTime = new Date(date);
    startTime.setHours(9, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(17, 0, 0, 0);

    for (const therapist of therapists) {
      schedules.push(
        prisma.grafikPracy.create({
          data: {
            masazystaId: therapist.id,
            data: date,
            godzinaOd: startTime,
            godzinaDo: endTime,
            status: 'PRACUJE',
          },
        })
      );
    }
  }

  await Promise.all(schedules);
  console.log(`✅ Created work schedules for next 7 days`);

  // 9. Create Sample Reservations
  console.log('\nCreating sample reservations...');

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const reservation1Start = new Date(tomorrow);
  reservation1Start.setHours(10, 0, 0, 0);
  const reservation1End = new Date(tomorrow);
  reservation1End.setHours(11, 0, 0, 0);

  await prisma.rezerwacja.create({
    data: {
      numer: `RES-${Date.now()}-001`,
      klientId: clients[0].id,
      masazystaId: therapists[0].id,
      gabinetId: cabinets[0].id,
      uslugaId: masazKlasyczny.id,
      wariantId: masazKlasyczny.wariantyUslugi[1].id,
      data: tomorrow,
      godzinaOd: reservation1Start,
      godzinaDo: reservation1End,
      cenaCalokowita: 150,
      status: 'POTWIERDZONA',
      zrodlo: 'TELEFON',
      platnoscMetoda: 'GOTOWKA',
      platnoscStatus: 'NIEOPLACONA',
      createdById: admin.id,
    },
  });

  console.log('✅ Created 1 sample reservation');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 admin user (admin@lotosspa.pl / haslo123)`);
  console.log(`   - 1 system user (for automated operations)`);
  console.log(`   - ${therapists.length} therapists`);
  console.log(`   - ${cabinets.length} cabinets`);
  console.log(`   - 3 services with variants`);
  console.log(`   - ${addons.length} add-ons`);
  console.log(`   - ${clients.length} clients`);
  console.log(`   - ${packages.length} package definitions`);
  console.log(`   - Work schedules for next 7 days`);
  console.log(`   - 1 sample reservation`);
  console.log('\n✨ You can now start the backend server!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
