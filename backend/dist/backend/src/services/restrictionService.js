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
const faaProxyService_1 = require("./faaProxyService");
class RestrictionService {
    constructor() {
        this.faaProxyService = new faaProxyService_1.FAAProxyService();
    }
    async getRestrictions(input) {
        const validatedInput = (0, spatial_1.validateInput)(input);
        const { lat, lng, radius } = validatedInput;
        const searchArea = (0, spatial_1.generateSearchArea)(lat, lng, radius);
        // 1️⃣ Generate FAA airspace restrictions
        const airspaceRestrictions = await this.generateAirspaceRestrictions(lat, lng, radius);
        // 2️⃣ Calculate allowed areas
        const allowedAreas = this.calculateAllowedAreas(searchArea, airspaceRestrictions.features);
        return {
            searchArea,
            airspaceRestrictions,
            localRestrictions: { type: 'FeatureCollection', features: [] },
            allowedAreas
        };
    }
    /**
     * Fetch FAA restrictions and merge grids by facility
     */
    async generateAirspaceRestrictions(lat, lng, radius) {
        try {
            const raw = await this.faaProxyService.getFAARestrictions(lat, lng, radius);
            // Merge FAA grids that belong to the same airport
            return this.mergeFAAFeaturesByFacility(raw.features);
        }
        catch (err) {
            console.error('FAA API failed:', err);
            return { type: 'FeatureCollection', features: [] };
        }
    }
    /**
     * Merge multiple FAA restriction grids that belong to the same airport
     * into a single polygon or multipolygon per facility
     */
    mergeFAAFeaturesByFacility(features) {
        const grouped = {};
        // Group by facility or fallback to gridId
        features.forEach(f => {
            const key = f.properties.facility || f.properties.gridId || 'unknown';
            if (!grouped[key])
                grouped[key] = [];
            grouped[key].push(f);
        });
        const mergedFeatures = [];
        Object.entries(grouped).forEach(([facility, group]) => {
            try {
                // Skip if only one feature (no need to merge)
                if (group.length <= 1) {
                    mergedFeatures.push(...group);
                    return;
                }
                // Convert RestrictionFeatures to simple Features for turf processing
                // Filter out GeometryCollections as they're not supported by turf.combine
                const simpleFeatures = group
                    .map(f => ({
                    type: 'Feature',
                    properties: f.properties,
                    geometry: f.geometry
                }))
                    .filter(f => f.geometry.type !== 'GeometryCollection');
                // Skip if no valid features after filtering
                if (simpleFeatures.length === 0) {
                    console.warn(`No valid features to merge for facility ${facility}`);
                    return;
                }
                // Skip if only one feature after filtering
                if (simpleFeatures.length === 1) {
                    const singleFeature = simpleFeatures[0];
                    const props = {
                        ...group[0].properties, // keep original metadata
                        facility,
                        name: group[0].properties.name || 'Unnamed Airspace',
                        category: group[0].properties.category || 'Airspace',
                        type: group[0].properties.type || 'No-Fly',
                        source: group[0].properties.source || 'FAA',
                        notes: group[0].properties.notes || ''
                    };
                    const restrictionFeature = {
                        type: 'Feature',
                        properties: props,
                        geometry: singleFeature.geometry
                    };
                    mergedFeatures.push(restrictionFeature);
                    return;
                }
                // Create a FeatureCollection for turf processing
                const featureCollection = {
                    type: 'FeatureCollection',
                    features: simpleFeatures
                };
                // Combine all polygons into one FeatureCollection
                const combined = turf.combine(featureCollection);
                if (!combined || combined.features.length === 0) {
                    console.warn(`Failed to combine features for facility ${facility}`);
                    mergedFeatures.push(...group);
                    return;
                }
                // Since turf.combine creates MultiPolygons and turf.dissolve expects Polygons,
                // we'll use the combined result directly instead of trying to dissolve
                // This gives us merged polygons that maintain their individual shapes
                // Create a single merged feature for this facility
                // Combine all geometries into a single feature
                if (combined.features.length === 1) {
                    // Single combined feature - use it directly
                    const props = {
                        ...group[0].properties, // keep original metadata
                        facility,
                        name: group[0].properties.name || 'Unnamed Airspace',
                        category: group[0].properties.category || 'Airspace',
                        type: group[0].properties.type || 'No-Fly',
                        source: group[0].properties.source || 'FAA',
                        notes: group[0].properties.notes || ''
                    };
                    const restrictionFeature = {
                        type: 'Feature',
                        properties: props,
                        geometry: combined.features[0].geometry // Cast geometry to match GeoJSONGeometry type
                    };
                    mergedFeatures.push(restrictionFeature);
                }
                else {
                    // Multiple combined features - merge them into a single MultiPolygon feature
                    const props = {
                        ...group[0].properties, // keep original metadata
                        facility,
                        name: group[0].properties.name || 'Unnamed Airspace',
                        category: group[0].properties.category || 'Airspace',
                        type: group[0].properties.type || 'No-Fly',
                        source: group[0].properties.source || 'FAA',
                        notes: group[0].properties.notes || ''
                    };
                    // Create a MultiPolygon geometry from all combined features
                    const multiPolygonGeometry = {
                        type: 'MultiPolygon',
                        coordinates: combined.features.map(f => {
                            const geom = f.geometry;
                            if (geom.type === 'Polygon') {
                                return geom.coordinates;
                            }
                            else if (geom.type === 'MultiPolygon') {
                                return geom.coordinates.flat(); // Flatten nested MultiPolygon coordinates
                            }
                            else {
                                // For other geometry types, try to convert to polygon coordinates
                                return [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]; // Fallback
                            }
                        })
                    };
                    const restrictionFeature = {
                        type: 'Feature',
                        properties: props,
                        geometry: multiPolygonGeometry
                    };
                    mergedFeatures.push(restrictionFeature);
                }
            }
            catch (err) {
                console.warn(`Failed to merge FAA grids for facility ${facility}:`, err);
                mergedFeatures.push(...group); // fallback
            }
        });
        return { type: 'FeatureCollection', features: mergedFeatures };
    }
    calculateAllowedAreas(searchArea, restrictions) {
        // Start with the original search area
        let allowedArea = searchArea.features[0];
        // If there are no restrictions, the entire search area is allowed
        if (restrictions.length === 0) {
            const resultFeature = {
                type: 'Feature',
                properties: {
                    id: 'allowed-area',
                    geometry: allowedArea.geometry,
                    category: types_1.RestrictionCategory.FAA,
                    type: types_1.RestrictionType.NO_FLY,
                    authority: 'System',
                    description: 'Entire search area is allowed (no restrictions)',
                    sourceUrl: '',
                    confidenceLevel: types_1.ConfidenceLevel.HIGH,
                    jurisdiction: { country: 'US' }
                },
                geometry: allowedArea.geometry
            };
            return { type: 'FeatureCollection', features: [resultFeature] };
        }
        // Process each restriction to subtract from the allowed area
        for (const restriction of restrictions) {
            try {
                // Create a FeatureCollection with the search area and restriction
                const searchFeature = {
                    type: 'Feature',
                    properties: {},
                    geometry: allowedArea.geometry
                };
                const restrictionFeature = {
                    type: 'Feature',
                    properties: {},
                    geometry: restriction.geometry
                };
                // Use turf.difference with FeatureCollection as expected by this version
                const featureCollection = {
                    type: 'FeatureCollection',
                    features: [searchFeature, restrictionFeature]
                };
                // Calculate the difference: searchArea - restriction
                const diff = turf.difference(featureCollection);
                if (diff) {
                    // Update the allowed area with the new geometry
                    allowedArea = {
                        ...allowedArea,
                        geometry: diff.geometry
                    };
                }
            }
            catch (err) {
                console.warn('Failed to subtract restriction from allowed area:', err);
                // Continue with the current allowed area if there's an error
            }
        }
        // Create the final result feature
        const resultFeature = {
            type: 'Feature',
            properties: {
                id: 'allowed-area',
                geometry: allowedArea.geometry,
                category: types_1.RestrictionCategory.FAA,
                type: types_1.RestrictionType.NO_FLY,
                authority: 'System',
                description: 'Allowed flight area after applying all restrictions',
                sourceUrl: '',
                confidenceLevel: types_1.ConfidenceLevel.HIGH,
                jurisdiction: { country: 'US' }
            },
            geometry: allowedArea.geometry
        };
        return { type: 'FeatureCollection', features: [resultFeature] };
    }
}
exports.RestrictionService = RestrictionService;
//# sourceMappingURL=restrictionService.js.map