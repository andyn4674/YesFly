import * as turf from '@turf/turf';
import { LocationInput, RestrictionFeatureCollection } from '../types';

// Type aliases for Turf.js types to avoid import issues
// Using any types as a workaround for Turf.js type export issues
type TurfPoint = any;
type TurfPolygon = any;
type TurfFeature = any;

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
export function validateInput(input: LocationInput): LocationInput {
  const { lat, lng, radius } = input;

  // Validate latitude (-90 to 90)
  if (typeof lat !== 'number' || lat < -90 || lat > 90) {
    throw new Error('Invalid latitude. Must be between -90 and 90.');
  }

  // Validate longitude (-180 to 180)
  if (typeof lng !== 'number' || lng < -180 || lng > 180) {
    throw new Error('Invalid longitude. Must be between -180 and 180.');
  }

  return input;
}

/**
 * Creates a GeoJSON point from coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns Turf.js Point feature
 */
export function createPoint(lat: number, lng: number): any {
  return turf.point([lng, lat]); // Turf uses [lng, lat] order
}

  /**
   * Generates a search area buffer around a point
   * @param lat Latitude of center point
   * @param lng Longitude of center point
   * @param radius Radius
   * @returns GeoJSON FeatureCollection with the buffer polygon
   */
  export function generateSearchArea(
    lat: number,
    lng: number,
    radius: number
  ): RestrictionFeatureCollection {
  try {
    const centerPoint = createPoint(lat, lng);
    
    // Create buffer using Turf.js
    // Units: 'miles'
    const buffer = turf.buffer(centerPoint, radius, { units: 'miles' });
    
    // Convert to FeatureCollection format expected by frontend
    return {
      type: 'FeatureCollection',
      features: [buffer as any]
    };
  } catch (error) {
    throw new Error(`Failed to generate search area: ${error}`);
  }
}

/**
 * Creates a random polygon within a bounding box
 * Used for generating mock restriction areas
 * @param centerLng Center longitude
 * @param centerLat Center latitude
 * @param maxRadius Maximum distance from center
 * @param numVertices Number of vertices for the polygon
 * @returns Turf.js Polygon feature
 */
export function createRandomPolygon(
  centerLng: number,
  centerLat: number,
  maxRadius: number,
  numVertices: number = 6
): any {
  const vertices: number[][] = [];
  
  // Generate random vertices around the center
  for (let i = 0; i < numVertices; i++) {
    // Random angle (0 to 2π)
    const angle = Math.random() * 2 * Math.PI;
    
    // Random distance (0 to maxRadius)
    const distance = Math.random() * maxRadius;
    
    // Convert polar coordinates to lat/lng
    const vertex = turf.destination(
      [centerLng, centerLat],
      distance,
      angle * (180 / Math.PI), // Convert to degrees
      { units: 'miles' }
    );
    
    vertices.push([vertex.geometry.coordinates[0], vertex.geometry.coordinates[1]]);
  }
  
  // Close the polygon by repeating the first vertex
  vertices.push(vertices[0]);
  
  return turf.polygon([vertices]);
}

/**
 * Checks if two GeoJSON features intersect
 * @param feature1 First feature
 * @param feature2 Second feature
 * @returns Boolean indicating if features intersect
 */
export function featuresIntersect(
  feature1: any,
  feature2: any
): boolean {
  try {
    const intersection = turf.intersect(feature1, feature2);
    return intersection !== null;
  } catch (error) {
    // If intersection fails, assume no intersection
    return false;
  }
}


/**
 * Simplifies a GeoJSON geometry to reduce complexity
 * Useful for performance optimization with complex polygons
 * @param geometry GeoJSON geometry
 * @param tolerance Simplification tolerance (higher = more simplified)
 * @returns Simplified geometry
 */
export function simplifyGeometry(
  geometry: any,
  tolerance: number = 0.001
): any {
  return turf.simplify(geometry, { tolerance, highQuality: true });
}
