/**
 * Masazysci (Therapists) Module
 *
 * This module handles all therapist-related operations including:
 * - CRUD operations for therapists
 * - Therapist schedule management
 * - Therapist reservations tracking
 * - Soft delete functionality
 * - Search and filtering
 */

export { MasazysciService, masazysciService } from './masazysci.service';
export { masazysciRoutes, masazysciRoutes as registerMasazysciRoutes } from './masazysci.routes';
export * from './masazysci.schemas';
