"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInput = validateInput;
exports.createPoint = createPoint;
exports.generateSearchArea = generateSearchArea;
exports.createRandomPolygon = createRandomPolygon;
exports.featuresIntersect = featuresIntersect;
exports.simplifyGeometry = simplifyGeometry;
const turf = __importStar(require("@turf/turf"));
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
function validateInput(input) {
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
function createPoint(lat, lng) {
    return turf.point([lng, lat]); // Turf uses [lng, lat] order
}
/**
 * Generates a search area buffer around a point
 * @param lat Latitude of center point
 * @param lng Longitude of center point
 * @param radius Radius
 * @returns GeoJSON FeatureCollection with the buffer polygon
 */
function generateSearchArea(lat, lng, radius) {
    try {
        const centerPoint = createPoint(lat, lng);
        // Create buffer using Turf.js
        // Units: 'miles'
        const buffer = turf.buffer(centerPoint, radius, { units: 'miles' });
        // Convert to FeatureCollection format expected by frontend
        return {
            type: 'FeatureCollection',
            features: [buffer]
        };
    }
    catch (error) {
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
function createRandomPolygon(centerLng, centerLat, maxRadius, numVertices = 6) {
    const vertices = [];
    // Generate random vertices around the center
    for (let i = 0; i < numVertices; i++) {
        // Random angle (0 to 2π)
        const angle = Math.random() * 2 * Math.PI;
        // Random distance (0 to maxRadius)
        const distance = Math.random() * maxRadius;
        // Convert polar coordinates to lat/lng
        const vertex = turf.destination([centerLng, centerLat], distance, angle * (180 / Math.PI), // Convert to degrees
        { units: 'miles' });
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
function featuresIntersect(feature1, feature2) {
    try {
        const intersection = turf.intersect(feature1, feature2);
        return intersection !== null;
    }
    catch (error) {
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
function simplifyGeometry(geometry, tolerance = 0.001) {
    return turf.simplify(geometry, { tolerance, highQuality: true });
}
//# sourceMappingURL=spatial.js.map