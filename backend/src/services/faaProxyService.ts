import axios from 'axios';
import { RestrictionFeature, RestrictionFeatureCollection, RestrictionCategory, RestrictionType, ConfidenceLevel } from '../types';

/**
 * FAA Proxy Service for integrating with FAA UAS Facility Map Data API
 *
 * This service handles communication with the FAA ArcGIS REST API
 * and transforms the ArcGIS JSON response to GeoJSON format compatible
 * with the YesFly application.
 */
export class FAAProxyService {
  private readonly FAA_API_URL = 'https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/FAA_UAS_FacilityMap_Data/FeatureServer/0/query';
  private readonly API_TIMEOUT = 10000;

  /**
   * Get FAA restrictions for a given location and radius
   * @param lat Center latitude
   * @param lng Center longitude
   * @param radius Search radius
   * @returns Promise resolving to GeoJSON FeatureCollection of FAA restrictions
   */
  async getFAARestrictions(lat: number, lng: number, radius: number): Promise<RestrictionFeatureCollection> {
    try {
      // Convert radius from miles to feet for envelope calculation
      // Expand the search area to ensure full FAA grid coverage
      const expandedRadius = radius * 5280; // Convert miles to feet (1 mile = 5280 feet)

      // Feet per degree (spherical Earth approximation)
      const feetPerDegreeLat = 364000;
      const feetPerDegreeLng = 364000 * Math.cos(lat * Math.PI / 180);

      // Convert expanded radius to degrees
      const radiusDegreesLat = expandedRadius / feetPerDegreeLat;
      const radiusDegreesLng = expandedRadius / feetPerDegreeLng;

      // Create envelope coordinates (minX, minY, maxX, maxY)
      const minLng = lng - radiusDegreesLng;
      const minLat = lat - radiusDegreesLat;
      const maxLng = lng + radiusDegreesLng;
      const maxLat = lat + radiusDegreesLat;

      const envelope = `${minLng},${minLat},${maxLng},${maxLat}`;

      // Call FAA API following strict rules
      const response = await axios.get(this.FAA_API_URL, {
        params: {
          f: 'json',
          geometry: envelope,
          geometryType: 'esriGeometryEnvelope',
          inSR: '4326',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: '*',
          returnGeometry: 'true',
          outSR: '4326'
        },
        timeout: this.API_TIMEOUT
      });

      // Transform ArcGIS JSON to GeoJSON
      return this.transformFAAResponse(response.data);

    } catch (error) {
      console.error('FAA API Error:', error);
      // Return empty feature collection if FAA API fails
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
  }

  /**
   * Transform FAA ArcGIS JSON response to GeoJSON format
   * @param faaData ArcGIS JSON response from FAA API
   * @returns GeoJSON FeatureCollection
   */
  private transformFAAResponse(faaData: any): RestrictionFeatureCollection {
    // Check if response has features
    if (!faaData.features || faaData.features.length === 0) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }

    const features: RestrictionFeature[] = faaData.features.map((feature: any) => {
      // Convert ESRI geometry to GeoJSON
      const geometry = this.convertESRIToGeoJSON(feature.geometry);

      // Determine restriction type based on MAX_AGL
      const maxAGL = feature.attributes.MAX_AGL || 0;
      const restrictionType = maxAGL === 0 ? RestrictionType.NO_FLY : RestrictionType.AUTH_REQUIRED;

      // Create restriction feature
      const restrictionFeature: RestrictionFeature = {
        type: 'Feature',
        geometry: geometry,
        properties: {
          id: `faa-${feature.attributes.GRID_ID || Math.random().toString(36).substring(2, 9)}`,
          geometry: geometry,
          category: RestrictionCategory.FAA,
          type: restrictionType,
          authority: 'Federal Aviation Administration',
          description: `FAA UAS Facility Map - ${feature.attributes.AIRSPACE || 'Unknown'} - Max AGL: ${maxAGL}ft`,
          sourceUrl: feature.attributes.UASFM_URL || 'https://www.faa.gov/uas/',
          confidenceLevel: ConfidenceLevel.HIGH,
          jurisdiction: {
            country: 'United States'
          },
          // FAA-specific properties
          maxAGL: maxAGL,
          airspace: feature.attributes.AIRSPACE,
          facility: feature.attributes.FACILITY,
          effectiveDate: feature.attributes.EFFECTIVE,
          gridId: feature.attributes.GRID_ID,
          uasfmUrl: feature.attributes.UASFM_URL,
          metadata: {
            dataSource: 'FAA ArcGIS',
            lastVerified: new Date().toISOString()
          }
        }
      };

      return restrictionFeature;
    });

    return {
      type: 'FeatureCollection',
      features: features
    };
  }

  /**
   * Convert ESRI geometry to GeoJSON format
   * @param esriGeometry ESRI geometry object
   * @returns GeoJSON geometry object
   */
  private convertESRIToGeoJSON(esriGeometry: any): any {
    if (!esriGeometry) {
      return {
        type: 'Point',
        coordinates: [0, 0]
      };
    }

    if (esriGeometry.rings) {
      // Convert ESRI polygon to GeoJSON
      return {
        type: 'Polygon',
        coordinates: esriGeometry.rings
      };
    } else if (esriGeometry.x !== undefined && esriGeometry.y !== undefined) {
      // Convert ESRI point to GeoJSON
      return {
        type: 'Point',
        coordinates: [esriGeometry.x, esriGeometry.y]
      };
    } else if (esriGeometry.paths) {
      // Convert ESRI polyline to GeoJSON
      return {
        type: 'LineString',
        coordinates: esriGeometry.paths[0]
      };
    }

    // Default fallback - return point at origin
    return {
      type: 'Point',
      coordinates: [0, 0]
    };
  }
}
