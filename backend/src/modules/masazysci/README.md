# MASAZYSCI (Therapists) Module

## Overview
Complete production-ready implementation of the therapists management module for the Lotos SPA system. This module handles all therapist-related operations including CRUD, schedule management, and reservations tracking.

## Database Model
Uses the `Masazysta` model from Prisma schema with the following fields:
- `id` (String, CUID)
- `imie` (String) - First name
- `nazwisko` (String) - Last name
- `specjalizacje` (String[]) - Specializations
- `jezyki` (String[]) - Languages spoken
- `zdjecieUrl` (String?) - Profile photo URL
- `aktywny` (Boolean) - Active status
- `kolejnosc` (Int) - Display order
- `createdAt`, `updatedAt` (DateTime)

### Relations
- `grafikPracy` - Work schedule entries (GrafikPracy[])
- `rezerwacje` - Reservations (Rezerwacja[])

## API Endpoints

### 1. GET /masazysci
List all therapists with pagination and filtering.

**Authentication:** Required (all roles)

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Items per page
- `search` (string, optional) - Search by first/last name
- `aktywny` (string: "true"|"false", optional) - Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "imie": "Jan",
      "nazwisko": "Kowalski",
      "specjalizacje": ["Sports massage", "Deep tissue"],
      "jezyki": ["Polish", "English"],
      "zdjecieUrl": "https://...",
      "aktywny": true,
      "kolejnosc": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### 2. GET /masazysci/:id
Get single therapist with schedule and upcoming reservations.

**Authentication:** Required (all roles)

**URL Parameters:**
- `id` (string) - Therapist ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "imie": "Jan",
    "nazwisko": "Kowalski",
    "specjalizacje": ["Sports massage"],
    "jezyki": ["Polish", "English"],
    "zdjecieUrl": "https://...",
    "aktywny": true,
    "kolejnosc": 1,
    "grafikPracy": [
      {
        "id": "clyyy",
        "masazystaId": "clxxx",
        "data": "2024-01-15T00:00:00.000Z",
        "godzinaOd": "2024-01-15T08:00:00.000Z",
        "godzinaDo": "2024-01-15T16:00:00.000Z",
        "status": "PRACUJE"
      }
    ],
    "rezerwacje": [
      {
        "id": "clzzz",
        "klient": {
          "id": "claaa",
          "imie": "Anna",
          "nazwisko": "Nowak",
          "telefon": "+48123456789"
        },
        "usluga": {
          "id": "clbbb",
          "nazwa": "Thai Massage"
        },
        "wariant": {
          "czasMinut": 60
        },
        "godzinaOd": "2024-01-15T10:00:00.000Z",
        "godzinaDo": "2024-01-15T11:00:00.000Z",
        "status": "POTWIERDZONA"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. POST /masazysci
Create new therapist.

**Authentication:** Required (MANAGER, WLASCICIEL only)

**Request Body:**
```json
{
  "imie": "Jan",
  "nazwisko": "Kowalski",
  "specjalizacje": ["Sports massage", "Deep tissue"],
  "jezyki": ["Polish", "English"],
  "zdjecieUrl": "https://example.com/photo.jpg",
  "kolejnosc": 1
}
```

**Validation Rules:**
- `imie`: Required, non-empty string
- `nazwisko`: Required, non-empty string
- `specjalizacje`: Optional array of strings (default: [])
- `jezyki`: Optional array of strings (default: [])
- `zdjecieUrl`: Optional valid URL or empty string
- `kolejnosc`: Optional integer >= 0 (default: 0)

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "imie": "Jan",
    "nazwisko": "Kowalski",
    "specjalizacje": ["Sports massage", "Deep tissue"],
    "jezyki": ["Polish", "English"],
    "zdjecieUrl": "https://example.com/photo.jpg",
    "aktywny": true,
    "kolejnosc": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. PUT /masazysci/:id
Update existing therapist.

**Authentication:** Required (MANAGER, WLASCICIEL only)

**URL Parameters:**
- `id` (string) - Therapist ID

**Request Body:** (all fields optional, partial update)
```json
{
  "imie": "Jan",
  "nazwisko": "Kowalski",
  "specjalizacje": ["Thai massage"],
  "jezyki": ["Polish"],
  "zdjecieUrl": "https://example.com/new-photo.jpg",
  "kolejnosc": 2
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "imie": "Jan",
    "nazwisko": "Kowalski",
    "specjalizacje": ["Thai massage"],
    "jezyki": ["Polish"],
    "zdjecieUrl": "https://example.com/new-photo.jpg",
    "aktywny": true,
    "kolejnosc": 2,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

### 5. DELETE /masazysci/:id
Soft delete therapist (sets aktywny = false).

**Authentication:** Required (MANAGER, WLASCICIEL only)

**URL Parameters:**
- `id` (string) - Therapist ID

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Therapist deactivated successfully"
}
```

**Note:** This is a soft delete. The therapist record remains in the database but is marked as inactive.

### 6. GET /masazysci/:id/grafik
Get therapist schedule for a date range.

**Authentication:** Required (all roles)

**URL Parameters:**
- `id` (string) - Therapist ID

**Query Parameters:**
- `dataOd` (string, required) - Start date (ISO 8601 format: YYYY-MM-DD)
- `dataDo` (string, required) - End date (ISO 8601 format: YYYY-MM-DD)

**Example:** `/masazysci/clxxx/grafik?dataOd=2024-01-01&dataDo=2024-01-31`

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "masazysta": {
      "id": "clxxx",
      "imie": "Jan",
      "nazwisko": "Kowalski"
    },
    "dataOd": "2024-01-01",
    "dataDo": "2024-01-31",
    "grafik": [
      {
        "id": "clyyy",
        "masazystaId": "clxxx",
        "data": "2024-01-15T00:00:00.000Z",
        "godzinaOd": "2024-01-15T08:00:00.000Z",
        "godzinaDo": "2024-01-15T16:00:00.000Z",
        "status": "PRACUJE"
      },
      {
        "id": "clzzz",
        "masazystaId": "clxxx",
        "data": "2024-01-16T00:00:00.000Z",
        "godzinaOd": "2024-01-16T08:00:00.000Z",
        "godzinaDo": "2024-01-16T16:00:00.000Z",
        "status": "PRACUJE"
      }
    ]
  }
}
```

**Validation:**
- Both dates are required
- Dates must be valid ISO 8601 format
- `dataOd` must be <= `dataDo`

### 7. GET /masazysci/:id/rezerwacje
Get therapist reservations with filtering and pagination.

**Authentication:** Required (all roles)

**URL Parameters:**
- `id` (string) - Therapist ID

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `status` (enum, optional) - Filter by status: NOWA, POTWIERDZONA, W_TRAKCIE, ZAKONCZONA, ANULOWANA, NO_SHOW
- `dataOd` (string, optional) - Filter from date (ISO 8601)
- `dataDo` (string, optional) - Filter to date (ISO 8601)

**Example:** `/masazysci/clxxx/rezerwacje?status=POTWIERDZONA&page=1&limit=20`

**Response:** 200 OK
```json
{
  "success": true,
  "masazysta": {
    "id": "clxxx",
    "imie": "Jan",
    "nazwisko": "Kowalski"
  },
  "data": [
    {
      "id": "clzzz",
      "numer": "RES-001",
      "klient": {
        "id": "claaa",
        "imie": "Anna",
        "nazwisko": "Nowak",
        "telefon": "+48123456789",
        "email": "anna@example.com"
      },
      "usluga": {
        "id": "clbbb",
        "nazwa": "Thai Massage",
        "kategoria": "Massage"
      },
      "wariant": {
        "id": "clccc",
        "czasMinut": 60,
        "cenaRegularna": "150.00",
        "cenaPromocyjna": null
      },
      "gabinet": {
        "id": "clddd",
        "numer": "1",
        "nazwa": "Room 1"
      },
      "data": "2024-01-15T00:00:00.000Z",
      "godzinaOd": "2024-01-15T10:00:00.000Z",
      "godzinaDo": "2024-01-15T11:00:00.000Z",
      "cenaCalokowita": "150.00",
      "status": "POTWIERDZONA",
      "zrodlo": "TELEFON",
      "platnoscMetoda": "GOTOWKA",
      "platnoscStatus": "NIEOPLACONA",
      "notatki": "Client prefers strong pressure",
      "createdAt": "2024-01-10T00:00:00.000Z",
      "updatedAt": "2024-01-10T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

## Error Responses

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": {
    "imie": ["First name is required"],
    "zdjecieUrl": ["Invalid URL format"]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Authorization header is missing"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Therapist not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error"
}
```

## Service Layer Methods

### MasazysciService Class

#### `findAll(filters: ListMasazysciQueryRequest)`
Returns paginated list of therapists with optional search and active status filtering.

#### `findById(id: string)`
Returns single therapist with:
- Next 30 days of work schedule
- Next 20 upcoming reservations (NOWA, POTWIERDZONA, W_TRAKCIE)
- Includes related client, service, and variant data

#### `create(data: CreateMasazystaRequest)`
Creates new therapist with default values:
- `aktywny`: true
- `specjalizacje`: [] (if not provided)
- `jezyki`: [] (if not provided)
- `kolejnosc`: 0 (if not provided)

#### `update(id: string, data: UpdateMasazystaRequest)`
Partial update of therapist. Only provided fields are updated.

#### `delete(id: string)`
Soft delete - sets `aktywny` to false. Therapist data is preserved.

#### `getGrafik(id: string, query: GetScheduleQueryRequest)`
Returns work schedule entries for specified date range.

#### `getRezerwacje(id: string, filters: GetReservationsQueryRequest)`
Returns paginated reservations with optional filters:
- Status filter
- Date range filter
- Includes full client, service, variant, and room data

#### `getStatistics(id: string)` (bonus method)
Returns therapist statistics:
- Total reservations count
- This month reservations count
- This week reservations count
- Completed reservations count
- Cancelled reservations count

## Validation Schemas (Zod)

### createMasazystaSchema
- `imie`: Required, non-empty, trimmed
- `nazwisko`: Required, non-empty, trimmed
- `specjalizacje`: Array of strings (default: [])
- `jezyki`: Array of strings (default: [])
- `zdjecieUrl`: Valid URL or empty string (optional)
- `kolejnosc`: Integer >= 0 (default: 0)

### updateMasazystaSchema
Partial version of createMasazystaSchema - all fields optional.

### listMasazysciQuerySchema
- `page`: Coerced number >= 1 (default: 1)
- `limit`: Coerced number 1-100 (default: 10)
- `search`: Optional string
- `aktywny`: Optional string transformed to boolean

### getScheduleQuerySchema
- `dataOd`: Required date string (ISO 8601)
- `dataDo`: Required date string (ISO 8601)

### getReservationsQuerySchema
- `page`: Coerced number >= 1 (default: 1)
- `limit`: Coerced number 1-100 (default: 20)
- `status`: Optional enum (reservation status)
- `dataOd`: Optional date string (ISO 8601)
- `dataDo`: Optional date string (ISO 8601)

## Authorization Matrix

| Endpoint | RECEPCJA | MANAGER | WLASCICIEL |
|----------|----------|---------|------------|
| GET /masazysci | ✓ | ✓ | ✓ |
| GET /masazysci/:id | ✓ | ✓ | ✓ |
| POST /masazysci | ✗ | ✓ | ✓ |
| PUT /masazysci/:id | ✗ | ✓ | ✓ |
| DELETE /masazysci/:id | ✗ | ✓ | ✓ |
| GET /masazysci/:id/grafik | ✓ | ✓ | ✓ |
| GET /masazysci/:id/rezerwacje | ✓ | ✓ | ✓ |

## Features Implemented

✓ Full CRUD operations for therapists
✓ Soft delete functionality (aktywny flag)
✓ Search by first name or last name
✓ Filter by active status
✓ Pagination support on all list endpoints
✓ Schedule retrieval with date range filtering
✓ Reservations retrieval with multiple filters
✓ Complete Zod validation on all inputs
✓ Role-based authorization (MANAGER+ for mutations)
✓ Comprehensive error handling
✓ Type-safe implementation with TypeScript
✓ Standard response format
✓ No TODOs or placeholders
✓ Production-ready code

## Files Structure

```
masazysci/
├── index.ts                 # Module exports
├── masazysci.schemas.ts     # Zod validation schemas and types
├── masazysci.service.ts     # Business logic layer
├── masazysci.routes.ts      # Fastify route handlers
└── README.md               # This documentation
```

## Dependencies

- `fastify` - Web framework
- `zod` - Schema validation
- `@prisma/client` - Database ORM
- `../../shared/errors` - Custom error classes
- `../../shared/prisma` - Prisma client instance
- `../auth/auth.middleware` - Authentication & authorization

## Usage Example

```typescript
// In your main Fastify app setup
import { masazysciRoutes } from './modules/masazysci';

// Register routes
await fastify.register(masazysciRoutes, { prefix: '/masazysci' });
```

## Testing Notes

To test the endpoints:

1. **Authentication**: All endpoints require a valid JWT token in the Authorization header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

2. **Create/Update/Delete**: Requires MANAGER or WLASCICIEL role

3. **Sample cURL commands**:
   ```bash
   # List therapists
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3000/masazysci?page=1&limit=10"

   # Get therapist by ID
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3000/masazysci/clxxx"

   # Create therapist (MANAGER+ only)
   curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"imie":"Jan","nazwisko":"Kowalski"}' \
     "http://localhost:3000/masazysci"

   # Get schedule
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3000/masazysci/clxxx/grafik?dataOd=2024-01-01&dataDo=2024-01-31"

   # Get reservations
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3000/masazysci/clxxx/rezerwacje?status=POTWIERDZONA&page=1"
   ```

## Notes

- All dates should be in ISO 8601 format (YYYY-MM-DD or full datetime)
- Soft delete preserves all therapist data and relationships
- Schedule retrieval automatically orders by date ascending
- Reservations retrieval defaults to descending order (newest first)
- The findById method automatically includes upcoming schedule and reservations
- Search is case-insensitive and works on both first and last names
- Arrays (specjalizacje, jezyki) are stored as PostgreSQL arrays

## Version
1.0.0 - Initial production release
