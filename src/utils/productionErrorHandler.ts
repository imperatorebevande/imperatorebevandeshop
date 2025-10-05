/**
 * Gestore centralizzato degli errori per l'ambiente di produzione
 */

export class ProductionErrorHandler {
  private static instance: ProductionErrorHandler;
  private errorCount = 0;
  private maxErrors = 5;
  private retryAttempts = new Map<string, number>();
  // Salva i metodi originali per poterli richiamare
  private originalDocQuerySelector = Document.prototype.querySelector;
  private originalDocQuerySelectorAll = Document.prototype.querySelectorAll;
  private originalElQuerySelector = Element.prototype.querySelector;
  private originalElQuerySelectorAll = Element.prototype.querySelectorAll;

  private constructor() {
    this.setupGlobalErrorHandler();
    // Applica una patch sicura ai selettori per evitare crash causati da selettori non validi (es. PayPal)
    this.patchQuerySelector();
  }

  public static getInstance(): ProductionErrorHandler {
    if (!ProductionErrorHandler.instance) {
      ProductionErrorHandler.instance = new ProductionErrorHandler();
    }
    return ProductionErrorHandler.instance;
  }

  private setupGlobalErrorHandler() {
    // Gestisce errori JavaScript globali
    window.addEventListener('error', (event: ErrorEvent) => {
      const error = (event as any).error || new Error(event.message);
      const message = (event as any).message || error?.message || '';
      const isSelector = this.isSelectorError(error) || /not a valid selector/i.test(message);
      const isPayPalSelector = isSelector && /paypal\.com\/sdk\/js/i.test(message);
      if (isPayPalSelector) {
        console.warn('[Production Error Handler] Blocco errore selettore PayPal e attivo fallback');
        try { event.preventDefault(); } catch {}
        this.handleSelectorError(error);
        this.handlePayPalError(error);
        return; // Non propagare oltre
      }
      this.handleError(error, 'Global JavaScript Error');
    }, true);

    // Gestisce errori di Promise non catturate
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason: any = (event as any).reason;
      const message = String(reason?.message || reason || '');
      const isSelector = /querySelector|Invalid selector|not a valid selector/i.test(message);
      const isPayPalSelector = isSelector && /paypal\.com\/sdk\/js/i.test(message);
      if (isPayPalSelector) {
        console.warn('[Production Error Handler] Blocco unhandledrejection selettore PayPal');
        try { event.preventDefault(); } catch {}
        this.handleSelectorError(reason);
        this.handlePayPalError(reason);
        return;
      }
      this.handleError(reason, 'Unhandled Promise Rejection');
    }, true);
  }

  public handleError(error: any, context: string = 'Unknown') {
    // Solo in produzione
    if (window.location.hostname === 'localhost') {
      return;
    }

    this.errorCount++;
    console.error(`[Production Error Handler] ${context}:`, error);

    // Se ci sono troppi errori, ricarica la pagina
    if (this.errorCount >= this.maxErrors) {
      this.reloadPage('Too many errors detected');
      return;
    }

    // Gestione specifica per errori PayPal
    if (this.isPayPalError(error)) {
      this.handlePayPalError(error);
    }

    // Gestione specifica per errori di selettori CSS
    if (this.isSelectorError(error)) {
      this.handleSelectorError(error);
    }
  }

  private isPayPalError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    return errorMessage.toLowerCase().includes('paypal') ||
           errorMessage.includes('data-funding-source') ||
           errorMessage.includes('paypal-button');
  }

  private isSelectorError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    return errorMessage.includes('querySelector') ||
           errorMessage.includes('querySelectorAll') ||
           errorMessage.includes('Invalid selector');
  }

  private handlePayPalError(error: any) {
    const retryKey = 'paypal-error';
    const attempts = this.retryAttempts.get(retryKey) || 0;

    if (attempts < 2) {
      this.retryAttempts.set(retryKey, attempts + 1);
      console.log(`[Production Error Handler] Retrying PayPal initialization (attempt ${attempts + 1})`);
      
      // Riprova dopo un breve delay
      setTimeout(() => {
        this.reinitializePayPal();
      }, 1000 * (attempts + 1));
    } else {
      console.error('[Production Error Handler] PayPal initialization failed after multiple attempts');
      this.showUserFriendlyError('Problema con il sistema di pagamento PayPal. Ricarica la pagina o prova un altro metodo di pagamento.');
    }
  }

  private handleSelectorError(error: any) {
    console.warn('[Production Error Handler] CSS Selector error detected, attempting to fix...');
    
    // Rimuovi eventuali selettori problematici dal DOM
    this.cleanupProblematicSelectors();
  }

  private cleanupProblematicSelectors() {
    try {
      // Rimuovi elementi con selettori problematici
      const problematicElements = document.querySelectorAll('[data-funding-source*="*"], [class*="*"]');
      problematicElements.forEach(el => {
        if ((el as HTMLElement).getAttribute('data-funding-source')?.includes('*')) {
          (el as HTMLElement).removeAttribute('data-funding-source');
        }
      });
    } catch (error) {
      console.warn('[Production Error Handler] Could not cleanup selectors:', error);
    }
  }

  private reinitializePayPal() {
    try {
      // Rimuovi eventuali script PayPal esistenti usando un approccio più sicuro
      const allScripts = document.getElementsByTagName('script');
      const paypalScripts = Array.from(allScripts).filter(script => 
        (script as HTMLScriptElement).src && (script as HTMLScriptElement).src.includes('paypal.com')
      );
      paypalScripts.forEach(script => script.remove());

      // Rimuovi container PayPal esistenti
      const existingContainers = document.querySelectorAll('.paypal-buttons-container');
      existingContainers.forEach(container => {
        (container as HTMLElement).innerHTML = '';
      });

      // Forza il re-render dei componenti PayPal
      window.dispatchEvent(new CustomEvent('paypal-reinitialize'));
    } catch (error) {
      console.error('[Production Error Handler] Failed to reinitialize PayPal:', error);
    }
  }

  private reloadPage(reason: string) {
    console.log(`[Production Error Handler] Reloading page: ${reason}`);
    
    // Mostra un messaggio all'utente prima di ricaricare
    this.showUserFriendlyError('Si è verificato un problema. La pagina verrà ricaricata automaticamente.');
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }

  private showUserFriendlyError(message: string) {
    // Crea un toast di errore user-friendly
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 16px;
      border-radius: 8px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Rimuovi dopo 5 secondi
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  public reset() {
    this.errorCount = 0;
    this.retryAttempts.clear();
  }

  // Patch per intercettare selettori non validi provenienti dalla libreria PayPal
  private patchQuerySelector() {
    try {
      const isProblematicSelector = (selector: string) => {
        return selector.includes('script[src=') && selector.includes('paypal.com/sdk/js');
      };

      const fallbackFindPayPalScript = (root: Document | Element): Element | null => {
        const scripts = (root as Document).getElementsByTagName
          ? (root as Document).getElementsByTagName('script')
          : document.getElementsByTagName('script');
        for (const sc of Array.from(scripts)) {
          const src = (sc as HTMLScriptElement).src || (sc as HTMLElement).getAttribute('src') || '';
          if (!src) continue;
          if (src.includes('paypal.com/sdk/js')) {
            // Preferisci quelli con components=buttons se richiesto
            return sc as Element;
          }
        }
        return null;
      };

      const self = this;

      // Patch Document.prototype.querySelector
      Document.prototype.querySelector = function(selectors: string): any {
        try {
          return self.originalDocQuerySelector.call(this, selectors);
        } catch (err: any) {
          const msg = String(err?.message || err);
          if (msg.includes('not a valid selector') && isProblematicSelector(selectors)) {
            console.warn('[Production Error Handler] Intercettato selettore PayPal non valido, uso fallback sicuro');
            return fallbackFindPayPalScript(this);
          }
          throw err;
        }
      };

      // Patch Document.prototype.querySelectorAll
      Document.prototype.querySelectorAll = function(selectors: string): any {
        try {
          return self.originalDocQuerySelectorAll.call(this, selectors);
        } catch (err: any) {
          const msg = String(err?.message || err);
          if (msg.includes('not a valid selector') && isProblematicSelector(selectors)) {
            console.warn('[Production Error Handler] Intercettato selettore non valido, uso fallback sicuro');
            // Ritorna un array vuoto per evitare errori
            const nodeListLike: any = {
              length: 0,
              item: (i: number) => null,
            };
            return nodeListLike;
          }
          throw err;
        }
      } as any;

      // Patch Element.prototype.querySelector per sicurezza (anche se l'errore mostrato è su Document)
      Element.prototype.querySelector = function(selectors: string): any {
        try {
          return self.originalElQuerySelector.call(this, selectors);
        } catch (err: any) {
          const msg = String(err?.message || err);
          if (msg.includes('not a valid selector') && isProblematicSelector(selectors)) {
            return fallbackFindPayPalScript(this);
          }
          throw err;
        }
      } as any;

      Element.prototype.querySelectorAll = function(selectors: string): any {
        try {
          return self.originalElQuerySelectorAll.call(this, selectors);
        } catch (err: any) {
          const msg = String(err?.message || err);
          if (msg.includes('not a valid selector') && isProblematicSelector(selectors)) {
            // Ritorna un array vuoto per evitare errori
            const nodeListLike: any = {
              length: 0,
              item: (i: number) => null,
            };
            return nodeListLike;
          }
          throw err;
        }
      } as any;
    } catch (e) {
      console.warn('[Production Error Handler] Impossibile applicare la patch ai selettori:', e);
    }
  }
}

// Inizializza automaticamente in produzione
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  ProductionErrorHandler.getInstance();
}

export default ProductionErrorHandler;