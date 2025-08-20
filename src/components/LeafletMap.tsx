import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix per le icone di Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ZonePolygon {
  id: string;
  name: string;
  coordinates: number[][][];
  color: string;
}

interface LeafletMapProps {
  onPolygonCreated?: (coordinates: number[][]) => void;
  onPolygonEdited?: (zoneId: string, coordinates: number[][]) => void;
  existingZones?: ZonePolygon[];
  editingZoneId?: string | null;
  height?: string;
  center?: [number, number];
  zoom?: number;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ 
  onPolygonCreated,
  onPolygonEdited,
  existingZones = [],
  editingZoneId = null,
  height = '400px',
  center = [41.1171, 16.8719], // Bari, Italia
  zoom = 11 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawingRef = useRef<boolean>(false);
  const currentPolygonRef = useRef<L.Polygon | null>(null);
  const existingPolygonsRef = useRef<L.Polygon[]>([]);
  const editingPolygonRef = useRef<L.Polygon | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    // Inizializza la mappa
    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Aggiungi il layer di OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Funzione per rendere un poligono editabile
    const makePolygonEditable = (polygon: L.Polygon, zoneId: string) => {
      setIsEditing(true);
      
      // Aggiungi i punti di controllo per la modifica
      const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
      const editMarkers: L.Marker[] = [];
      
      latlngs.forEach((latlng, index) => {
        const marker = L.marker(latlng, {
          draggable: true,
          icon: L.divIcon({
            className: 'edit-marker',
            html: '<div style="background: #FF6B6B; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })
        }).addTo(map);
        
        marker.on('drag', () => {
          const newLatLngs = [...latlngs];
          newLatLngs[index] = marker.getLatLng();
          polygon.setLatLngs(newLatLngs);
        });
        
        marker.on('dragend', () => {
          const newLatLngs = polygon.getLatLngs()[0] as L.LatLng[];
          const coordinates = newLatLngs.map(point => [point.lat, point.lng]);
          if (onPolygonEdited) {
            onPolygonEdited(zoneId, coordinates);
          }
        });
        
        editMarkers.push(marker);
      });
      
      // Salva i marker per la pulizia successiva
      (polygon as any)._editMarkers = editMarkers;
    };
    
    // Funzione per terminare la modifica
    const finishEditing = () => {
      if (editingPolygonRef.current) {
        const editMarkers = (editingPolygonRef.current as any)._editMarkers;
        if (editMarkers) {
          editMarkers.forEach((marker: L.Marker) => map.removeLayer(marker));
        }
        editingPolygonRef.current = null;
      }
      setIsEditing(false);
    };

    // Visualizza le zone esistenti
    const displayExistingZones = () => {
      // Rimuovi i poligoni esistenti
      existingPolygonsRef.current.forEach(polygon => map.removeLayer(polygon));
      existingPolygonsRef.current = [];

      // Aggiungi i nuovi poligoni
      existingZones.forEach(zone => {
        if (zone.coordinates && zone.coordinates.length > 0) {
          // Converti le coordinate da GeoJSON (lng,lat) a Leaflet (lat,lng)
          const leafletCoords = zone.coordinates[0].map(coord => [coord[1], coord[0]] as [number, number]);
          
          const isEditingThisZone = editingZoneId === zone.id;
          
          const polygon = L.polygon(leafletCoords, {
            color: isEditingThisZone ? '#FF6B6B' : (zone.color || '#3B82F6'),
            fillColor: isEditingThisZone ? '#FF6B6B' : (zone.color || '#3B82F6'),
            fillOpacity: isEditingThisZone ? 0.5 : 0.3,
            weight: isEditingThisZone ? 3 : 2
          }).addTo(map);

          // Aggiungi tooltip con il nome della zona
          polygon.bindTooltip(zone.name + (isEditingThisZone ? ' (In modifica)' : ''), {
            permanent: isEditingThisZone,
            direction: 'center',
            className: 'zone-tooltip'
          });

          // Se questa zona è in modifica, rendila editabile
          if (isEditingThisZone) {
            editingPolygonRef.current = polygon;
            makePolygonEditable(polygon, zone.id);
          }

          existingPolygonsRef.current.push(polygon);
        }
      });
    };

    // Esponi la funzione per terminare la modifica
    (window as any).finishPolygonEditing = finishEditing;

    displayExistingZones();

    // Variabili per il disegno del poligono
    let isDrawingPolygon = false;
    let polygonPoints: L.LatLng[] = [];
    let tempMarkers: L.Marker[] = [];
    let tempLines: L.Polyline[] = [];

    // Funzione per iniziare il disegno
    const startDrawing = () => {
      isDrawingPolygon = true;
      drawingRef.current = true;
      setIsDrawing(true);
      polygonPoints = [];
      tempMarkers = [];
      tempLines = [];
      map.getContainer().style.cursor = 'crosshair';
    };

    // Funzione per terminare il disegno
    const finishDrawing = () => {
      if (polygonPoints.length >= 3) {
        // Rimuovi i marker temporanei e le linee
        tempMarkers.forEach(marker => map.removeLayer(marker));
        tempLines.forEach(line => map.removeLayer(line));

        // Crea il poligono finale
        const polygon = L.polygon(polygonPoints, {
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.3,
          weight: 2
        }).addTo(map);

        currentPolygonRef.current = polygon;

        // Converti le coordinate per il callback
        const coordinates = polygonPoints.map(point => [point.lat, point.lng]);
        if (onPolygonCreated) {
          onPolygonCreated(coordinates);
        }
      } else {
        // Rimuovi i marker se non ci sono abbastanza punti
        tempMarkers.forEach(marker => map.removeLayer(marker));
        tempLines.forEach(line => map.removeLayer(line));
      }

      // Reset dello stato
      isDrawingPolygon = false;
      drawingRef.current = false;
      setIsDrawing(false);
      polygonPoints = [];
      tempMarkers = [];
      tempLines = [];
      map.getContainer().style.cursor = '';
    };

    // Event listener per i click sulla mappa
    const onMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawingPolygon) return;

      const { lat, lng } = e.latlng;
      polygonPoints.push(e.latlng);

      // Aggiungi un marker per il punto
      const marker = L.marker([lat, lng]).addTo(map);
      tempMarkers.push(marker);

      // Se ci sono almeno 2 punti, disegna una linea
      if (polygonPoints.length > 1) {
        const line = L.polyline([
          polygonPoints[polygonPoints.length - 2],
          polygonPoints[polygonPoints.length - 1]
        ], { color: '#3B82F6', weight: 2 }).addTo(map);
        tempLines.push(line);
      }
    };

    // Event listener per il doppio click (termina il disegno)
    const onMapDoubleClick = (e: L.LeafletMouseEvent) => {
      if (isDrawingPolygon) {
        e.originalEvent.preventDefault();
        finishDrawing();
      }
    };

    // Event listener per il tasto Escape
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawingPolygon) {
        // Cancella il disegno corrente
        tempMarkers.forEach(marker => map.removeLayer(marker));
        tempLines.forEach(line => map.removeLayer(line));
        finishDrawing();
      }
    };

    // Aggiungi gli event listeners
    map.on('click', onMapClick);
    map.on('dblclick', onMapDoubleClick);
    document.addEventListener('keydown', onKeyDown);

    // Esponi la funzione per iniziare il disegno
    (window as any).startPolygonDrawing = startDrawing;
    (window as any).clearCurrentPolygon = () => {
      if (currentPolygonRef.current) {
        map.removeLayer(currentPolygonRef.current);
        currentPolygonRef.current = null;
      }
    };

    // Cleanup
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      map.remove();
      delete (window as any).startPolygonDrawing;
      delete (window as any).clearCurrentPolygon;
      delete (window as any).finishPolygonEditing;
    };
  }, [center, zoom, onPolygonCreated, existingZones]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }} 
        className="rounded-lg border"
      />
      {isDrawing && (
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border z-[1000]">
          <p className="text-sm font-medium text-gray-700 mb-2">Disegno Poligono</p>
          <p className="text-xs text-gray-500 mb-2">Clicca per aggiungere punti</p>
          <p className="text-xs text-gray-500 mb-3">Doppio click per terminare</p>
          <button 
            onClick={() => {
              if ((window as any).clearCurrentPolygon) {
                (window as any).clearCurrentPolygon();
              }
              setIsDrawing(false);
              drawingRef.current = false;
            }}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
          >
            Annulla (ESC)
          </button>
        </div>
      )}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => {
            if ((window as any).startPolygonDrawing && !isDrawing) {
              (window as any).startPolygonDrawing();
            }
          }}
          disabled={isDrawing}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDrawing ? 'Disegno in corso...' : 'Disegna Zona'}
        </button>
      </div>
    </div>
  );
};

export default LeafletMap;