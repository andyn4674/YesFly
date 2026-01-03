/**
 * Type definitions for the drone flight restriction API
 */

// Input validation types
export interface LocationInput {
  lat: number;
  lng: number;
  radiusMeters: number;
}

// GeoJSON types for response
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

// Response structure
export interface RestrictionsResponse {
  searchArea: GeoJSONFeatureCollection;
  airspaceRestrictions: GeoJSONFeatureCollection;
  localRestrictions: GeoJSONFeatureCollection;
  allowedAreas: GeoJSONFeatureCollection;
}

// Mock data configuration
export interface MockDataConfig {
  minRadiusMeters: number;
  maxRadiusMeters: number;
  maxRestrictionCount: number;
}
