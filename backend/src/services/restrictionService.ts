import * as turf from '@turf/turf';
import { LocationInput, RestrictionsResponse, MockDataConfig } from '../types';
import { validateInput, generateSearchArea, createRandomPolygon, calculateArea } from '../utils/spatial';

/**
 * Mock data configuration
 * This can be easily replaced with real GIS API calls later
 */
const MOCK_CONFIG: MockDataConfig = {
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
export class RestrictionService {
  
  /**
   * Main method to get restrictions for a given location and radius
   * @param input Location and radius parameters
   * @returns Promise resolving to restrictions response
   */
  async getRestrictions(input: LocationInput): Promise<RestrictionsResponse> {
    try {
      // 1. Validate input parameters
      const validatedInput = validateInput(input);
      const { lat, lng, radiusMeters } = validatedInput;

      // 2. Generate search area buffer
      const searchArea = generateSearchArea(lat, lng, radiusMeters);

      // 3. Generate mock restriction data
      const airspaceRestrictions = this.generateAirspaceRestrictions(lat, lng, radiusMeters);
      const localRestrictions = this.generateLocalRestrictions(lat, lng, radiusMeters);
      
      // 4. Calculate allowed areas (complement of restrictions)
      const allowedAreas = this.calculateAllowedAreas(
        searchArea,
        [...airspaceRestrictions.features, ...localRestrictions.features]
      );

      return {
        searchArea,
        airspaceRestrictions,
        localRestrictions,
        allowedAreas
      };
    } catch (error) {
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
  private generateAirspaceRestrictions(lat: number, lng: number, radiusMeters: number): any {
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 restrictions
    const features: any[] = [];

    for (let i = 0; i < count; i++) {
      // Create random restriction polygon
      const restriction = createRandomPolygon(lng, lat, radiusMeters * 0.8, 6);
      
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
        areaSqMeters: calculateArea(restriction)
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
  private generateLocalRestrictions(lat: number, lng: number, radiusMeters: number): any {
    const count = Math.floor(Math.random() * 4) + 1; // 1-4 restrictions
    const features: any[] = [];

    for (let i = 0; i < count; i++) {
      // Create random local restriction polygon
      const restriction = createRandomPolygon(lng, lat, radiusMeters * 0.6, 5);
      
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
        areaSqMeters: calculateArea(restriction)
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
  private calculateAllowedAreas(searchArea: any, restrictions: any[]): any {
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
        } else {
          console.log('Difference returned null - restriction completely covers allowed area');
        }
      } catch (error) {
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
  private getRandomAirspaceCategory(): string {
    const categories = ['Class B', 'Class C', 'Class D', 'Restricted', 'Prohibited', 'MOA'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  /**
   * Helper method to get random local restriction category
   */
  private getRandomLocalCategory(): string {
    const categories = ['Park', 'Stadium', 'Prison', 'Power Plant', 'Hospital', 'School'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  /**
   * Helper method to generate airspace names
   */
  private generateAirspaceName(index: number): string {
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
  private generateLocalName(index: number): string {
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
