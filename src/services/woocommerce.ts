
// Configurazione per le API WooCommerce
interface WooCommerceConfig {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

// Interfacce per i dati WooCommerce
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number;
  average_rating: string;
  rating_count: number;
  attributes: Array<{
    id: number;
    name: string;
    options: string[];
  }>;
}

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: {
    id: number;
    src: string;
    alt: string;
  } | null;
  count: number;
}

class WooCommerceService {
  private config: WooCommerceConfig | null = null;

  // Inizializza la configurazione
  init(config: WooCommerceConfig) {
    this.config = config;
  }

  // Genera le credenziali di autenticazione
  private getAuthString(): string {
    if (!this.config) {
      throw new Error('WooCommerce non configurato. Chiama init() prima.');
    }
    
    const credentials = btoa(`${this.config.consumerKey}:${this.config.consumerSecret}`);
    return `Basic ${credentials}`;
  }

  // Metodo generico per fare richieste API
  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.config) {
      throw new Error('WooCommerce non configurato. Chiama init() prima.');
    }

    const url = new URL(`${this.config.baseUrl}/wp-json/wc/v3/${endpoint}`);
    
    // Aggiungi parametri alla query string
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key].toString());
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthString(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore API WooCommerce: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Errore nella richiesta WooCommerce:', error);
      throw error;
    }
  }

  // Ottieni tutti i prodotti
  async getProducts(params: {
    page?: number;
    per_page?: number;
    category?: string;
    search?: string;
    orderby?: 'date' | 'id' | 'title' | 'popularity' | 'rating' | 'price';
    order?: 'asc' | 'desc';
    on_sale?: boolean;
    featured?: boolean;
    status?: 'publish' | 'draft' | 'pending' | 'private';
  } = {}): Promise<WooCommerceProduct[]> {
    return await this.makeRequest('products', {
      per_page: 20,
      status: 'publish',
      ...params,
    });
  }

  // Ottieni un singolo prodotto
  async getProduct(id: number): Promise<WooCommerceProduct> {
    return await this.makeRequest(`products/${id}`);
  }

  // Ottieni tutte le categorie
  async getCategories(params: {
    page?: number;
    per_page?: number;
    orderby?: 'id' | 'name' | 'slug' | 'count';
    order?: 'asc' | 'desc';
    hide_empty?: boolean;
  } = {}): Promise<WooCommerceCategory[]> {
    return await this.makeRequest('products/categories', {
      per_page: 100,
      hide_empty: true,
      ...params,
    });
  }

  // Cerca prodotti
  async searchProducts(query: string, params: any = {}): Promise<WooCommerceProduct[]> {
    return await this.getProducts({
      search: query,
      ...params,
    });
  }

  // Ottieni prodotti in offerta
  async getSaleProducts(params: any = {}): Promise<WooCommerceProduct[]> {
    return await this.getProducts({
      on_sale: true,
      ...params,
    });
  }

  // Ottieni prodotti featured
  async getFeaturedProducts(params: any = {}): Promise<WooCommerceProduct[]> {
    return await this.getProducts({
      featured: true,
      ...params,
    });
  }

  // Converti prodotto WooCommerce al formato dell'app
  convertToAppProduct(wooProduct: WooCommerceProduct): any {
    return {
      id: wooProduct.id,
      name: wooProduct.name,
      price: parseFloat(wooProduct.price),
      originalPrice: wooProduct.sale_price ? parseFloat(wooProduct.regular_price) : undefined,
      image: wooProduct.images[0]?.src || '/placeholder.svg',
      category: wooProduct.categories[0]?.name || 'Generale',
      description: wooProduct.short_description || wooProduct.description,
      features: wooProduct.attributes.map(attr => 
        `${attr.name}: ${attr.options.join(', ')}`
      ),
      rating: parseFloat(wooProduct.average_rating) || 0,
      reviews: wooProduct.rating_count || 0,
      inStock: wooProduct.stock_status === 'instock',
      slug: wooProduct.slug,
      permalink: wooProduct.permalink,
    };
  }
}

// Istanza singleton del servizio
export const wooCommerceService = new WooCommerceService();

// Hook personalizzato per usare WooCommerce con React Query
export const useWooCommerceConfig = () => {
  const initWooCommerce = (config: WooCommerceConfig) => {
    wooCommerceService.init(config);
    console.log('WooCommerce configurato con successo');
  };

  return { initWooCommerce };
};
