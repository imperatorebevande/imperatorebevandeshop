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
    // 'data-client-token': 'sandbox_token', // Prova a commentare o rimuovere questa riga
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
      <div className="paypal-container">
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onErrorHandler}
          onCancel={onCancelHandler}
        />
      </div>
    </PayPalScriptProvider>
  );
};

export default PayPalNativeCheckout;