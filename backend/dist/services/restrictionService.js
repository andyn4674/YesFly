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
exports.RestrictionService = void 0;
const turf = __importStar(require("@turf/turf"));
const spatial_1 = require("../utils/spatial");
/**
 * Mock data configuration
 * This can be easily replaced with real GIS API calls later
 */
const MOCK_CONFIG = {
    minRadiusMeters: 100,
    maxRadiusMeters: 5000,
    maxRestrictionCount: 8
};
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
class RestrictionService {
    /**
     * Main method to get restrictions for a given location and radius
     * @param input Location and radius parameters
     * @returns Promise resolving to restrictions response
     */
    async getRestrictions(input) {
        try {
            // 1. Validate input parameters
            const validatedInput = (0, spatial_1.validateInput)(input);
            const { lat, lng, radiusMeters } = validatedInput;
            // 2. Generate search area buffer
            const searchArea = (0, spatial_1.generateSearchArea)(lat, lng, radiusMeters);
            // 3. Generate mock restriction data
            const airspaceRestrictions = this.generateAirspaceRestrictions(lat, lng, radiusMeters);
            const localRestrictions = this.generateLocalRestrictions(lat, lng, radiusMeters);
            // 4. Calculate allowed areas (complement of restrictions)
            const allowedAreas = this.calculateAllowedAreas(searchArea, [...airspaceRestrictions.features, ...localRestrictions.features]);
            return {
                searchArea,
                airspaceRestrictions,
                localRestrictions,
                allowedAreas
            };
        }
        catch (error) {
            throw new Error(`Failed to get restrictions: ${error}`);
        }
    }
    /**
     * Generates mock FAA airspace restrictions
     * In production, this would call FAA ArcGIS REST services
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radiusMeters Search radius
     * @returns GeoJSON FeatureCollection of airspace restrictions
     */
    generateAirspaceRestrictions(lat, lng, radiusMeters) {
        const count = Math.floor(Math.random() * 3) + 1; // 1-3 restrictions
        const features = [];
        for (let i = 0; i < count; i++) {
            // Create random restriction polygon
            const restriction = (0, spatial_1.createRandomPolygon)(lng, lat, radiusMeters * 0.8, 6);
            // Add metadata properties
            restriction.properties = {
                id: `airspace-${Date.now()}-${i}`,
                type: 'airspace',
                category: this.getRandomAirspaceCategory(),
                name: this.generateAirspaceName(i),
                description: 'FAA controlled airspace restriction',
                altitudeMin: Math.floor(Math.random() * 1000),
                altitudeMax: Math.floor(Math.random() * 4000) + 1000,
                effectiveDate: new Date().toISOString(),
                source: 'FAA',
                areaSqMeters: (0, spatial_1.calculateArea)(restriction)
            };
            features.push(restriction);
        }
        return {
            type: 'FeatureCollection',
            features
        };
    }
    /**
     * Generates mock local/city restrictions
     * In production, this would call city GIS open data APIs
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radiusMeters Search radius
     * @returns GeoJSON FeatureCollection of local restrictions
     */
    generateLocalRestrictions(lat, lng, radiusMeters) {
        const count = Math.floor(Math.random() * 4) + 1; // 1-4 restrictions
        const features = [];
        for (let i = 0; i < count; i++) {
            // Create random local restriction polygon
            const restriction = (0, spatial_1.createRandomPolygon)(lng, lat, radiusMeters * 0.6, 5);
            // Add metadata properties
            restriction.properties = {
                id: `local-${Date.now()}-${i}`,
                type: 'local',
                category: this.getRandomLocalCategory(),
                name: this.generateLocalName(i),
                description: 'Local government flight restriction',
                city: 'Sample City',
                enforcement: '24/7',
                penalties: 'Fines and legal action',
                source: 'City GIS',
                areaSqMeters: (0, spatial_1.calculateArea)(restriction)
            };
            features.push(restriction);
        }
        return {
            type: 'FeatureCollection',
            features
        };
    }
    /**
     * Calculates allowed areas by subtracting restrictions from search area
     * @param searchArea The search area buffer
     * @param restrictions Array of restriction features
     * @returns GeoJSON FeatureCollection of allowed areas
     */
    calculateAllowedAreas(searchArea, restrictions) {
        let allowedArea = searchArea.features[0];
        // Subtract each restriction from the allowed area
        for (const restriction of restrictions) {
            try {
                // Turf.js difference operation - subtract restriction from allowed area
                const difference = turf.difference(allowedArea, restriction);
                if (difference) {
                    allowedArea = difference;
                }
            }
            catch (error) {
                // If difference operation fails, continue with current allowed area
                console.warn('Failed to calculate difference for restriction:', error);
            }
        }
        // If the entire area is restricted, return empty features
        if (!allowedArea) {
            return {
                type: 'FeatureCollection',
                features: []
            };
        }
        // If allowed area is still the full search area, wrap it in a FeatureCollection
        if (allowedArea.type === 'Feature') {
            return {
                type: 'FeatureCollection',
                features: [allowedArea]
            };
        }
        // Handle case where difference returns a MultiPolygon
        return {
            type: 'FeatureCollection',
            features: [allowedArea]
        };
    }
    /**
     * Helper method to get random airspace category
     */
    getRandomAirspaceCategory() {
        const categories = ['Class B', 'Class C', 'Class D', 'Restricted', 'Prohibited', 'MOA'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
    /**
     * Helper method to get random local restriction category
     */
    getRandomLocalCategory() {
        const categories = ['Park', 'Stadium', 'Prison', 'Power Plant', 'Hospital', 'School'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
    /**
     * Helper method to generate airspace names
     */
    generateAirspaceName(index) {
        const names = [
            'Metropolitan Class B Airspace',
            'Regional Approach Control',
            'Airport Traffic Pattern',
            'Military Operations Area',
            'Temporary Flight Restriction'
        ];
        return `${names[index % names.length]} ${index + 1}`;
    }
    /**
     * Helper method to generate local restriction names
     */
    generateLocalName(index) {
        const names = [
            'City Park No-Fly Zone',
            'Stadium Event Area',
            'Correctional Facility',
            'Nuclear Power Plant',
            'Medical Center',
            'University Campus'
        ];
        return `${names[index % names.length]} ${index + 1}`;
    }
}
exports.RestrictionService = RestrictionService;
//# sourceMappingURL=restrictionService.js.map