// Configurazione CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Configurazione WhatsApp
const WHATSAPP_CONFIG = {
  // WhatsApp Business API (Meta)
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  
  // Twilio WhatsApp (alternativa)
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER, // es: whatsapp:+14155238886
  
  // Numero di destinazione
  businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '393123456789'
};

/**
 * Invia messaggio tramite WhatsApp Business API (Meta)
 */
const sendViaWhatsAppBusinessAPI = async (to, message) => {
  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_CONFIG.phoneNumberId}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: {
      body: message
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`WhatsApp Business API Error: ${error.error?.message || response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Invia messaggio tramite Twilio WhatsApp API
 */
const sendViaTwilio = async (to, message) => {
  const accountSid = WHATSAPP_CONFIG.twilioAccountSid;
  const authToken = WHATSAPP_CONFIG.twilioAuthToken;
  const fromNumber = WHATSAPP_CONFIG.twilioWhatsAppNumber;
  
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const params = new URLSearchParams();
  params.append('From', fromNumber);
  params.append('To', `whatsapp:${to}`);
  params.append('Body', message);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Twilio Error: ${error.message || response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Formatta il messaggio WhatsApp
 */
const formatMessage = (formData) => {
  const { name, subject, message } = formData;
  
  return `🍺 *NUOVO CONTATTO - Imperatore Bevande*\n\n` +
    `👤 *Nome:* ${name}\n` +
    `📋 *Oggetto:* ${subject}\n\n` +
    `💬 *Messaggio:*\n${message}\n\n` +
    `---\n` +
    `📅 *Data:* ${new Date().toLocaleString('it-IT')}\n` +
    `🌐 *Fonte:* Sito Web - Form Contatti`;
};

/**
 * Valida i dati del form
 */
const validateFormData = (formData) => {
  const { name, subject, message } = formData;
  
  if (!name || !subject || !message) {
    throw new Error('Nome, oggetto e messaggio sono obbligatori');
  }
};

/**
 * Formatta il numero di telefono per WhatsApp
 */
const formatPhoneNumber = (phone) => {
  // Rimuove tutti i caratteri non numerici
  let formatted = phone.replace(/[^\d]/g, '');
  
  // Se non inizia con il prefisso internazionale, aggiungi +39 per l'Italia
  if (!formatted.startsWith('39')) {
    formatted = '39' + formatted;
  }
  
  return formatted;
};

/**
 * Handler principale
 */
module.exports = async (req, res) => {
  // Gestione CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'OK' });
  }
  
  // Imposta headers CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Metodo non consentito. Usa POST.' 
    });
  }
  
  try {
    const { formData, to } = req.body;
    
    // Validazione
    if (!formData) {
      return res.status(400).json({
        success: false,
        message: 'Dati del form mancanti'
      });
    }
    
    validateFormData(formData);
    
    // Formatta il messaggio
    const message = formatMessage(formData);
    
    // Determina il numero di destinazione
    const destinationNumber = to || formatPhoneNumber(WHATSAPP_CONFIG.businessNumber);
    
    let result;
    let method = 'URL';
    
    // Prova prima con WhatsApp Business API
    if (WHATSAPP_CONFIG.accessToken && WHATSAPP_CONFIG.phoneNumberId) {
      try {
        result = await sendViaWhatsAppBusinessAPI(destinationNumber, message);
        method = 'WhatsApp Business API';
      } catch (error) {
        console.log('WhatsApp Business API fallito, provo con Twilio:', error.message);
        
        // Fallback a Twilio
        if (WHATSAPP_CONFIG.twilioAccountSid && WHATSAPP_CONFIG.twilioAuthToken) {
          result = await sendViaTwilio(destinationNumber, message);
          method = 'Twilio';
        } else {
          throw error;
        }
      }
    } else if (WHATSAPP_CONFIG.twilioAccountSid && WHATSAPP_CONFIG.twilioAuthToken) {
      // Usa Twilio se configurato
      result = await sendViaTwilio(destinationNumber, message);
      method = 'Twilio';
    } else {
      // Nessuna API configurata, restituisci URL per apertura manuale
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${destinationNumber}?text=${encodedMessage}`;
      
      return res.status(200).json({
        success: true,
        message: 'URL WhatsApp generato con successo',
        method: 'URL',
        whatsappUrl,
        data: {
          to: destinationNumber,
          message: message
        }
      });
    }
    
    // Successo
    res.status(200).json({
      success: true,
      message: `Messaggio WhatsApp inviato con successo tramite ${method}`,
      method,
      data: result
    });
    
  } catch (error) {
    console.error('Errore invio WhatsApp:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Errore interno del server',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};