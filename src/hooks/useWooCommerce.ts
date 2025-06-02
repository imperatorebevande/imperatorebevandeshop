
import { useQuery, UseQueryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  wooCommerceService, 
  WooCommerceProduct, 
  WooCommerceCategory,
  WooCommerceCustomer,
  WooCommerceOrder
} from '@/services/woocommerce';

// Hook per ottenere tutti i prodotti
export const useWooCommerceProducts = (
  params: {
    page?: number;
    per_page?: number;
    category?: string;
    search?: string;
    orderby?: 'date' | 'id' | 'title' | 'popularity' | 'rating' | 'price';
    order?: 'asc' | 'desc';
    on_sale?: boolean;
    featured?: boolean;
    exclude?: number[];
  } = {},
  options?: Partial<UseQueryOptions<WooCommerceProduct[], Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-products', params],
    queryFn: () => wooCommerceService.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minuti
    gcTime: 10 * 60 * 1000, // 10 minuti
    ...options,
  });
};

// Hook per ottenere un singolo prodotto
export const useWooCommerceProduct = (
  id: number,
  options?: Partial<UseQueryOptions<WooCommerceProduct, Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-product', id],
    queryFn: () => wooCommerceService.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
};

// Hook per ottenere le categorie
export const useWooCommerceCategories = (
  params: {
    page?: number;
    per_page?: number;
    orderby?: 'id' | 'name' | 'slug' | 'count';
    order?: 'asc' | 'desc';
    hide_empty?: boolean;
  } = {},
  options?: Partial<UseQueryOptions<WooCommerceCategory[], Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-categories', params],
    queryFn: () => wooCommerceService.getCategories(params),
    staleTime: 10 * 60 * 1000, // 10 minuti
    gcTime: 30 * 60 * 1000, // 30 minuti
    ...options,
  });
};

// Hook per cercare prodotti
export const useWooCommerceSearch = (
  query: string,
  params: any = {},
  options?: Partial<UseQueryOptions<WooCommerceProduct[], Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-search', query, params],
    queryFn: () => wooCommerceService.searchProducts(query, params),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minuti
    gcTime: 5 * 60 * 1000, // 5 minuti
    ...options,
  });
};

// Hook per prodotti in offerta
export const useWooCommerceSaleProducts = (
  params: any = {},
  options?: Partial<UseQueryOptions<WooCommerceProduct[], Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-sale-products', params],
    queryFn: () => wooCommerceService.getSaleProducts(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
};

// Hook per prodotti più venduti (sostituisce featured)
export const useWooCommerceBestSellingProducts = (
  params: any = {},
  options?: Partial<UseQueryOptions<WooCommerceProduct[], Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-best-selling-products', params],
    queryFn: () => wooCommerceService.getProducts({ ...params, orderby: 'popularity', order: 'desc' }),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
};

// NUOVI HOOK PER CLIENTI E ORDINI

// Hook per ottenere tutti i clienti
export const useWooCommerceCustomers = (
  params: any = {},
  options?: Partial<UseQueryOptions<WooCommerceCustomer[], Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-customers', params],
    queryFn: () => wooCommerceService.getCustomers(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
};

// Hook per ottenere un singolo cliente
export const useWooCommerceCustomer = (customerId: number | null, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['woocommerce-customer', customerId],
    queryFn: () => customerId ? wooCommerceService.getCustomer(customerId) : null,
    enabled: options?.enabled !== false && !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minuti
  });
};

// Hook per cercare cliente per email
export const useWooCommerceCustomerByEmail = (
  email: string,
  options?: Partial<UseQueryOptions<WooCommerceCustomer[], Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-customer-email', email],
    queryFn: () => wooCommerceService.getCustomerByEmail(email),
    enabled: !!email && email.includes('@'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
};

// Hook per cercare cliente per username
export const useWooCommerceCustomerByUsername = (
  username: string,
  options?: Partial<UseQueryOptions<WooCommerceCustomer[], Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-customer-username', username],
    queryFn: () => wooCommerceService.getCustomerByUsername(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
    ...options
  });
};

// Hook per ottenere tutti gli ordini
export const useWooCommerceOrders = (
  params: any = {},
  options?: Partial<UseQueryOptions<WooCommerceOrder[], Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-orders', params],
    queryFn: () => wooCommerceService.getOrders(params),
    staleTime: 2 * 60 * 1000, // 2 minuti per ordini più aggiornati
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

// Hook per ottenere ordini di un cliente specifico
export const useWooCommerceCustomerOrders = (
  customerId: number,
  params: any = {},
  options?: Partial<UseQueryOptions<WooCommerceOrder[], Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-customer-orders', customerId, params],
    queryFn: () => wooCommerceService.getCustomerOrders(customerId, params),
    enabled: !!customerId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

// Hook per ottenere un singolo ordine
export const useWooCommerceOrder = (
  id: number,
  options?: Partial<UseQueryOptions<WooCommerceOrder, Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-order', id],
    queryFn: () => wooCommerceService.getOrder(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

// NUOVO HOOK PER CREARE ORDINI
export const useCreateWooCommerceOrder = () => {
  return async (orderData: any) => {
    return await wooCommerceService.createOrder(orderData);
  };
};

// HOOK PER AGGIORNARE LO STOCK
export const useUpdateProductStock = () => {
  return async (productId: number, stockQuantity: number) => {
    return await wooCommerceService.updateProductStock(productId, stockQuantity);
  };
};

// NUOVO HOOK PER OTTENERE I METODI DI PAGAMENTO
export const useWooCommercePaymentGateways = (
  options?: Partial<UseQueryOptions<any[], Error>>
) => {
  return useQuery({
    queryKey: ['woocommerce-payment-gateways'],
    queryFn: () => wooCommerceService.getPaymentGateways(),
    staleTime: 30 * 60 * 1000, // 30 minuti - i metodi di pagamento cambiano raramente
    gcTime: 60 * 60 * 1000, // 1 ora
    ...options,
  });
};

// NUOVO HOOK PER AGGIORNARE I DATI DEL CLIENTE
export const useUpdateWooCommerceCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, customerData }: { id: number, customerData: Partial<WooCommerceCustomer> }) => {
      console.log('Inviando richiesta di aggiornamento:', { id, customerData });
      return await wooCommerceService.updateCustomer(id, customerData);
    },
    onSuccess: (data, variables) => {
      console.log('Aggiornamento completato con successo:', data);
      // Invalida la cache per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ['woocommerce-customer', data.id] });
      
      // Messaggio specifico in base al tipo di aggiornamento
      if (variables.customerData.shipping || variables.customerData.billing) {
        toast.success('Indirizzo aggiornato con successo!');
      } else {
        toast.success('Profilo aggiornato con successo!');
      }
    },
    onError: (error) => {
      console.error('Errore dettagliato nell\'aggiornamento del cliente:', error);
      toast.error('Errore nell\'aggiornamento dei dati cliente');
    }
  });
};
