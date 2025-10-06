// Endpoint per creare un Payment Intent di Stripe
// Questo file simula un endpoint backend per la creazione del payment intent

// In un'applicazione reale, questo dovrebbe essere un endpoint del server
// Per ora, restituiamo un mock del client_secret

const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, orderId } = req.body;
    
    // Validazione dei parametri
    if (!amount || !currency || !orderId) {
      return res.status(400).json({
        error: 'Parametri mancanti: amount, currency e orderId sono richiesti'
      });
    }

    // Mock del client_secret per testing
    // In produzione, qui dovresti usare l'SDK di Stripe per creare un vero payment intent
    const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Payment Intent creato per:', {
      amount,
      currency,
      orderId,
      client_secret: mockClientSecret
    });

    return res.status(200).json({
      client_secret: mockClientSecret,
      amount,
      currency,
      orderId
    });
    
  } catch (error) {
    console.error('Errore nella creazione del Payment Intent:', error);
    return res.status(500).json({
      error: 'Errore interno del server'
    });
  }
};

// Per compatibilità con diversi ambienti
if (typeof module !== 'undefined' && module.exports) {
  module.exports = createPaymentIntent;
} else {
  // Per ambienti browser/frontend
  window.createPaymentIntent = createPaymentIntent;
}

// Simulazione di un endpoint REST
if (typeof fetch !== 'undefined') {
  // Mock fetch per testing locale
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (url.includes('/api/create-payment-intent')) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const body = JSON.parse(options.body);
          const mockResponse = {
            client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
            amount: body.amount,
            currency: body.currency,
            orderId: body.orderId
          };
          
          resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponse)
          });
        }, 500); // Simula latenza di rete
      });
    }
    return originalFetch.apply(this, arguments);
  };
}