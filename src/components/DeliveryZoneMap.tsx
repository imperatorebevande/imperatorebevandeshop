import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { determineZoneFromCoordinates, getAllZones, getAvailableTimeSlotsForZone } from '../config/deliveryZones';
import { getCurrentPosition } from '../services/geocoding';
import { MapPin, Navigation, Info, Search, Clock, CheckCircle, MessageCircle, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import AddressAutocomplete from './AddressAutocomplete';

interface DeliveryZoneMapProps {
  onZoneDetected?: (zone: any) => void;
  onZoneError?: (error: string | null) => void;
}

const DeliveryZoneMap: React.FC<DeliveryZoneMapProps> = ({ onZoneDetected, onZoneError }) => {
  const navigate = useNavigate();
  const [currentZone, setCurrentZone] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableZones, setAvailableZones] = useState<any[]>([]);
  const [addressInput, setAddressInput] = useState<string>('');

  // Carica le zone disponibili quando il componente viene montato
  useEffect(() => {
    const zones = getAllZones();
    setAvailableZones(zones);
  }, []);

  const detectCurrentZone = async () => {
    setIsLoading(true);
    setError(null);
    onZoneError?.(null);
    
    try {
      const position = await getCurrentPosition();
      
      if (position) {
        handleCoordinatesReceived(position.lat, position.lng);
      } else {
        const errorMsg = 'Impossibile ottenere la posizione corrente';
        setError(errorMsg);
        onZoneError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Errore nel rilevamento della posizione';
      setError(errorMsg);
      onZoneError?.(errorMsg);
      console.error('Errore geolocalizzazione:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address + ', Bari, Italy')}&key=YOUR_API_KEY&limit=1`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.lat,
          lng: result.geometry.lng
        };
      }
      return null;
    } catch (error) {
      console.error('Errore geocoding:', error);
      return null;
    }
  };

  // Funzione per gestire le coordinate ricevute (da geolocalizzazione o autocomplete)
  const handleCoordinatesReceived = (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setError(null);
    
    const zone = determineZoneFromCoordinates(lat, lng);
    
    if (zone) {
      setCurrentZone(zone);
      setError(null);
      onZoneDetected?.(zone);
      onZoneError?.(null);
    } else {
      const errorMsg = 'L\'indirizzo inserito non sembra essere coperto dal nostro servizio di consegna';
      setError(errorMsg);
      setCurrentZone(null);
      onZoneDetected?.(null);
      onZoneError?.(errorMsg);
    }
  };

  const searchByAddress = async () => {
    if (!addressInput.trim()) {
      const errorMsg = 'Inserisci un indirizzo valido';
      setError(errorMsg);
      onZoneError?.(errorMsg);
      return;
    }

    setIsGeocodingLoading(true);
    setError(null);
    
    try {
      // Prova prima con un geocoding semplificato per Bari
      const bariCoordinates = await geocodeAddressSimple(addressInput);
      
      if (bariCoordinates) {
        handleCoordinatesReceived(bariCoordinates.lat, bariCoordinates.lng);
      } else {
        const errorMsg = 'Sembra che il tuo indirizzo non sia coperto dal nostro servizio';
        setError(errorMsg);
        onZoneError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Errore nella ricerca dell\'indirizzo';
      setError(errorMsg);
      onZoneError?.(errorMsg);
      console.error('Errore geocoding:', err);
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  // Geocoding semplificato per zone di Bari
  const geocodeAddressSimple = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    const addressLower = address.toLowerCase();
    
    // Mappa semplificata delle zone principali di Bari con coordinate approssimative
    const zoneCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'triggiano': { lat: 41.0667, lng: 16.9167 },
      'valenzano': { lat: 41.0500, lng: 16.8833 },
      'poggifranco': { lat: 41.1167, lng: 16.8667 },
      'carbonara': { lat: 41.1333, lng: 16.9000 },
      'ceglie del campo': { lat: 41.1000, lng: 16.9333 },
      'amendola': { lat: 41.1000, lng: 16.8500 },
      'sanpasquale': { lat: 41.1167, lng: 16.8833 },
      'japigia': { lat: 41.0833, lng: 16.8833 },
      'madonnella': { lat: 41.1167, lng: 16.8667 },
      'libertà': { lat: 41.1167, lng: 16.8667 },
      'palese': { lat: 41.1500, lng: 16.8000 },
      'stanic': { lat: 41.1333, lng: 16.8000 },
      'modugno': { lat: 41.0833, lng: 16.8333 },
      'bitrito': { lat: 41.0500, lng: 16.8667 },
      'cellamare': { lat: 41.0333, lng: 16.9000 },
      'torre a mare': { lat: 41.0667, lng: 16.9500 },
      'capurso': { lat: 41.0667, lng: 16.9333 },
      'mungivacca': { lat: 41.1000, lng: 16.8833 },
      'carrassi': { lat: 41.1167, lng: 16.8833 },
      'centro': { lat: 41.1177, lng: 16.8719 },
      'sangirolamo': { lat: 41.1000, lng: 16.8500 },
      'fesca': { lat: 41.1000, lng: 16.8500 },
      'sanpaolo': { lat: 41.1000, lng: 16.8333 },
      'loseto': { lat: 41.0833, lng: 16.9167 },
      'adelfia': { lat: 41.0167, lng: 16.8667 },
      'sangiorgio': { lat: 41.0833, lng: 16.8167 }
    };
    
    // Cerca corrispondenze nelle zone conosciute
    for (const [zoneName, coords] of Object.entries(zoneCoordinates)) {
      if (addressLower.includes(zoneName) || addressLower.includes(zoneName.replace(' ', ''))) {
        return coords;
      }
    }
    
    // Se non trova corrispondenze specifiche, usa coordinate generiche di Bari centro
    if (addressLower.includes('bari')) {
      return { lat: 41.1177, lng: 16.8719 };
    }
    
    return null;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-3xl shadow-2xl border border-gray-100/50 backdrop-blur-sm relative overflow-hidden">
      {/* Effetto di sfondo decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/10 to-blue-400/10 rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-3 animate-in">Verifica Zona di Consegna</h2>
          <p className="text-gray-600 text-lg font-medium animate-in" style={{animationDelay: '0.2s'}}>Controlla se la tua zona è coperta dal nostro servizio di consegna</p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4 animate-in" style={{animationDelay: '0.4s'}}></div>
        </div>
        <div className="space-y-6">
        <div className="text-center">
          <Button 
            onClick={detectCurrentZone}
            disabled={isLoading || isGeocodingLoading}
            className="group relative w-full flex items-center justify-center gap-3 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
          >
            {/* Effetto di brillantezza */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            
            <div className="relative flex items-center gap-3">
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              ) : (
                <div className="p-1 bg-white/20 rounded-lg">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
              )}
              <span className="text-lg tracking-wide">
                {isLoading ? 'Rilevamento in corso...' : 'Rileva Automaticamente'}
              </span>
            </div>
            
            {/* Indicatori di stato */}
            {!isLoading && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            )}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-gray-500 font-medium">oppure</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative group">
            <AddressAutocomplete
              label=""
              placeholder="Inserisci il tuo indirizzo (es. Via Roma, Bari)"
              value={addressInput}
              onChange={setAddressInput}
              onAddressSelect={(address) => {
                setAddressInput(address.address);
                // Se abbiamo le coordinate dall'autocomplete, usale direttamente
                if (address.coordinates) {
                  handleCoordinatesReceived(address.coordinates.lat, address.coordinates.lng);
                } else {
                  // Fallback alla ricerca tradizionale
                  searchByAddress();
                }
              }}
              className="h-14 pl-14 pr-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 transition-all duration-500 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm placeholder:text-gray-400 font-medium"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1 bg-blue-100 rounded-lg group-focus-within:bg-blue-200 transition-colors duration-300 pointer-events-none z-10">
              <MapPin className="text-blue-600 w-5 h-5" />
            </div>
            
            {/* Indicatore di focus */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
          <Button 
            onClick={searchByAddress}
            disabled={isLoading || isGeocodingLoading || !addressInput.trim()}
            className="group relative w-full flex items-center justify-center gap-3 h-14 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 disabled:hover:translate-y-0 overflow-hidden"
          >
            {/* Effetto di brillantezza */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            
            <div className="relative flex items-center gap-3">
              {isGeocodingLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              ) : (
                <div className="p-1 bg-white/20 rounded-lg">
                  <Search className="w-5 h-5 animate-pulse" />
                </div>
              )}
              <span className="text-lg tracking-wide">
                {isGeocodingLoading ? 'Ricerca in corso...' : 'Cerca Indirizzo'}
              </span>
            </div>
            
            {/* Indicatori di stato */}
            {!isGeocodingLoading && !(!addressInput.trim()) && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
            )}
          </Button>
        </div>

        {coordinates && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">
                Posizione: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </span>
            </div>
          </div>
        )}

        {currentZone && (
          <div className="relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 rounded-2xl border-2 shadow-2xl overflow-hidden transform transition-all duration-500 hover:shadow-3xl animate-in slide-in-from-bottom-4" style={{ borderColor: currentZone.color }}>
            {/* Effetto di sfondo animato */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse opacity-30"></div>
            
            {/* Header della zona con design migliorato */}
            <div className="relative p-6 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border-b border-green-200/50 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div 
                    className="w-12 h-12 rounded-full shadow-xl flex items-center justify-center ring-4 ring-white/50 transform transition-all duration-300 hover:scale-110" 
                    style={{ backgroundColor: currentZone.color }}
                  >
                    <CheckCircle className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-800 leading-tight bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                    La sua zona è coperta dal nostro servizio
                  </h3>
                </div>
              </div>
            </div>
            
            {/* Fasce orarie disponibili con design migliorato */}
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-lg text-gray-800">Fasce Orarie Disponibili</h4>
                <div className="flex-1 h-px bg-gradient-to-r from-green-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getAvailableTimeSlotsForZone(currentZone.id).map((slot: string, index: number) => (
                  <div 
                    key={index}
                    className="group relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200/60 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-green-300 min-w-0 transform hover:-translate-y-1"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    {/* Effetto di brillantezza */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    
                    <div className="relative flex items-center justify-center gap-3 flex-wrap">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex-shrink-0 shadow-lg animate-pulse"></div>
                      <span className="text-base font-bold text-green-800 whitespace-nowrap tracking-wide">{slot}</span>
                    </div>
                    
                    {/* Indicatore di disponibilità */}
                    <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                ))}
              </div>
              
              {getAvailableTimeSlotsForZone(currentZone.id).length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-base font-medium bg-gray-100 rounded-lg p-4">Nessuna fascia oraria disponibile per questa zona</div>
                </div>
              )}
            </div>
            
            {/* Decorazione inferiore */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
            <div className="text-red-700 font-medium mb-4">{error}</div>
            <Button 
               onClick={() => window.open('https://wa.me/393402486783?text=Ciao,%20vorrei%20informazioni%20sulla%20copertura%20del%20servizio%20di%20consegna%20per%20il%20mio%20indirizzo', '_blank')}
               className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white px-6 py-2 text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
             >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chiedi al nostro TEAM
            </Button>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Info className="w-4 h-4" />
            <span className="text-sm">
              Sistema di rilevamento geografico preciso
            </span>
          </div>
          
          {/* Link alla mappa con confini delle zone */}
          <div className="pt-2 border-t border-gray-200">
            <Button
              onClick={() => navigate('/zone-map')}
              variant="outline"
              className="w-full bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center justify-center gap-2">
                <Map className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm">
                  Visualizza Mappa Zone di Consegna
                </span>
              </div>
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryZoneMap;