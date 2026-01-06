"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestrictionController = void 0;
const restrictionService_1 = require("../services/restrictionService");
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
class RestrictionController {
    constructor() {
        this.restrictionService = new restrictionService_1.RestrictionService();
    }
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
    async getRestrictions(req, res) {
        try {
            // 1. Extract and validate input from request body
            const input = req.body;
            // Basic validation - ensure required fields are present
            if (!input || typeof input.lat !== 'number' || typeof input.lng !== 'number' || typeof input.radius !== 'number') {
                res.status(400).json({
                    error: 'Invalid request format',
                    message: 'Request must contain lat (number), lng (number), and radius (number)',
                    example: {
                        lat: 37.7749,
                        lng: -122.4194,
                        radius: 1000
                    }
                });
                return;
            }
            console.log(`Processing restriction request: lat=${input.lat}, lng=${input.lng}, radius=${input.radius}m`);
            // 2. Delegate to service layer for business logic
            const restrictions = await this.restrictionService.getRestrictions(input);
            // 3. Return successful response with GeoJSON data
            res.status(200).json({
                success: true,
                data: restrictions,
                metadata: {
                    timestamp: new Date().toISOString(),
                    request: input
                }
            });
        }
        catch (error) {
            // 4. Handle errors gracefully
            console.error('Error processing restriction request:', error);
            // Return appropriate HTTP status codes based on error type
            if (error instanceof Error) {
                if (error.message.includes('Invalid') || error.message.includes('Invalid radius')) {
                    res.status(400).json({
                        success: false,
                        error: 'Validation Error',
                        message: error.message
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        error: 'Internal Server Error',
                        message: 'Failed to process restriction request',
                        details: process.env.NODE_ENV === 'development' ? error.message : undefined
                    });
                }
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Unknown Error',
                    message: 'An unexpected error occurred'
                });
            }
        }
    }
    /**
     * Health check endpoint
     * Useful for monitoring and load balancers
     */
    async healthCheck(req, res) {
        res.status(200).json({
            status: 'healthy',
            service: 'drone-restriction-api',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0'
        });
    }
    /**
     * API documentation endpoint
     * Provides information about the API endpoints and expected formats
     */
    async getApiDocs(req, res) {
        res.status(200).json({
            service: 'Drone Flight Restriction API',
            version: '1.0.0',
            endpoints: {
                'POST /api/restrictions': {
                    description: 'Get flight restrictions for a location and radius',
                    requestBody: {
                        lat: 'Latitude (number, -90 to 90)',
                        lng: 'Longitude (number, -180 to 180)',
                        radius: 'Search radius in meters (number, 1 to 100000)'
                    },
                    response: {
                        searchArea: 'GeoJSON FeatureCollection of the search buffer',
                        airspaceRestrictions: 'GeoJSON FeatureCollection of FAA airspace restrictions',
                        localRestrictions: 'GeoJSON FeatureCollection of local/city restrictions',
                        allowedAreas: 'GeoJSON FeatureCollection of areas where flight is permitted'
                    }
                },
                'GET /api/health': {
                    description: 'Health check endpoint',
                    response: {
                        status: 'Service health status',
                        service: 'Service name',
                        timestamp: 'Current timestamp',
                        version: 'API version'
                    }
                }
            },
            notes: [
                'All coordinates use WGS84 (EPSG:4326) coordinate system',
                'Radius is limited to 100km maximum for performance reasons',
                'Response includes mock data in MVP - will integrate with real GIS APIs in production',
                'All areas are returned as GeoJSON polygons with metadata properties'
            ]
        });
    }
}
exports.RestrictionController = RestrictionController;
//# sourceMappingURL=restrictionController.js.map