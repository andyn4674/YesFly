import { LocationInput, RestrictionFeatureCollection } from '../types';
/**
 * Spatial utility functions for drone flight restriction analysis
 *
 * This module handles all spatial operations using Turf.js, including:
 * - Input validation for geographic coordinates
 * - Buffer generation for search areas
 * - Spatial analysis for restriction overlap
 * - GeoJSON feature creation
 */
/**
 * Validates input coordinates and radius
 * @param input Location input with lat, lng, and radius
 * @returns Promise that resolves to validated input or throws error
 */
export declare function validateInput(input: LocationInput): LocationInput;
/**
 * Creates a GeoJSON point from coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns Turf.js Point feature
 */
export declare function createPoint(lat: number, lng: number): any;
/**
 * Generates a search area buffer around a point
 * @param lat Latitude of center point
 * @param lng Longitude of center point
 * @param radius Radius
 * @returns GeoJSON FeatureCollection with the buffer polygon
 */
export declare function generateSearchArea(lat: number, lng: number, radius: number): RestrictionFeatureCollection;
/**
 * Creates a random polygon within a bounding box
 * Used for generating mock restriction areas
 * @param centerLng Center longitude
 * @param centerLat Center latitude
 * @param maxRadius Maximum distance from center
 * @param numVertices Number of vertices for the polygon
 * @returns Turf.js Polygon feature
 */
export declare function createRandomPolygon(centerLng: number, centerLat: number, maxRadius: number, numVertices?: number): any;
/**
 * Checks if two GeoJSON features intersect
 * @param feature1 First feature
 * @param feature2 Second feature
 * @returns Boolean indicating if features intersect
 */
export declare function featuresIntersect(feature1: any, feature2: any): boolean;
/**
 * Simplifies a GeoJSON geometry to reduce complexity
 * Useful for performance optimization with complex polygons
 * @param geometry GeoJSON geometry
 * @param tolerance Simplification tolerance (higher = more simplified)
 * @returns Simplified geometry
 */
export declare function simplifyGeometry(geometry: any, tolerance?: number): any;
//# sourceMappingURL=spatial.d.ts.map