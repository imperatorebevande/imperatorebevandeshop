import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import PayPalCheckout from './PayPalCheckout';
import StripeCheckout from './StripeCheckout';
import LottieAnimation from './LottieAnimation';

import { toast } from '../hooks/use-toast';
import { wooCommerceService } from '@/services/woocommerce';
import { configService } from '@/services/configService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: {
    id: string;
    title: string;
    description: string;
    icon: string;
    animationData?: any;
  } | null;
  orderData: {
    customer_id?: number;
    billing: any;
    shipping: any;
    line_items: any[];
    total: string;
  };
  onPaymentSuccess: (order: any, paymentDetails?: any) => void;
  onPaymentError: (error: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  paymentMethod,
  orderData,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const config = configService.getConfig();
  
  // Gestione errori JavaScript globali
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Errore JavaScript globale:', event.error);
      console.error('Messaggio:', event.message);
      console.error('File:', event.filename);
      console.error('Linea:', event.lineno);
      
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il caricamento. Riprova.",
        variant: "destructive"
      });
      onPaymentError(event.error || new Error(event.message));
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Promise rejection non gestita:', event.reason);
      
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il caricamento. Riprova.",
        variant: "destructive"
      });
      onPaymentError(event.reason);
    };
    
    if (isOpen) {
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isOpen, onPaymentError]);







  const handleCodPayment = async () => {
    setIsProcessing(true);
    try {
      const wooOrder = await wooCommerceService.createOrder({
        ...orderData,
        payment_method: 'cod',
        payment_method_title: 'Pagamento in contanti o POS',
        status: 'processing'
      });

      toast({
        title: "Ordine confermato!",
        description: `Ordine #${wooOrder.number} pagamento alla consegna.`,
        variant: "default"
      });

      onPaymentSuccess(wooOrder);
      onClose();
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine COD:', error);
      toast({
        title: "Errore",
        description: "Errore nella creazione dell'ordine. Riprova.",
        variant: "destructive"
      });
      onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBacsPayment = async () => {
    setIsProcessing(true);
    try {
      const wooOrder = await wooCommerceService.createOrder({
        ...orderData,
        payment_method: 'bacs',
        payment_method_title: 'Bonifico Boncario',
        status: 'on-hold'
      });

      toast({
        title: "Ordine confermato!",
        description: `Ordine #${wooOrder.number} in attesa di bonifico.`,
        variant: "default"
      });

      onPaymentSuccess(wooOrder);
      onClose();
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine BACS:', error);
      toast({
        title: "Errore",
        description: "Errore nella creazione dell'ordine. Riprova.",
        variant: "destructive"
      });
      onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalPayment = async (paypalDetails: any) => {
    setIsProcessing(true);
    try {
      const wooOrder = await wooCommerceService.createOrder({
        ...orderData,
        payment_method: 'paypal',
        payment_method_title: 'PayPal',
        status: 'processing'
      });

      toast({
        title: "Pagamento completato!",
        description: `Ordine #${wooOrder.number} pagato con PayPal.`,
        variant: "default"
      });

      onPaymentSuccess(wooOrder, paypalDetails);
      onClose();
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine PayPal:', error);
      toast({
        title: "Errore",
        description: "Errore nella creazione dell'ordine. Riprova.",
        variant: "destructive"
      });
      onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalError = (error: any) => {
    console.error('Errore PayPal:', error);
    toast({
      title: "Errore PayPal",
      description: "Si è verificato un errore durante il pagamento PayPal.",
      variant: "destructive"
    });
    onPaymentError(error);
  };

  const handleStripePayment = async (paymentIntent: any) => {
    setIsProcessing(true);
    try {
      const wooOrder = await wooCommerceService.createOrder({
        ...orderData,
        payment_method: 'stripe',
        payment_method_title: 'Carta di Credito/Debito',
        status: 'processing'
      });

      toast({
        title: "Pagamento completato!",
        description: `Ordine #${wooOrder.number} pagato con carta di credito.`,
        variant: "default"
      });

      onPaymentSuccess(wooOrder, paymentIntent);
      onClose();
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine Stripe:', error);
      toast({
        title: "Errore",
        description: "Errore nella creazione dell'ordine. Riprova.",
        variant: "destructive"
      });
      onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeError = (error: any) => {
    console.error('Errore Stripe:', error);
    toast({
      title: "Errore Pagamento",
      description: "Si è verificato un errore durante il pagamento con carta.",
      variant: "destructive"
    });
    onPaymentError(error);
  };

  const renderPaymentContent = () => {
    if (!paymentMethod) return null;

    switch (paymentMethod.id) {
      case 'native_stripe':
        return (
          <div className="space-y-4">
            <StripeCheckout
              amount={parseFloat(orderData.total)}
              currency="EUR"
              customerId={orderData.customer_id?.toString()}
              billingAddress={{
                firstName: orderData.billing.first_name,
                lastName: orderData.billing.last_name,
                address: orderData.billing.address_1,
                city: orderData.billing.city,
                province: orderData.billing.state,
                postalCode: orderData.billing.postcode,
                country: orderData.billing.country,
                email: orderData.billing.email,
                phone: orderData.billing.phone
              }}
              onSuccess={handleStripePayment}
              onError={handleStripeError}
              onCancel={onClose}
            />
          </div>
        );

      case 'native_satispay':
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Metodo di pagamento non disponibile</p>
          </div>
        );

      case 'native_cod':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Pagamento alla Consegna</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Importo totale:</strong> €{orderData.total}</div>
                {config.cod.feeAmount > 0 && (
                  <div><strong>Commissione COD:</strong> €{config.cod.feeAmount}</div>
                )}
                <div><strong>Modalità:</strong> Contanti o POS</div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Istruzioni:</strong> {config.cod.instructions}
              </p>
            </div>
            <Button 
              onClick={handleCodPayment}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Elaborazione...</>
              ) : (
                'Conferma Ordine con Pagamento alla consegna'
              )}
            </Button>
          </div>
        );

      case 'native_bacs':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Bonifico Bancario</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Importo totale:</strong> €{orderData.total}</div>
                <div><strong>Beneficiario:</strong> {config.bacs.accountName}</div>
                <div><strong>IBAN:</strong> {config.bacs.iban}</div>
                <div><strong>Banca:</strong> {config.bacs.bankName}</div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Istruzioni:</strong> {config.bacs.instructions}
              </p>
            </div>
            <Button 
              onClick={handleBacsPayment}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Elaborazione...</>
              ) : (
                'Conferma Ordine con Bonifico'
              )}
            </Button>
          </div>
        );

      case 'native_paypal':
        return (
          <div className="space-y-4">
            <PayPalCheckout
              amount={parseFloat(orderData.total)}
              onSuccess={handlePayPalPayment}
              onError={handlePayPalError}
              disabled={isProcessing}
            />
          </div>
        );

      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Metodo di pagamento non supportato
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {paymentMethod && (
              <>
                {paymentMethod.animationData ? (
                  <LottieAnimation 
                    animationData={paymentMethod.animationData} 
                    width={32} 
                    height={32} 
                    loop={true} 
                    autoplay={true}
                  />
                ) : (
                  <span className="text-2xl">{paymentMethod.icon}</span>
                )}
                <span>{paymentMethod.title}</span>
              </>
            )}
          </DialogTitle>
          {paymentMethod && (
            <p className="text-sm text-gray-600 mt-2">
              {paymentMethod.description}
            </p>
          )}
        </DialogHeader>
        
        <div className="mt-6">
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-blue-800">Elaborazione pagamento in corso...</span>
              </div>
            </div>
          )}
          
          {renderPaymentContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;