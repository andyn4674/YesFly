/**
 * Type definitions for the drone flight restriction API
 */

// Input validation types
export interface LocationInput {
  lat: number;
  lng: number;
  radiusMeters: number;
}

// Import shared restriction layer types
import {
  RestrictionFeature,
  RestrictionFeatureCollection,
  RestrictionCategory,
  RestrictionType,
  ConfidenceLevel,
  Jurisdiction,
  RestrictionMetadata
} from '../../../shared/types/RestrictionLayer';

// Response structure using shared types
export interface RestrictionsResponse {
  searchArea: RestrictionFeatureCollection;
  airspaceRestrictions: RestrictionFeatureCollection;
  localRestrictions: RestrictionFeatureCollection;
  allowedAreas: RestrictionFeatureCollection;
}

// Mock data configuration
export interface MockDataConfig {
  minRadiusMeters: number;
  maxRadiusMeters: number;
  maxRestrictionCount: number;
}

// Re-export shared types for convenience
export {
  RestrictionFeature,
  RestrictionFeatureCollection,
  RestrictionCategory,
  RestrictionType,
  ConfidenceLevel,
  Jurisdiction,
  RestrictionMetadata
};
