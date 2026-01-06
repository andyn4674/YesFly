"use strict";
/**
 * Shared TypeScript interface for drone flight restriction layers
 *
 * This interface represents a single restriction layer that can be used
 * consistently across both frontend and backend components. It provides
 * a standardized schema for all types of flight restrictions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfidenceLevel = exports.RestrictionType = exports.RestrictionCategory = void 0;
// Enums for strict type safety
var RestrictionCategory;
(function (RestrictionCategory) {
    RestrictionCategory["FAA"] = "FAA";
    RestrictionCategory["STATE"] = "STATE";
    RestrictionCategory["CITY"] = "CITY";
    RestrictionCategory["PRIVATE"] = "PRIVATE";
})(RestrictionCategory || (exports.RestrictionCategory = RestrictionCategory = {}));
var RestrictionType;
(function (RestrictionType) {
    RestrictionType["NO_FLY"] = "NO_FLY";
    RestrictionType["AUTH_REQUIRED"] = "AUTH_REQUIRED";
    RestrictionType["ADVISORY"] = "ADVISORY";
})(RestrictionType || (exports.RestrictionType = RestrictionType = {}));
var ConfidenceLevel;
(function (ConfidenceLevel) {
    ConfidenceLevel["HIGH"] = "HIGH";
    ConfidenceLevel["MEDIUM"] = "MEDIUM";
    ConfidenceLevel["LOW"] = "LOW";
})(ConfidenceLevel || (exports.ConfidenceLevel = ConfidenceLevel = {}));
//# sourceMappingURL=RestrictionLayer.js.map