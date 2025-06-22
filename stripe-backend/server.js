const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors({
  origin: 'http://localhost:8080', // URL del tuo frontend
  credentials: true
}));
app.use(express.json());

// Endpoint per creare Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur', metadata = {} } = req.body;

    // Validazione
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Importo non valido' });
    }

    // Crea il Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe usa i centesimi
      currency: currency.toLowerCase(),
      metadata: {
        ...metadata,
        source: 'imperatore-bevande-shop'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Errore creazione Payment Intent:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      message: error.message 
    });
  }
});

// Endpoint per confermare il pagamento (opzionale)
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { payment_intent_id } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    res.json({
      status: paymentIntent.status,
      payment_intent: paymentIntent
    });

  } catch (error) {
    console.error('Errore conferma pagamento:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      message: error.message 
    });
  }
});

// Webhook per gestire eventi Stripe (opzionale ma raccomandato)
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gestisci l'evento
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Pagamento riuscito:', paymentIntent.id);
      // Qui puoi aggiornare il tuo database, inviare email, ecc.
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Pagamento fallito:', failedPayment.id);
      break;
    default:
      console.log(`Evento non gestito: ${event.type}`);
  }

  res.json({received: true});
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
});