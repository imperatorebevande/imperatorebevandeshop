import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { wooCommerceService } from '@/services/woocommerce';

import { configService } from '@/services/configService';

interface WooCommercePaymentGatewayProps {
  gateway: {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
    method_title: string;
    method_description: string;
    settings?: any;
  };
  orderData: {
    customer_id?: number;
    billing: any;
    shipping: any;
    line_items: any[];
    payment_method: string;
    payment_method_title: string;
    status?: string;
    total: string;
  };
  onSuccess: (order: any, paymentDetails?: any) => void;
  onError: (error: any) => void;
  disabled?: boolean;
}

const WooCommercePaymentGateway: React.FC<WooCommercePaymentGatewayProps> = ({
  gateway,
  orderData,
  onSuccess,
  onError,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [bacsConfig, setBacsConfig] = useState(configService.getBACSConfig());
  const [codConfig, setCodConfig] = useState(configService.getCODConfig());


  useEffect(() => {
    // Ascolta i cambiamenti nella configurazione
    const handleStorageChange = () => {
      setBacsConfig(configService.getBACSConfig());
      setCodConfig(configService.getCODConfig());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handlePayment = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    
    try {
      // Per metodi offline (bonifico, contanti), è corretto creare l'ordine immediatamente
      // ma con lo status appropriato
      let orderStatus = 'pending';
      let orderTitle = gateway.title;
      
      if (gateway.id === 'cod') {
        orderStatus = 'processing'; // Contanti alla consegna: in elaborazione
        orderTitle = 'Pagamento in contanti o POS alla consegna';
      } else if (gateway.id === 'bacs') {
        orderStatus = 'on-hold'; // Bonifico: in attesa del pagamento
        orderTitle = 'Bonifico bancario';
      }
      
      const order = await wooCommerceService.createOrder({
        ...orderData,
        payment_method: gateway.id,
        payment_method_title: orderTitle,
        status: orderStatus
      });

      console.log('Ordine creato:', order);

      toast({
        title: "Ordine confermato!",
        description: gateway.id === 'cod' 
          ? 'Ordine confermato! Pagamento alla consegna.'
          : gateway.id === 'bacs'
          ? 'Ordine confermato! Procedi con il bonifico bancario.'
          : `Ordine confermato con ${gateway.title}!`,
        variant: "default"
      });

      onSuccess(order, { method: gateway.id, order_id: order.id });
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine:', error);
      onError(error);
      toast({
        title: "Errore nell'ordine",
        description: "Errore nella creazione dell'ordine",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };



  const getGatewayIcon = (gatewayId: string) => {
    switch (gatewayId) {
      case 'cod':
        return '💶';
      case 'bacs':
        return '🏦';
      case 'paypal':
        return '💙';
      default:
        return '💳';
    }
  };

  const getGatewayDescription = (gatewayId: string) => {
    switch (gatewayId) {
      case 'cod':
        return 'Paga in contanti o con carta alla consegna.';
      case 'bacs':
        return 'Effettua un bonifico bancario.';
      case 'paypal':
        return 'Paga in modo sicuro con il tuo account PayPal.';
      default:
        return gateway.description || gateway.method_description;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getGatewayIcon(gateway.id)}</span>
            <div>
              <h3 className="font-semibold text-lg">{gateway.title}</h3>
              <p className="text-sm text-gray-600">
                {getGatewayDescription(gateway.id)}
              </p>
            </div>
          </div>
        </div>



        {gateway.id === 'satispay' ? (
          <div className="mt-4 text-center py-8">
            <p className="text-gray-500">Metodo di pagamento non disponibile</p>
          </div>
        ) : gateway.id === 'bacs' ? (
          <div className="mt-4">
            {!bacsConfig.enabled ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    Bonifico bancario non disponibile
                  </span>
                </div>
                <p className="text-sm text-red-600 mt-2">
                  Il bonifico bancario non è attualmente abilitato. Contatta l'amministratore.
                </p>
              </div>
            ) : !bacsConfig.accountName || !bacsConfig.iban ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-700">
                    Configurazione incompleta
                  </span>
                </div>
                <p className="text-sm text-yellow-600 mt-2">
                  I dati bancari non sono configurati correttamente. Contatta l'amministratore.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Dati per il bonifico:</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Beneficiario:</strong> {bacsConfig.accountName}</div>
                    <div><strong>IBAN:</strong> {bacsConfig.iban}</div>
                    {bacsConfig.bankName && <div><strong>Banca:</strong> {bacsConfig.bankName}</div>}
                  </div>
                </div>
                <Button
                  onClick={handlePayment}
                  disabled={disabled || isProcessing}
                  className="w-full gradient-primary"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Elaborazione...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Conferma Ordine (Bonifico)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : gateway.id === 'cod' ? (
          <div className="mt-4">
            {!codConfig.enabled ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    Pagamento in contanti o POS alla consegna non disponibile
                  </span>
                </div>
                <p className="text-sm text-red-600 mt-2">
                  Il pagamento in contanti o POS alla consegna non è attualmente abilitato. Contatta l'amministratore.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {codConfig.feeAmount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Commissione pagamento alla consegna:</strong> {codConfig.feeType === 'percentage' ? `${codConfig.feeAmount}%` : `€${codConfig.feeAmount.toFixed(2)}`}
                    </p>
                  </div>
                )}
                {codConfig.instructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">{codConfig.instructions}</p>
                  </div>
                )}
                <Button
                  onClick={handlePayment}
                  disabled={disabled || isProcessing}
                  className="w-full gradient-primary"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Elaborazione...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Conferma Ordine (Pagamento alla consegna)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button
            onClick={handlePayment}
            disabled={disabled || isProcessing}
            className="w-full gradient-primary"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Elaborazione...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Paga con {gateway.title}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default WooCommercePaymentGateway;