export interface WhatsAppFormData {
  name: string;
  subject: string;
  message: string;
}

export interface WhatsAppConfig {
  businessNumber: string;
  businessName: string;
}

// Configurazione WhatsApp Business
const WHATSAPP_CONFIG: WhatsAppConfig = {
  businessNumber: '3402486783', // Numero WhatsApp diretto
  businessName: 'Imperatore Bevande'
};

/**
 * Formatta il messaggio WhatsApp con i dati del form
 */
const formatWhatsAppMessage = (data: WhatsAppFormData): string => {
  return `🍺 *NUOVO CONTATTO - Imperatore Bevande*\n\n` +
    `👤 *Nome:* ${data.name}\n` +
    `📋 *Oggetto:* ${data.subject}\n\n` +
    `💬 *Messaggio:*\n${data.message}\n\n` +
    `---\n` +
    `📅 *Data:* ${new Date().toLocaleString('it-IT')}\n` +
    `🌐 *Fonte:* Sito Web - Form Contatti`;
};

/**
 * Invia un messaggio WhatsApp aprendo l'app/web WhatsApp
 */
export const sendWhatsAppMessage = async (formData: WhatsAppFormData): Promise<{ success: boolean; message: string }> => {
  try {
    // Validazione dei dati
    if (!formData.name || !formData.subject || !formData.message) {
      throw new Error('Tutti i campi obbligatori devono essere compilati');
    }

    // Formatta il messaggio
    const message = formatWhatsAppMessage(formData);
    
    // Codifica il messaggio per URL
    const encodedMessage = encodeURIComponent(message);
    
    // Crea l'URL WhatsApp
    const whatsappUrl = `https://wa.me/${WHATSAPP_CONFIG.businessNumber}?text=${encodedMessage}`;
    
    // Apre WhatsApp in una nuova finestra/tab
    window.open(whatsappUrl, '_blank');
    
    return {
      success: true,
      message: 'WhatsApp aperto con successo! Completa l\'invio del messaggio nell\'app.'
    };
    
  } catch (error) {
    console.error('Errore nell\'invio WhatsApp:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Errore sconosciuto nell\'invio WhatsApp'
    };
  }
};

/**
 * Alternativa: Invia tramite API WhatsApp Business (richiede configurazione server)
 */
export const sendWhatsAppViaAPI = async (formData: WhatsAppFormData): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: WHATSAPP_CONFIG.businessNumber,
        message: formatWhatsAppMessage(formData),
        formData
      }),
    });

    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      message: 'Messaggio WhatsApp inviato con successo!'
    };
    
  } catch (error) {
    console.error('Errore API WhatsApp:', error);
    
    // Fallback al metodo URL se l'API fallisce
    return await sendWhatsAppMessage(formData);
  }
};

/**
 * Verifica se WhatsApp è disponibile sul dispositivo
 */
export const isWhatsAppAvailable = (): boolean => {
  // Controlla se siamo su mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Su mobile, WhatsApp è quasi sempre disponibile
  // Su desktop, utilizziamo WhatsApp Web
  return true;
};

/**
 * Ottiene il numero WhatsApp Business configurato
 */
export const getBusinessWhatsAppNumber = (): string => {
  return WHATSAPP_CONFIG.businessNumber;
};

/**
 * Formatta un numero di telefono per WhatsApp (rimuove spazi e caratteri speciali)
 */
export const formatPhoneForWhatsApp = (phone: string): string => {
  // Rimuove tutti i caratteri non numerici eccetto il +
  let formatted = phone.replace(/[^\d+]/g, '');
  
  // Se non inizia con +, aggiungi +39 per l'Italia
  if (!formatted.startsWith('+')) {
    formatted = '+39' + formatted;
  }
  
  return formatted;
};