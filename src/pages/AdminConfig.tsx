import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, RotateCcw, Settings, CreditCard, Wallet, CheckCircle, AlertCircle, Building, Truck, Lock, Eye, EyeOff } from 'lucide-react';
import { configService, PaymentConfig } from '@/services/configService';
import { useToast } from '@/hooks/use-toast';

const ADMIN_PASSWORD = 'ImperatoreBev26';

const AdminConfig: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<PaymentConfig>(configService.getConfig());
  const [paypalConfig, setPaypalConfig] = useState(configService.getPayPalConfig());
  const [stripeConfig, setStripeConfig] = useState(configService.getStripeConfig());

  const [bacsConfig, setBacsConfig] = useState(configService.getBACSConfig());
  const [codConfig, setCodConfig] = useState(configService.getCODConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const currentConfig = configService.getConfig();
    setConfig(currentConfig);
  }, []);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="mt-6 text-2xl font-bold text-gray-900">
                Area Amministrativa
              </CardTitle>
              <CardDescription>
                Inserisci la password per accedere alla configurazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                   <Label htmlFor="password">Password</Label>
                   <div className="relative mt-1">
                     <Input
                       id="password"
                       type={showPassword ? "text" : "password"}
                       value={passwordInput}
                       onChange={(e) => setPasswordInput(e.target.value)}
                       placeholder="Inserisci la password"
                       className="pr-10"
                       required
                     />
                     <Button
                       type="button"
                       variant="ghost"
                       size="sm"
                       className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                       onClick={() => setShowPassword(!showPassword)}
                     >
                       {showPassword ? (
                         <EyeOff className="h-4 w-4 text-gray-400" />
                       ) : (
                         <Eye className="h-4 w-4 text-gray-400" />
                       )}
                     </Button>
                   </div>
                 </div>
                <Button type="submit" className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  Accedi
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handlePayPalChange = (field: keyof PaymentConfig['paypal'], value: string) => {
    const newConfig = {
      ...config,
      paypal: {
        ...config.paypal,
        [field]: value
      }
    };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleStripeChange = (field: keyof PaymentConfig['stripe'], value: string) => {
    const newConfig = {
      ...config,
      stripe: {
        ...config.stripe,
        [field]: value
      }
    };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      configService.updateConfig(config);
      setHasChanges(false);
      toast({
        title: "Configurazione salvata",
        description: "Le impostazioni di pagamento sono state aggiornate con successo.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePayPal = () => {
    try {
      configService.updatePayPalConfig(paypalConfig);
      toast({
        title: "Successo",
        description: "Configurazione PayPal salvata con successo!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel salvare la configurazione PayPal",
        variant: "destructive"
      });
    }
  };

  const handleSaveStripe = () => {
    try {
      configService.updateStripeConfig(stripeConfig);
      toast({
        title: "Successo",
        description: "Configurazione Stripe salvata con successo!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel salvare la configurazione Stripe",
        variant: "destructive"
      });
    }
  };

  const handleSaveSatispay = () => {
    try {
      configService.updateSatispayConfig(satispayConfig);
      toast({
        title: "Successo",
        description: "Configurazione Satispay salvata con successo!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel salvare la configurazione Satispay",
        variant: "destructive"
      });
    }
  };

  const handleSaveBACS = () => {
    try {
      configService.updateBACSConfig(bacsConfig);
      toast({
        title: "Successo",
        description: "Configurazione Bonifico Bancario salvata con successo!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel salvare la configurazione Bonifico Bancario",
        variant: "destructive"
      });
    }
  };

  const handleSaveCOD = () => {
    try {
      configService.updateCODConfig(codConfig);
      toast({
        title: "Successo",
        description: "Configurazione Contrassegno salvata con successo!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel salvare la configurazione Contrassegno",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    configService.resetToDefaults();
    const defaultConfig = configService.getConfig();
    setConfig(defaultConfig);
    setHasChanges(false);
    toast({
      title: "Configurazione ripristinata",
      description: "Le impostazioni sono state ripristinate ai valori predefiniti.",
      variant: "default"
    });
  };

  const isPayPalConfigured = config.paypal.clientId !== 'pk_test_placeholder' && config.paypal.clientId.length > 10;
  const isStripeConfigured = stripeConfig.publishableKey !== 'pk_test_placeholder' && stripeConfig.publishableKey.length > 10;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Configurazione Pagamenti</h1>
        </div>
        <p className="text-muted-foreground">
          Gestisci le configurazioni di PayPal e Stripe per i pagamenti del tuo e-commerce.
        </p>
      </div>

      {hasChanges && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Hai modifiche non salvate. Ricordati di salvare le configurazioni prima di uscire.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">PayPal</h3>
                <div className="flex items-center gap-2 mt-1">
                  {isPayPalConfigured ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="secondary" className="text-xs">Configurato</Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <Badge variant="outline" className="text-xs">Non configurato</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold">Stripe</h3>
                <div className="flex items-center gap-2 mt-1">
                  {isStripeConfigured ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="secondary" className="text-xs">Configurato</Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <Badge variant="outline" className="text-xs">Non configurato</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-gray-600" />
              <div>
                <h3 className="font-semibold">Stato</h3>
                <div className="flex items-center gap-2 mt-1">
                  {hasChanges ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <Badge variant="outline" className="text-xs">Modifiche pending</Badge>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="secondary" className="text-xs">Sincronizzato</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="paypal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="paypal" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            PayPal
          </TabsTrigger>
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="satispay" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Satispay
          </TabsTrigger>
          <TabsTrigger value="bacs" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Bonifico
          </TabsTrigger>
          <TabsTrigger value="cod" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Contrassegno
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paypal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                Configurazione PayPal
              </CardTitle>
              <CardDescription>
                Configura le credenziali PayPal per abilitare i pagamenti tramite PayPal nel tuo store.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="paypal-client-id">Client ID PayPal</Label>
                <Input
                  id="paypal-client-id"
                  type="text"
                  placeholder="Inserisci il Client ID di PayPal"
                  value={config.paypal.clientId}
                  onChange={(e) => handlePayPalChange('clientId', e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Puoi trovare il Client ID nel tuo dashboard PayPal Developer.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paypal-environment">Ambiente</Label>
                <Select
                  value={config.paypal.environment}
                  onValueChange={(value: 'sandbox' | 'production') => handlePayPalChange('environment', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">TEST</Badge>
                        Sandbox (Test)
                      </div>
                    </SelectItem>
                    <SelectItem value="production">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">LIVE</Badge>
                        Production (Live)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Usa Sandbox per i test e Production per i pagamenti reali.
                </p>
              </div>

              {config.paypal.environment === 'production' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Attenzione:</strong> Stai utilizzando l'ambiente di produzione. 
                    Assicurati che le credenziali siano corrette prima di salvare.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Configurazione Stripe
              </CardTitle>
              <CardDescription>
                Configura le credenziali Stripe per abilitare i pagamenti con carta di credito.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="stripe-publishable-key">Publishable Key</Label>
                <Input
                  id="stripe-publishable-key"
                  type="text"
                  placeholder="pk_test_... o pk_live_..."
                  value={stripeConfig.publishableKey}
                  onChange={(e) => setStripeConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  La Publishable Key è sicura da utilizzare nel frontend.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripe-environment">Ambiente</Label>
                <Select
                  value={stripeConfig.environment}
                  onValueChange={(value: 'test' | 'live') => setStripeConfig(prev => ({ ...prev, environment: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">TEST</Badge>
                        Test Mode
                      </div>
                    </SelectItem>
                    <SelectItem value="live">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">LIVE</Badge>
                        Live Mode
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Usa Test Mode per i test e Live Mode per i pagamenti reali.
                </p>
              </div>

              {stripeConfig.environment === 'live' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Attenzione:</strong> Stai utilizzando l'ambiente live. 
                    I pagamenti saranno reali. Verifica le credenziali prima di salvare.
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleSaveStripe} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salva Configurazione Stripe
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satispay">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Configurazione Satispay
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="satispay-enabled">Abilita Satispay</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="satispay-enabled"
                    type="checkbox"
                    checked={satispayConfig.enabled}
                    onChange={(e) => setSatispayConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="satispay-enabled" className="text-sm font-normal">
                    Abilita pagamenti Satispay
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                 <Label htmlFor="satispay-key-id">Key ID Satispay</Label>
                 <Input
                   id="satispay-key-id"
                   placeholder="Inserisci il tuo Key ID Satispay"
                   value={satispayConfig.keyId || ''}
                   onChange={(e) => setSatispayConfig(prev => ({ ...prev, keyId: e.target.value }))}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="satispay-private-key">Chiave Privata</Label>
                 <textarea
                   id="satispay-private-key"
                   placeholder="Inserisci la tua chiave privata Satispay"
                   value={satispayConfig.privateKey || ''}
                   onChange={(e) => setSatispayConfig(prev => ({ ...prev, privateKey: e.target.value }))}
                   className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="satispay-public-key">Chiave Pubblica</Label>
                 <textarea
                   id="satispay-public-key"
                   placeholder="Inserisci la tua chiave pubblica Satispay"
                   value={satispayConfig.publicKey || ''}
                   onChange={(e) => setSatispayConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                   className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                 />
               </div>
              <div className="space-y-2">
                <Label htmlFor="satispay-environment">Ambiente</Label>
                <select
                  id="satispay-environment"
                  value={satispayConfig.environment}
                  onChange={(e) => setSatispayConfig(prev => ({ ...prev, environment: e.target.value as 'sandbox' | 'production' }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="sandbox">Sandbox (Test)</option>
                  <option value="production">Produzione</option>
                </select>
              </div>
              <Button onClick={handleSaveSatispay} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salva Configurazione Satispay
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bacs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Configurazione Bonifico Bancario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bacs-enabled">Abilita Bonifico Bancario</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="bacs-enabled"
                    type="checkbox"
                    checked={bacsConfig.enabled}
                    onChange={(e) => setBacsConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="bacs-enabled" className="text-sm font-normal">
                    Abilita pagamenti con bonifico bancario
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bacs-account-name">Nome del Conto</Label>
                <Input
                  id="bacs-account-name"
                  placeholder="Nome del beneficiario"
                  value={bacsConfig.accountName}
                  onChange={(e) => setBacsConfig(prev => ({ ...prev, accountName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bacs-iban">IBAN</Label>
                <Input
                  id="bacs-iban"
                  placeholder="IT60 X054 2811 1010 0000 0123 456"
                  value={bacsConfig.iban}
                  onChange={(e) => setBacsConfig(prev => ({ ...prev, iban: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bacs-bank-name">Nome della Banca</Label>
                <Input
                  id="bacs-bank-name"
                  placeholder="Nome della banca"
                  value={bacsConfig.bankName}
                  onChange={(e) => setBacsConfig(prev => ({ ...prev, bankName: e.target.value }))}
                />
              </div>
              <Button onClick={handleSaveBACS} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salva Configurazione Bonifico
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cod">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Configurazione Contrassegno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cod-enabled">Abilita Contrassegno</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="cod-enabled"
                    type="checkbox"
                    checked={codConfig.enabled}
                    onChange={(e) => setCodConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="cod-enabled" className="text-sm font-normal">
                    Abilita pagamento alla consegna
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                 <Label htmlFor="cod-fee-amount">Commissione Contrassegno (€)</Label>
                 <Input
                   id="cod-fee-amount"
                   type="number"
                   step="0.01"
                   min="0"
                   placeholder="0.00"
                   value={codConfig.feeAmount}
                   onChange={(e) => setCodConfig(prev => ({ ...prev, feeAmount: parseFloat(e.target.value) || 0 }))}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="cod-fee-type">Tipo Commissione</Label>
                 <select
                   id="cod-fee-type"
                   value={codConfig.feeType}
                   onChange={(e) => setCodConfig(prev => ({ ...prev, feeType: e.target.value as 'fixed' | 'percentage' }))}
                   className="w-full p-2 border border-gray-300 rounded-md"
                 >
                   <option value="fixed">Importo Fisso</option>
                   <option value="percentage">Percentuale</option>
                 </select>
               </div>
              <div className="space-y-2">
                <Label htmlFor="cod-instructions">Istruzioni per il Cliente</Label>
                <textarea
                  id="cod-instructions"
                  placeholder="Istruzioni per il pagamento alla consegna..."
                  value={codConfig.instructions}
                  onChange={(e) => setCodConfig(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                />
              </div>
              <Button onClick={handleSaveCOD} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salva Configurazione Contrassegno
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Ripristina Default
        </Button>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Salvando...' : 'Salva Configurazione'}
        </Button>
      </div>
    </div>
  );
};

export default AdminConfig;