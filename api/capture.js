// PayPal Capture API - Vercel Serverless Function 
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

    // Estrazione orderID dalla query string o dal body 
    const orderID = req.query.orderID || req.body.orderID; 

    // Validazione orderID 
    if (!orderID) { 
      return res.status(400).json({ 
        error: 'Missing orderID', 
        message: 'OrderID is required in query parameters or request body' 
      }); 
    } 

    // Validazione formato orderID (PayPal order IDs sono alfanumerici) 
    if (!/^[A-Z0-9]+$/.test(orderID)) { 
      return res.status(400).json({ 
        error: 'Invalid orderID format', 
        message: 'OrderID must contain only uppercase letters and numbers' 
      }); 
    } 

    // Inizializzazione client PayPal 
    const paypalClient = initializePayPalClient(); 
    const ordersController = paypalClient.ordersController; 

    // Cattura dell'ordine PayPal 
    const request = { 
      id: orderID, 
      body: {}, 
    }; 

    const response = await ordersController.ordersCapture(request); 

    if (response.statusCode !== 201) { 
      throw new Error(`PayPal Capture Error: ${response.statusCode} - ${response.result?.message || 'Unknown error'}`); 
    } 

    // Verifica stato della cattura 
    const captureResult = response.result; 
    const captureStatus = captureResult.status; 

    if (captureStatus !== 'COMPLETED') { 
      return res.status(400).json({ 
        error: 'Capture not completed', 
        message: `Order capture status: ${captureStatus}`, 
        orderID: orderID, 
        status: captureStatus, 
      }); 
    } 

    // Risposta con headers CORS 
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); 

    return res.status(200).json({ 
      orderID: orderID, 
      status: captureStatus, 
      captureID: captureResult.purchaseUnits?.[0]?.payments?.captures?.[0]?.id, 
      amount: captureResult.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount, 
      createTime: captureResult.createTime, 
      updateTime: captureResult.updateTime, 
      payer: { 
        email: captureResult.payer?.emailAddress, 
        payerID: captureResult.payer?.payerId, 
        name: captureResult.payer?.name, 
      }, 
    }); 

  } catch (error) { 
    console.error('PayPal Capture Error:', error); 

    // Risposta errore con headers CORS 
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); 

    // Gestione errori specifici PayPal 
    if (error.message?.includes('RESOURCE_NOT_FOUND')) { 
      return res.status(404).json({ 
        error: 'Order not found', 
        message: 'The specified order ID was not found', 
        orderID: req.query.orderID || req.body.orderID, 
      }); 
    } 

    if (error.message?.includes('ORDER_NOT_APPROVED')) { 
      return res.status(400).json({ 
        error: 'Order not approved', 
        message: 'The order has not been approved by the payer', 
        orderID: req.query.orderID || req.body.orderID, 
      }); 
    } 

    return res.status(500).json({ 
      error: 'Capture failed', 
      message: error.message || 'Internal server error', 
      orderID: req.query.orderID || req.body.orderID, 
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined, 
    }); 
  } 
};