// PayPal Orders API - Vercel Serverless Function 
import { Client, Environment } from '@paypal/paypal-server-sdk'; 

// Configurazione CORS 
const corsHeaders = { 
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 
  'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
}; 

// Inizializzazione client PayPal 
const initializePayPalClient = () => { 
  const client = new Client({ 
    clientCredentialsAuthCredentials: { 
      oAuthClientId: process.env.PAYPAL_CLIENT_ID, 
      oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET, 
    }, 
    timeout: 0, 
    environment: process.env.PAYPAL_ENVIRONMENT === 'production' 
      ? Environment.Production 
      : Environment.Sandbox, 
  }); 
  
  return client; 
}; 

export default async (req, res) => { 
  // Gestione preflight CORS 
  if (req.method === 'OPTIONS') { 
    return res.status(200).json({}); 
  } 

  // Solo metodo POST consentito 
  if (req.method !== 'POST') { 
    return res.status(405).json({ 
      error: 'Method not allowed', 
      message: 'Only POST method is allowed' 
    }); 
  } 

  try { 
    // Validazione variabili ambiente 
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) { 
      throw new Error('PayPal credentials not configured'); 
    } 

    const { cart } = req.body; 

    // Validazione dati carrello 
    if (!cart || !Array.isArray(cart) || cart.length === 0) { 
      return res.status(400).json({ 
        error: 'Invalid cart data', 
        message: 'Cart must be a non-empty array' 
      }); 
    } 

    // Calcolo totale carrello 
    const total = cart.reduce((sum, item) => { 
      const price = parseFloat(item.price) || 0; 
      const quantity = parseInt(item.quantity) || 0; 
      return sum + (price * quantity); 
    }, 0); 

    if (total <= 0) { 
      return res.status(400).json({ 
        error: 'Invalid cart total', 
        message: 'Cart total must be greater than 0' 
      }); 
    } 

    // Inizializzazione client PayPal 
    const paypalClient = initializePayPalClient(); 
    const ordersController = paypalClient.ordersController; 

    // Creazione ordine PayPal 
    const request = { 
      body: { 
        intent: 'CAPTURE', 
        purchaseUnits: [ 
          { 
            amount: { 
              currencyCode: 'EUR', 
              value: total.toFixed(2), 
            }, 
            description: `Ordine Imperatore Bevande - ${cart.length} prodotti`, 
            items: cart.map(item => ({ 
              name: item.name || 'Prodotto', 
              quantity: (parseInt(item.quantity) || 1).toString(), 
              unitAmount: { 
                currencyCode: 'EUR', 
                value: (parseFloat(item.price) || 0).toFixed(2), 
              }, 
            })), 
          }, 
        ], 
        applicationContext: { 
          returnUrl: `${req.headers.origin || 'http://localhost:8080'}/order-success`, 
          cancelUrl: `${req.headers.origin || 'http://localhost:8080'}/checkout`, 
          brandName: 'Imperatore Bevande', 
          landingPage: 'NO_PREFERENCE', 
          userAction: 'PAY_NOW', 
        }, 
      }, 
    }; 

    const response = await ordersController.ordersCreate(request); 

    if (response.statusCode !== 201) { 
      throw new Error(`PayPal API Error: ${response.statusCode}`); 
    } 

    // Risposta con headers CORS 
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); 

    return res.status(201).json({ 
      id: response.result.id, 
      status: response.result.status, 
      links: response.result.links, 
    }); 

  } catch (error) { 
    console.error('PayPal Order Creation Error:', error); 

    // Risposta errore con headers CORS 
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); 

    return res.status(500).json({ 
      error: 'Order creation failed', 
      message: error.message || 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined, 
    }); 
  } 
};