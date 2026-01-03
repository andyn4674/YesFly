import { LocationInput, RestrictionsResponse } from '../types';
/**
 * Service for handling drone flight restriction data
 *
 * This service provides mock data for the MVP but is structured
 * to easily integrate with real GIS APIs later:
 * - FAA ArcGIS REST services
 * - City GIS open data endpoints
 * - Custom spatial databases
 *
 * The service follows a clean separation of concerns:
 * - Input validation and sanitization
 * - Spatial analysis using Turf.js
 * - Mock data generation (replaceable with real APIs)
 * - Response formatting for frontend consumption
 */
export declare class RestrictionService {
    /**
     * Main method to get restrictions for a given location and radius
     * @param input Location and radius parameters
     * @returns Promise resolving to restrictions response
     */
    getRestrictions(input: LocationInput): Promise<RestrictionsResponse>;
    /**
     * Generates mock FAA airspace restrictions
     * In production, this would call FAA ArcGIS REST services
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radiusMeters Search radius
     * @returns GeoJSON FeatureCollection of airspace restrictions
     */
    private generateAirspaceRestrictions;
    /**
     * Generates mock local/city restrictions
     * In production, this would call city GIS open data APIs
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radiusMeters Search radius
     * @returns GeoJSON FeatureCollection of local restrictions
     */
    private generateLocalRestrictions;
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
     * Helper method to get random local restriction category
     */
    private getRandomLocalCategory;
    /**
     * Helper method to generate airspace names
     */
    private generateAirspaceName;
    /**
     * Helper method to generate local restriction names
     */
    private generateLocalName;
}
//# sourceMappingURL=restrictionService.d.ts.map