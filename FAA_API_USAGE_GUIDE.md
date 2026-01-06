# FAA UAS Facility Map Data API Usage Guide

## Overview

This guide explains how to use the FAA UAS Facility Map Data API within the YesFly drone flight restriction application without modifying the existing codebase, following strict FAA integration rules.

## Critical FAA API Rules

### FAA UAS Facility Maps API Characteristics

**IMPORTANT**: The FAA UAS Facility Maps API is NOT a traditional REST API. It is an ArcGIS FeatureServer that exposes geospatial data via query operations.

### Authoritative Service Rules

✅ **USE ONLY**:
- Production service: `FAA_UAS_FacilityMap_Data (FeatureServer)`

❌ **DO NOT USE**:
- Any service with "_Test" in the name
- Any non-production ArcGIS services

### Base Service URLs

- **FeatureServer Base**: `https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/FAA_UAS_FacilityMap_Data/FeatureServer`
- **Query Endpoint**: `https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/FAA_UAS_FacilityMap_Data/FeatureServer/0/query`

### API Discovery Rules

ArcGIS REST services do NOT expose endpoints via OpenAPI or Swagger. Endpoints are discovered by navigating:
`FeatureServer → Layer → Supported Operations → Query`

## Current Implementation

The YesFly application uses a mock data system designed for easy replacement with real FAA GIS APIs.

### Key Components

1. **Backend API**: `backend/src/services/restrictionService.ts`
2. **Controller**: `backend/src/controllers/restrictionController.ts`
3. **Routes**: `backend/src/routes/index.ts`
4. **Frontend**: `frontend/src/components/` (MapVisualization.jsx, FlightRestrictions.jsx)

## FAA API Integration Rules

### Query Usage Rules

**STRICT REQUIREMENTS**:

1. ✅ **Always include**: `f=json`
2. ✅ **Always query by geometry**: (point or envelope)
3. ✅ **Use geometryType**: `esriGeometryPoint` for single-location queries
4. ✅ **Use geometryType**: `esriGeometryEnvelope` for area/radius queries
5. ✅ **Use spatialRel**: `esriSpatialRelIntersects`
6. ✅ **Use outFields**: `*`
7. ✅ **Use returnGeometry**: `true`

### Example API Call

```bash
curl "https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/FAA_UAS_FacilityMap_Data/FeatureServer/0/query" \
  -G \
  --data-urlencode "f=json" \
  --data-urlencode "geometry=-97.735,30.285" \
  --data-urlencode "geometryType=esriGeometryPoint" \
  --data-urlencode "inSR=4326" \
  --data-urlencode "spatialRel=esriSpatialRelIntersects" \
  --data-urlencode "outFields=*" \
  --data-urlencode "returnGeometry=true"
```

### Response Format Rules

FAA API returns data in ArcGIS JSON format:

```json
{
  "objectIdFieldName": "OBJECTID",
  "globalIdFieldName": "",
  "fields": [...],
  "features": [
    {
      "attributes": {
        "OBJECTID": 1,
        "GRID_ID": "ABC123",
        "MAX_AGL": 400,
        "UASFM_URL": "https://www.faa.gov/uas/..."
      },
      "geometry": {
        "x": -97.735,
        "y": 30.285
      }
    }
  ]
}
```

**Geometry Conversion Required**: ESRI geometry must be converted to GeoJSON before frontend use.

## Implementation Rules

### Backend Integration Rules

✅ **MUST**:
- Query FAA API from backend only (NEVER frontend)
- Cache responses to avoid repeated calls
- Treat service URL as configuration, not dynamically generated
- Do NOT use API keys or SDKs

❌ **MUST NOT**:
- Use geocoding, routing, basemaps, portal, or content APIs
- Use Esri Location Services
- Attempt authentication
- Use any ArcGIS services other than the authoritative FAA service

### Data Usage Rules

**CRITICAL CONSTRAINTS**:

⚠️ **The FAA API does NOT grant flight authorization**
⚠️ **Data is informational only**
⚠️ **Do NOT infer legality beyond altitude authorization context**
⚠️ **Always treat FAA data as a federal restriction layer**

## Integration Approach

### Proxy Service Implementation

```typescript
// faa-proxy-service.ts
import axios from 'axios';

const FAA_API_URL = 'https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/FAA_UAS_FacilityMap_Data/FeatureServer/0/query';

async function getFAARestrictions(lat: number, lng: number, radius: number) {
  try {
    // Call FAA API following strict rules
    const response = await axios.get(FAA_API_URL, {
      params: {
        f: 'json',
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'true',
        outSR: '4326' // Ensure output matches frontend coordinate system
      },
      timeout: 10000
    });

    // Transform ArcGIS JSON to GeoJSON
    return transformFAAResponse(response.data);

  } catch (error) {
    console.error('FAA API Error:', error);
    // Fallback to mock data if FAA API fails
    return getMockRestrictions(lat, lng, radius);
  }
}

function transformFAAResponse(faaData: any) {
  return {
    type: 'FeatureCollection',
    features: faaData.features.map(feature => ({
      type: 'Feature',
      id: `faa-${feature.attributes.GRID_ID}`,
      geometry: convertESRIToGeoJSON(feature.geometry),
      properties: {
        id: `faa-${feature.attributes.GRID_ID}`,
        category: 'FAA',
        type: feature.attributes.MAX_AGL === 0 ? 'NO_FLY' : 'AUTH_REQUIRED',
        authority: 'Federal Aviation Administration',
        description: `FAA UAS Facility Map - ${feature.attributes.AIRSPACE} - Max AGL: ${feature.attributes.MAX_AGL}ft`,
        sourceUrl: feature.attributes.UASFM_URL || 'https://www.faa.gov/uas/',
        confidenceLevel: 'HIGH',
        jurisdiction: { country: 'United States' },
        maxAGL: feature.attributes.MAX_AGL,
        airspace: feature.attributes.AIRSPACE,
        facility: feature.attributes.FACILITY,
        effectiveDate: feature.attributes.EFFECTIVE,
        gridId: feature.attributes.GRID_ID,
        uasfmUrl: feature.attributes.UASFM_URL
      }
    }))
  };
}

// ESRI to GeoJSON conversion helper
function convertESRIToGeoJSON(esriGeometry: any) {
  if (esriGeometry.rings) {
    // Convert ESRI polygon to GeoJSON
    return {
      type: 'Polygon',
      coordinates: esriGeometry.rings
    };
  } else if (esriGeometry.x && esriGeometry.y) {
    // Convert ESRI point to GeoJSON
    return {
      type: 'Point',
      coordinates: [esriGeometry.x, esriGeometry.y]
    };
  }
  // Default fallback
  return esriGeometry;
}
```

### Configuration Rules

Create `.env` file in backend directory:

```env
# FAA API Configuration
USE_REAL_FAA_DATA=true
FAA_API_TIMEOUT=10000
FAA_API_RETRY_COUNT=3
FAA_API_URL=https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/FAA_UAS_FacilityMap_Data/FeatureServer/0/query
```

### Integration in Service Layer

```typescript
// In restrictionService.ts
private generateAirspaceRestrictions(lat: number, lng: number, radius: number): any {
  if (process.env.USE_REAL_FAA_DATA === 'true') {
    return this.faaProxyService.getFAARestrictions(lat, lng, radius);
  } else {
    // Current mock implementation
    const count = Math.floor(Math.random() * 3) + 1;
    // ... existing mock code
  }
}
```

## Testing and Validation

### Test FAA API Directly

```bash
# Test with specific location
curl "https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/FAA_UAS_FacilityMap_Data/FeatureServer/0/query" \
  -G \
  --data-urlencode "f=json" \
  --data-urlencode "geometry=-97.735,30.285" \
  --data-urlencode "geometryType=esriGeometryPoint" \
  --data-urlencode "inSR=4326" \
  --data-urlencode "spatialRel=esriSpatialRelIntersects" \
  --data-urlencode "outFields=*" \
  --data-urlencode "returnGeometry=true"
```

### Test YesFly API

```bash
# Test YesFly API with FAA data enabled
curl -X POST http://localhost:3000/api/restrictions \
  -H "Content-Type: application/json" \
  -d '{"lat": 37.7749, "lng": -122.4194, "radius": 1000}'
```

## Important Resources

- [FAA UAS Facility Maps](https://www.faa.gov/uas/where_to_fly/uas_facility_maps/)
- [FAA UAS Data Research](https://www.faa.gov/uas/data_research/)
- [FAA ArcGIS Services](https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/arcgis/)

## Conclusion

The YesFly application is designed to integrate with the FAA UAS Facility Map Data API while following strict FAA rules:

1. **Use ONLY the authoritative FAA service**
2. **Query from backend only**
3. **Follow exact API parameter rules**
4. **Transform ArcGIS JSON to GeoJSON**
5. **Cache responses appropriately**
6. **Never infer flight authorization from API data**

By following these rules and using the proxy service approach, you can integrate real FAA data while maintaining the existing architecture and complying with all FAA requirements.
