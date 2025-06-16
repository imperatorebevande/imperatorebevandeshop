import React from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import PayPalNativeCheckout from './PayPalNativeCheckout';

interface PaymentSectionProps {
  paymentGatewaysLoading: boolean;
  filteredPaymentGateways: any[];
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  expandedPaymentDetails: string | null;
  setExpandedPaymentDetails: (id: string | null) => void;
  orderTotal?: string;
  onPayPalSuccess?: (details: any) => void;
  onPayPalError?: (error: any) => void;
}

// Funzioni helper per le descrizioni
const getMainDescription = (gateway: any) => {
  switch (gateway.id) {
    case 'cod':
      return 'Cash on delivery';
    case 'stripe':
      return 'Credit Card';
    case 'paypal':
      return 'PayPal';
    case 'satispay':
      return 'Satispay';
    case 'bacs':
      return 'Bank Transfer';
    default:
      return gateway.title;
  }
};

const getFullDescription = (gateway: any) => {
  switch (gateway.id) {
    case 'cod':
      return 'I nostri collaboratori durante la consegna del vostro ordine, saranno muniti di contanti o con POS per agevolarvi nel pagamento.';
    case 'paypal':
      return 'Paga facilmente e in sicurezza con il tuo account PayPal.';
    default:
      return gateway.description;
  }
};

// Funzione per ottenere l'icona appropriata
const getPaymentIcon = (gatewayId: string) => {
  switch (gatewayId) {
    case 'cod':
      return '💳';
    case 'stripe':
      return '💳';
    case 'paypal':
      return '🅿️';
    case 'satispay':
      return '📱';
    case 'bacs':
      return '🏦';
    default:
      return '💳';
  }
};

const PaymentSection: React.FC<PaymentSectionProps> = ({
  paymentGatewaysLoading,
  filteredPaymentGateways,
  paymentMethod,
  setPaymentMethod,
  expandedPaymentDetails,
  setExpandedPaymentDetails,
  orderTotal = '0',
  onPayPalSuccess,
  onPayPalError
}) => {
  if (paymentGatewaysLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Choose payment Option:
      </h3>
      
      <div className="space-y-3">
        {filteredPaymentGateways.map((gateway) => {
          const isSelected = paymentMethod === gateway.id;
          
          return (
            <div key={gateway.id} className="space-y-2">
              {/* Opzione di pagamento principale */}
              <div 
                className={`
                  flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => {
                  console.log('Payment method clicked:', gateway.id); // <-- ADD THIS LINE
                  setPaymentMethod(gateway.id);
                }}
              >
                {/* Radio Button */}
                <div className="flex items-center mr-4">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300 bg-white'
                    }
                  `}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>

                {/* Icona del metodo di pagamento */}
                <div className="flex items-center mr-3">
                  {gateway.id === 'paypal' ? (
                    <span className="text-2xl">🅿️</span>
                  ) : gateway.id === 'cod' ? (
                    <span className="text-2xl">💳</span>
                  ) : gateway.id === 'stripe' ? (
                    <span className="text-2xl">💳</span>
                  ) : (
                    <span className="text-2xl">{getPaymentIcon(gateway.id)}</span>
                  )}
                </div>

                {/* Nome del metodo di pagamento */}
                <div className="flex-1">
                  <span className="text-base font-medium text-gray-900">
                    {getMainDescription(gateway)}
                  </span>
                </div>
              </div>

              {/* Sezione espansa per PayPal */}
              {isSelected && gateway.id === 'paypal' && onPayPalSuccess && onPayPalError && (
                <div className="ml-9 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    {getFullDescription(gateway)}
                  </p>
                  <PayPalNativeCheckout
                    amount={orderTotal}
                    currency="EUR"
                    onSuccess={onPayPalSuccess}
                    onError={onPayPalError}
                  />
                </div>
              )}

              {/* Sezione espansa per altri metodi */}
              {isSelected && gateway.id !== 'paypal' && (
                <div className="ml-9 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    {getFullDescription(gateway)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentSection;