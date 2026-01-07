import { LocationInput, RestrictionsResponse } from '../types';
/**
 * Service for handling drone flight restriction data
 *
 * This service integrates with real FAA ArcGIS REST services to provide
 * accurate airspace restrictions for drone operations. It also includes
 * mock local restrictions for demonstration purposes.
 *
 * The service follows a clean separation of concerns:
 * - Input validation and sanitization
 * - Spatial analysis using Turf.js
 * - Real FAA API integration for airspace restrictions
 * - Mock local restrictions for city/state/private areas
 * - Response formatting for frontend consumption
 */
export declare class RestrictionService {
    private faaProxyService;
    constructor();
    /**
     * Main method to get restrictions for a given location and radius
     * @param input Location and radius parameters
     * @returns Promise resolving to restrictions response
     */
    getRestrictions(input: LocationInput): Promise<RestrictionsResponse>;
    /**
     * Generates FAA airspace restrictions using real FAA API
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radiusFeet Search radius in feet
     * @returns GeoJSON FeatureCollection of airspace restrictions
     */
    private generateAirspaceRestrictions;
    /**
     * Combines FAA restrictions that belong to the same airport/facility
     * @param restrictions FeatureCollection of FAA restrictions
     * @returns FeatureCollection with combined restrictions
     */
    private combineSameAirportRestrictions;
    /**
     * Combines multiple restrictions for the same facility into one
     * @param restrictions Array of restrictions for the same facility
     * @param facilityName Name of the facility/airport
     * @returns Combined restriction feature
     */
    private combineRestrictionsForFacility;
    /**
     * Generates mock local/city restrictions using imperial units
     * In production, this would call city GIS open data APIs
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radius Search radius
     * @returns GeoJSON FeatureCollection of local restrictions
     */
    /**
     * Calculates allowed areas by subtracting restrictions from search area
     * @param searchArea The search area buffer
     * @param restrictions Array of restriction features
     * @returns GeoJSON FeatureCollection of allowed areas
     */
    private calculateAllowedAreas;
    /**
     * Helper method to get random airspace category
     */
    private getRandomAirspaceCategory;
    /**
     * Helper method to generate random airport facility code
     * @returns Random 3-4 letter airport code (e.g., "DFW", "LAX")
     */
    private generateRandomAirportCode;
    /**
     * Helper method to get random local restriction category
     */
    private getRandomLocalCategory;
}
//# sourceMappingURL=restrictionService.d.ts.map