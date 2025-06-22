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
      // Crea il Payment Intent sul backend
      const response = await fetch('http://localhost:3001/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(parseFloat(amount) * 100), // Converti in centesimi
          currency: currency.toLowerCase(),
          metadata: {
            source: 'imperatore-bevande-checkout'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const { client_secret } = await response.json();

      // Conferma il pagamento
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Cliente Imperatore Bevande',
            },
          },
        }
      );

      if (error) {
        console.error('Errore pagamento:', error);
        toast.error('Errore nel pagamento: ' + error.message);
        onError(error);
      } else {
        console.log('Pagamento riuscito:', paymentIntent);
        toast.success('Pagamento completato con successo!');
        onSuccess(paymentIntent);
      }
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore durante il pagamento');
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