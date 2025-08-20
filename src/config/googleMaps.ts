// Google Maps API configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'AIzaSyBxgstK7aLk9d-Kb1G9hXMWNFWiXp28MNg',
  libraries: ['places', 'marker'] as const,
  region: 'IT', // Restrict to Italy
  language: 'it' // Italian language
};

// Check if Google Maps API is loaded
export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.google !== 'undefined' && 
         typeof window.google.maps !== 'undefined' && 
         typeof window.google.maps.places !== 'undefined';
};

// Wait for Google Maps API to load
export const waitForGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isGoogleMapsLoaded()) {
      resolve();
      return;
    }

    const checkInterval = setInterval(() => {
      if (isGoogleMapsLoaded()) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Google Maps API failed to load'));
    }, 10000);
  });
};