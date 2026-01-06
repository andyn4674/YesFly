/**
 * Shared TypeScript interface for drone flight restriction layers
 *
 * This interface represents a single restriction layer that can be used
 * consistently across both frontend and backend components. It provides
 * a standardized schema for all types of flight restrictions.
 */

// Enums for strict type safety
export enum RestrictionCategory {
  FAA = 'FAA',
  STATE = 'STATE',
  CITY = 'CITY',
  PRIVATE = 'PRIVATE'
}

export enum RestrictionType {
  NO_FLY = 'NO_FLY',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  ADVISORY = 'ADVISORY'
}

export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Jurisdiction information for the restriction
 */
export interface Jurisdiction {
  country: string;
  state?: string;
  county?: string;
  city?: string;
}

/**
 * Metadata for auditing and debugging purposes
 */
export interface RestrictionMetadata {
  createdAt?: string;
  updatedAt?: string;
  dataSource?: string;
  lastVerified?: string;
  version?: string;
}

/**
 * GeoJSON geometry types supported for map rendering
 */
export type GeoJSONGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'Polygon'; coordinates: [number, number][][] }
  | { type: 'MultiPolygon'; coordinates: [number, number][][][] }
  | { type: 'GeometryCollection'; geometries: GeoJSONGeometry[] };

/**
 * Main RestrictionLayer interface
 *
 * This interface represents a single flight restriction layer with all
 * necessary properties for map rendering, legal compliance, and user information.
 */
export interface RestrictionLayer {
  /**
   * Unique identifier for this restriction layer
   */
  id: string;

  /**
   * GeoJSON geometry for map rendering
   */
  geometry: GeoJSONGeometry;

  /**
   * The category of authority responsible for this restriction
   */
  category: RestrictionCategory;

  /**
   * The type of restriction (severity level)
   */
  type: RestrictionType;

  /**
   * The authority responsible for enforcing this restriction
   */
  authority: string;

  /**
   * Human-readable description of the restriction
   */
  description: string;

  /**
   * Source URL linking to the authoritative reference
   */
  sourceUrl: string;

  /**
   * Confidence level in the accuracy of this restriction data
   */
  confidenceLevel: ConfidenceLevel;

  /**
   * Jurisdiction information (country required, others optional)
   */
  jurisdiction: Jurisdiction;

  /**
   * Optional metadata for auditing and debugging
   */
  metadata?: RestrictionMetadata;

  /**
   * Additional properties that may be specific to certain restriction types
   */
  [key: string]: any;
}

/**
 * Extended interface for FAA airspace restrictions
 */
export interface FAAAirspaceRestriction extends RestrictionLayer {
  category: RestrictionCategory.FAA;
  type: RestrictionType;

  /**
   * Effective date of this restriction
   */
  effectiveDate: string;
}

/**
 * Extended interface for local/city restrictions
 */
export interface LocalRestriction extends RestrictionLayer {
  category: RestrictionCategory.CITY | RestrictionCategory.STATE | RestrictionCategory.PRIVATE;
  type: RestrictionType;

  /**
   * Enforcement schedule (e.g., "24/7", "Daylight hours only")
   */
  enforcement: string;

  /**
   * Potential penalties for violation
   */
  penalties: string;
}

/**
 * Type for GeoJSON Feature with RestrictionLayer properties
 */
export interface RestrictionFeature {
  type: 'Feature';
  properties: RestrictionLayer;
  geometry: GeoJSONGeometry;
}

/**
 * Type for GeoJSON FeatureCollection of restrictions
 */
export interface RestrictionFeatureCollection {
  type: 'FeatureCollection';
  features: RestrictionFeature[];
}
