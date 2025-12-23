/**
 * Simple Mock Server for Frontend Testing
 * Responds to login and client list requests with mock data
 */

const http = require('http');
const url = require('url');

const PORT = 3000;

// Mock data
const mockUser = {
  id: '1',
  email: 'admin@lotosspa.pl',
  imie: 'Admin',
  rola: 'WLASCICIEL',
  aktywny: true,
  ostatnieLogowanie: new Date().toISOString(),
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwicm9sZSI6IldMQVNDSUNJRUwiLCJpYXQiOjE3MzMyNDEyMDAsImV4cCI6MTczMzMyNzYwMH0.mock-token-for-testing';

const mockClients = [
  {
    id: '1',
    imie: 'Anna',
    nazwisko: 'Kowalska',
    telefon: '+48 123 456 789',
    email: 'anna.kowalska@email.com',
    zrodlo: 'Google Maps',
    aktywny: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    imie: 'Magdalena',
    nazwisko: 'Nowak',
    telefon: '+48 987 654 321',
    email: 'magdalena.nowak@email.com',
    zrodlo: 'Polecenie',
    aktywny: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    imie: 'Joanna',
    nazwisko: 'Lewandowska',
    telefon: '+48 555 666 777',
    email: 'joanna.lewandowska@email.com',
    zrodlo: 'Facebook',
    aktywny: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    imie: 'Katarzyna',
    nazwisko: 'Wiśniewski',
    telefon: '+48 222 333 444',
    email: 'katarzyna.wisniewski@email.com',
    zrodlo: 'Instagram',
    aktywny: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    imie: 'Urszula',
    nazwisko: 'Michalski',
    telefon: '+48 111 222 333',
    email: null,
    zrodlo: 'Strona internetowa',
    aktywny: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    imie: 'Beata',
    nazwisko: 'Grabowska',
    telefon: '+48 444 555 666',
    email: 'beata.grabowska@email.com',
    zrodlo: null,
    aktywny: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    imie: 'Agnieszka',
    nazwisko: 'Szymańska',
    telefon: '+48 777 888 999',
    email: 'agnieszka.szymanska@email.com',
    zrodlo: 'Polecenie',
    aktywny: true,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    imie: 'Maria',
    nazwisko: 'Piotrowska',
    telefon: '+48 666 777 888',
    email: 'maria.piotrowska@email.com',
    zrodlo: 'Google Maps',
    aktywny: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '9',
    imie: 'Dorota',
    nazwisko: 'Zwolińska',
    telefon: '+48 333 444 555',
    email: null,
    zrodlo: 'Instagram',
    aktywny: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10',
    imie: 'Ewa',
    nazwisko: 'Jaworska',
    telefon: '+48 888 999 111',
    email: 'ewa.jaworska@email.com',
    zrodlo: 'Facebook',
    aktywny: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  console.log(`${req.method} ${pathname}`);

  // Login endpoint
  if (pathname === '/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      setTimeout(() => {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            code: 200,
            message: 'Login successful',
            data: {
              token: mockToken,
              user: mockUser,
            },
          })
        );
      }, 500); // Simulate network delay
    });
    return;
  }

  // Clients list endpoint
  if (pathname === '/klienci' && req.method === 'GET') {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const search = query.search || '';

    let filteredClients = mockClients;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredClients = mockClients.filter(
        (client) =>
          client.imie.toLowerCase().includes(searchLower) ||
          client.nazwisko.toLowerCase().includes(searchLower) ||
          client.telefon.includes(search)
      );
    }

    const total = filteredClients.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);

    setTimeout(() => {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          success: true,
          data: paginatedClients,
          pagination: {
            page,
            limit,
            total,
            pages,
            hasMore: page < pages,
          },
        })
      );
    }, 400); // Simulate network delay
    return;
  }

  // 404 for other endpoints
  res.writeHead(404);
  res.end(
    JSON.stringify({
      success: false,
      code: 404,
      message: 'Endpoint not found',
    })
  );
});

server.listen(PORT, () => {
  console.log(`\n🚀 Mock API Server running on http://localhost:${PORT}\n`);
  console.log('Available endpoints:');
  console.log('  POST /auth/login - Login with any credentials');
  console.log('  GET  /klienci - Get client list (supports ?page=1&limit=10&search=name)');
  console.log('\n');
});
