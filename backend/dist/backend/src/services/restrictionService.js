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
const faaProxyService_1 = require("./faaProxyService");
/**
 * Service for handling drone flight restriction data
 *
 * This service integrates with real FAA ArcGIS REST services to provide
 * accurate airspace restrictions for drone operations. It also includes
 * mock local restrictions for demonstration purposes.
 *
 * The service follows a clean separation of concerns:
 * - Input validation and sanitization
 * - Spatial analysis using Turf.js
 * - Real FAA API integration for airspace restrictions
 * - Mock local restrictions for city/state/private areas
 * - Response formatting for frontend consumption
 */
class RestrictionService {
    constructor() {
        this.faaProxyService = new faaProxyService_1.FAAProxyService();
    }
    /**
     * Main method to get restrictions for a given location and radius
     * @param input Location and radius parameters
     * @returns Promise resolving to restrictions response
     */
    async getRestrictions(input) {
        try {
            // 1. Validate input parameters
            const validatedInput = (0, spatial_1.validateInput)(input);
            const radius = validatedInput.radius;
            const { lat, lng } = validatedInput;
            // 2. Generate search area buffer
            const searchArea = (0, spatial_1.generateSearchArea)(lat, lng, radius);
            // 3. Generate restriction data (now async for FAA API integration)
            const airspaceRestrictions = await this.generateAirspaceRestrictions(lat, lng, radius);
            // const localRestrictions = this.generateLocalRestrictions(lat, lng, radius);
            // 4. Calculate allowed areas (complement of restrictions)
            const allowedAreas = this.calculateAllowedAreas(searchArea, [...airspaceRestrictions.features]);
            return {
                searchArea,
                airspaceRestrictions,
                localRestrictions: { type: 'FeatureCollection', features: [] },
                allowedAreas
            };
        }
        catch (error) {
            throw new Error(`Failed to get restrictions: ${error}`);
        }
    }
    /**
     * Generates FAA airspace restrictions using real FAA API
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radiusFeet Search radius in feet
     * @returns GeoJSON FeatureCollection of airspace restrictions
     */
    async generateAirspaceRestrictions(lat, lng, radiusFeet) {
        try {
            // Use real FAA API via proxy service
            console.log('Using real FAA API for airspace restrictions');
            const faaRestrictions = await this.faaProxyService.getFAARestrictions(lat, lng, radiusFeet);
            // Combine restrictions that belong to the same airport/facility
            return this.combineSameAirportRestrictions(faaRestrictions);
        }
        catch (error) {
            console.error('FAA API failed:', error);
            // Return empty feature collection if FAA API fails
            return {
                type: 'FeatureCollection',
                features: []
            };
        }
    }
    /**
     * Combines FAA restrictions that belong to the same airport/facility
     * @param restrictions FeatureCollection of FAA restrictions
     * @returns FeatureCollection with combined restrictions
     */
    combineSameAirportRestrictions(restrictions) {
        if (!restrictions.features || restrictions.features.length === 0) {
            return restrictions;
        }
        // Group restrictions by facility (airport)
        const restrictionsByFacility = {};
        for (const restriction of restrictions.features) {
            const facility = restriction.properties.facility;
            if (!facility)
                continue;
            if (!restrictionsByFacility[facility]) {
                restrictionsByFacility[facility] = [];
            }
            restrictionsByFacility[facility].push(restriction);
        }
        // Combine restrictions for each facility
        const combinedFeatures = [];
        for (const [facility, facilityRestrictions] of Object.entries(restrictionsByFacility)) {
            if (facilityRestrictions.length === 1) {
                // Only one restriction for this facility, no need to combine
                combinedFeatures.push(facilityRestrictions[0]);
            }
            else {
                // Multiple restrictions for the same facility, combine them
                const combinedRestriction = this.combineRestrictionsForFacility(facilityRestrictions, facility);
                combinedFeatures.push(combinedRestriction);
            }
        }
        return {
            type: 'FeatureCollection',
            features: combinedFeatures
        };
    }
    /**
     * Combines multiple restrictions for the same facility into one
     * @param restrictions Array of restrictions for the same facility
     * @param facilityName Name of the facility/airport
     * @returns Combined restriction feature
     */
    combineRestrictionsForFacility(restrictions, facilityName) {
        // Use Turf.js to combine the geometries
        try {
            // Create a feature collection for Turf.js union operation
            const featureCollection = {
                type: 'FeatureCollection',
                features: restrictions
            };
            // Use the first restriction as base and union others with it
            let combinedGeometry = restrictions[0].geometry;
            for (let i = 1; i < restrictions.length; i++) {
                try {
                    // Union the geometries to create a single combined polygon
                    const unionResult = turf.union(combinedGeometry, restrictions[i].geometry);
                    if (unionResult) {
                        combinedGeometry = unionResult;
                    }
                }
                catch (error) {
                    console.warn(`Failed to union geometries for facility ${facilityName}:`, error);
                    // If union fails, just keep the current combined geometry
                }
            }
            // Create the combined restriction feature
            const combinedRestriction = {
                type: 'Feature',
                geometry: combinedGeometry,
                properties: {
                    ...restrictions[0].properties,
                    // Update description to indicate this is a combined restriction
                    description: `FAA UAS Facility Map - Combined restrictions for ${facilityName} - Max AGL: ${Math.max(...restrictions.map(r => r.properties.maxAGL || 0))}ft`,
                    // Use the highest maxAGL from all combined restrictions
                    maxAGL: Math.max(...restrictions.map(r => r.properties.maxAGL || 0)),
                    // Update the ID to indicate it's combined
                    id: `faa-combined-${facilityName.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substring(2, 8)}`,
                    // Add information about how many restrictions were combined
                    combinedFrom: restrictions.length,
                    originalGridIds: restrictions.map(r => r.properties.gridId).filter(Boolean)
                }
            };
            return combinedRestriction;
        }
        catch (error) {
            console.error(`Failed to combine restrictions for facility ${facilityName}:`, error);
            // If combining fails, return the first restriction as fallback
            return restrictions[0];
        }
    }
    /**
     * Generates mock local/city restrictions using imperial units
     * In production, this would call city GIS open data APIs
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radius Search radius
     * @returns GeoJSON FeatureCollection of local restrictions
     */
    // private generateLocalRestrictions(lat: number, lng: number, radiusFeet: number): any {
    //   const count = Math.floor(Math.random() * 4) + 1; // 1-4 restrictions
    //   const features: any[] = [];
    //   for (let i = 0; i < count; i++) {
    //     // Create random local restriction polygon (using feet)
    //     const restriction = createRandomPolygon(lng, lat, radiusFeet * 0.6, 5);
    //     // Add metadata properties conforming to RestrictionLayer interface
    //     const category = this.getRandomLocalCategory();
    //     const restrictionType = i % 2 === 0 ? RestrictionType.NO_FLY : RestrictionType.AUTH_REQUIRED;
    //     // Local restrictions typically have lower altitude limits (in feet)
    //     const maxAltitudes = {
    //       'Park': 400,
    //       'Stadium': 3000,
    //       'Prison': 2000,
    //       'Power Plant': 1000,
    //       'Hospital': 500,
    //       'School': 400
    //     };
    //     restriction.properties = {
    //       id: `local-${Date.now()}-${i}`,
    //       geometry: restriction.geometry,
    //       category: category === 'Park' ? RestrictionCategory.CITY :
    //                category === 'Stadium' ? RestrictionCategory.CITY :
    //                category === 'Prison' ? RestrictionCategory.STATE :
    //                category === 'Power Plant' ? RestrictionCategory.PRIVATE :
    //                category === 'Hospital' ? RestrictionCategory.CITY :
    //                RestrictionCategory.CITY,
    //       type: restrictionType,
    //       authority: category === 'Park' ? 'City Parks Department' :
    //                category === 'Stadium' ? 'City Events Authority' :
    //                category === 'Prison' ? 'State Corrections Department' :
    //                category === 'Power Plant' ? 'Private Energy Corporation' :
    //                category === 'Hospital' ? 'City Health Department' :
    //                'Local Government',
    //       description: `${category} - Local government flight restriction`,
    //       sourceUrl: 'https://www.citygis.gov/restrictions',
    //       confidenceLevel: ConfidenceLevel.MEDIUM,
    //       jurisdiction: {
    //         country: 'United States',
    //         state: 'California',
    //         city: 'San Francisco'
    //       },
    //       enforcement: '24/7',
    //       penalties: 'Fines and legal action',
    //       notes: `Local government restriction at ${category} - check with city authorities before flying`,
    //       metadata: {
    //         dataSource: 'City GIS Open Data',
    //         lastVerified: new Date().toISOString()
    //       },
    //       // Local restriction properties using imperial units (feet)
    //       maxAGL: maxAltitudes[category as keyof typeof maxAltitudes],
    //       radiusFeet: Math.round(radiusFeet),
    //       altitudeUnit: 'feet'
    //     };
    //     features.push(restriction);
    //   }
    //   return {
    //     type: 'FeatureCollection',
    //     features
    //   };
    // }
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
                // Create a FeatureCollection with both features for turf.difference
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