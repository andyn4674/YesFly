/**
 * Type definitions for the drone flight restriction API
 */
export interface LocationInput {
    lat: number;
    lng: number;
    radius: number;
}
import { RestrictionFeature, RestrictionFeatureCollection, RestrictionCategory, RestrictionType, ConfidenceLevel, Jurisdiction, RestrictionMetadata } from '../../../shared/types/RestrictionLayer';
export interface RestrictionsResponse {
    searchArea: RestrictionFeatureCollection;
    airspaceRestrictions: RestrictionFeatureCollection;
    localRestrictions: RestrictionFeatureCollection;
    allowedAreas: RestrictionFeatureCollection;
}
export interface MockDataConfig {
    minRadius: number;
    maxRadius: number;
    maxRestrictionCount: number;
    faaAirspaceClasses?: {
        [key: string]: {
            maxAlt: number;
            description: string;
        };
    };
}
export { RestrictionFeature, RestrictionFeatureCollection, RestrictionCategory, RestrictionType, ConfidenceLevel, Jurisdiction, RestrictionMetadata };
//# sourceMappingURL=index.d.ts.map