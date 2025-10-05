import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { configService } from '@/services/configService';

interface StripeCheckoutProps {
  amount: number;
  currency: string;
  customerId?: string;
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
  onSuccess: (paymentIntent: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

// Configurazione dello stile per CardElement
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

// Componente interno per il form di pagamento
const CheckoutForm: React.FC<StripeCheckoutProps> = ({
  amount,
  currency,
  customerId,
  billingAddress,
  onSuccess,
  onError,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe non è ancora caricato');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      console.error('CardElement non trovato');
      return;
    }

    if (!cardComplete) {
      toast({
        title: "Errore",
        description: 'Completa i dettagli della carta',
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Crea payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Converti in centesimi
          currency: currency.toLowerCase(),
          customerId,
          billingAddress
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nella creazione del payment intent');
      }

      const { client_secret } = await response.json();

      // Conferma il pagamento
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: billingAddress ? {
            name: `${billingAddress.firstName} ${billingAddress.lastName}`,
            email: billingAddress.email,
            phone: billingAddress.phone,
            address: {
              line1: billingAddress.address,
              city: billingAddress.city,
              state: billingAddress.province,
              postal_code: billingAddress.postalCode,
              country: billingAddress.country,
            },
          } : undefined,
        },
      });

      if (error) {
        console.error('Errore Stripe:', error);
        toast({
          title: "Errore",
          description: error.message || 'Errore durante il pagamento',
          variant: "destructive"
        });
        if (onError) onError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Successo",
          description: 'Pagamento completato con successo!',
        });
        onSuccess(paymentIntent);
      }
    } catch (error) {
      console.error('Errore durante il pagamento:', error);
      toast({
        title: "Errore",
        description: 'Errore durante il pagamento. Riprova.',
        variant: "destructive"
      });
      if (onError) onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Form per carta */}
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Dettagli Carta</span>
        </div>
        <div className="bg-white p-4 rounded border min-h-[50px]">
          <CardElement
            options={cardElementOptions}
            onChange={(event) => {
              console.log('CardElement onChange:', event);
              setCardComplete(event.complete);
            }}
          />
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            Annulla
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!stripe || isProcessing || !cardComplete}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Elaborazione...
            </>
          ) : (
            `Paga €${amount.toFixed(2)}`
          )}
        </Button>
      </div>
    </div>
  );
};

// Componente principale che wrappa tutto con Elements
const StripeCheckout: React.FC<StripeCheckoutProps> = (props) => {
  const stripeConfig = configService.getStripeConfig();
  
  // Inizializza Stripe con la chiave pubblica
  const stripePromise = loadStripe(stripeConfig.publishableKey);

  if (!stripeConfig.enabled) {
    return (
      <div className="text-center p-4 text-gray-500">
        I pagamenti con carta di credito non sono attualmente disponibili.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default StripeCheckout;