import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { LocationInput, RestrictionsResponse } from '../types';
import { RestrictionFeature, RestrictionFeatureCollection, RestrictionCategory, RestrictionType, ConfidenceLevel } from '../types';
import { RestrictionLayer } from '../../../shared/types/RestrictionLayer';
import { validateInput, generateSearchArea } from '../utils/spatial';
import { FAAProxyService } from './faaProxyService';

export class RestrictionService {
  private faaProxyService: FAAProxyService;

  constructor() {
    this.faaProxyService = new FAAProxyService();
  }

  async getRestrictions(input: LocationInput): Promise<RestrictionsResponse> {
    const validatedInput = validateInput(input);
    const { lat, lng, radius } = validatedInput;

    const searchArea = generateSearchArea(lat, lng, radius);

    // 1️⃣ Generate FAA airspace restrictions
    const airspaceRestrictions = await this.generateAirspaceRestrictions(lat, lng, radius);

    // 2️⃣ Calculate allowed areas
    const allowedAreas = this.calculateAllowedAreas(searchArea, airspaceRestrictions.features);

    return {
      searchArea,
      airspaceRestrictions,
      localRestrictions: { type: 'FeatureCollection', features: [] } as RestrictionFeatureCollection,
      allowedAreas
    };
  }

  /**
   * Fetch FAA restrictions and merge grids by facility
   */
  private async generateAirspaceRestrictions(
    lat: number,
    lng: number,
    radius: number
  ): Promise<RestrictionFeatureCollection> {
    try {
      const raw = await this.faaProxyService.getFAARestrictions(lat, lng, radius);
      const searchArea = generateSearchArea(lat, lng, radius);

      // Merge FAA grids that belong to the same airport
      const mergedRestrictions = this.mergeFAAFeaturesByFacility(raw.features);

      // Clip restrictions to the search area
      return this.clipRestrictionsToSearchArea(mergedRestrictions, searchArea);
    } catch (err) {
      console.error('FAA API failed:', err);
      return { type: 'FeatureCollection', features: [] };
    }
  }

  /**
   * Merge multiple FAA restriction grids that belong to the same airport
   * into a single polygon or multipolygon per facility
   */
  private mergeFAAFeaturesByFacility(features: RestrictionFeature[]): RestrictionFeatureCollection {
    const grouped: Record<string, RestrictionFeature[]> = {};

    // Group by facility or fallback to gridId
    features.forEach(f => {
      const key = f.properties.facility || f.properties.gridId || 'unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(f);
    });

    const mergedFeatures: RestrictionFeature[] = [];

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
            type: 'Feature' as const,
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
          const props: RestrictionLayer = {
            ...group[0].properties, // keep original metadata
            facility,
            name: group[0].properties.name || 'Unnamed Airspace',
            category: group[0].properties.category || 'Airspace',
            type: group[0].properties.type || 'No-Fly',
            source: group[0].properties.source || 'FAA',
            notes: group[0].properties.notes || ''
          };

          const restrictionFeature: RestrictionFeature = {
            type: 'Feature',
            properties: props,
            geometry: singleFeature.geometry as any
          };

          mergedFeatures.push(restrictionFeature);
          return;
        }

        // Create a FeatureCollection for turf processing
        const featureCollection = {
          type: 'FeatureCollection' as const,
          features: simpleFeatures as any
        };

        // Combine all polygons into one FeatureCollection
        const combined = turf.combine(featureCollection as any);

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
          const props: RestrictionLayer = {
            ...group[0].properties, // keep original metadata
            facility,
            name: group[0].properties.name || 'Unnamed Airspace',
            category: group[0].properties.category || 'Airspace',
            type: group[0].properties.type || 'No-Fly',
            source: group[0].properties.source || 'FAA',
            notes: group[0].properties.notes || ''
          };

          const restrictionFeature: RestrictionFeature = {
            type: 'Feature',
            properties: props,
            geometry: combined.features[0].geometry as any // Cast geometry to match GeoJSONGeometry type
          };

          mergedFeatures.push(restrictionFeature);
        } else {
          // Multiple combined features - merge them into a single MultiPolygon feature
          const props: RestrictionLayer = {
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
            type: 'MultiPolygon' as const,
            coordinates: combined.features.map(f => {
              const geom = f.geometry as any;
              if (geom.type === 'Polygon') {
                return geom.coordinates;
              } else if (geom.type === 'MultiPolygon') {
                return geom.coordinates.flat(); // Flatten nested MultiPolygon coordinates
              } else {
                // For other geometry types, try to convert to polygon coordinates
                return [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]; // Fallback
              }
            })
          };

          const restrictionFeature: RestrictionFeature = {
            type: 'Feature',
            properties: props,
            geometry: multiPolygonGeometry
          };

          mergedFeatures.push(restrictionFeature);
        }
      } catch (err) {
        console.warn(`Failed to merge FAA grids for facility ${facility}:`, err);
        mergedFeatures.push(...group); // fallback
      }
    });

    return { type: 'FeatureCollection', features: mergedFeatures };
  }

  private calculateAllowedAreas(searchArea: RestrictionFeatureCollection, restrictions: RestrictionFeature[]): RestrictionFeatureCollection {
    // If there are no restrictions, the entire search area is allowed
    if (restrictions.length === 0) {
      const resultFeature: RestrictionFeature = {
        type: 'Feature',
        properties: {
          id: 'allowed-area',
          geometry: searchArea.features[0].geometry,
          category: RestrictionCategory.FAA,
          type: RestrictionType.NO_FLY,
          authority: 'System',
          description: 'Entire search area is allowed (no restrictions)',
          sourceUrl: '',
          confidenceLevel: ConfidenceLevel.HIGH,
          jurisdiction: { country: 'US' }
        },
        geometry: searchArea.features[0].geometry
      };

      return { type: 'FeatureCollection', features: [resultFeature] };
    }

    // If there are restrictions, calculate the allowed area by subtracting all restrictions from search area
    try {
      let currentAllowedArea = searchArea.features[0].geometry;

      // Process each restriction to subtract from the allowed area
      for (const restriction of restrictions) {
        try {
          // Use turf.difference correctly for Turf v7
          // Create a feature collection with both features
          const featureCollection = {
            type: 'FeatureCollection' as const,
            features: [
              {
                type: 'Feature' as const,
                properties: {},
                geometry: currentAllowedArea as any
              },
              {
                type: 'Feature' as const,
                properties: {},
                geometry: restriction.geometry as any
              }
            ]
          };

          // Use turf.difference with the feature collection
          const diff = turf.difference(featureCollection as any);

          if (diff && diff.geometry) {
            currentAllowedArea = diff.geometry as any;
          } else {
            // If difference returns null, the entire area is restricted
            return { type: 'FeatureCollection', features: [] };
          }
        } catch (err) {
          console.warn('Failed to subtract restriction from allowed area:', err);
          // Continue with the current allowed area if there's an error
        }
      }

      // If we have a valid allowed area after all subtractions
      if (currentAllowedArea) {
        const resultFeature: RestrictionFeature = {
          type: 'Feature',
          properties: {
            id: 'allowed-area',
            geometry: currentAllowedArea,
            category: RestrictionCategory.FAA,
            type: RestrictionType.NO_FLY,
            authority: 'System',
            description: 'Allowed flight area after applying all restrictions',
            sourceUrl: '',
            confidenceLevel: ConfidenceLevel.HIGH,
            jurisdiction: { country: 'US' }
          },
          geometry: currentAllowedArea
        };

        return { type: 'FeatureCollection', features: [resultFeature] };
      }
    } catch (err) {
      console.warn('Failed to calculate allowed areas:', err);
    }

    // If we get here, either the entire area is restricted or there was an error
    // Return empty allowed areas
    return { type: 'FeatureCollection', features: [] };
  }

  /**
   * Clip restrictions to only show parts that intersect with the search area
   * This prevents restrictions from extending outside the search radius
   */
  private clipRestrictionsToSearchArea(
    restrictions: RestrictionFeatureCollection,
    searchArea: RestrictionFeatureCollection
  ): RestrictionFeatureCollection {
    if (restrictions.features.length === 0) {
      return restrictions;
    }

    const searchAreaGeometry = searchArea.features[0].geometry;
    const clippedFeatures: RestrictionFeature[] = [];

    for (const restriction of restrictions.features) {
      try {
        // Use turf.intersect to clip the restriction to the search area
        // Create a feature collection for turf.intersect
        const featureCollection = {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              properties: {},
              geometry: searchAreaGeometry as any
            },
            {
              type: 'Feature' as const,
              properties: {},
              geometry: restriction.geometry as any
            }
          ]
        };

        const intersection = turf.intersect(featureCollection as any);

        if (intersection) {
          // Create a new restriction feature with the clipped geometry
          const clippedRestriction: RestrictionFeature = {
            type: 'Feature',
            properties: {
              ...restriction.properties,
              // Add a note indicating this restriction was clipped
              notes: `${restriction.properties.notes || ''} ${restriction.properties.notes ? '| ' : ''}Clipped to search area`.trim()
            },
            geometry: intersection.geometry as any
          };
          clippedFeatures.push(clippedRestriction);
        }
        // If no intersection, the restriction doesn't intersect with search area, so skip it
      } catch (err) {
        console.warn('Failed to clip restriction to search area:', err);
        // If clipping fails, include the original restriction as fallback
        clippedFeatures.push(restriction);
      }
    }

    return { type: 'FeatureCollection', features: clippedFeatures };
  }
}
