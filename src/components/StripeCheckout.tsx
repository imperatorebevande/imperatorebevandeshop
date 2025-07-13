import React, { useState } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Chiave pubblicabile Stripe aggiornata
const stripePromise = loadStripe('pk_test_q2T6zSXCsZgSDBoczp5ESl9I');

interface StripeCheckoutProps {
  amount: string;
  currency?: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
}

const CheckoutForm: React.FC<{
  amount: string;
  currency: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
}> = ({ amount, currency, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { authState } = useAuth(); // Aggiungi questo

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setIsProcessing(true);

    try {
      // Costruisci il nome completo dall'utente loggato
      const userName = authState.user 
        ? `${authState.user.first_name} ${authState.user.last_name}`.trim()
        : 'Cliente Imperatore Bevande';

      // Con il plugin WooCommerce Stripe, non serve il backend personalizzato
      // Semplicemente validiamo la carta e creiamo il payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: userName, // Usa il nome dell'utente loggato
          email: authState.user?.email || undefined, // Aggiungi anche l'email se disponibile
        },
      });

      if (error) {
        console.error('Errore validazione carta:', error);
        toast.error('Errore nella validazione della carta: ' + error.message);
        onError(error);
      } else {
        console.log('Metodo di pagamento creato:', paymentMethod);
        toast.success('Carta validata con successo!');
        // Il plugin WooCommerce Stripe gestirà il resto automaticamente
        onSuccess(paymentMethod);
      }
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore durante la validazione della carta');
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg">
        <CardElement
          options={{
            hidePostalCode: true, // Aggiunge questa opzione per nascondere il CAP
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Elaborazione...
          </>
        ) : (
          `Paga €${amount}`
        )}
      </button>
    </form>
  );
};

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  amount,
  currency = 'EUR',
  onSuccess,
  onError
}) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

export default StripeCheckout;