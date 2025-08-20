// Google Maps API type definitions
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, options?: any) => any;
          AutocompleteService: new () => any;
          PlacesService: new (attrContainer: any) => any;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            INVALID_REQUEST: string;
            UNKNOWN_ERROR: string;
          };
        };
        Geocoder: new () => any;
        LatLng: new (lat: number, lng: number) => any;
        LatLngBounds: new (sw?: any, ne?: any) => any;
        Map: new (mapDiv: HTMLElement, opts?: any) => any;
        MapTypeId: {
          ROADMAP: string;
          SATELLITE: string;
          HYBRID: string;
          TERRAIN: string;
        };
        ControlPosition: {
          TOP_CENTER: number;
          TOP_LEFT: number;
          TOP_RIGHT: number;
          LEFT_TOP: number;
          RIGHT_TOP: number;
          LEFT_CENTER: number;
          RIGHT_CENTER: number;
          LEFT_BOTTOM: number;
          RIGHT_BOTTOM: number;
          BOTTOM_CENTER: number;
          BOTTOM_LEFT: number;
          BOTTOM_RIGHT: number;
        };
        drawing: {
          DrawingManager: new (options?: any) => any;
          OverlayType: {
            CIRCLE: string;
            MARKER: string;
            POLYGON: string;
            POLYLINE: string;
            RECTANGLE: string;
          };
        };
        event: {
          addListener: (instance: any, eventName: string, handler: (...args: any[]) => void) => any;
          removeListener: (listener: any) => void;
        };
      };
    };
  }
}

declare namespace google {
  namespace maps {
    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface Geocoder {
      geocode(
        request: google.maps.GeocoderRequest,
        callback: (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => void
      ): void;
    }

    interface GeocoderRequest {
      address?: string;
      location?: google.maps.LatLng;
      placeId?: string;
      bounds?: google.maps.LatLngBounds;
      componentRestrictions?: google.maps.GeocoderComponentRestrictions;
      region?: string;
    }

    interface GeocoderResult {
      address_components: google.maps.GeocoderAddressComponent[];
      formatted_address: string;
      geometry: google.maps.GeocoderGeometry;
      place_id: string;
      types: string[];
    }

    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface GeocoderGeometry {
      location: google.maps.LatLng;
      location_type: google.maps.GeocoderLocationType;
      viewport: google.maps.LatLngBounds;
      bounds?: google.maps.LatLngBounds;
    }

    enum GeocoderStatus {
      ERROR = 'ERROR',
      INVALID_REQUEST = 'INVALID_REQUEST',
      OK = 'OK',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      ZERO_RESULTS = 'ZERO_RESULTS'
    }

    enum GeocoderLocationType {
      APPROXIMATE = 'APPROXIMATE',
      GEOMETRIC_CENTER = 'GEOMETRIC_CENTER',
      RANGE_INTERPOLATED = 'RANGE_INTERPOLATED',
      ROOFTOP = 'ROOFTOP'
    }

    interface LatLngBounds {
      contains(latLng: google.maps.LatLng): boolean;
      extend(point: google.maps.LatLng): google.maps.LatLngBounds;
      getCenter(): google.maps.LatLng;
      getNorthEast(): google.maps.LatLng;
      getSouthWest(): google.maps.LatLng;
    }

    interface Map {
      setCenter(latlng: google.maps.LatLng): void;
      setZoom(zoom: number): void;
      getCenter(): google.maps.LatLng;
      getZoom(): number;
    }

    interface Polygon {
      getPath(): google.maps.MVCArray<google.maps.LatLng>;
      getPaths(): google.maps.MVCArray<google.maps.MVCArray<google.maps.LatLng>>;
      setMap(map: google.maps.Map | null): void;
    }

    interface MVCArray<T> {
      getArray(): T[];
      getAt(i: number): T;
      getLength(): number;
    }

    namespace drawing {
      interface DrawingManager {
        setMap(map: google.maps.Map | null): void;
        setDrawingMode(drawingMode: google.maps.drawing.OverlayType | null): void;
        setOptions(options: any): void;
      }
    }

    interface GeocoderComponentRestrictions {
      administrativeArea?: string;
      country?: string;
      locality?: string;
      postalCode?: string;
      route?: string;
    }

    namespace places {
      interface Autocomplete {
        addListener(eventName: string, handler: () => void): void;
        getPlace(): google.maps.places.PlaceResult;
        setBounds(bounds: google.maps.LatLngBounds): void;
        setComponentRestrictions(restrictions: google.maps.places.ComponentRestrictions): void;
        setFields(fields: string[]): void;
        setOptions(options: google.maps.places.AutocompleteOptions): void;
        setTypes(types: string[]): void;
      }

      interface AutocompleteOptions {
        bounds?: google.maps.LatLngBounds;
        componentRestrictions?: google.maps.places.ComponentRestrictions;
        fields?: string[];
        strictBounds?: boolean;
        types?: string[];
      }

      interface ComponentRestrictions {
        country?: string | string[];
      }

      interface PlaceResult {
        address_components?: google.maps.GeocoderAddressComponent[];
        formatted_address?: string;
        geometry?: google.maps.places.PlaceGeometry;
        name?: string;
        place_id?: string;
        types?: string[];
        vicinity?: string;
      }

      interface PlaceGeometry {
        location?: google.maps.LatLng;
        viewport?: google.maps.LatLngBounds;
      }

      interface AutocompleteService {
        getPlacePredictions(
          request: google.maps.places.AutocompletionRequest,
          callback: (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => void
        ): void;
      }

      interface AutocompletionRequest {
        input: string;
        bounds?: google.maps.LatLngBounds;
        componentRestrictions?: google.maps.places.ComponentRestrictions;
        location?: google.maps.LatLng;
        offset?: number;
        radius?: number;
        sessionToken?: google.maps.places.AutocompleteSessionToken;
        types?: string[];
      }

      interface AutocompletePrediction {
        description: string;
        matched_substrings: google.maps.places.PredictionSubstring[];
        place_id: string;
        structured_formatting: google.maps.places.StructuredFormatting;
        terms: google.maps.places.PredictionTerm[];
        types: string[];
      }

      interface PredictionSubstring {
        length: number;
        offset: number;
      }

      interface StructuredFormatting {
        main_text: string;
        main_text_matched_substrings: google.maps.places.PredictionSubstring[];
        secondary_text: string;
      }

      interface PredictionTerm {
        offset: number;
        value: string;
      }

      interface PlacesService {
        getDetails(
          request: google.maps.places.PlaceDetailsRequest,
          callback: (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => void
        ): void;
      }

      interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[];
        sessionToken?: google.maps.places.AutocompleteSessionToken;
      }

      enum PlacesServiceStatus {
        INVALID_REQUEST = 'INVALID_REQUEST',
        NOT_FOUND = 'NOT_FOUND',
        OK = 'OK',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR',
        ZERO_RESULTS = 'ZERO_RESULTS'
      }

      interface AutocompleteSessionToken {}
    }
  }
}

export {};