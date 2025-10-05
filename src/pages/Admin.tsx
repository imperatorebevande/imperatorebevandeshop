import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Save, 
  RotateCcw, 
  Settings, 
  CreditCard, 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Building, 
  Truck, 
  Lock, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  Download,
  Copy,
  Map,
  Edit,
  Clock,
  MapPin,
  Shield
} from 'lucide-react';
import { configService, PaymentConfig } from '@/services/configService';
import { useToast } from '@/hooks/use-toast';
import { getAllZones, DeliveryZone, saveZonesToFile } from '@/config/deliveryZones';
import LeafletMap from '@/components/LeafletMap';

const ADMIN_PASSWORD = 'ImperatoreBev26';

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

const Admin: React.FC = () => {
  // Stato per l'autenticazione
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Stati per la configurazione dei pagamenti
  const [config, setConfig] = useState<PaymentConfig>(configService.getConfig());
  const [paypalConfig, setPaypalConfig] = useState(configService.getPayPalConfig());
  const [bacsConfig, setBacsConfig] = useState(configService.getBACSConfig());
  const [codConfig, setCodConfig] = useState(configService.getCODConfig());
  
  // Stati per la gestione delle zone
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [editingZone, setEditingZone] = useState<ZoneConfig | null>(null);
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 45.4642, lng: 9.1900 });
  const [mapZoom, setMapZoom] = useState(10);
  
  // Stati generali
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('payments');
  
  const { toast } = useToast();
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const currentConfig = configService.getConfig();
    setConfig(currentConfig);
    loadZones();
  }, []);

  const loadZones = () => {
    try {
      const allZones = getAllZones();
      setZones(allZones);
    } catch (error) {
      console.error('Errore nel caricamento delle zone:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le zone di consegna.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Accesso autorizzato",
        description: "Benvenuto nell'area amministrativa.",
      });
    } else {
      toast({
        title: "Password errata",
        description: "La password inserita non è corretta.",
        variant: "destructive",
      });
      setPasswordInput('');
    }
  };

  const handleSavePaymentConfig = async () => {
    setIsLoading(true);
    try {
      configService.updateConfig(config);
      configService.updatePayPalConfig(paypalConfig);
      configService.updateBACSConfig(bacsConfig);
      configService.updateCODConfig(codConfig);
      
      setHasChanges(false);
      toast({
        title: "Configurazione salvata",
        description: "Le impostazioni di pagamento sono state aggiornate con successo.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare la configurazione.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPaymentConfig = () => {
    const defaultConfig = configService.getConfig();
    setConfig(defaultConfig);
    setPaypalConfig(configService.getPayPalConfig());
    setBacsConfig(configService.getBACSConfig());
    setCodConfig(configService.getCODConfig());
    setHasChanges(false);
    
    toast({
      title: "Configurazione ripristinata",
      description: "Le impostazioni sono state ripristinate ai valori predefiniti.",
    });
  };

  const handleSaveZones = async () => {
    setIsLoading(true);
    try {
      await saveZonesToFile(zones);
      toast({
        title: "Zone salvate",
        description: "Le zone di consegna sono state salvate con successo.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le zone di consegna.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoneSelect = (zone: DeliveryZone) => {
    setSelectedZone(zone);
    if (zone.polygon?.center) {
      setMapCenter(zone.polygon.center);
      setMapZoom(12);
    }
  };

  const handleCreateZone = () => {
    const newZone: ZoneConfig = {
      id: `zone_${Date.now()}`,
      name: '',
      description: '',
      cities: [],
      provinces: [],
      postalCodes: [],
      color: '#3B82F6',
      timeSlotRestrictions: {
        preferredSlots: [],
        excludedSlots: []
      }
    };
    setEditingZone(newZone);
    setIsCreatingZone(true);
  };

  const handleDeleteZone = (zoneId: string) => {
    const updatedZones = zones.filter(zone => zone.id !== zoneId);
    setZones(updatedZones);
    if (selectedZone?.id === zoneId) {
      setSelectedZone(null);
    }
    toast({
      title: "Zona eliminata",
      description: "La zona di consegna è stata eliminata.",
    });
  };

  // Componente per il login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Area Amministrativa</CardTitle>
            <CardDescription>
              Inserisci la password per accedere al pannello di controllo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Inserisci la password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Accedi
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interfaccia principale admin
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pannello Amministrativo</h1>
              <p className="text-gray-600 mt-2">Gestisci pagamenti e zone di consegna</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Esci</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Gestione Pagamenti</span>
            </TabsTrigger>
            <TabsTrigger value="zones" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Gestione Zone</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Gestione Pagamenti */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Configurazione Metodi di Pagamento</span>
                </CardTitle>
                <CardDescription>
                  Configura e gestisci i metodi di pagamento disponibili nel tuo negozio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    {hasChanges && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Modifiche non salvate</span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleResetPaymentConfig}
                      disabled={isLoading}
                      className="flex items-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Ripristina</span>
                    </Button>
                    <Button
                      onClick={handleSavePaymentConfig}
                      disabled={isLoading}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isLoading ? 'Salvataggio...' : 'Salva Configurazione'}</span>
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="bacs" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bacs">Bonifico</TabsTrigger>
                    <TabsTrigger value="cod">Contrassegno</TabsTrigger>
                  </TabsList>

                  {/* Configurazione PayPal */}
                  <TabsContent value="paypal" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Wallet className="w-5 h-5 text-blue-600" />
                          <span>Configurazione PayPal</span>
                          <Badge variant={paypalConfig.clientId ? "default" : "secondary"}>
                            {paypalConfig.clientId ? "Attivo" : "Disattivo"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="paypal-enabled"
                            checked={config.paypal.clientId !== ''}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                setPaypalConfig({ ...paypalConfig, clientId: '' });
                              }
                              setHasChanges(true);
                            }}
                          />
                          <Label htmlFor="paypal-enabled">Abilita PayPal</Label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="paypal-client-id">Client ID</Label>
                            <Input
                              id="paypal-client-id"
                              value={paypalConfig.clientId}
                              onChange={(e) => {
                                setPaypalConfig({ ...paypalConfig, clientId: e.target.value });
                                setHasChanges(true);
                              }}
                              placeholder="Inserisci PayPal Client ID"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="paypal-environment">Ambiente</Label>
                            <Select
                              value={paypalConfig.environment}
                              onValueChange={(value: 'sandbox' | 'production') => {
                                setPaypalConfig({ ...paypalConfig, environment: value });
                                setHasChanges(true);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                                <SelectItem value="production">Production (Live)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="paypal-currency">Valuta</Label>
                          <Input
                              id="paypal-currency"
                              value="EUR"
                              disabled
                              placeholder="EUR"
                            />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>



                  {/* Configurazione Bonifico */}
                  <TabsContent value="bacs" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Building className="w-5 h-5 text-green-600" />
                          <span>Configurazione Bonifico Bancario</span>
                          <Badge variant={bacsConfig.enabled ? "default" : "secondary"}>
                            {bacsConfig.enabled ? "Attivo" : "Disattivo"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="bacs-enabled"
                            checked={bacsConfig.enabled}
                            onCheckedChange={(checked) => {
                              setBacsConfig({ ...bacsConfig, enabled: !!checked });
                              setHasChanges(true);
                            }}
                          />
                          <Label htmlFor="bacs-enabled">Abilita Bonifico Bancario</Label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bacs-account-name">Nome Beneficiario</Label>
                            <Input
                              id="bacs-account-name"
                              value={bacsConfig.accountName}
                              onChange={(e) => {
                                setBacsConfig({ ...bacsConfig, accountName: e.target.value });
                                setHasChanges(true);
                              }}
                              placeholder="Nome del beneficiario"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="bacs-bank-name">Nome Banca</Label>
                            <Input
                              id="bacs-bank-name"
                              value={bacsConfig.bankName}
                              onChange={(e) => {
                                setBacsConfig({ ...bacsConfig, bankName: e.target.value });
                                setHasChanges(true);
                              }}
                              placeholder="Nome della banca"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bacs-iban">IBAN</Label>
                          <Input
                            id="bacs-iban"
                            value={bacsConfig.iban}
                            onChange={(e) => {
                              setBacsConfig({ ...bacsConfig, iban: e.target.value });
                              setHasChanges(true);
                            }}
                            placeholder="IT00 X000 0000 0000 0000 0000 000"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bacs-instructions">Istruzioni</Label>
                          <Textarea
                            id="bacs-instructions"
                            value={bacsConfig.instructions}
                            onChange={(e) => {
                              setBacsConfig({ ...bacsConfig, instructions: e.target.value });
                              setHasChanges(true);
                            }}
                            placeholder="Istruzioni per il bonifico bancario"
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Configurazione Contrassegno */}
                  <TabsContent value="cod" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Truck className="w-5 h-5 text-orange-600" />
                          <span>Configurazione Contrassegno</span>
                          <Badge variant={codConfig.enabled ? "default" : "secondary"}>
                            {codConfig.enabled ? "Attivo" : "Disattivo"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="cod-enabled"
                            checked={codConfig.enabled}
                            onCheckedChange={(checked) => {
                              setCodConfig({ ...codConfig, enabled: !!checked });
                              setHasChanges(true);
                            }}
                          />
                          <Label htmlFor="cod-enabled">Abilita Contrassegno</Label>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cod-fee">Commissione (€)</Label>
                          <Input
                              id="cod-fee"
                              type="number"
                              step="0.01"
                              value={codConfig.feeAmount}
                              onChange={(e) => {
                                setCodConfig({ ...codConfig, feeAmount: parseFloat(e.target.value) || 0 });
                                setHasChanges(true);
                              }}
                              placeholder="0.00"
                            />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cod-instructions">Istruzioni</Label>
                          <Textarea
                            id="cod-instructions"
                            value={codConfig.instructions}
                            onChange={(e) => {
                              setCodConfig({ ...codConfig, instructions: e.target.value });
                              setHasChanges(true);
                            }}
                            placeholder="Istruzioni per il pagamento in contrassegno"
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Gestione Zone */}
          <TabsContent value="zones" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista Zone */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Map className="w-5 h-5" />
                        <span>Zone di Consegna</span>
                      </CardTitle>
                      <Button
                        onClick={handleCreateZone}
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nuova</span>
                      </Button>
                    </div>
                    <CardDescription>
                      Gestisci le zone di consegna disponibili
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {zones.map((zone) => (
                        <div
                          key={zone.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedZone?.id === zone.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleZoneSelect(zone)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: zone.color }}
                              />
                              <div>
                                <p className="font-medium text-sm">{zone.name}</p>
                                <p className="text-xs text-gray-500">
                                  {zone.cities?.length || 0} città
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteZone(zone.id);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {zones.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nessuna zona configurata</p>
                          <p className="text-sm">Clicca "Nuova" per iniziare</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-4">
                  <Button
                    onClick={handleSaveZones}
                    disabled={isLoading}
                    className="w-full flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isLoading ? 'Salvataggio...' : 'Salva Zone'}</span>
                  </Button>
                </div>
              </div>

              {/* Mappa */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Mappa Zone di Consegna</span>
                    </CardTitle>
                    <CardDescription>
                      Visualizza le zone di consegna sulla mappa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 rounded-lg overflow-hidden">
                      <LeafletMap
                        center={[mapCenter.lat, mapCenter.lng]}
                        zoom={mapZoom}
                        existingZones={zones.map(zone => ({
                          id: zone.id,
                          name: zone.name,
                          coordinates: zone.polygon?.coordinates || [],
                          color: zone.color || '#3b82f6'
                        }))}
                        height="384px"
                      />
                    </div>
                    
                    {selectedZone && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">{selectedZone.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{selectedZone.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Città:</p>
                            <p className="text-gray-600">
                              {selectedZone.cities?.join(', ') || 'Nessuna città'}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Province:</p>
                            <p className="text-gray-600">
                              {selectedZone.provinces?.join(', ') || 'Nessuna provincia'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;