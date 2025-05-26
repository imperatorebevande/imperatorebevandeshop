
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { wooCommerceService, WooCommerceProduct, WooCommerceCategory } from '@/services/woocommerce';

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
  } = {},
  options?: UseQueryOptions<WooCommerceProduct[]>
) => {
  return useQuery({
    queryKey: ['woocommerce-products', params],
    queryFn: () => wooCommerceService.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minuti
    cacheTime: 10 * 60 * 1000, // 10 minuti
    ...options,
  });
};

// Hook per ottenere un singolo prodotto
export const useWooCommerceProduct = (
  id: number,
  options?: UseQueryOptions<WooCommerceProduct>
) => {
  return useQuery({
    queryKey: ['woocommerce-product', id],
    queryFn: () => wooCommerceService.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
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
  options?: UseQueryOptions<WooCommerceCategory[]>
) => {
  return useQuery({
    queryKey: ['woocommerce-categories', params],
    queryFn: () => wooCommerceService.getCategories(params),
    staleTime: 10 * 60 * 1000, // 10 minuti
    cacheTime: 30 * 60 * 1000, // 30 minuti
    ...options,
  });
};

// Hook per cercare prodotti
export const useWooCommerceSearch = (
  query: string,
  params: any = {},
  options?: UseQueryOptions<WooCommerceProduct[]>
) => {
  return useQuery({
    queryKey: ['woocommerce-search', query, params],
    queryFn: () => wooCommerceService.searchProducts(query, params),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minuti
    cacheTime: 5 * 60 * 1000, // 5 minuti
    ...options,
  });
};

// Hook per prodotti in offerta
export const useWooCommerceSaleProducts = (
  params: any = {},
  options?: UseQueryOptions<WooCommerceProduct[]>
) => {
  return useQuery({
    queryKey: ['woocommerce-sale-products', params],
    queryFn: () => wooCommerceService.getSaleProducts(params),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    ...options,
  });
};

// Hook per prodotti featured
export const useWooCommerceFeaturedProducts = (
  params: any = {},
  options?: UseQueryOptions<WooCommerceProduct[]>
) => {
  return useQuery({
    queryKey: ['woocommerce-featured-products', params],
    queryFn: () => wooCommerceService.getFeaturedProducts(params),
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    ...options,
  });
};
