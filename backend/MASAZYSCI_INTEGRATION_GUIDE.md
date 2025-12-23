# MASAZYSCI Module - Integration Guide

## Quick Start

The MASAZYSCI module is **complete and ready to use**. Follow these steps to integrate it into your application.

## Step 1: Verify Module Location

Ensure all files are in the correct location:
```
backend/src/modules/masazysci/
├── index.ts
├── masazysci.schemas.ts
├── masazysci.service.ts
├── masazysci.routes.ts
└── README.md
```

✅ All files are already created and in place.

## Step 2: Register Routes

In your main Fastify application file (e.g., `src/app.ts` or `src/server.ts`), register the masazysci routes:

```typescript
import { masazysciRoutes } from './modules/masazysci';

// After your Fastify instance is created
export async function buildApp(fastify: FastifyInstance) {
  // ... other middleware and setup ...

  // Register masazysci routes
  await fastify.register(masazysciRoutes, { prefix: '/masazysci' });

  // ... other routes ...
}
```

## Step 3: Verify Dependencies

All dependencies are standard and should already be installed:

```json
{
  "dependencies": {
    "fastify": "^4.x.x",
    "@prisma/client": "^5.x.x",
    "zod": "^3.x.x"
  }
}
```

If not installed, run:
```bash
npm install fastify @prisma/client zod
```

## Step 4: Database Migration (if needed)

The module uses the existing `Masazysta` model from your Prisma schema. Ensure your database is up to date:

```bash
npx prisma migrate dev
# or
npx prisma db push
```

## Step 5: Test the Module

### 1. Start your server
```bash
npm run dev
```

### 2. Get an authentication token
Login to get a JWT token (using your auth endpoint):
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@example.com", "password": "your-password"}'
```

Save the token from the response.

### 3. Test the endpoints

**List therapists:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/masazysci
```

**Create a therapist (requires MANAGER or WLASCICIEL role):**
```bash
curl -X POST http://localhost:3000/masazysci \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imie": "Jan",
    "nazwisko": "Kowalski",
    "specjalizacje": ["Thai massage", "Sports massage"],
    "jezyki": ["Polish", "English"],
    "kolejnosc": 1
  }'
```

**Get a specific therapist:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/masazysci/THERAPIST_ID
```

**Get therapist schedule:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/masazysci/THERAPIST_ID/grafik?dataOd=2024-01-01&dataDo=2024-01-31"
```

**Get therapist reservations:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/masazysci/THERAPIST_ID/rezerwacje?status=POTWIERDZONA&page=1&limit=20"
```

## Step 6: Frontend Integration

### React/TypeScript Example

```typescript
// types/masazysci.ts
export interface Masazysta {
  id: string;
  imie: string;
  nazwisko: string;
  specjalizacje: string[];
  jezyki: string[];
  zdjecieUrl: string | null;
  aktywny: boolean;
  kolejnosc: number;
  createdAt: string;
  updatedAt: string;
}

// api/masazysci.ts
const API_URL = process.env.REACT_APP_API_URL;

export const masazysciApi = {
  // List therapists
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    aktywny?: boolean;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.aktywny !== undefined) query.append('aktywny', params.aktywny.toString());

    const response = await fetch(`${API_URL}/masazysci?${query}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },

  // Get single therapist
  async getById(id: string) {
    const response = await fetch(`${API_URL}/masazysci/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },

  // Create therapist
  async create(data: {
    imie: string;
    nazwisko: string;
    specjalizacje?: string[];
    jezyki?: string[];
    zdjecieUrl?: string;
    kolejnosc?: number;
  }) {
    const response = await fetch(`${API_URL}/masazysci`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Update therapist
  async update(id: string, data: Partial<{
    imie: string;
    nazwisko: string;
    specjalizacje: string[];
    jezyki: string[];
    zdjecieUrl: string;
    kolejnosc: number;
  }>) {
    const response = await fetch(`${API_URL}/masazysci/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Delete therapist
  async delete(id: string) {
    const response = await fetch(`${API_URL}/masazysci/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },

  // Get schedule
  async getSchedule(id: string, dataOd: string, dataDo: string) {
    const response = await fetch(
      `${API_URL}/masazysci/${id}/grafik?dataOd=${dataOd}&dataDo=${dataDo}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.json();
  },

  // Get reservations
  async getReservations(id: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    dataOd?: string;
    dataDo?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.dataOd) query.append('dataOd', params.dataOd);
    if (params?.dataDo) query.append('dataDo', params.dataDo);

    const response = await fetch(
      `${API_URL}/masazysci/${id}/rezerwacje?${query}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.json();
  },
};
```

### React Hook Example

```typescript
// hooks/useMasazysci.ts
import { useState, useEffect } from 'react';
import { masazysciApi } from '../api/masazysci';

export function useMasazysci(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  aktywny?: boolean;
}) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await masazysciApi.list(filters);
        if (result.success) {
          setData(result.data);
          setPagination(result.pagination);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filters]);

  return { data, pagination, loading, error };
}
```

## Step 7: Environment Variables

Ensure your `.env` file has the required variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lotos_spa"
JWT_SECRET="your-secret-key"
PORT=3000
```

## Troubleshooting

### Issue: "Therapist not found" error
**Solution:** Ensure the therapist ID exists in the database and the user has proper authentication.

### Issue: "Forbidden" error on create/update/delete
**Solution:** Verify the user has MANAGER or WLASCICIEL role. RECEPCJA role can only read data.

### Issue: "Validation failed" error
**Solution:** Check the request body matches the schema requirements. See README.md for field requirements.

### Issue: "Authorization header is missing"
**Solution:** Include the JWT token in the Authorization header: `Authorization: Bearer YOUR_TOKEN`

### Issue: Date validation errors
**Solution:** Ensure dates are in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)

## API Endpoint Summary

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | /masazysci | ✓ | All | List therapists |
| GET | /masazysci/:id | ✓ | All | Get therapist |
| POST | /masazysci | ✓ | M/W* | Create therapist |
| PUT | /masazysci/:id | ✓ | M/W* | Update therapist |
| DELETE | /masazysci/:id | ✓ | M/W* | Delete therapist |
| GET | /masazysci/:id/grafik | ✓ | All | Get schedule |
| GET | /masazysci/:id/rezerwacje | ✓ | All | Get reservations |

*M/W = MANAGER or WLASCICIEL only

## Additional Resources

- **Full API Documentation:** `backend/src/modules/masazysci/README.md`
- **Implementation Summary:** `MASAZYSCI_IMPLEMENTATION_SUMMARY.md`
- **Prisma Schema:** `backend/prisma/schema.prisma`

## Support

For questions or issues:
1. Check the README.md for detailed API documentation
2. Review the implementation code in the masazysci module
3. Check error messages for specific validation issues

## Next Steps

1. ✅ Module is ready - integrate into your app
2. Test all endpoints with your authentication system
3. Create frontend components to consume the API
4. Add additional business logic if needed
5. Deploy to production

---

**Status:** ✅ Ready for Integration
**Version:** 1.0.0
**Last Updated:** 2024-12-04
