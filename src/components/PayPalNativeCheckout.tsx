import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { toast } from 'sonner';

interface PayPalNativeCheckoutProps {
  amount: string;
  currency?: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
}

const PayPalNativeCheckout: React.FC<PayPalNativeCheckoutProps> = ({
  amount,
  currency = 'EUR',
  onSuccess,
  onError,
  onCancel
}) => {
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  const initialOptions = {
    'client-id': paypalClientId,
    currency: currency,
    intent: 'capture',
    // Aggiungi opzioni per migliorare la gestione del modal
    'disable-funding': 'credit,card',
    'data-page-type': 'checkout'
  };

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount,
          },
        },
      ],
    });
  };

  const onApprove = (data: any, actions: any) => {
    return actions.order.capture().then((details: any) => {
      toast.success('Pagamento completato con successo!');
      onSuccess(details);
    });
  };

  const onErrorHandler = (err: any) => {
    console.error('PayPal Checkout onError', err);
    toast.error('Errore durante il pagamento PayPal');
    onError(err);
  };

  const onCancelHandler = () => {
    toast.info('Pagamento PayPal annullato');
    if (onCancel) onCancel();
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="paypal-container relative z-10">
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
            height: 40
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onErrorHandler}
          onCancel={onCancelHandler}
          // Aggiungi questa opzione per migliorare la gestione del modal
          forceReRender={[amount, currency]}
        />
      </div>
    </PayPalScriptProvider>
  );
};

export default PayPalNativeCheckout;