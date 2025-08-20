import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllZones, DeliveryZone } from '../config/deliveryZones';
import { ArrowLeft, Info, Clock, MapPin, Navigation, Truck, Calendar, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

// Tipi per Google Maps
type GoogleMap = any;
type GoogleMapsPolygon = any;
type GoogleMapsMarker = any;
type GoogleMapsInfoWindow = any;

const ZoneMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openInfoWindow, setOpenInfoWindow] = useState<GoogleMapsInfoWindow | null>(null);
  const [polygons, setPolygons] = useState<GoogleMapsPolygon[]>([]);
  const [allInfoWindows, setAllInfoWindows] = useState<GoogleMapsInfoWindow[]>([]);

  useEffect(() => {
    // Carica le zone
    const allZones = getAllZones();
    setZones(allZones);
    
    // Inizializza la mappa
    initializeMap();
  }, []);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      // Carica Google Maps API se non è già caricata
      if (!window.google) {
        await loadGoogleMapsAPI();
      }

      // Crea la mappa centrata su Bari
      const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: 41.1171, lng: 16.8719 }, // Bari
        zoom: 11,
        mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false, // Disabilita i controlli per cambiare tipo di mappa
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#f5f7fa' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry.fill',
            stylers: [{ color: '#1B5AAB' }, { lightness: 80 }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#1B5AAB' }, { lightness: 90 }]
          },
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'administrative',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#1B5AAB' }]
          }
        ]
      });

      setMap(mapInstance);
      
      // Aggiungi i poligoni delle zone
      const allZones = getAllZones();
      addZonePolygons(mapInstance, allZones);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Errore nell\'inizializzazione della mappa:', error);
      setIsLoading(false);
    }
  };

  const loadGoogleMapsAPI = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Errore nel caricamento di Google Maps'));
      document.head.appendChild(script);
    });
  };

  const addZonePolygons = (mapInstance: GoogleMap, zones: DeliveryZone[]) => {
    const createdPolygons: GoogleMapsPolygon[] = [];
    const createdInfoWindows: GoogleMapsInfoWindow[] = [];
    const createdMarkers: GoogleMapsMarker[] = [];
    
    zones.forEach((zone) => {
      if (zone.polygon && zone.polygon.coordinates) {
        // Converti le coordinate del poligono
        const paths = zone.polygon.coordinates[0].map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));

        // Crea il poligono
        const polygon = new (window as any).google.maps.Polygon({
          paths: paths,
          strokeColor: zone.color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: zone.color,
          fillOpacity: 0.2,
          clickable: true
        });
        
        // Salva il colore originale per il ripristino
        (polygon as any).originalColor = zone.color;

        polygon.setMap(mapInstance);
        createdPolygons.push(polygon);

        // Aggiungi listener per il click sul poligono
        polygon.addListener('click', (event: any) => {
          // Trova il marker corrispondente a questa zona
          const correspondingMarker = createdMarkers.find(m => m.zoneId === zone.id);
          const correspondingInfoWindow = createdInfoWindows.find(iw => iw.zoneId === zone.id);
          
          if (correspondingMarker && correspondingInfoWindow) {
            // Chiudi tutte le InfoWindow precedenti
            createdInfoWindows.forEach(iw => {
              if (iw !== correspondingInfoWindow) {
                iw.close();
              }
            });
            
            // Evidenzia il poligono selezionato e rendi gli altri grigi
             highlightSelectedPolygon(createdPolygons, polygon);
             
             // Apri l'InfoWindow nella posizione del click
             correspondingInfoWindow.setPosition(event.latLng);
             correspondingInfoWindow.open(mapInstance);
             setOpenInfoWindow(correspondingInfoWindow);
             setSelectedZone(zone);
          }
        });

        // Aggiungi marker con il nome della zona
        if (zone.polygon.center) {
          const marker = new (window as any).google.maps.Marker({
            position: zone.polygon.center,
            map: mapInstance,
            title: zone.name,
            icon: {
              path: (window as any).google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: zone.color,
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });
          
          // Aggiungi identificatore della zona al marker
          (marker as any).zoneId = zone.id;
          createdMarkers.push(marker);

          // InfoWindow per il marker con design migliorato
          const timeSlots = calculateAvailableTimeSlots(zone);
          const infoWindow = new (window as any).google.maps.InfoWindow({
            content: `
              <div style="padding: 16px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 280px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${zone.color};"></div>
                  <h3 style="margin: 0; color: #1B5AAB; font-size: 18px; font-weight: 600;">${zone.name}</h3>
                </div>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b; line-height: 1.5;">${zone.description}</p>
                ${timeSlots.length > 0 ? `
                  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B5AAB" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      <span style="font-size: 12px; font-weight: 600; color: #1B5AAB;">Orari Disponibili</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                      ${timeSlots.map(slot => `
                        <span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${slot}</span>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            `
          });

          // Aggiungi identificatore della zona all'InfoWindow
          (infoWindow as any).zoneId = zone.id;
          // Aggiungi l'InfoWindow all'array
          createdInfoWindows.push(infoWindow);

          // Aggiungi listener per chiudere l'InfoWindow quando viene chiusa
          infoWindow.addListener('closeclick', () => {
            setOpenInfoWindow(null);
          });

          marker.addListener('click', () => {
            // Chiudi tutte le InfoWindow precedenti
            createdInfoWindows.forEach(iw => {
              if (iw !== infoWindow) {
                iw.close();
              }
            });
            
            // Evidenzia il poligono selezionato e rendi gli altri grigi
            highlightSelectedPolygon(createdPolygons, polygon);
            
            infoWindow.open(mapInstance, marker);
            setOpenInfoWindow(infoWindow);
            setSelectedZone(zone);
          });
        }
      }
    });
    
    setPolygons(createdPolygons);
    setAllInfoWindows(createdInfoWindows);
  };

  const highlightSelectedPolygon = (allPolygons: GoogleMapsPolygon[], selectedPolygon: GoogleMapsPolygon) => {
    allPolygons.forEach(polygon => {
      if (polygon !== selectedPolygon) {
        // Rendi i poligoni non selezionati grigi e meno opachi
        polygon.setOptions({
          strokeColor: '#9CA3AF',
          fillColor: '#9CA3AF',
          strokeOpacity: 0.4,
          fillOpacity: 0.1,
          strokeWeight: 1
        });
      } else {
        // Mantieni il poligono selezionato con i colori originali
        const originalColor = (polygon as any).originalColor;
        polygon.setOptions({
          strokeColor: originalColor,
          fillColor: originalColor,
          strokeOpacity: 0.8,
          fillOpacity: 0.3,
          strokeWeight: 3
        });
      }
    });
  };

  // Funzione per calcolare gli orari disponibili (07:00-16:00 meno quelli esclusi)
  const calculateAvailableTimeSlots = (zone: DeliveryZone): string[] => {
    const allSlots: string[] = [];
    
    // Genera tutti gli slot dalle 07:00 alle 16:00
    for (let hour = 7; hour < 16; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      allSlots.push(`${startTime} - ${endTime}`);
    }
    
    // Rimuovi gli slot esclusi
    const excludedSlots = zone.timeSlotRestrictions?.excludedSlots || [];
    return allSlots.filter(slot => !excludedSlots.includes(slot));
  };

  const showAllPolygons = () => {
    polygons.forEach(polygon => {
      // Ripristina tutti i poligoni ai colori originali
      const originalColor = (polygon as any).originalColor;
      polygon.setOptions({
        strokeColor: originalColor,
        fillColor: originalColor,
        strokeOpacity: 0.8,
        fillOpacity: 0.2,
        strokeWeight: 2
      });
    });
    // Chiudi tutte le InfoWindow
    allInfoWindows.forEach(infoWindow => {
      infoWindow.close();
    });
    setOpenInfoWindow(null);
    setSelectedZone(null);
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 touch-manipulation">
      {/* Header responsivo fisso */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm shadow-xl border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-6 flex-1">
              <Button
                onClick={goBack}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 hover:bg-[#1B5AAB] hover:text-white border-[#1B5AAB] text-[#1B5AAB] transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Indietro</span>
              </Button>
              <div className="flex items-center gap-2 sm:gap-4 flex-1">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-[#1B5AAB] to-blue-600 rounded-lg sm:rounded-xl shadow-lg">
                  <Navigation className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#1B5AAB] to-blue-600 bg-clip-text text-transparent truncate">
                    Zone di Consegna
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 sm:gap-2 truncate">
                    <Truck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Scopri le aree servite e gli orari disponibili</span>
                    <span className="sm:hidden">Aree servite</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Link to="/prodotti">
                <Button 
                  className="bg-gradient-to-r from-[#1B5AAB] to-blue-600 hover:from-blue-600 hover:to-[#1B5AAB] text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 font-semibold"
                  size="sm"
                >
                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Vai allo Shop</span>
                  <span className="sm:hidden">Shop</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pt-20 sm:pt-24">
        <div className="space-y-4 sm:space-y-6">
          {/* Controlli responsivi */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs sm:text-sm">
                {zones.length} Zone Attive
              </Badge>
              {selectedZone && (
                <Button
                  onClick={showAllPolygons}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 sm:gap-2 hover:bg-[#1B5AAB] hover:text-white border-[#1B5AAB] text-[#1B5AAB] transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Mostra Tutte le Zone</span>
                  <span className="sm:hidden">Tutte</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Mappa responsiva */}
          <div>
            <Card className="h-[400px] sm:h-[500px] lg:h-[700px] overflow-hidden shadow-xl sm:shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl">
              <CardContent className="p-0 h-full relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center px-4">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-[#1B5AAB]/20 border-t-[#1B5AAB] mx-auto mb-4 sm:mb-6"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Navigation className="w-4 h-4 sm:w-6 sm:h-6 text-[#1B5AAB] animate-pulse" />
                        </div>
                      </div>
                      <p className="text-[#1B5AAB] font-semibold text-base sm:text-lg">Caricamento mappa...</p>
                      <p className="text-gray-500 text-xs sm:text-sm mt-2">Preparazione delle zone di consegna</p>
                    </div>
                  </div>
                )}
                <div ref={mapRef} className="w-full h-full rounded-lg" />
              </CardContent>
            </Card>
          </div>

          {/* Dettagli zona selezionata sotto la mappa - responsivo */}
          {selectedZone && (
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm overflow-hidden rounded-xl sm:rounded-2xl">
              <div className="h-2 bg-gradient-to-r from-[#1B5AAB] to-blue-600"></div>
              <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="flex items-start gap-3 text-lg sm:text-xl flex-1 min-w-0">
                    <div 
                      className="p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0"
                      style={{ backgroundColor: selectedZone.color + '20', border: `2px solid ${selectedZone.color}40` }}
                    >
                      <MapPin className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: selectedZone.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-800 break-words">{selectedZone.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 font-normal">Dettagli zona di consegna</p>
                    </div>
                  </CardTitle>
                  <Button
                    onClick={showAllPolygons}
                    variant="outline"
                    size="sm"
                    className="hover:bg-[#1B5AAB] hover:text-white border-[#1B5AAB] text-[#1B5AAB] transition-all duration-300 flex-shrink-0 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
                  >
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Mostra Tutte</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-3 sm:p-4 bg-gray-50/50 rounded-lg sm:rounded-xl border border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">{selectedZone.description}</p>
                  </div>
                  
                  {selectedZone.timeSlotRestrictions && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-200">
                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-md sm:rounded-lg flex-shrink-0">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#1B5AAB]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">Orari di Consegna</h4>
                          <p className="text-xs text-gray-500 truncate">Fasce orarie disponibili</p>
                        </div>
                      </div>
                      
                      {(() => {
                        const availableSlots = calculateAvailableTimeSlots(selectedZone);
                        return availableSlots.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <p className="text-sm font-semibold text-green-700">Orari Disponibili</p>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {availableSlots.map((slot, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-md sm:rounded-lg hover:bg-green-100 transition-colors"
                                >
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                                  <span className="font-medium text-green-800 text-xs sm:text-sm flex-1 min-w-0 truncate">{slot}</span>
                                  <div className="flex-shrink-0">
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs px-1.5 sm:px-2 py-0.5">
                                      <span className="hidden sm:inline">Disponibile</span>
                                      <span className="sm:hidden">OK</span>
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                      

                    </div>
                  )}
                </div>
                
                {/* Informazioni aggiuntive */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-[#1B5AAB] flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-[#1B5AAB] truncate">Informazioni Consegna</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed break-words">
                    Gli orari mostrati sono indicativi e possono variare in base alla disponibilità del servizio.
                    Contattaci per maggiori informazioni sui tempi di consegna.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Istruzioni */}
          {!selectedZone && (
            <Card className="shadow-xl border-0 bg-gradient-to-br from-[#1B5AAB]/5 to-blue-50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-white/60 rounded-full w-fit mx-auto">
                    <Info className="w-8 h-8 text-[#1B5AAB]" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-800">
                      Come utilizzare la mappa
                    </p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>• Clicca su una zona colorata per vedere i dettagli</p>
                      <p>• Visualizza gli orari di consegna disponibili</p>
                      <p>• Usa i marker per informazioni rapide</p>
                    </div>
                  </div>
                  <div className="pt-4 space-y-3">
                    <Link to="/prodotti">
                      <Button 
                        className="bg-gradient-to-r from-[#1B5AAB] to-blue-600 hover:from-blue-600 hover:to-[#1B5AAB] text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold px-6 py-3 rounded-xl w-full sm:w-auto"
                        size="lg"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Scopri i Nostri Prodotti
                      </Button>
                    </Link>
                    <div className="pt-2 border-t border-white/50">
                      <p className="text-xs text-gray-500 italic">
                        Imperatore Bevande - Servizio consegne professionale
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoneMap;