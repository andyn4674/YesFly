/**
 * Type definitions for the drone flight restriction API
 */

// Input validation types
export interface LocationInput {
  lat: number;
  lng: number;
  radius: number;
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
  minRadius: number;
  maxRadius: number;
  maxRestrictionCount: number;
  // Imperial units for FAA compatibility
  faaAirspaceClasses?: {
    [key: string]: {
      maxAlt: number;
      description: string;
    };
  };
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
