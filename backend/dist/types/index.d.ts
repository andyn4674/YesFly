/**
 * Type definitions for the drone flight restriction API
 */
export interface LocationInput {
    lat: number;
    lng: number;
    radiusMeters: number;
}
export interface GeoJSONFeature {
    type: 'Feature';
    properties: Record<string, any>;
    geometry: {
        type: string;
        coordinates: any[];
    };
}
export interface GeoJSONFeatureCollection {
    type: 'FeatureCollection';
    features: GeoJSONFeature[];
}
export interface RestrictionsResponse {
    searchArea: GeoJSONFeatureCollection;
    airspaceRestrictions: GeoJSONFeatureCollection;
    localRestrictions: GeoJSONFeatureCollection;
    allowedAreas: GeoJSONFeatureCollection;
}
export interface MockDataConfig {
    minRadiusMeters: number;
    maxRadiusMeters: number;
    maxRestrictionCount: number;
}
//# sourceMappingURL=index.d.ts.map