// Client-side API service per creare Payment Intent
export interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  success: boolean;
  client_secret?: string;
  payment_intent_id?: string;
  amount?: number;
  currency?: string;
  error?: string;
  details?: string;
  code?: string;
}

export const createPaymentIntent = async (
  data: PaymentIntentRequest
): Promise<PaymentIntentResponse> => {
  try {
    // Validazione dell'importo
    if (!data.amount || data.amount <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency || 'eur',
        metadata: {
          ...data.metadata,
          created_at: new Date().toISOString(),
        },
      }),
    });

    const result: PaymentIntentResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Payment intent creation failed');
    }

    return result;
  } catch (error: any) {
    console.error('Payment Intent API Error:', error);
    
    return {
      success: false,
      error: 'Payment intent creation failed',
      details: error.message || 'Unknown error occurred',
    };
  }
};

export default createPaymentIntent;