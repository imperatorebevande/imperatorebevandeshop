// Servizio per la geolocalizzazione degli indirizzi
import { waitForGoogleMaps } from '@/config/googleMaps';

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
}

// Funzione per ottenere le coordinate da un indirizzo usando Google Maps Geocoding API
export async function geocodeAddress(address: {
  address: string;
  city: string;
  province: string;
  postalCode: string;
}): Promise<GeocodeResult | null> {
  try {
    await waitForGoogleMaps();
    
    // Costruisce l'indirizzo completo
    const fullAddress = `${address.address}, ${address.city}, ${address.province}, ${address.postalCode}, Italy`;
    
    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode(
        {
          address: fullAddress,
          componentRestrictions: { country: 'IT' },
          region: 'it'
        },
        (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const location = result.geometry.location;
            
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formatted_address: result.formatted_address
            });
          } else {
            console.warn('Geocoding fallito:', status);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('Errore nel geocoding dell\'indirizzo:', error);
    return null;
  }
}

// Funzione per ottenere la posizione corrente dell'utente
export function getCurrentPosition(): Promise<GeocodeResult | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocalizzazione non supportata dal browser');
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          formatted_address: 'Posizione corrente'
        });
      },
      (error) => {
        console.warn('Errore nell\'ottenere la posizione corrente:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minuti
      }
    );
  });
}