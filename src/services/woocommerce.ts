import axios, { AxiosInstance } from 'axios';

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_from_gmt: string | null;
  date_on_sale_to: string | null;
  date_on_sale_to_gmt: string | null;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: any[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  low_stock_amount: number | null;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: WooCommerceCategory[];
  tags: any[];
  images: {
    id: number;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    src: string;
    name: string;
    alt: string;
  }[];
  attributes: any[];
  default_attributes: any[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  price_html: string;
  related_ids: number[];
  meta_data: any[];
  stock_status: string;
}

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: string;
  image: {
    id: number;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    src: string;
    name: string;
    alt: string;
  } | null;
  menu_order: number;
  count: number;
}

export interface WooCommerceCustomer {
  id: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  is_paying_customer: boolean;
  avatar_url: string;
  meta_data: any[];
}

export interface WooCommerceOrder {
  id: number;
  parent_id: number;
  status: string;
  currency: string;
  version: string;
  prices_include_tax: boolean;
  date_created: string;
  date_modified: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  customer_id: number;
  order_key: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  customer_ip_address: string;
  customer_user_agent: string;
  created_via: string;
  customer_note: string;
  date_completed: string | null;
  date_paid: string | null;
  cart_hash: string;
  number: string;
  meta_data: any[];
  line_items: {
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    tax_class: string;
    subtotal: string;
    subtotal_tax: string;
    total: string;
    total_tax: string;
    taxes: any[];
    meta_data: any[];
    sku: string;
    price: number;
    image: {
      id: number;
      src: string;
    };
  }[];
  tax_lines: any[];
  shipping_lines: any[];
  fee_lines: any[];
  coupon_lines: any[];
  refunds: any[];
  payment_url: string;
  is_editable: boolean;
  needs_payment: boolean;
  needs_processing: boolean;
  date_created_gmt: string;
  date_modified_gmt: string;
  date_completed_gmt: string | null;
  date_paid_gmt: string | null;
  currency_symbol: string;
}

class WooCommerceService {
  private api: AxiosInstance;
  private isConfigured = false;

  constructor() {
    // Configurazione automatica con le tue credenziali
    this.api = axios.create({
      baseURL: 'https://imperatorebevande.it/wp-json/wc/v3',
      auth: {
        username: 'ck_130da21fbbeddc098a110b2d43a56de1d5e43904',
        password: 'cs_a8b506ead451a64501a90e870c6e006de3359262'
      },
      timeout: 10000,
    });
    this.isConfigured = true;
  
    // Interceptor per gestire errori
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('WooCommerce API Error:', error.response?.data || error.message);
        throw error;
      }
    );
    
    // Interceptor per aggiungere il token JWT alle richieste
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Metodo per verificare se il servizio è configurato
  isReady(): boolean {
    return this.isConfigured;
  }

  // Ottenere tutti i prodotti
  async getProducts(params: any = {}): Promise<WooCommerceProduct[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.get('/products', { params });
      console.log('WooCommerce products fetched:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero dei prodotti:', error);
      throw error;
    }
  }

  // Ottenere un singolo prodotto
  async getProduct(id: number): Promise<WooCommerceProduct> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.get(`/products/${id}`);
      console.log('WooCommerce product fetched:', response.data.name);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero del prodotto:', error);
      throw error;
    }
  }

  // Ottenere le categorie
  async getCategories(params: any = {}): Promise<WooCommerceCategory[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.get('/products/categories', { params });
      console.log('WooCommerce categories fetched:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero delle categorie:', error);
      throw error;
    }
  }

  // Cercare prodotti
  async searchProducts(query: string, params: any = {}): Promise<WooCommerceProduct[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const searchParams = { ...params, search: query };
      const response = await this.api.get('/products', { params: searchParams });
      console.log('WooCommerce search results:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Errore nella ricerca prodotti:', error);
      throw error;
    }
  }

  // Ottenere prodotti in offerta
  async getSaleProducts(params: any = {}): Promise<WooCommerceProduct[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const saleParams = { ...params, on_sale: true };
      const response = await this.api.get('/products', { params: saleParams });
      console.log('WooCommerce sale products fetched:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero prodotti in offerta:', error);
      throw error;
    }
  }

  // Ottenere prodotti featured
  async getFeaturedProducts(params: any = {}): Promise<WooCommerceProduct[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const featuredParams = { ...params, featured: true };
      const response = await this.api.get('/products', { params: featuredParams });
      console.log('WooCommerce featured products fetched:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero prodotti featured:', error);
      throw error;
    }
  }

  // NUOVI METODI PER GESTIRE I CLIENTI E ORDINI

  // Ottenere tutti i clienti
  async getCustomers(params: any = {}): Promise<WooCommerceCustomer[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.get('/customers', { params });
      console.log('WooCommerce customers fetched:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero dei clienti:', error);
      throw error;
    }
  }

  // Ottenere un singolo cliente
  async getCustomer(id: number): Promise<WooCommerceCustomer> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.get(`/customers/${id}`);
      console.log('WooCommerce customer fetched:', response.data.email);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero del cliente:', error);
      throw error;
    }
  }

  // Metodo combinato per cercare il cliente
  async findCustomer(emailOrUsername: string): Promise<WooCommerceCustomer[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      // Prima prova con email
      const emailResults = await this.getCustomerByEmail(emailOrUsername);
      if (emailResults.length > 0) {
        return emailResults;
      }

      // Se non trova nulla, prova con username
      const usernameResults = await this.getCustomerByUsername(emailOrUsername);
      return usernameResults;

    } catch (error) {
      console.error('Errore nella ricerca cliente:', error);
      throw error;
    }
  }

  // Cercare cliente per email
  async getCustomerByEmail(email: string): Promise<WooCommerceCustomer[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }
  
    try {
      const response = await this.api.get('/customers', { 
        params: { 
          email: email,
          role: 'all',       // Include tutti i ruoli
          per_page: 100,     // Aumenta il numero di risultati
          orderby: 'id',     // Ordina per ID
          order: 'desc'      // Ordine decrescente
        } 
      });
      
      console.log('WooCommerce customer search response:', response.data);
      console.log('WooCommerce customer search by email:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Errore nella ricerca cliente per email:', error);
      throw error;
    }
  }

  // Aggiungere questa funzione dopo getCustomerByEmail
  async getCustomerByUsername(username: string): Promise<WooCommerceCustomer[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      // Prima prova con il parametro search
      const searchResponse = await this.api.get('/customers', {
        params: {
          search: username,
          per_page: 100
        }
      });
      
      console.log('WooCommerce customer search by username:', searchResponse.data.length);
      
      // Filtriamo per username esatto
      const exactMatches = searchResponse.data.filter(
        (customer: WooCommerceCustomer) => 
          customer.username.toLowerCase() === username.toLowerCase()
      );
      
      console.log('Filtered customers by exact username match:', exactMatches.length);
      
      if (exactMatches.length > 0) {
        return exactMatches;
      }
      
      // Se non troviamo risultati con search, proviamo la ricerca paginata
      let page = 1;
      const per_page = 100;
      let foundCustomers: WooCommerceCustomer[] = [];
      let hasMorePages = true;
      
      while (hasMorePages && foundCustomers.length === 0 && page <= 10) {
        console.log(`Cercando nella pagina ${page}...`);
        
        const response = await this.api.get('/customers', {
          params: {
            page,
            per_page
          }
        });
        
        console.log(`Pagina ${page}: ${response.data.length} clienti`);
        
        if (response.data.length === 0) {
          hasMorePages = false;
        } else {
          foundCustomers = response.data.filter(
            (customer: WooCommerceCustomer) => 
              customer.username.toLowerCase() === username.toLowerCase()
          );
          
          if (foundCustomers.length > 0) {
            console.log(`Cliente trovato nella pagina ${page}:`, foundCustomers[0].username);
            break;
          }
          
          page++;
        }
      }
      
      console.log('Risultato finale ricerca per username:', foundCustomers.length);
      return foundCustomers;
    } catch (error) {
      console.error('Errore nella ricerca cliente per username:', error);
      throw error;
    }
  }

  // Ottenere tutti gli ordini
  async getOrders(params: any = {}): Promise<WooCommerceOrder[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.get('/orders', { params });
      console.log('WooCommerce orders fetched:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero degli ordini:', error);
      throw error;
    }
  }

  // Ottenere ordini di un cliente specifico
  async getCustomerOrders(customerId: number, params: any = {}): Promise<WooCommerceOrder[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const orderParams = { ...params, customer: customerId };
      const response = await this.api.get('/orders', { params: orderParams });
      console.log('WooCommerce customer orders fetched:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero degli ordini del cliente:', error);
      throw error;
    }
  }

  // Ottenere un singolo ordine
  async getOrder(id: number): Promise<WooCommerceOrder> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.get(`/orders/${id}`);
      console.log('WooCommerce order fetched:', response.data.number);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero dell\'ordine:', error);
      throw error;
    }
  }

  // NUOVO METODO PER CREARE ORDINI
  async createOrder(orderData: {
    customer_id?: number;
    billing: {
      first_name: string;
      last_name: string;
      address_1: string;
      city: string;
      state: string;
      postcode: string;
      country: string;
      email: string;
      phone: string;
    };
    shipping: {
      first_name: string;
      last_name: string;
      address_1: string;
      city: string;
      state: string;
      postcode: string;
      country: string;
    };
    line_items: {
      product_id: number;
      quantity: number;
    }[];
    payment_method: string;
    payment_method_title: string;
    status?: string;
  }): Promise<WooCommerceOrder> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.post('/orders', orderData);
      console.log('WooCommerce order created:', response.data.number);
      return response.data;
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine:', error);
      throw error;
    }
  }

  // METODO PER AGGIORNARE LO STOCK DEI PRODOTTI
  async updateProductStock(productId: number, stockQuantity: number): Promise<WooCommerceProduct> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.put(`/products/${productId}`, {
        stock_quantity: stockQuantity,
        manage_stock: true
      });
      console.log('Product stock updated:', response.data.name);
      return response.data;
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello stock:', error);
      throw error;
    }
  }

  // NUOVO METODO PER AGGIORNARE I DATI DEL CLIENTE
  async updateCustomer(id: number, customerData: Partial<WooCommerceCustomer>): Promise<WooCommerceCustomer> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.put(`/customers/${id}`, customerData);
      console.log('WooCommerce customer updated:', response.data.email);
      return response.data;
    } catch (error) {
      console.error('Errore nell\'aggiornamento del cliente:', error);
      throw error;
    }
  }

  // NUOVO METODO PER OTTENERE I METODI DI PAGAMENTO DISPONIBILI
  async getPaymentGateways(): Promise<any[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.get('/payment_gateways');
      console.log('WooCommerce payment gateways fetched:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero dei metodi di pagamento:', error);
      throw error;
    }
  }

  // NUOVO METODO PER IL LOGIN JWT
  async loginWithJwt(username: string, password: string): Promise<any> {
    try {
      const response = await axios.post('https://imperatorebevande.it/wp-json/jwt-auth/v1/token', {
        username,
        password,
      });
      // Salva il token JWT (es. in localStorage)
      localStorage.setItem('jwtToken', response.data.token);
      // Configura Axios per includere il token JWT nelle richieste successive
      // Questo ora è gestito dall'interceptor nel costruttore
      return response.data;
    } catch (error) {
      console.error('Errore durante il login JWT:', error);
      throw error;
    }
  }

  // Aggiungi questo nuovo metodo all'INTERNO della classe
  async getCustomerByWordPressUserId(wpUserId: number): Promise<WooCommerceCustomer[]> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      const response = await this.api.get('/customers', { 
        params: { role: 'all', wp_user_id: wpUserId } 
      });
      console.log('WooCommerce customer search by WordPress ID:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Errore nella ricerca cliente per WordPress ID:', error);
      throw error;
    }
  }

  async getCustomerIdAfterAuth(authData: { user_email: string; user_nicename: string }): Promise<number> {
    if (!this.isConfigured) {
      throw new Error('WooCommerce non è configurato');
    }

    try {
      // Prima prova a cercare per email
      const customersByEmail = await this.getCustomerByEmail(authData.user_email);
      if (customersByEmail.length > 0) {
        return customersByEmail[0].id;
      }

      // Se non trova per email, prova con lo username
      const customersByUsername = await this.getCustomerByUsername(authData.user_nicename);
      if (customersByUsername.length > 0) {
        return customersByUsername[0].id;
      }

      // Se non trova nulla, ritorna 0 o lancia un'eccezione
      console.warn('Cliente non trovato dopo autenticazione JWT');
      return 0;
    } catch (error) {
      console.error('Errore nel recupero ID cliente dopo auth:', error);
      throw error;
    }
  }
} // Chiusura della classe WooCommerceService

export const wooCommerceService = new WooCommerceService();
