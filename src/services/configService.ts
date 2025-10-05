export interface PaymentConfig {
  bacs: {
    enabled: boolean;
    bankName: string;
    accountName: string;
    iban: string;
    instructions: string;
  };
  cod: {
    enabled: boolean;
    instructions: string;
    enableForShipping: string[];
    feeAmount: number;
    feeType: 'fixed' | 'percentage';
  };
  paypal: {
    enabled: boolean;
    clientId: string;
    environment: 'sandbox' | 'production';
    instructions: string;
  };
  stripe: {
    enabled: boolean;
    publishableKey: string;
    environment: 'test' | 'live';
    instructions: string;
  };
}

const DEFAULT_CONFIG: PaymentConfig = {
  bacs: {
    enabled: true,
    bankName: 'Intesa SanPaolo',
    accountName: 'Imperatore Pietro',
    iban: 'IT53U0306904013100000018868',
    instructions: 'Effettua il bonifico utilizzando i dati bancari forniti. Inserisci il numero dell\'ordine come causale.'
  },
  cod: {
    enabled: true,
    instructions: 'Paga in contanti o con POS al momento della consegna.',
    enableForShipping: ['local_delivery'],
    feeAmount: 0,
    feeType: 'fixed'
  },
  paypal: {
    enabled: true,
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'Af3uPRypCi5IJHb_pyRkLaJPwpL-OJBJQPvcP5TcwOmpTP1lAYO1o0AQmqmAczKEHhU70z1q9Y17_hLf',
    environment: (import.meta.env.VITE_PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    instructions: 'Paga in modo sicuro con il tuo account PayPal.'
  },
  stripe: {
    enabled: true,
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_q2T6zSXCsZgSDBoczp5ESl9I',
    environment: (import.meta.env.VITE_STRIPE_ENVIRONMENT as 'test' | 'live') || 'test',
    instructions: 'Paga in modo sicuro con la tua carta di credito.'
  }
};

class ConfigService {
  private static instance: ConfigService;
  private config: PaymentConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): PaymentConfig {
    const savedConfig = localStorage.getItem('paymentConfig');
    if (savedConfig) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
      } catch (error) {
        console.error('Errore nel caricamento della configurazione:', error);
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  }

  public getConfig(): PaymentConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<PaymentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('paymentConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Errore nel salvataggio della configurazione:', error);
    }
  }

  public resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }

  public getBACSConfig() {
    return this.config.bacs;
  }

  public getCODConfig() {
    return this.config.cod;
  }

  public getPayPalConfig() {
    return this.config.paypal;
  }

  public getStripeConfig() {
    return this.config.stripe;
  }

  public updateBACSConfig(bacsConfig: Partial<PaymentConfig['bacs']>): void {
    this.config.bacs = { ...this.config.bacs, ...bacsConfig };
    this.saveConfig();
  }

  public updateCODConfig(codConfig: Partial<PaymentConfig['cod']>): void {
    this.config.cod = { ...this.config.cod, ...codConfig };
    this.saveConfig();
  }

  public updatePayPalConfig(paypalConfig: Partial<PaymentConfig['paypal']>): void {
    this.config.paypal = { ...this.config.paypal, ...paypalConfig };
    this.saveConfig();
  }

  public updateStripeConfig(stripeConfig: Partial<PaymentConfig['stripe']>): void {
    this.config.stripe = { ...this.config.stripe, ...stripeConfig };
    this.saveConfig();
  }
}

export const configService = ConfigService.getInstance();
export default configService;