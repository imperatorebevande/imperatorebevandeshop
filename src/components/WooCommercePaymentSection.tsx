import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { configService } from '@/services/configService';

interface WooCommercePaymentSectionProps {
  onPaymentMethodSelect: (method: {
    id: string;
    title: string;
    description: string;
    icon: string;
  }) => void;
}

const WooCommercePaymentSection: React.FC<WooCommercePaymentSectionProps> = ({
  onPaymentMethodSelect
}) => {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configData = await configService.getConfig();
        setConfig(configData);
      } catch (error) {
        console.error('Errore nel caricamento della configurazione:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const getAvailablePaymentMethods = () => {
    const methods = [];

    // PayPal per primo
    if (config.paypal?.enabled) {
      methods.push({
        id: 'paypal',
        title: 'PayPal',
        description: config.paypal.instructions || 'Paga con PayPal',
        icon: 'credit-card'
      });
    }

    if (config.bacs?.enabled) {
      methods.push({
        id: 'bacs',
        title: 'Bonifico Bancario',
        description: config.bacs.description || 'Trasferimento bancario',
        icon: 'credit-card'
      });
    }

    if (config.cod?.enabled) {
      methods.push({
        id: 'cod',
        title: 'Contrassegno',
        description: config.cod.description || 'Paga alla consegna',
        icon: 'banknote'
      });
    }

    return methods;
  };

  const getIconComponent = (iconType: string) => {
    switch (iconType) {
      case 'smartphone':
        return <Smartphone className="w-5 h-5" />;
      case 'banknote':
        return <Banknote className="w-5 h-5" />;
      case 'credit-card':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Caricamento metodi di pagamento...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableMethods = getAvailablePaymentMethods();

  if (availableMethods.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <span>Nessun metodo di pagamento disponibile</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Seleziona il metodo di pagamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availableMethods.map((method) => (
              <Button
                key={method.id}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => onPaymentMethodSelect(method)}
              >
                <div className="flex items-center space-x-3">
                  {getIconComponent(method.icon)}
                  <div className="text-left">
                    <div className="font-medium">{method.title}</div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WooCommercePaymentSection;