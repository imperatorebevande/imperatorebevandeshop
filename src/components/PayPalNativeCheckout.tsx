import React, { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { toast } from 'sonner';
import { configService } from '@/services/configService';
import { Loader2 } from 'lucide-react';

interface PayPalNativeCheckoutProps {
  amount: number;
  currency: string;
  billingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    email: string;
    phone: string;
  };
  env?: string;
  onSuccess: (details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
  showCardOnly?: boolean;
}

const PayPalNativeCheckout: React.FC<PayPalNativeCheckoutProps> = ({ 
  amount, 
  currency, 
  billingAddress, 
  env = 'production',
  onSuccess, 
  onError, 
  onCancel, 
  showCardOnly = false 
}) => {
  const config = configService.getPayPalConfig();
  const [isProcessing, setIsProcessing] = useState(false);

  // Configurazione PayPal con disabilitazione delle carte di credito/debito
  const initialOptions = {
    clientId: config.clientId,
    currency: currency,
    intent: 'capture',
    'disable-funding': 'card,credit,paylater,bancontact,blik,eps,giropay,ideal,mercadopago,mybank,p24,sepa,sofort,venmo'
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="paypal-container relative">
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-700">Reindirizzamento a PayPal...</span>
            </div>
          </div>
        )}
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal'
          }}
          createOrder={(data, actions) => {
            setIsProcessing(true);
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  amount: {
                    value: amount.toFixed(2),
                    currency_code: currency
                  }
                }
              ]
            });
          }}
          onApprove={async (data, actions) => {
            try {
              if (actions.order) {
                const details = await actions.order.capture();
                toast.success('Pagamento completato con successo!');
                onSuccess(details);
              }
            } catch (error) {
              console.error('Errore durante l\'approvazione:', error);
              toast.error('Errore durante il completamento del pagamento');
              if (onError) onError(error);
            } finally {
              setIsProcessing(false);
            }
          }}
          onError={(err: any) => {
            console.error('Errore PayPal:', err);
            toast.error('Errore durante il pagamento PayPal');
            setIsProcessing(false);
            if (onError) onError(err);
          }}
          onCancel={() => {
            toast.info('Pagamento PayPal annullato');
            setIsProcessing(false);
            if (onCancel) onCancel();
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
};

export default PayPalNativeCheckout;
