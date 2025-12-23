import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * Seed script for populating test data in the database
 * Run with: npm run seed
 */

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Clear existing data (optional, comment out to preserve data)
    // await clearDatabase();

    // Create admin user
    console.log('Creating admin user...');
    const admin = await createAdminUser();
    console.log(`✓ Created admin user: ${admin.email}\n`);

    // Create therapists with schedules
    console.log('Creating therapists...');
    const therapists = await createTherapists();
    console.log(`✓ Created ${therapists.length} therapists\n`);

    // Create rooms
    console.log('Creating rooms...');
    const rooms = await createRooms();
    console.log(`✓ Created ${rooms.length} rooms\n`);

    // Create services
    console.log('Creating services with variants...');
    const services = await createServices();
    console.log(`✓ Created ${services.length} services\n`);

    // Create add-ons
    console.log('Creating add-ons...');
    const addOns = await createAddOns();
    console.log(`✓ Created ${addOns.length} add-ons\n`);

    // Create package definitions
    console.log('Creating package definitions...');
    const packages = await createPackageDefinitions();
    console.log(`✓ Created ${packages.length} package definitions\n`);

    // Create test clients
    console.log('Creating test clients...');
    const clients = await createTestClients();
    console.log(`✓ Created ${clients.length} clients\n`);

    console.log('✅ Seed completed successfully!\n');
    console.log('Test user credentials:');
    console.log('  Email: admin@lotosspa.pl');
    console.log('  Password: admin123456\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Clear all data from database
 */
async function clearDatabase() {
  console.log('Clearing existing data...');
  await prisma.transakcja.deleteMany({});
  await prisma.sMSLog.deleteMany({});
  await prisma.rezerwacjaReminder.deleteMany({});
  await prisma.wykorzystaniePakietu.deleteMany({});
  await prisma.pakietKlienta.deleteMany({});
  await prisma.voucherNotification.deleteMany({});
  await prisma.voucher.deleteMany({});
  await prisma.notatkaKlienta.deleteMany({});
  await prisma.rezerwacja.deleteMany({});
  await prisma.grafikMasazysty.deleteMany({});
  await prisma.masazysta.deleteMany({});
  await prisma.gabinet.deleteMany({});
  await prisma.doplata.deleteMany({});
  await prisma.wariantUslugi.deleteMany({});
  await prisma.usluga.deleteMany({});
  await prisma.pakietDefinicja.deleteMany({});
  await prisma.klient.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Database cleared.\n');
}

/**
 * Create admin user
 */
async function createAdminUser() {
  const hashedPassword = await bcrypt.hash('admin123456', 10);

  return prisma.user.create({
    data: {
      email: 'admin@lotosspa.pl',
      imie: 'Admin',
      nazwisko: 'Lotos',
      haslo: hashedPassword,
      rola: 'WLASCICIEL',
      aktywny: true,
    },
  });
}

/**
 * Create therapists with schedules
 */
async function createTherapists() {
  const therapists = [
    {
      imie: 'Anna',
      nazwisko: 'Kowalska',
      specjalizacje: ['Masaż klasyczny', 'Reflexoterapia'],
      jezyki: ['Polski', 'Angielski'],
      kolejnosc: 1,
    },
    {
      imie: 'Magdalena',
      nazwisko: 'Nowak',
      specjalizacje: ['Masaż tajski', 'Shiatsu'],
      jezyki: ['Polski'],
      kolejnosc: 2,
    },
    {
      imie: 'Barbara',
      nazwisko: 'Lewandowska',
      specjalizacje: ['Masaż sportowy', 'Fizykoterapia'],
      jezyki: ['Polski', 'Angielski', 'Niemiecki'],
      kolejnosc: 3,
    },
    {
      imie: 'Ewa',
      nazwisko: 'Kuchta',
      specjalizacje: ['Hot stone', 'Masaż relaksacyjny'],
      jezyki: ['Polski', 'Angielski'],
      kolejnosc: 4,
    },
  ];

  const created = await Promise.all(
    therapists.map(async (therapist) => {
      const created = await prisma.masazysta.create({
        data: {
          ...therapist,
          aktywny: true,
        },
      });

      // Create schedule (work hours: 10:00 - 18:00, Monday to Saturday)
      for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek++) {
        await prisma.grafikMasazysty.create({
          data: {
            masazystaId: created.id,
            dzienTygodnia: dayOfWeek,
            czasOd: 600, // 10:00
            czasDo: 1080, // 18:00
            status: 'PRACUJE',
          },
        });
      }

      return created;
    })
  );

  return created;
}

/**
 * Create 12 rooms
 */
async function createRooms() {
  const rooms = Array.from({ length: 12 }, (_, i) => ({
    numer: String(i + 1).padStart(2, '0'),
    nazwa: `Gabinet ${i + 1}`,
    pojemnosc: 1,
    kolejnosc: i + 1,
  }));

  const created = await Promise.all(
    rooms.map((room) =>
      prisma.gabinet.create({
        data: {
          ...room,
          aktywny: true,
        },
      })
    )
  );

  return created;
}

/**
 * Create services with variants
 */
async function createServices() {
  const services = [
    {
      nazwa: 'Masaż klasyczny',
      opis: 'Tradycyjny masaż relaksacyjny całego ciała',
      kategoria: 'RELAKSACYJNY',
      kolejnosc: 1,
      variants: [
        { czasMinut: 30, cenaRegularna: new Decimal('80.00'), cenaPromocyjna: null },
        { czasMinut: 60, cenaRegularna: new Decimal('150.00'), cenaPromocyjna: new Decimal('130.00') },
        { czasMinut: 90, cenaRegularna: new Decimal('220.00'), cenaPromocyjna: null },
      ],
    },
    {
      nazwa: 'Masaż tajski',
      opis: 'Tradycyjny masaż tajski na całe ciało',
      kategoria: 'ORIENTALNY',
      kolejnosc: 2,
      variants: [
        { czasMinut: 60, cenaRegularna: new Decimal('170.00'), cenaPromocyjna: null },
        { czasMinut: 90, cenaRegularna: new Decimal('250.00'), cenaPromocyjna: null },
      ],
    },
    {
      nazwa: 'Masaż sportowy',
      opis: 'Masaż przygotowujący mięśnie do wysiłku lub regeneracyjny',
      kategoria: 'SPORTOWY',
      kolejnosc: 3,
      variants: [
        { czasMinut: 45, cenaRegularna: new Decimal('120.00'), cenaPromocyjna: null },
        { czasMinut: 60, cenaRegularna: new Decimal('160.00'), cenaPromocyjna: null },
      ],
    },
    {
      nazwa: 'Shiatsu',
      opis: 'Japoński masaż energetyczny',
      kategoria: 'ORIENTALNY',
      kolejnosc: 4,
      variants: [
        { czasMinut: 60, cenaRegularna: new Decimal('160.00'), cenaPromocyjna: null },
        { czasMinut: 90, cenaRegularna: new Decimal('240.00'), cenaPromocyjna: null },
      ],
    },
    {
      nazwa: 'Hot stone',
      opis: 'Masaż ciepłymi kamieniami bazaltowymi',
      kategoria: 'RELAKSACYJNY',
      kolejnosc: 5,
      variants: [
        { czasMinut: 60, cenaRegularna: new Decimal('180.00'), cenaPromocyjna: null },
        { czasMinut: 90, cenaRegularna: new Decimal('260.00'), cenaPromocyjna: null },
      ],
    },
  ];

  const created = await Promise.all(
    services.map(async (service) => {
      const { variants, ...serviceData } = service;

      const created = await prisma.usluga.create({
        data: {
          ...serviceData,
          aktywna: true,
        },
      });

      await Promise.all(
        variants.map((variant) =>
          prisma.wariantUslugi.create({
            data: {
              uslugaId: created.id,
              ...variant,
            },
          })
        )
      );

      return created;
    })
  );

  return created;
}

/**
 * Create add-ons
 */
async function createAddOns() {
  const addOns = [
    { nazwa: 'Aromaterapia', cena: new Decimal('20.00'), kolejnosc: 1 },
    { nazwa: 'Masaż twarzy', cena: new Decimal('30.00'), kolejnosc: 2 },
    { nazwa: 'Krioterapia', cena: new Decimal('25.00'), kolejnosc: 3 },
    { nazwa: 'Pakowanie ciała', cena: new Decimal('35.00'), kolejnosc: 4 },
    { nazwa: 'Refleksoterapia stóp', cena: new Decimal('40.00'), kolejnosc: 5 },
  ];

  return Promise.all(
    addOns.map((addOn) => prisma.doplata.create({ data: addOn }))
  );
}

/**
 * Create package definitions
 */
async function createPackageDefinitions() {
  const packages = [
    {
      nazwa: 'Pakiet relaksacyjny',
      opis: '5 godzin masażu relaksacyjnego',
      godzinyTotalnie: 5,
      cena: new Decimal('600.00'),
      rabat: new Decimal('10'),
      kolejnosc: 1,
    },
    {
      nazwa: 'Pakiet sportowy',
      opis: '8 godzin masażu sportowego',
      godzinyTotalnie: 8,
      cena: new Decimal('1000.00'),
      rabat: new Decimal('15'),
      kolejnosc: 2,
    },
    {
      nazwa: 'Pakiet premium',
      opis: '10 godzin masażu - dostęp do wszystkich usług',
      godzinyTotalnie: 10,
      cena: new Decimal('1400.00'),
      rabat: new Decimal('20'),
      kolejnosc: 3,
    },
    {
      nazwa: 'Pakiet starter',
      opis: '3 godziny masażu do wyboru',
      godzinyTotalnie: 3,
      cena: new Decimal('380.00'),
      rabat: new Decimal('5'),
      kolejnosc: 4,
    },
  ];

  return Promise.all(
    packages.map((pkg) => prisma.pakietDefinicja.create({ data: pkg }))
  );
}

/**
 * Create test clients with notes
 */
async function createTestClients() {
  const clients = [
    {
      imie: 'Jan',
      nazwisko: 'Kowalski',
      telefon: '+48123456789',
      email: 'jan.kowalski@example.com',
      notatki: 'Pacjent z bólem pleców, wrażliwy na CBD',
      notes: [
        {
          tresc: 'Schorzenia: bóle pleców krzyżowych',
          typ: 'MEDYCZNA',
        },
        {
          tresc: 'Preferuje masaż sportowy, unika intensywnych naciśnięć',
          typ: 'WAZNA',
        },
      ],
    },
    {
      imie: 'Maria',
      nazwisko: 'Nowak',
      telefon: '+48987654321',
      email: 'maria.nowak@example.com',
      notatki: 'Pracownik biurowy, ciąża, wizyta każdy tydzień',
      notes: [
        {
          tresc: 'Ciąża - 6 miesiąc, wymaga specjalnego podejścia',
          typ: 'MEDYCZNA',
        },
        {
          tresc: 'Stały klient - każdy czwartek o 16:00',
          typ: 'INFO',
        },
      ],
    },
    {
      imie: 'Piotr',
      nazwisko: 'Lewandowski',
      telefon: '+48111111111',
      email: 'piotr.lewandowski@example.com',
      notatki: 'Sportowiec, przygotowanie do maratonu',
      notes: [
        {
          tresc: 'Maratończyk - przygotowanie do konkurencji',
          typ: 'INFO',
        },
        {
          tresc: 'Prefereruje masaż sportowy i krioterapię',
          typ: 'WAZNA',
        },
      ],
    },
    {
      imie: 'Katarzyna',
      nazwisko: 'Wiśniewski',
      telefon: '+48222222222',
      email: 'katarzyna.wisniewski@example.com',
      notatki: 'Artretyzm, stały klient od roku',
      notes: [
        {
          tresc: 'Zapalenie stawów - wymaga łagodnego podejścia',
          typ: 'MEDYCZNA',
        },
      ],
    },
    {
      imie: 'Tomasz',
      nazwisko: 'Szymański',
      telefon: '+48333333333',
      email: 'tomasz.szymanski@example.com',
      notatki: 'Stres zawodowy, przygotowywane zabiegi relaksacyjne',
      notes: [
        {
          tresc: 'Wysoki poziom stresu - polecać zabiegi relaksacyjne',
          typ: 'WAZNA',
        },
      ],
    },
  ];

  return Promise.all(
    clients.map(async (client) => {
      const { notes, ...clientData } = client;

      const created = await prisma.klient.create({
        data: {
          ...clientData,
          zrodlo: 'TELEFON',
          aktywny: true,
        },
      });

      if (notes && notes.length > 0) {
        await Promise.all(
          notes.map((note) =>
            prisma.notatkaKlienta.create({
              data: {
                klientId: created.id,
                tresc: note.tresc,
                typ: note.typ,
              },
            })
          )
        );
      }

      return created;
    })
  );
}

// Run the seed
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
