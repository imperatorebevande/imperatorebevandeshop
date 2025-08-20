import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Plus, Trash2, Download, Copy, Map, Edit, Clock } from 'lucide-react';
import { getAllZones, DeliveryZone, saveZonesToFile } from '@/config/deliveryZones';
import LeafletMap from '@/components/LeafletMap';

// Interfacce per la gestione delle zone

interface AdminAuth {
  isAuthenticated: boolean;
  password: string;
}

interface ZoneConfig {
  id: string;
  name: string;
  description: string;
  cities: string[];
  provinces: string[];
  postalCodes: string[];
  color: string;
  polygon?: {
    coordinates: number[][][];
    center: { lat: number; lng: number };
  };
  timeSlotRestrictions?: {
    preferredSlots?: string[];
    excludedSlots?: string[];
  };
}

const ADMIN_PASSWORD = 'imperatore2024';

// Slot orari disponibili nel sistema
const AVAILABLE_TIME_SLOTS = [
  "07:00 - 08:00",
  "08:00 - 09:00", 
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00"
];

const AdminZoneManager: React.FC = () => {
  const [auth, setAuth] = useState<AdminAuth>({ isAuthenticated: false, password: '' });
  const [zones, setZones] = useState<ZoneConfig[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneConfig | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('map');

  // Carica le zone esistenti
  useEffect(() => {
    const existingZones = getAllZones();
    const convertedZones: ZoneConfig[] = existingZones.map(zone => ({
      id: zone.id,
      name: zone.name,
      description: zone.description || '',
      cities: zone.cities,
      provinces: zone.provinces,
      postalCodes: zone.postalCodes,
      color: zone.color || '#3B82F6',
      polygon: zone.polygon ? {
        coordinates: zone.polygon.coordinates,
        center: zone.polygon.center
      } : undefined,
      timeSlotRestrictions: zone.timeSlotRestrictions
    }));
    setZones(convertedZones);
  }, []);

  // Gestione creazione poligono dalla mappa
  const handlePolygonCreated = (coordinates: number[][]) => {
    const center = {
      lat: coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length,
      lng: coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length
    };

    // Converti le coordinate da lat,lng a lng,lat per GeoJSON
    const geoJsonCoordinates = coordinates.map(coord => [coord[1], coord[0]]);
    
    // IMPORTANTE: Assicurati che il poligono sia chiuso (primo e ultimo punto identici)
    if (geoJsonCoordinates.length > 0) {
      const firstPoint = geoJsonCoordinates[0];
      const lastPoint = geoJsonCoordinates[geoJsonCoordinates.length - 1];
      
      // Se il primo e ultimo punto non sono identici, aggiungi il primo punto alla fine
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        geoJsonCoordinates.push([...firstPoint]);
      }
    }

    const newZone: ZoneConfig = {
      id: `zona-${Date.now()}`,
      name: `Zona Poligono ${zones.length + 1}`,
      description: 'Servizio consegne attivo con fasce orarie disponibili',
      cities: [],
      provinces: ['BA'],
      postalCodes: [],
      color: '#3B82F6',
      polygon: {
        coordinates: [geoJsonCoordinates],
        center: center
      },
      timeSlotRestrictions: {
        preferredSlots: ['09:00-12:00', '15:00-18:00']
      }
    };

    setZones(prev => [...prev, newZone]);
    setSelectedZone(newZone);
  };

  // Gestione eliminazione zona
  const handleDeleteZone = (zoneId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa zona?')) {
      setZones(prev => prev.filter(zone => zone.id !== zoneId));
      if (selectedZone?.id === zoneId) {
        setSelectedZone(null);
      }
    }
  };

  // Gestione modifica zona
  const handleEditZone = (zone: ZoneConfig) => {
    setSelectedZone(zone);
    setActiveTab('zones');
  };

  // Gestione modifica poligono
  const handleEditPolygon = (zone: ZoneConfig) => {
    setEditingZoneId(zone.id);
    setActiveTab('map');
  };

  // Gestione salvataggio poligono modificato
  const handlePolygonEdited = (zoneId: string, coordinates: number[][]) => {
    const center = {
      lat: coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length,
      lng: coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length
    };

    // Converti le coordinate da lat,lng a lng,lat per GeoJSON
    const geoJsonCoordinates = coordinates.map(coord => [coord[1], coord[0]]);
    
    // Assicurati che il poligono sia chiuso
    if (geoJsonCoordinates.length > 0) {
      const firstPoint = geoJsonCoordinates[0];
      const lastPoint = geoJsonCoordinates[geoJsonCoordinates.length - 1];
      
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        geoJsonCoordinates.push([...firstPoint]);
      }
    }

    const updatedZones = zones.map(zone => 
       zone.id === zoneId 
         ? {
             ...zone,
             polygon: {
               coordinates: [geoJsonCoordinates],
               center: center
             }
           }
         : zone
     );
     
     setZones(updatedZones);
     
     // Salva automaticamente le modifiche al poligono
     const deliveryZones = updatedZones.map(zone => ({
       id: zone.id,
       name: zone.name,
       description: zone.description,
       cities: zone.cities,
       provinces: zone.provinces,
       postalCodes: zone.postalCodes,
       color: zone.color,
       polygon: zone.polygon,
       timeSlotRestrictions: zone.timeSlotRestrictions
     }));
     saveZonesToFile(deliveryZones);
     setSaveSuccess(true);
     setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Termina modifica poligono
  const finishPolygonEditing = () => {
    setEditingZoneId(null);
    if ((window as any).finishPolygonEditing) {
      (window as any).finishPolygonEditing();
    }
  };

  // Gestione toggle slot orario per zona
  const handleTimeSlotToggle = (timeSlot: string, isEnabled: boolean) => {
    if (!selectedZone) return;

    const updatedZone = { ...selectedZone };
    
    // Inizializza timeSlotRestrictions se non esiste
    if (!updatedZone.timeSlotRestrictions) {
      updatedZone.timeSlotRestrictions = {
        excludedSlots: [],
        preferredSlots: []
      };
    }

    // Gestisci gli slot esclusi
    const excludedSlots = updatedZone.timeSlotRestrictions.excludedSlots || [];
    
    if (isEnabled) {
      // Se abilitato, rimuovi dagli esclusi
      updatedZone.timeSlotRestrictions.excludedSlots = excludedSlots.filter(slot => slot !== timeSlot);
    } else {
      // Se disabilitato, aggiungi agli esclusi
      if (!excludedSlots.includes(timeSlot)) {
        updatedZone.timeSlotRestrictions.excludedSlots = [...excludedSlots, timeSlot];
      }
    }

    setSelectedZone(updatedZone);
  };

  // Verifica se uno slot è abilitato per la zona
  const isTimeSlotEnabled = (timeSlot: string): boolean => {
    if (!selectedZone?.timeSlotRestrictions?.excludedSlots) return true;
    return !selectedZone.timeSlotRestrictions.excludedSlots.includes(timeSlot);
  };

  // Gestione salvataggio nel file di configurazione
  const handleSaveToConfigFile = () => {
    try {
      const configCode = saveZonesToFile(zones);
      
      // Crea e scarica il file di configurazione
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(configCode);
      const exportFileDefaultName = 'deliveryZones.json';
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      alert('Errore durante il salvataggio del file di configurazione');
    }
  };







  const handleLogin = () => {
    if (auth.password === ADMIN_PASSWORD) {
      setAuth({ ...auth, isAuthenticated: true });
    } else {
      alert('Password non corretta');
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accesso Admin - Gestione Zone</CardTitle>
            <CardDescription>Inserisci la password per accedere</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={auth.password}
                onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Accedi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestione Zone di Consegna</h1>
          <p className="text-gray-600 mt-2">Configura le zone di consegna utilizzando la mappa interattiva</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Mappa
            </TabsTrigger>
            <TabsTrigger value="zones">Zone</TabsTrigger>
            <TabsTrigger value="code">Codice</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mappa Interattiva</CardTitle>
                <CardDescription>
                  {editingZoneId 
                    ? "Modalità modifica attiva: trascina i punti rossi per modificare il poligono"
                    : "Utilizza gli strumenti di disegno per creare nuove zone di consegna"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editingZoneId && (
                  <Alert className="mb-4">
                    <Map className="h-4 w-4" />
                    <AlertDescription>
                      Stai modificando il poligono della zona <strong>{zones.find(z => z.id === editingZoneId)?.name}</strong>. 
                      Trascina i punti rossi per modificare la forma. 
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="ml-2"
                        onClick={finishPolygonEditing}
                      >
                        Termina Modifica
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <LeafletMap 
                  onPolygonCreated={handlePolygonCreated}
                  onPolygonEdited={handlePolygonEdited}
                  editingZoneId={editingZoneId}
                  existingZones={zones.filter(zone => zone.polygon).map(zone => ({
                    id: zone.id,
                    name: zone.name,
                    coordinates: zone.polygon!.coordinates,
                    color: zone.color
                  }))}
                  height="400px"
                  center={[41.1171, 16.8719]}
                  zoom={11}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zone Configurate ({zones.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {zones.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nessuna zona configurata</p>
                ) : (
                  <div className="space-y-4">
                    {zones.map((zone) => (
                      <div key={zone.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{zone.name}</h3>
                            <p className="text-sm text-gray-600">{zone.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditZone(zone)}
                              title="Modifica informazioni zona"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {zone.polygon && (
                              <Button 
                                size="sm" 
                                variant={editingZoneId === zone.id ? "default" : "outline"}
                                onClick={() => editingZoneId === zone.id ? finishPolygonEditing() : handleEditPolygon(zone)}
                                title={editingZoneId === zone.id ? "Termina modifica poligono" : "Modifica poligono"}
                              >
                                <Map className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteZone(zone.id)}
                              title="Elimina zona"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedZone && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Modifica Zona: {selectedZone.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="zoneName">Nome Zona</Label>
                          <Input
                            id="zoneName"
                            value={selectedZone.name}
                            onChange={(e) => setSelectedZone({...selectedZone, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="zoneColor">Colore</Label>
                          <Input
                            id="zoneColor"
                            type="color"
                            value={selectedZone.color}
                            onChange={(e) => setSelectedZone({...selectedZone, color: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="zoneDescription">Descrizione</Label>
                        <Textarea
                          id="zoneDescription"
                          value={selectedZone.description}
                          onChange={(e) => setSelectedZone({...selectedZone, description: e.target.value})}
                        />
                      </div>
                      
                      {/* Gestione Slot Orari */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <Label className="text-base font-semibold">Fasce Orarie Disponibili</Label>
                        </div>
                        <p className="text-sm text-gray-600">
                          Seleziona le fasce orarie disponibili per questa zona di consegna
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
                          {AVAILABLE_TIME_SLOTS.map((timeSlot) => {
                            const isEnabled = isTimeSlotEnabled(timeSlot);
                            return (
                              <div key={timeSlot} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`slot-${timeSlot}`}
                                  checked={isEnabled}
                                  onCheckedChange={(checked) => handleTimeSlotToggle(timeSlot, checked as boolean)}
                                />
                                <Label 
                                  htmlFor={`slot-${timeSlot}`} 
                                  className={`text-sm cursor-pointer ${
                                    isEnabled ? 'text-gray-900' : 'text-gray-500 line-through'
                                  }`}
                                >
                                  {timeSlot}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          💡 Gli slot non selezionati non saranno disponibili per questa zona
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            setZones(prev => prev.map(zone => 
                              zone.id === selectedZone.id ? selectedZone : zone
                            ));
                            setSelectedZone(null);
                            // Salva le modifiche nel file
                            const updatedZones = zones.map(zone => 
                              zone.id === selectedZone.id ? selectedZone : zone
                            );
                            const deliveryZones = updatedZones.map(zone => ({
                              id: zone.id,
                              name: zone.name,
                              description: zone.description,
                              cities: zone.cities,
                              provinces: zone.provinces,
                              postalCodes: zone.postalCodes,
                              color: zone.color,
                              polygon: zone.polygon,
                              timeSlotRestrictions: zone.timeSlotRestrictions
                            }));
                            saveZonesToFile(deliveryZones);
                            setSaveSuccess(true);
                            setTimeout(() => setSaveSuccess(false), 3000);
                          }}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Salva Modifiche
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedZone(null)}
                        >
                          Annulla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Codice Generato</CardTitle>
                <CardDescription>
                  Codice di configurazione per le zone di consegna. Usa "Salva nel Codice" per generare il file deliveryZones.json da sostituire nella cartella config.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zones.some(zone => zone.polygon) && (
                    <Alert>
                      <AlertDescription>
                        <strong>Istruzioni:</strong> Dopo aver cliccato "Salva nel Codice", sostituisci il file <code>src/config/deliveryZones.json</code> con quello scaricato per rendere permanenti le zone create.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(zones, null, 2)}
                    </pre>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(zones, null, 2));
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copySuccess ? 'Copiato!' : 'Copia'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const dataStr = JSON.stringify(zones, null, 2);
                        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                        const exportFileDefaultName = 'zone-consegna.json';
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', exportFileDefaultName);
                        linkElement.click();
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Scarica
                    </Button>
                    <Button 
                      onClick={handleSaveToConfigFile}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saveSuccess ? 'Salvato!' : 'Salva nel Codice'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminZoneManager;