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
const types_1 = require("../types");
const spatial_1 = require("../utils/spatial");
/**
 * Mock data configuration
 * This can be easily replaced with real GIS API calls later
 * All measurements in imperial units (feet) for FAA compatibility
 */
const MOCK_CONFIG = {
    minRadius: 328, // ~100 meters in feet
    maxRadius: 16404, // ~5000 meters in feet
    maxRestrictionCount: 8,
    // FAA airspace altitude limits in feet
    faaAirspaceClasses: {
        'Class B': { maxAlt: 10000, description: 'Busy airport airspace' },
        'Class C': { maxAlt: 4000, description: 'Medium airport airspace' },
        'Class D': { maxAlt: 2500, description: 'Small airport airspace' },
        'Class E': { maxAlt: 18000, description: 'Controlled airspace' },
        'Restricted': { maxAlt: 0, description: 'No-fly zone' },
        'Prohibited': { maxAlt: 0, description: 'Critical no-fly zone' }
    }
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
     * @param input Location and radius parameters (converted to feet internally)
     * @returns Promise resolving to restrictions response
     */
    async getRestrictions(input) {
        try {
            // 1. Validate input parameters
            const validatedInput = (0, spatial_1.validateInput)(input);
            // Convert meters to feet for internal processing
            const radiusFeet = validatedInput.radius;
            const { lat, lng } = validatedInput;
            // 2. Generate search area buffer (using feet)
            const searchArea = (0, spatial_1.generateSearchArea)(lat, lng, radiusFeet);
            // 3. Generate mock restriction data
            const airspaceRestrictions = this.generateAirspaceRestrictions(lat, lng, radiusFeet);
            const localRestrictions = this.generateLocalRestrictions(lat, lng, radiusFeet);
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
     * Generates mock FAA airspace restrictions using imperial units
     * In production, this would call FAA ArcGIS REST services
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radiusFeet Search radius in feet
     * @returns GeoJSON FeatureCollection of airspace restrictions
     */
    generateAirspaceRestrictions(lat, lng, radiusFeet) {
        const count = Math.floor(Math.random() * 3) + 1; // 1-3 restrictions
        const features = [];
        // Get FAA airspace classes from config (with null check)
        const airspaceClasses = Object.entries(MOCK_CONFIG.faaAirspaceClasses || {});
        for (let i = 0; i < count; i++) {
            // Create random restriction polygon (using feet)
            const restriction = (0, spatial_1.createRandomPolygon)(lng, lat, radiusFeet * 0.8, 6);
            // Select random airspace class
            const [airspaceClass, config] = airspaceClasses[Math.floor(Math.random() * airspaceClasses.length)];
            // Add metadata properties conforming to RestrictionLayer interface
            restriction.properties = {
                id: `airspace-${Date.now()}-${i}`,
                geometry: restriction.geometry,
                category: types_1.RestrictionCategory.FAA,
                type: config.maxAlt === 0 ? types_1.RestrictionType.NO_FLY : types_1.RestrictionType.AUTH_REQUIRED,
                authority: 'Federal Aviation Administration',
                description: `${airspaceClass} airspace - ${config.description}`,
                sourceUrl: 'https://www.faa.gov/uas/',
                confidenceLevel: types_1.ConfidenceLevel.HIGH,
                jurisdiction: {
                    country: 'United States',
                    state: 'California'
                },
                effectiveDate: new Date().toISOString(),
                notes: `FAA ${airspaceClass} airspace - authorization required for drone operations`,
                metadata: {
                    dataSource: 'FAA ArcGIS',
                    lastVerified: new Date().toISOString()
                },
                // FAA-specific properties using imperial units (feet)
                maxAGL: config.maxAlt, // Maximum altitude in feet
                airspaceClass: airspaceClass,
                facility: `K${this.generateRandomAirportCode()}`,
                radiusFeet: Math.round(radiusFeet),
                altitudeUnit: 'feet'
            };
            features.push(restriction);
        }
        return {
            type: 'FeatureCollection',
            features
        };
    }
    /**
     * Generates mock local/city restrictions using imperial units
     * In production, this would call city GIS open data APIs
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radiusFeet Search radius in feet
     * @returns GeoJSON FeatureCollection of local restrictions
     */
    generateLocalRestrictions(lat, lng, radiusFeet) {
        const count = Math.floor(Math.random() * 4) + 1; // 1-4 restrictions
        const features = [];
        for (let i = 0; i < count; i++) {
            // Create random local restriction polygon (using feet)
            const restriction = (0, spatial_1.createRandomPolygon)(lng, lat, radiusFeet * 0.6, 5);
            // Add metadata properties conforming to RestrictionLayer interface
            const category = this.getRandomLocalCategory();
            const restrictionType = i % 2 === 0 ? types_1.RestrictionType.NO_FLY : types_1.RestrictionType.AUTH_REQUIRED;
            // Local restrictions typically have lower altitude limits (in feet)
            const maxAltitudes = {
                'Park': 400,
                'Stadium': 3000,
                'Prison': 2000,
                'Power Plant': 1000,
                'Hospital': 500,
                'School': 400
            };
            restriction.properties = {
                id: `local-${Date.now()}-${i}`,
                geometry: restriction.geometry,
                category: category === 'Park' ? types_1.RestrictionCategory.CITY :
                    category === 'Stadium' ? types_1.RestrictionCategory.CITY :
                        category === 'Prison' ? types_1.RestrictionCategory.STATE :
                            category === 'Power Plant' ? types_1.RestrictionCategory.PRIVATE :
                                category === 'Hospital' ? types_1.RestrictionCategory.CITY :
                                    types_1.RestrictionCategory.CITY,
                type: restrictionType,
                authority: category === 'Park' ? 'City Parks Department' :
                    category === 'Stadium' ? 'City Events Authority' :
                        category === 'Prison' ? 'State Corrections Department' :
                            category === 'Power Plant' ? 'Private Energy Corporation' :
                                category === 'Hospital' ? 'City Health Department' :
                                    'Local Government',
                description: `${category} - Local government flight restriction`,
                sourceUrl: 'https://www.citygis.gov/restrictions',
                confidenceLevel: types_1.ConfidenceLevel.MEDIUM,
                jurisdiction: {
                    country: 'United States',
                    state: 'California',
                    city: 'San Francisco'
                },
                enforcement: '24/7',
                penalties: 'Fines and legal action',
                notes: `Local government restriction at ${category} - check with city authorities before flying`,
                metadata: {
                    dataSource: 'City GIS Open Data',
                    lastVerified: new Date().toISOString()
                },
                // Local restriction properties using imperial units (feet)
                maxAGL: maxAltitudes[category],
                radiusFeet: Math.round(radiusFeet),
                altitudeUnit: 'feet'
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
        console.log('calculateAllowedAreas called with:', {
            searchAreaFeatures: searchArea.features.length,
            restrictionsCount: restrictions.length,
            restrictionsTypes: restrictions.map(r => r.type),
            restrictionsProperties: restrictions.map(r => r.properties?.name || 'unnamed')
        });
        let allowedArea = searchArea.features[0];
        // Subtract each restriction from the allowed area
        for (const restriction of restrictions) {
            try {
                // Turf.js difference operation - subtract restriction from allowed area
                // Use the correct syntax for turf.difference (two features, not FeatureCollection)
                console.log('Calculating difference between allowedArea and restriction', {
                    allowedAreaType: allowedArea.type,
                    restrictionType: restriction.type,
                    allowedAreaCoords: allowedArea.geometry?.coordinates?.length,
                    restrictionCoords: restriction.geometry?.coordinates?.length
                });
                const difference = turf.difference({
                    type: 'FeatureCollection',
                    features: [allowedArea, restriction]
                });
                console.log('Difference result:', {
                    result: difference,
                    resultType: difference?.type,
                    resultIsNull: difference === null
                });
                if (difference) {
                    allowedArea = difference;
                    console.log('Updated allowedArea:', {
                        type: allowedArea.type,
                        coordinatesLength: allowedArea.geometry?.coordinates?.length
                    });
                }
                else {
                    console.log('Difference returned null - restriction completely covers allowed area');
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
     * Helper method to generate random airport facility code
     * @returns Random 3-4 letter airport code (e.g., "DFW", "LAX")
     */
    generateRandomAirportCode() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        const length = Math.random() > 0.5 ? 3 : 4; // 3 or 4 letters
        for (let i = 0; i < length; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return code;
    }
    /**
     * Helper method to get random local restriction category
     */
    getRandomLocalCategory() {
        const categories = ['Park', 'Stadium', 'Prison', 'Power Plant', 'Hospital', 'School'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
}
exports.RestrictionService = RestrictionService;
//# sourceMappingURL=restrictionService.js.map