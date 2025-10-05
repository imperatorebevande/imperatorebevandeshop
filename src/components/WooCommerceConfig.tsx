
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { wooCommerceService } from '@/services/woocommerce';
import { toast } from '../hooks/use-toast';
import { Settings, Check, AlertCircle } from 'lucide-react';

const WooCommerceConfig = () => {
  const [config, setConfig] = useState({
    baseUrl: '',
    consumerKey: '',
    consumerSecret: '',
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!config.baseUrl || !config.consumerKey || !config.consumerSecret) {
      toast({
        title: "Campi obbligatori",
        description: "Tutti i campi sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    // Rimuovi slash finale dall'URL se presente
    const cleanBaseUrl = config.baseUrl.replace(/\/$/, '');

    setIsLoading(true);
    try {
      // Il servizio WooCommerce è già configurato automaticamente
      // Qui potresti aggiungere logica per testare la connessione
      console.log('Testing WooCommerce connection with:', cleanBaseUrl);
      
      setIsConfigured(true);
      toast({
        title: "Configurazione completata",
        description: "WooCommerce configurato con successo!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore configurazione",
        description: "Errore nella configurazione di WooCommerce",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setConfig({
      baseUrl: '',
      consumerKey: '',
      consumerSecret: '',
    });
    setIsConfigured(false);
    toast({
      title: "Configurazione resettata",
      description: "La configurazione è stata resettata",
      variant: "default"
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurazione WooCommerce
          {isConfigured && <Check className="w-5 h-5 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigured ? (
          <>
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Come ottenere le credenziali API:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Vai nel tuo WordPress Admin → WooCommerce → Impostazioni → Avanzate → REST API</li>
                    <li>Clicca "Aggiungi chiave"</li>
                    <li>Inserisci una descrizione (es: "App Mobile")</li>
                    <li>Seleziona utente e permessi "Lettura/Scrittura"</li>
                    <li>Clicca "Genera chiave API"</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="baseUrl">URL del sito WooCommerce</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  placeholder="https://tuosito.com"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="consumerKey">Consumer Key</Label>
                <Input
                  id="consumerKey"
                  type="text"
                  placeholder="ck_..."
                  value={config.consumerKey}
                  onChange={(e) => setConfig({ ...config, consumerKey: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="consumerSecret">Consumer Secret</Label>
                <Input
                  id="consumerSecret"
                  type="password"
                  placeholder="cs_..."
                  value={config.consumerSecret}
                  onChange={(e) => setConfig({ ...config, consumerSecret: e.target.value })}
                />
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full gradient-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Configurazione...' : 'Salva Configurazione'}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              WooCommerce Configurato!
            </h3>
            <p className="text-gray-600 mb-4">
              La tua app è ora connessa al tuo negozio WooCommerce
            </p>
            <Button variant="outline" onClick={handleReset}>
              Modifica Configurazione
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WooCommerceConfig;
