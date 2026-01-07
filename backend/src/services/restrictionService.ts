import * as turf from '@turf/turf';
import { LocationInput, RestrictionsResponse, MockDataConfig, RestrictionCategory, RestrictionType, ConfidenceLevel } from '../types';
import { validateInput, generateSearchArea, createRandomPolygon } from '../utils/spatial';
import { FAAProxyService } from './faaProxyService';


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
export class RestrictionService {
  private faaProxyService: FAAProxyService;

  constructor() {
    this.faaProxyService = new FAAProxyService();
  }
  
  /**
   * Main method to get restrictions for a given location and radius
   * @param input Location and radius parameters
   * @returns Promise resolving to restrictions response
   */
  async getRestrictions(input: LocationInput): Promise<RestrictionsResponse> {
    try {
      // 1. Validate input parameters
      const validatedInput = validateInput(input);
      const radius = validatedInput.radius;
      const { lat, lng } = validatedInput;

      // 2. Generate search area buffer
      const searchArea = generateSearchArea(lat, lng, radius);

      // 3. Generate restriction data (now async for FAA API integration)
      const airspaceRestrictions = await this.generateAirspaceRestrictions(lat, lng, radius);
      // const localRestrictions = this.generateLocalRestrictions(lat, lng, radius);

      // 4. Calculate allowed areas (complement of restrictions)
      const allowedAreas = this.calculateAllowedAreas(
        searchArea,
        [...airspaceRestrictions.features]
      );

      return {
        searchArea,
        airspaceRestrictions,
        localRestrictions: { type: 'FeatureCollection', features: [] },
        allowedAreas
      };
    } catch (error) {
      throw new Error(`Failed to get restrictions: ${error}`);
    }
  }

  /**
   * Generates FAA airspace restrictions using real FAA API
   * @param lat Center latitude
   * @param lng Center longitude
   * @param radius Search radius
   * @returns GeoJSON FeatureCollection of airspace restrictions
   */
  private async generateAirspaceRestrictions(lat: number, lng: number, radius: number): Promise<any> {
    try {
      // Use real FAA API via proxy service
      console.log('Using real FAA API for airspace restrictions');
      return await this.faaProxyService.getFAARestrictions(lat, lng, radius);
    } catch (error) {
      console.error('FAA API failed:', error);
      // Return empty feature collection if FAA API fails
      return {
        type: 'FeatureCollection',
        features: []
      };
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
   * Helper method to generate random airport facility code
   * @returns Random 3-4 letter airport code (e.g., "DFW", "LAX")
   */
  private generateRandomAirportCode(): string {
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
  private getRandomLocalCategory(): string {
    const categories = ['Park', 'Stadium', 'Prison', 'Power Plant', 'Hospital', 'School'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

}
