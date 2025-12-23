# Lotos SPA - Modules Guide

This document describes the implemented modules and their usage.

## Auth Module (`src/modules/auth/`)

### Overview
The authentication module handles user login, password management, and JWT-based authorization.

### Files

#### `auth.schemas.ts`
Zod schemas for request validation:
- `loginSchema` - Email and password login validation
- `changePasswordSchema` - Password change validation
- `registerSchema` - User registration (if needed)

#### `auth.service.ts`
Core business logic:
- `hashPassword(password)` - Hash password using bcrypt (10 rounds)
- `comparePassword(password, hash)` - Verify password
- `login(email, password)` - Authenticate user and return JWT token
- `generateToken(userId, role)` - Generate JWT with 24-hour expiration
- `verifyToken(token)` - Verify and decode JWT
- `getUserById(userId)` - Get user profile
- `changePassword(userId, currentPassword, newPassword)` - Change user password

#### `auth.middleware.ts`
Fastify middleware for authentication and authorization:
- `authenticate` - Verifies JWT token and attaches user to request
- `authorize(...roles)` - Checks if user has required role
- `optionalAuth` - Optional authentication (doesn't fail if missing)

**Usage in routes:**
```typescript
fastify.get('/protected', { onRequest: [authenticate] }, handler);
fastify.post('/admin', { onRequest: [authorize('WLASCICIEL')] }, handler);
```

#### `auth.routes.ts`
API endpoints:
- `POST /auth/login` - Login (returns JWT token)
- `GET /auth/me` - Get current user profile (requires auth)
- `POST /auth/change-password` - Change password (requires auth)
- `POST /auth/logout` - Logout (optional, for frontend)

### JWT Token Structure
```typescript
{
  userId: string,
  role: 'RECEPCJA' | 'MANAGER' | 'WLASCICIEL',
  iat: number,  // Issued at
  exp: number   // Expires in 24 hours
}
```

### Example: Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "cuid...",
      "email": "user@example.com",
      "imie": "Jan",
      "rola": "RECEPCJA",
      "aktywny": true,
      "ostatnieLogowanie": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

---

## Klienci Module (`src/modules/klienci/`)

### Overview
Manages client/customer information, notes, and visit history.

### Files

#### `klienci.schemas.ts`
Zod schemas for validation:
- `createKlientSchema` - Create new client validation
- `updateKlientSchema` - Update client validation
- `createNotatkaSchema` - Add client note validation
- `searchQuerySchema` - Search query validation
- `listQuerySchema` - Pagination and filtering validation

**Phone Validation:**
- Accepts: `+48XXXXXXXXX` or `9-digit` numbers
- Automatically normalizes to `+48XXXXXXXXX` format
- Examples: `+48123456789`, `123456789`, `048123456789`

#### `klienci.service.ts`
Business logic:
- `findAll(filters)` - List clients with pagination and filtering
- `search(query, limit)` - Quick search for autocomplete (max 10 results)
- `findById(id)` - Get single client with notes and history
- `create(data)` - Create new client (checks phone uniqueness)
- `update(id, data)` - Update client info
- `delete(id)` - Soft delete (sets aktywny to false)
- `addNotatka(klientId, data, userId)` - Add note to client
- `getNotatki(klientId)` - Get all notes for client
- `deleteNotatka(klientId, notatkaId)` - Remove note
- `getHistoriaWizyt(klientId, page, limit)` - Get visit history

#### `klienci.routes.ts`
API endpoints (all require authentication):

**Clients:**
- `GET /klienci` - List with pagination, search, filtering
  - Query params: `page` (default 1), `limit` (default 10), `search`, `filter` (ALL/Z_PAKIETEM/BEZ_PAKIETU)
- `GET /klienci/szukaj?q=<query>` - Search for autocomplete
- `GET /klienci/:id` - Get client profile with notes and recent visits
- `POST /klienci` - Create new client
- `PUT /klienci/:id` - Update client
- `DELETE /klienci/:id` - Soft delete client

**Notes:**
- `GET /klienci/:id/notatki` - Get all notes
- `POST /klienci/:id/notatki` - Add note (MEDYCZNA/WAZNA/INFO)
- `DELETE /klienci/:id/notatki/:notatkaId` - Delete note

**History:**
- `GET /klienci/:id/historia` - Visit history with pagination

### Example: Create Client
```bash
POST /klienci
Authorization: Bearer <token>
Content-Type: application/json

{
  "imie": "Jan",
  "nazwisko": "Kowalski",
  "telefon": "123456789",
  "email": "jan@example.com",
  "zrodlo": "STRONA"
}

Response:
{
  "success": true,
  "data": {
    "id": "cuid...",
    "imie": "Jan",
    "nazwisko": "Kowalski",
    "telefon": "+48123456789",
    "email": "jan@example.com",
    "zrodlo": "STRONA",
    "aktywny": true,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Example: Search Clients
```bash
GET /klienci?search=jan&page=1&limit=10&filter=ALL
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "cuid...",
      "imie": "Jan",
      "nazwisko": "Kowalski",
      "telefon": "+48123456789",
      "email": "jan@example.com",
      "pakietyKlienta": [
        {
          "id": "cuid...",
          "status": "AKTYWNY",
          "godzinyPozostale": 10,
          "pakiet": { "nazwa": "Pakiet Gold" }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Example: Add Note
```bash
POST /klienci/cuid.../notatki
Authorization: Bearer <token>
Content-Type: application/json

{
  "typ": "MEDYCZNA",
  "tresc": "Pacjent ma alergię na oliwę z oliwek",
  "pokazujPrzyRezerwacji": true
}

Response:
{
  "success": true,
  "data": {
    "id": "cuid...",
    "klientId": "cuid...",
    "typ": "MEDYCZNA",
    "tresc": "Pacjent ma alergię na oliwę z oliwek",
    "pokazujPrzyRezerwacji": true,
    "createdById": "cuid...",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## Error Handling

All endpoints use centralized error handling with custom error classes:

### Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email address"],
    "password": ["Password must be at least 6 characters"]
  }
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Invalid credentials"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You do not have permission to access this resource"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Client not found"
}
```

**Conflict (409):**
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "Phone number already exists"
}
```

---

## Shared Utilities

### Error Classes (`src/shared/errors.ts`)
- `AppError` - Base error class
- `UnauthorizedError` - 401
- `ForbiddenError` - 403
- `NotFoundError` - 404
- `ValidationError` - 400 with validation errors
- `ConflictError` - 409
- `InternalServerError` - 500

---

## Database Relations

### User
- Creates: notes, reservations
- Manages: multiple clients

### Klient
- Has many: notes, packages, reservations
- Can have: active packages, visit history

### NotatkaKlienta
- Belongs to: Klient, User (creator)
- Types: MEDYCZNA (medical), WAZNA (important), INFO

---

## Future Enhancements

1. Add role-based filtering (receptionist sees all, therapist sees own reservations)
2. Implement audit logging for client data changes
3. Add client communication history (SMS, email)
4. Add package integration for pricing
5. Add reservation history filtering
6. Implement client segmentation (VIP, regular, etc.)
7. Add client birthday reminders
8. Add client rating/reviews system
