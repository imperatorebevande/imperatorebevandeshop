import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PaymentModal from './PaymentModal';
import { toast } from '../hooks/use-toast';
import { wooCommerceService } from '@/services/woocommerce';
import { configService } from '@/services/configService';

interface NativePaymentSectionProps {
  orderData: {
    customer_id?: number;
    billing: any;
    shipping: any;
    line_items: any[];
    total: string;
    meta_data?: any[];
    customer_note?: string;
  };
  onPaymentSuccess: (order: any, paymentDetails?: any) => void;
  onPaymentError: (error: any) => void;
  disabled?: boolean;
  selectedPaymentMethod?: string;
  onPaymentMethodChange?: (method: string) => void;
}

// Definizione dei metodi di pagamento nativi (base)
const BASE_NATIVE_PAYMENT_METHODS = [
  {
    id: 'native_paypal',
    title: 'PayPal',
    description: 'Paga in modo sicuro con il tuo account PayPal',
    icon: '💙'
  },
  {
    id: 'native_bacs',
    title: 'Bonifico Bancario',
    description: 'Effettua un bonifico bancario',
    icon: '🏦'
  },
  {
    id: 'native_cod',
    title: 'Pagamento in contanti o POS alla consegna',
    description: 'Paga in contanti o con carta alla consegna',
    icon: '💵'
  }
];

const NativePaymentSection: React.FC<NativePaymentSectionProps> = ({
  orderData,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  selectedPaymentMethod = '',
  onPaymentMethodChange
}) => {
  const [localSelectedPaymentMethod, setLocalSelectedPaymentMethod] = useState<string>(selectedPaymentMethod);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  
  // Stati per le configurazioni dinamiche
  const [config, setConfig] = useState(configService.getConfig());

  // Ascolta i cambiamenti nelle configurazioni
  useEffect(() => {
    const handleConfigChange = () => {
      setConfig(configService.getConfig());
    };
    
    // Polling per aggiornamenti (semplificato)
    const interval = setInterval(handleConfigChange, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Crea la lista dei metodi abilitati basata sulle configurazioni
  const enabledMethods = BASE_NATIVE_PAYMENT_METHODS.filter(method => {
    switch (method.id) {
      case 'native_paypal':
        return config.paypal.enabled; // PayPal abilitato se configurato
      case 'native_paypal_cards':
        return false; // PayPal Cards disabilitato temporaneamente per problemi di configurazione
      case 'native_bacs':
        return config.bacs.enabled;
      case 'native_cod':
        return config.cod.enabled;
      default:
        return false;
    }
  }).map(method => ({ ...method, enabled: true }));

  const handlePaymentMethodSelect = (methodId: string) => {
    setLocalSelectedPaymentMethod(methodId);
    if (onPaymentMethodChange) {
      onPaymentMethodChange(methodId);
    }
    const method = enabledMethods.find(m => m.id === methodId);
    if (method) {
      setSelectedMethod(method);
      setIsModalOpen(true);
    }
  };



  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMethod(null);
    setLocalSelectedPaymentMethod(''); // Reset della selezione quando si chiude senza pagare
    if (onPaymentMethodChange) {
      onPaymentMethodChange('');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>💳</span>
            <span>Metodo di Pagamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={localSelectedPaymentMethod}
            onValueChange={handlePaymentMethodSelect}
            disabled={disabled}
          >
            {enabledMethods.map((method) => (
              <div key={method.id} className="space-y-2">
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label htmlFor={method.id} className="flex items-center space-x-3 cursor-pointer flex-1">
                    <span className="text-xl">{method.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{method.title}</div>
                      <div className="text-sm text-gray-600">
                        {method.description}
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Modal per il pagamento */}
       <PaymentModal
         isOpen={isModalOpen}
         onClose={handleModalClose}
         paymentMethod={selectedMethod}
         orderData={orderData}
         onPaymentSuccess={onPaymentSuccess}
         onPaymentError={onPaymentError}
       />

      {/* Informazioni sui pagamenti sicuri */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Pagamenti Sicuri e Nativi</p>
              <p>
                I pagamenti sono elaborati direttamente tramite i provider ufficiali 
                (PayPal, Stripe) con crittografia SSL. I tuoi dati sono protetti 
                e non vengono mai memorizzati sui nostri server.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NativePaymentSection;