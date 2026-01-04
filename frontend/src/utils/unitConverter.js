/**
 * Unit conversion utilities for displaying measurements in US Customary units
 */

export const unitConverter = {
  /**
   * Convert meters to appropriate US Customary unit
   * @param {number} meters - Distance in meters
   * @returns {object} Object with value and unit
   */
  convertDistance: (meters) => {
    if (meters < 1609.34) {
      // Use feet for distances less than 1 mile
      const feet = meters * 3.28084;
      return {
        value: feet,
        unit: 'ft',
        formatted: feet < 1000 ? `${Math.round(feet)} ft` : `${(feet / 5280).toFixed(2)} mi`
      };
    } else {
      // Use miles for distances 1 mile and greater
      const miles = meters / 1609.34;
      return {
        value: miles,
        unit: 'mi',
        formatted: miles.toFixed(2) + ' mi'
      };
    }
  },

  /**
   * Convert square meters to US Customary unit based on radius
   * @param {number} squareMeters - Area in square meters
   * @param {number} radiusMeters - Radius in meters to determine unit preference
   * @returns {object} Object with value and unit
   */
  convertArea: (squareMeters, radiusMeters) => {
    if (radiusMeters < 1609.34) {
      // Use square feet for areas when radius is in feet
      const squareFeet = squareMeters * 10.7639;
      return {
        value: squareFeet,
        unit: 'sq ft',
        formatted: squareFeet < 1000000 ? `${Math.round(squareFeet).toLocaleString()} sq ft` : `${(squareFeet / 27878400).toFixed(2)} sq mi`
      };
    } else {
      // Use square miles for areas when radius is in miles
      const squareMiles = squareMeters / 2589988;
      return {
        value: squareMiles,
        unit: 'sq mi',
        formatted: squareMiles.toFixed(2) + ' sq mi'
      };
    }
  },

  /**
   * Get the appropriate unit label for a given radius in meters
   * @param {number} radiusMeters - Radius in meters
   * @returns {string} Unit label (ft or mi)
   */
  getRadiusUnit: (radiusMeters) => {
    return radiusMeters < 1609.34 ? 'ft' : 'mi';
  },

  /**
   * Format radius display based on the selected radius
   * @param {number} radiusMeters - Radius in meters
   * @returns {string} Formatted radius string
   */
  formatRadiusDisplay: (radiusMeters) => {
    const conversion = unitConverter.convertDistance(radiusMeters);
    return conversion.formatted;
  },

  /**
   * Format area display for search area and total allowed area
   * @param {number} areaSqMeters - Area in square meters
   * @param {number} radiusMeters - Radius in meters to determine unit preference
   * @returns {string} Formatted area string
   */
  formatAreaDisplay: (areaSqMeters, radiusMeters) => {
    const conversion = unitConverter.convertArea(areaSqMeters, radiusMeters);
    return conversion.formatted;
  }
};
