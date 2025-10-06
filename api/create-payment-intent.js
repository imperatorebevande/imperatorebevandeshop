import Stripe from 'stripe'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 

export default async function handler(req, res) { 
  // Gestione CORS 
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); 

  // Gestione preflight OPTIONS request 
  if (req.method === 'OPTIONS') { 
    return res.status(200).end(); 
  } 

  if (req.method !== 'POST') { 
    return res.status(405).json({ error: 'Method not allowed' }); 
  } 

  try { 
    const { amount, currency = 'eur', billing_details } = req.body; 

    if (!amount || amount < 50) { // Minimo 0.50 EUR 
      return res.status(400).json({ error: 'Importo non valido' }); 
    } 

    // Crea il Payment Intent 
    const paymentIntent = await stripe.paymentIntents.create({ 
      amount: Math.round(amount), // Stripe usa i centesimi 
      currency: currency.toLowerCase(), 
      automatic_payment_methods: { 
        enabled: true, 
      }, 
      metadata: { 
        integration_check: 'accept_a_payment', 
        source: 'imperatore_bevande_shop', 
      }, 
      ...(billing_details && { 
        shipping: { 
          name: billing_details.name, 
          address: billing_details.address, 
        }, 
      }), 
    }); 

    res.status(200).json({ 
      client_secret: paymentIntent.client_secret, 
      payment_intent_id: paymentIntent.id, 
    }); 
  } catch (error) { 
    console.error('Errore creazione Payment Intent:', error); 
    res.status(500).json({ 
      error: 'Errore interno del server', 
      message: error.message 
    }); 
  } 
}