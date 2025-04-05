// Type definitions for Google Maps JavaScript API
// This adds global type definitions for the Google Maps API

declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element, opts?: MapOptions);
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    [key: string]: any;
  }

  class LatLng {
    constructor(lat: number, lng: number, noWrap?: boolean);
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  namespace places {
    class PlacesService {
      constructor(attrContainer: HTMLDivElement | Map);
      nearbySearch(
        request: PlaceSearchRequest,
        callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void
      ): void;
      getDetails(
        request: PlaceDetailsRequest,
        callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void
      ): void;
    }

    interface PlaceSearchRequest {
      location: LatLng;
      radius?: number;
      type?: string;
      keyword?: string;
      [key: string]: any;
    }

    interface PlaceDetailsRequest {
      placeId: string;
      fields?: string[];
      [key: string]: any;
    }

    interface PlaceResult {
      place_id?: string;
      name?: string;
      vicinity?: string; // address
      geometry?: {
        location: LatLng;
      };
      photos?: {
        getUrl: (opts: PhotoOptions) => string;
        height: number;
        width: number;
        html_attributions: string[];
        photo_reference: string;
      }[];
      rating?: number;
      user_ratings_total?: number; // number of reviews
      [key: string]: any;
    }

    interface PhotoOptions {
      maxWidth?: number;
      maxHeight?: number;
    }

    enum PlacesServiceStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      NOT_FOUND = 'NOT_FOUND'
    }
  }
}

// This empty export is needed to make this file a module
export {};
