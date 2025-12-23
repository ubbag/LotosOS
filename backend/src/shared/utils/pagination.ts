/**
 * Pagination utilities for database queries
 */

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

/**
 * Parse pagination parameters from query string
 * @param page - page number (1-indexed)
 * @param limit - items per page
 * @returns { skip, take, page, limit }
 */
export function parsePagination(
  page?: number | string,
  limit?: number | string
): PaginationResult {
  // Parse page number (default: 1)
  let pageNum = 1;
  if (page) {
    const parsed = parseInt(String(page), 10);
    if (!isNaN(parsed) && parsed > 0) {
      pageNum = parsed;
    }
  }

  // Parse limit (default: 20, max: 100)
  let pageLimit = 20;
  if (limit) {
    const parsed = parseInt(String(limit), 10);
    if (!isNaN(parsed) && parsed > 0) {
      pageLimit = Math.min(parsed, 100);
    }
  }

  // Calculate skip
  const skip = (pageNum - 1) * pageLimit;

  return {
    skip,
    take: pageLimit,
    page: pageNum,
    limit: pageLimit,
  };
}

/**
 * Format paginated response
 * @param data - array of items
 * @param total - total number of items
 * @param page - current page number
 * @param limit - items per page
 * @returns formatted response
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const pages = Math.ceil(total / limit);
  const hasMore = page < pages;

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasMore,
    },
  };
}

/**
 * Create Prisma pagination query object
 * @param params - pagination parameters
 * @returns { skip, take } for Prisma
 */
export function createPaginationQuery(params: PaginationParams) {
  const { skip, take } = parsePagination(params.page, params.limit);
  return { skip, take };
}

/**
 * Create Prisma pagination options with sorting
 */
export interface PaginationWithSort<T> {
  skip: number;
  take: number;
  orderBy?: T;
}

/**
 * Parse pagination with optional sorting
 */
export function parsePaginationWithSort<T>(
  page?: number | string,
  limit?: number | string,
  orderBy?: T
): PaginationWithSort<T> {
  const { skip, take } = parsePagination(page, limit);
  return {
    skip,
    take,
    ...(orderBy && { orderBy }),
  };
}
