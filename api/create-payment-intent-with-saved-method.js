import Stripe from 'stripe'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
  apiVersion: '2023-10-16', 
}); 

export default async function handler(req, res) { 
  // Gestione CORS 
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); 

  if (req.method === 'OPTIONS') { 
    return res.status(200).end(); 
  } 

  if (req.method !== 'POST') { 
    return res.status(405).json({ error: 'Method not allowed' }); 
  } 

  try { 
    const { 
      amount, 
      currency = 'eur', 
      paymentMethodId, 
      customerId, 
      billing_details, 
      confirm = true 
    } = req.body; 

    if (!amount || !paymentMethodId || !customerId) { 
      return res.status(400).json({ 
        error: 'Amount, paymentMethodId, and customerId are required' 
      }); 
    } 

    // Verifica che il payment method appartenga al customer 
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId); 
    if (paymentMethod.customer !== customerId) { 
      return res.status(403).json({ 
        error: 'Payment method does not belong to customer' 
      }); 
    } 

    // Crea il Payment Intent con il metodo di pagamento salvato 
    const paymentIntentData = { 
      amount: Math.round(amount), 
      currency: currency.toLowerCase(), 
      customer: customerId, 
      payment_method: paymentMethodId, 
      confirmation_method: 'manual', 
      confirm: confirm, 
      return_url: `${req.headers.origin || 'http://localhost:3000'}/account`, 
    }; 

    // Aggiungi billing details se forniti 
    if (billing_details) { 
      paymentIntentData.shipping = { 
        name: billing_details.name, 
        address: { 
          line1: billing_details.address?.line1, 
          city: billing_details.address?.city, 
          state: billing_details.address?.state, 
          postal_code: billing_details.address?.postal_code, 
          country: billing_details.address?.country || 'IT', 
        }, 
      }; 
    } 

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData); 

    // Se il pagamento richiede ulteriori azioni (3D Secure, etc.) 
    if (paymentIntent.status === 'requires_action') { 
      return res.status(200).json({ 
        requires_action: true, 
        payment_intent: { 
          id: paymentIntent.id, 
          client_secret: paymentIntent.client_secret, 
          status: paymentIntent.status, 
        }, 
      }); 
    } 

    // Se il pagamento è riuscito 
    if (paymentIntent.status === 'succeeded') { 
      return res.status(200).json({ 
        success: true, 
        payment_intent: { 
          id: paymentIntent.id, 
          status: paymentIntent.status, 
          amount: paymentIntent.amount, 
          currency: paymentIntent.currency, 
        }, 
      }); 
    } 

    // Altri stati 
    return res.status(200).json({ 
      payment_intent: { 
        id: paymentIntent.id, 
        client_secret: paymentIntent.client_secret, 
        status: paymentIntent.status, 
      }, 
    }); 

  } catch (error) { 
    console.error('Errore nella creazione del Payment Intent con metodo salvato:', error); 
    
    return res.status(500).json({ 
      error: 'Errore interno del server', 
      details: error.message 
    }); 
  } 
}