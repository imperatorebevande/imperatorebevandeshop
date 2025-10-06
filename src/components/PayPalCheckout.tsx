import React, { useEffect, useRef, useCallback, useState } from 'react';
import { configService } from '@/services/configService';

// Dichiarazione globale per PayPal
declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalCheckoutProps {
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  disabled?: boolean;
}

// Variabile globale per tracciare lo stato di caricamento
let isPayPalLoading = false;
let paypalLoadPromise: Promise<any> | null = null;
let paypalInitialized = false;

const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  amount,
  onSuccess,
  onError,
  disabled = false
}) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const initializationAttempts = useRef(0);
  const maxAttempts = 3;
  
  // Memoizza le callback per evitare ricreazioni
  const memoizedOnSuccess = useCallback((details: any) => {
    console.log('PayPal payment success:', details);
    onSuccess(details);
  }, [onSuccess]);

  const memoizedOnError = useCallback((error: any) => {
    console.error('PayPal payment error:', error);
    onError(error);
  }, [onError]);

  const memoizedOnCancel = useCallback((data: any) => {
    console.log('PayPal payment cancelled:', data);
    setError('Pagamento annullato');
  }, []);

  // Funzione per pulire completamente PayPal
  const cleanupPayPal = useCallback(() => {
    if (paypalRef.current) {
      paypalRef.current.innerHTML = '';
    }
    
    // Rimuovi tutti gli script PayPal esistenti
    const existingScripts = document.querySelectorAll('script[src*="paypal"]');
    existingScripts.forEach(script => script.remove());
    
    // Pulisci le variabili globali PayPal
    if (window.paypal) {
      delete window.paypal;
    }
    
    // Reset delle variabili di stato globali
    isPayPalLoading = false;
    paypalLoadPromise = null;
    paypalInitialized = false;
  }, []);

  // Funzione per caricare lo script PayPal
  const loadPayPalScript = useCallback((): Promise<any> => {
    // Se già in caricamento, restituisci la promise esistente
    if (paypalLoadPromise) {
      return paypalLoadPromise;
    }

    // Se PayPal è già disponibile, restituisci una promise risolta
    if (window.paypal && paypalInitialized) {
      return Promise.resolve(window.paypal);
    }

    // Previeni caricamenti multipli
    if (isPayPalLoading) {
      return new Promise((resolve, reject) => {
        const checkPayPal = () => {
          if (window.paypal && !isPayPalLoading) {
            resolve(window.paypal);
          } else if (!isPayPalLoading) {
            reject(new Error('PayPal failed to load'));
          } else {
            setTimeout(checkPayPal, 100);
          }
        };
        checkPayPal();
      });
    }

    isPayPalLoading = true;
    const config = configService.getPayPalConfig();

    paypalLoadPromise = new Promise((resolve, reject) => {
      // Pulisci prima di caricare
      cleanupPayPal();

      const script = document.createElement('script');
      // Usa EUR come valuta di default se non specificata
      const currency = 'EUR';
      // Aggiungi il parametro environment per specificare sandbox o production
      const environment = config.environment === 'production' ? '' : '&environment=sandbox';
      // Disabilita le carte di credito/debito e altri metodi di pagamento
      const disableFunding = '&disable-funding=card,credit,paylater,bancontact,blik,eps,giropay,ideal,mercadopago,mybank,p24,sepa,sofort,venmo';
      script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${currency}&intent=capture&data-partner-attribution-id=TRAE_ECOMMERCE_PLATFORM${environment}${disableFunding}`;
      script.async = true;
      
      script.onload = () => {
        console.log('PayPal script loaded successfully');
        isPayPalLoading = false;
        
        // Verifica immediata della disponibilità
        if (window.paypal) {
          paypalInitialized = true;
          resolve(window.paypal);
        } else {
          // Retry con timeout
          setTimeout(() => {
            if (window.paypal) {
              paypalInitialized = true;
              resolve(window.paypal);
            } else {
              reject(new Error('PayPal SDK not available after loading'));
            }
          }, 1000);
        }
      };
      
      script.onerror = (error) => {
        console.error('Failed to load PayPal script:', error);
        isPayPalLoading = false;
        paypalLoadPromise = null;
        script.remove();
        reject(new Error('Failed to load PayPal script'));
      };
      
      document.head.appendChild(script);
    });

    return paypalLoadPromise;
  }, [cleanupPayPal]);

  // Funzione per inizializzare i pulsanti PayPal
  const initializePayPalButtons = useCallback(async () => {
    if (!isComponentMounted || !paypalRef.current || disabled) {
      return;
    }

    // Previeni inizializzazioni multiple
    if (initializationAttempts.current >= maxAttempts) {
      setError('Impossibile inizializzare PayPal dopo diversi tentativi');
      setIsLoading(false);
      return;
    }

    initializationAttempts.current++;

    try {
      setIsLoading(true);
      setError(null);

      const paypal = await loadPayPalScript();
      
      if (!paypal || !paypal.Buttons) {
        throw new Error('PayPal Buttons not available');
      }

      // Pulisci il container prima di renderizzare
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }

      // Verifica che il componente sia ancora montato
      if (!isComponentMounted) {
        return;
      }

      const buttons = paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: amount.toFixed(2)
              }
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          try {
            const details = await actions.order.capture();
            memoizedOnSuccess(details);
          } catch (error) {
            console.error('Error capturing PayPal order:', error);
            memoizedOnError(error);
          }
        },
        onError: (error: any) => {
          console.error('PayPal button error:', error);
          memoizedOnError(error);
        },
        onCancel: memoizedOnCancel,
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal'
        }
      });

      if (paypalRef.current && isComponentMounted) {
        await buttons.render(paypalRef.current);
        setIsLoading(false);
        console.log('PayPal buttons rendered successfully');
      }

    } catch (error) {
      console.error('Error initializing PayPal buttons:', error);
      setError('Errore nel caricamento di PayPal. Riprova.');
      setIsLoading(false);
      
      // Retry automatico solo se non abbiamo raggiunto il limite
      if (initializationAttempts.current < maxAttempts && isComponentMounted) {
        setTimeout(() => {
          if (isComponentMounted) {
            initializePayPalButtons();
          }
        }, 2000);
      }
    }
  }, [amount, memoizedOnSuccess, memoizedOnError, memoizedOnCancel, disabled, isComponentMounted, loadPayPalScript]);

  // Effect per il montaggio del componente
  useEffect(() => {
    setIsComponentMounted(true);
    initializationAttempts.current = 0;
    
    return () => {
      setIsComponentMounted(false);
    };
  }, []);

  // Effect per l'inizializzazione di PayPal
  useEffect(() => {
    if (isComponentMounted && !disabled) {
      // Delay per assicurarsi che il DOM sia pronto
      const timer = setTimeout(() => {
        if (isComponentMounted) {
          initializePayPalButtons();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [initializePayPalButtons, isComponentMounted, disabled]);

  // Cleanup al dismount
  useEffect(() => {
    return () => {
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }
    };
  }, []);

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            initializationAttempts.current = 0;
            initializePayPalButtons();
          }}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="paypal-checkout-container">
      {isLoading && (
        <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Caricamento PayPal...</span>
        </div>
      )}
      <div 
        ref={paypalRef} 
        className={`paypal-buttons-container pwa-optimized ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ minHeight: isLoading ? '0' : '50px' }}
      />
    </div>
  );
};

export default PayPalCheckout;