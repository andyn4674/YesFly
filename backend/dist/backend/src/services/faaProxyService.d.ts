import { RestrictionFeatureCollection } from '../types';
/**
 * FAA Proxy Service for integrating with FAA UAS Facility Map Data API
 *
 * This service handles communication with the FAA ArcGIS REST API
 * and transforms the ArcGIS JSON response to GeoJSON format compatible
 * with the YesFly application.
 */
export declare class FAAProxyService {
    private readonly FAA_API_URL;
    private readonly API_TIMEOUT;
    /**
     * Get FAA restrictions for a given location and radius
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radius Search radius
     * @returns Promise resolving to GeoJSON FeatureCollection of FAA restrictions
     */
    getFAARestrictions(lat: number, lng: number, radius: number): Promise<RestrictionFeatureCollection>;
    /**
     * Transform FAA ArcGIS JSON response to GeoJSON format
     * @param faaData ArcGIS JSON response from FAA API
     * @returns GeoJSON FeatureCollection
     */
    private transformFAAResponse;
    /**
     * Convert ESRI geometry to GeoJSON format
     * @param esriGeometry ESRI geometry object
     * @returns GeoJSON geometry object
     */
    private convertESRIToGeoJSON;
}
//# sourceMappingURL=faaProxyService.d.ts.map