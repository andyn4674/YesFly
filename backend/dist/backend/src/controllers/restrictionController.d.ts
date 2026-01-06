import { Request, Response } from 'express';
/**
 * Controller for handling drone flight restriction API endpoints
 *
 * This controller handles HTTP requests and responses, delegating
 * business logic to the RestrictionService. It provides:
 * - Input validation and error handling
 * - HTTP status code management
 * - Response formatting
 * - Request/response logging
 *
 * The controller follows REST API best practices:
 * - POST /api/restrictions for getting restrictions
 * - Proper error responses with meaningful messages
 * - Consistent response format
 * - Input validation with clear error messages
 */
export declare class RestrictionController {
    private restrictionService;
    constructor();
    /**
     * GET /api/restrictions endpoint handler
     * Accepts location and radius, returns GeoJSON layers for map rendering
     *
     * Request body format:
     * {
     *   "lat": 37.7749,
     *   "lng": -122.4194,
     *   "radius": 1000
     * }
     *
     * Response format:
     * {
     *   "searchArea": { GeoJSON FeatureCollection },
     *   "airspaceRestrictions": { GeoJSON FeatureCollection },
     *   "localRestrictions": { GeoJSON FeatureCollection },
     *   "allowedAreas": { GeoJSON FeatureCollection }
     * }
     */
    getRestrictions(req: Request, res: Response): Promise<void>;
    /**
     * Health check endpoint
     * Useful for monitoring and load balancers
     */
    healthCheck(req: Request, res: Response): Promise<void>;
    /**
     * API documentation endpoint
     * Provides information about the API endpoints and expected formats
     */
    getApiDocs(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=restrictionController.d.ts.map