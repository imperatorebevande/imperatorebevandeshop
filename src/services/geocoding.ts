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

    // Controlla se le permissions sono disponibili
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          console.warn('Permessi di geolocalizzazione negati');
          resolve(null);
          return;
        }
        
        // Procedi con la geolocalizzazione solo se i permessi sono concessi o prompt
        requestGeolocation(resolve);
      }).catch(() => {
        // Fallback se l'API permissions non è supportata
        console.warn('API permissions non supportata, tentativo di geolocalizzazione senza controllo permessi');
        resolve(null);
      });
    } else {
      // Fallback per browser che non supportano l'API permissions
      console.warn('API permissions non disponibile, geolocalizzazione disabilitata per sicurezza');
      resolve(null);
    }
  });
}

// Funzione helper per la richiesta di geolocalizzazione
function requestGeolocation(resolve: (value: GeocodeResult | null) => void) {
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
      enableHighAccuracy: false, // Ridotto per migliorare performance
      timeout: 5000, // Ridotto timeout
      maximumAge: 600000 // 10 minuti
    }
  );
}