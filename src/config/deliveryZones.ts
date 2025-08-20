// Configurazione delle zone di consegna
import * as turf from '@turf/turf';
import { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import deliveryZonesData from './deliveryZones.json';

export interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  cities: string[];
  provinces: string[];
  postalCodes: string[];
  color: string; // Colore per identificare visivamente la zona
  polygon?: {
    coordinates: number[][][];
    center: { lat: number; lng: number };
  };
  timeSlotRestrictions?: {
    excludedSlots?: string[];
    preferredSlots?: string[];
  };
}

// Zone di consegna statiche in memoria
const STATIC_DELIVERY_ZONES: DeliveryZone[] = [
  // Tutte le zone statiche sono state rimosse per permettere la gestione tramite poligoni
];

// Funzione per ottenere le zone statiche
function getStaticZones(): DeliveryZone[] {
  return STATIC_DELIVERY_ZONES;
}

// Funzione per verificare se un punto è all'interno di un poligono personalizzato
function isPointInCustomPolygon(lat: number, lng: number, polygonCoordinates: number[][][]): boolean {
  try {
    const point = turf.point([lng, lat]);
    const polygon = turf.polygon(polygonCoordinates);
    return turf.booleanPointInPolygon(point, polygon);
  } catch (error) {
    console.error('Errore nel controllo del poligono:', error);
    return false;
  }
}

// Funzione per determinare la zona in base alle coordinate geografiche
export function determineZoneFromCoordinates(lat: number, lng: number): DeliveryZone | null {
  try {
    const point = turf.point([lng, lat]);
    
    // Controlla tutte le zone dal JSON
    const allZones = parseZonesFromJson();
    for (const zone of allZones) {
      if (zone.polygon && zone.polygon.coordinates) {
        if (isPointInCustomPolygon(lat, lng, zone.polygon.coordinates)) {
          return zone;
        }
      }
    }
    
    // Fallback per GeoJSON con geometry
    if ((deliveryZonesData as any).features) {
      for (const feature of (deliveryZonesData as any).features) {
        if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
          if (turf.booleanPointInPolygon(point, feature as any)) {
            const zoneName = feature.properties?.name;
            const zoneId = feature.properties?.id;
            
            if (zoneName && zoneId) {
              return {
                id: zoneId,
                name: zoneName,
                description: feature.properties?.description || '',
                cities: [],
                provinces: [],
                postalCodes: [],
                color: feature.properties?.color || '#3B82F6',
                timeSlotRestrictions: (feature.properties as any)?.timeSlotRestrictions || {
                  excludedSlots: [],
                  preferredSlots: []
                }
              };
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Errore nella determinazione della zona geografica:', error);
  }
  
  return null;
}

// Funzione per determinare la zona in base all'indirizzo (fallback)
export function determineZoneFromAddress(address: {
  postalCode?: string;
  city?: string;
  province?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
}): DeliveryZone | null {
  // Prima prova con le coordinate se disponibili
  if (address.coordinates) {
    const zoneByCoordinates = determineZoneFromCoordinates(
      address.coordinates.lat, 
      address.coordinates.lng
    );
    if (zoneByCoordinates) return zoneByCoordinates;
  }

  // Ottieni le zone statiche
  const staticZones = getStaticZones();

  // Fallback: prova con il codice postale
  if (address.postalCode) {
    const zoneByPostalCode = staticZones.find(zone => 
      zone.postalCodes.includes(address.postalCode!)
    );
    if (zoneByPostalCode) {
      return zoneByPostalCode;
    }
  }

  // Poi prova con la città
  if (address.city) {
    const zoneByCity = staticZones.find(zone => 
      zone.cities.some(city => 
        city.toLowerCase().includes(address.city!.toLowerCase()) ||
        address.city!.toLowerCase().includes(city.toLowerCase())
      )
    );
    if (zoneByCity) {
      return zoneByCity;
    }
  }

  // Infine prova con la provincia
  if (address.province) {
    const zoneByProvince = staticZones.find(zone => 
      zone.provinces.includes(address.province!)
    );
    if (zoneByProvince) {
      return zoneByProvince;
    }
  }

  // Fallback: cerca nelle zone del JSON se disponibili le coordinate
  if (address.coordinates && !Array.isArray(deliveryZonesData) && (deliveryZonesData as any).features) {
    for (const feature of (deliveryZonesData as any).features) {
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        const point = turf.point([address.coordinates.lng, address.coordinates.lat]);
        if (turf.booleanPointInPolygon(point, feature as any)) {
          const zoneName = feature.properties?.name;
          const zoneId = feature.properties?.id;
          
          if (zoneName && zoneId) {
            return {
              id: zoneId,
              name: zoneName,
              description: feature.properties?.description || '',
              cities: [],
              provinces: [],
              postalCodes: [],
              color: feature.properties?.color || '#3B82F6'
            };
          }
        }
      }
    }
  }

  // Fallback finale: cerca per nome città nelle zone del JSON
  if (address.city && !Array.isArray(deliveryZonesData) && (deliveryZonesData as any).features) {
    for (const feature of (deliveryZonesData as any).features) {
      const zoneName = feature.properties?.name;
      const zoneId = feature.properties?.id;
      
      if (zoneName && zoneId && zoneName.toLowerCase().includes(address.city.toLowerCase())) {
        return {
          id: zoneId,
          name: zoneName,
          description: feature.properties?.description || '',
          cities: [],
          provinces: [],
          postalCodes: [],
          color: feature.properties?.color || '#3B82F6'
        };
      }
    }
  }
  return null;
}

// Funzione per ottenere le fasce orarie consigliate per una zona
export const getRecommendedTimeSlotsForZone = (zoneId: string): string[] => {
  // Cerca la zona nelle configurazioni statiche
  const allZones = getAllZones();
  const zone = allZones.find(z => z.id === zoneId);
  
  if (!zone || !zone.timeSlotRestrictions) {
    return [];
  }
  
  return zone.timeSlotRestrictions.preferredSlots || [];
};

// Funzione per ottenere le fasce orarie escluse per una zona
export const getExcludedTimeSlotsForZone = (zoneId: string): string[] => {
  // Cerca la zona nelle configurazioni statiche
  const allZones = getAllZones();
  const zone = allZones.find(z => z.id === zoneId);
  
  if (!zone || !zone.timeSlotRestrictions) {
    return [];
  }
  
  return zone.timeSlotRestrictions.excludedSlots || [];
};

// Funzione per ottenere le fasce orarie disponibili per una zona
export const getAvailableTimeSlotsForZone = (zoneId: string): string[] => {
  // Tutte le fasce orarie possibili
  const allTimeSlots = [
    '07:00 - 08:00',
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 13:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00'
  ];
  
  const excludedSlots = getExcludedTimeSlotsForZone(zoneId);
  
  // Filtra le fasce orarie rimuovendo quelle escluse
  return allTimeSlots.filter(slot => !excludedSlots.includes(slot));
};

// Funzione per convertire i dati JSON in formato DeliveryZone
function parseZonesFromJson(): DeliveryZone[] {
  try {
    // Se è un array, restituiscilo direttamente (assicurandoci che abbia la struttura corretta)
    if (Array.isArray(deliveryZonesData)) {
      return deliveryZonesData.map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        description: zone.description || '',
        cities: zone.cities || [],
        provinces: zone.provinces || [],
        postalCodes: zone.postalCodes || [],
        color: zone.color || '#3B82F6',
        polygon: zone.polygon ? {
          coordinates: zone.polygon.coordinates,
          center: zone.polygon.center
        } : undefined,
        timeSlotRestrictions: zone.timeSlotRestrictions || {
          excludedSlots: [],
          preferredSlots: []
        }
      }));
    }
    // Se è un GeoJSON, convertilo
    if ((deliveryZonesData as any).features && Array.isArray((deliveryZonesData as any).features)) {
      return (deliveryZonesData as any).features.map((feature: any) => ({
        id: feature.properties?.id || 'unknown',
        name: feature.properties?.name || 'Zona sconosciuta',
        description: feature.properties?.description || '',
        cities: [],
        provinces: [],
        postalCodes: [],
        color: feature.properties?.color || '#3B82F6',
        polygon: feature.geometry ? {
          coordinates: feature.geometry.coordinates,
          center: feature.properties?.center || { lat: 0, lng: 0 }
        } : undefined,
        timeSlotRestrictions: feature.properties?.timeSlotRestrictions || {
          excludedSlots: [],
          preferredSlots: []
        }
      }));
    }
  } catch (error) {
    console.error('Errore nel parsing delle zone:', error);
  }
  return [];
}

// Funzione per ottenere tutte le zone
export const getAllZones = (): DeliveryZone[] => {
  return parseZonesFromJson();
};

// Funzione per ottenere una zona per ID
export const getZoneById = (zoneId: string): DeliveryZone | null => {
  const allZones = parseZonesFromJson();
  return allZones.find(zone => zone.id === zoneId) || null;
};

// Funzione per salvare le zone nel file JSON
export const saveZonesToFile = (zones: DeliveryZone[]): string => {
  // Genera il codice JSON formattato per il file deliveryZones.json
  const jsonCode = JSON.stringify(zones, null, 2);
  console.log('Codice generato per deliveryZones.json:', jsonCode);
  return jsonCode;
};