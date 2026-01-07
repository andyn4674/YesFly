import { LocationInput, RestrictionsResponse } from '../types';
export declare class RestrictionService {
    private faaProxyService;
    constructor();
    getRestrictions(input: LocationInput): Promise<RestrictionsResponse>;
    /**
     * Fetch FAA restrictions and merge grids by facility
     */
    private generateAirspaceRestrictions;
    /**
     * Merge multiple FAA restriction grids that belong to the same airport
     * into a single polygon or multipolygon per facility
     */
    private mergeFAAFeaturesByFacility;
    private calculateAllowedAreas;
}
//# sourceMappingURL=restrictionService.d.ts.map