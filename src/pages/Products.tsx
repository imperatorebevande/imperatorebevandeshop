
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Filter, Grid3X3, List, Loader2 } from 'lucide-react';
import { useWooCommerceProducts, useWooCommerceCategories, useWooCommerceSearch } from '@/hooks/useWooCommerce';

const Products = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMainFilter, setActiveMainFilter] = useState('tutti');

  // Usa la ricerca se c'è una query, altrimenti carica tutti i prodotti
  const shouldUseSearch = searchQuery.length > 0;

  // Hook per ricerca prodotti
  const searchResults = useWooCommerceSearch(
    searchQuery,
    {
      per_page: 20,
      category: selectedCategory || undefined,
      orderby: sortBy as any,
      order: 'desc'
    },
    {
      enabled: shouldUseSearch
    }
  );

  // Hook per tutti i prodotti (quando non c'è ricerca)
  const allProductsResults = useWooCommerceProducts({
    per_page: 20,
    category: selectedCategory || undefined,
    orderby: sortBy as any,
    order: 'desc'
  }, {
    enabled: !shouldUseSearch
  });

  // Seleziona i risultati appropriati
  const { data: products = [], isLoading: productsLoading, error: productsError } = 
    shouldUseSearch ? searchResults : allProductsResults;

  // Recupera categorie da WooCommerce
  const { 
    data: categories = [], 
    isLoading: categoriesLoading 
  } = useWooCommerceCategories({
    per_page: 50,
    hide_empty: true
  });

  // Reset categoria quando cambia la ricerca
  useEffect(() => {
    if (searchQuery) {
      setSelectedCategory('');
    }
  }, [searchQuery]);

  // Organizza le categorie per filtri principali
  const organizedCategories = {
    bevande: categories.filter(cat => 
      cat.name.toLowerCase().includes('bevanda') || 
      cat.name.toLowerCase().includes('drink') ||
      cat.name.toLowerCase().includes('acqua') ||
      cat.name.toLowerCase().includes('succo') ||
      cat.name.toLowerCase().includes('bibita')
    ),
    alcolici: categories.filter(cat => 
      cat.name.toLowerCase().includes('vino') || 
      cat.name.toLowerCase().includes('birra') ||
      cat.name.toLowerCase().includes('liquore') ||
      cat.name.toLowerCase().includes('whisky') ||
      cat.name.toLowerCase().includes('vodka') ||
      cat.name.toLowerCase().includes('rum')
    ),
    alimentari: categories.filter(cat => 
      cat.name.toLowerCase().includes('cibo') || 
      cat.name.toLowerCase().includes('snack') ||
      cat.name.toLowerCase().includes('dolce') ||
      cat.name.toLowerCase().includes('pasta') ||
      cat.name.toLowerCase().includes('conserve')
    ),
    altri: categories.filter(cat => {
      const name = cat.name.toLowerCase();
      return !name.includes('bevanda') && !name.includes('drink') && 
             !name.includes('acqua') && !name.includes('succo') && 
             !name.includes('bibita') && !name.includes('vino') && 
             !name.includes('birra') && !name.includes('liquore') && 
             !name.includes('whisky') && !name.includes('vodka') && 
             !name.includes('rum') && !name.includes('cibo') && 
             !name.includes('snack') && !name.includes('dolce') && 
             !name.includes('pasta') && !name.includes('conserve');
    })
  };

  // Trasforma i prodotti WooCommerce nel formato atteso da ProductCard
  const transformedProducts = products.map(product => {
    console.log('Transforming product:', product.name, product);
    return {
      id: product.id,
      name: product.name || 'Prodotto senza nome',
      price: product.price ? parseFloat(product.price) : 0,
      originalPrice: product.regular_price && product.sale_price && parseFloat(product.regular_price) > parseFloat(product.sale_price)
        ? parseFloat(product.regular_price) 
        : undefined,
      image: product.images && product.images.length > 0 ? product.images[0].src : '/placeholder.svg',
      rating: product.average_rating ? parseFloat(product.average_rating) : 0,
      reviews: product.rating_count || 0,
    };
  });

  console.log('Products from API:', products.length);
  console.log('Transformed products:', transformedProducts.length);
  console.log('Search query:', searchQuery);

  if (productsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-semibold mb-2 text-red-600">
              Errore di connessione
            </h3>
            <p className="text-gray-600 mb-6">
              Non è possibile connettersi al negozio WooCommerce
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="gradient-primary"
            >
              Riprova
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getCategoriesForFilter = (filterType: string) => {
    switch (filterType) {
      case 'bevande':
        return organizedCategories.bevande;
      case 'alcolici':
        return organizedCategories.alcolici;
      case 'alimentari':
        return organizedCategories.alimentari;
      case 'altri':
        return organizedCategories.altri;
      default:
        return categories;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gradient">
            {searchQuery ? `Risultati per "${searchQuery}"` : 'I Nostri Prodotti'}
          </h1>
          <p className="text-gray-600 text-lg">
            {searchQuery 
              ? `Prodotti trovati per la tua ricerca`
              : 'Scopri la nostra vasta gamma di prodotti dal negozio Imperatore Bevande'
            }
          </p>
        </div>

        {/* Filtri Organizzati */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-lg">Filtri Prodotti</span>
          </div>

          <Tabs value={activeMainFilter} onValueChange={setActiveMainFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="tutti">Tutti</TabsTrigger>
              <TabsTrigger value="bevande">Bevande</TabsTrigger>
              <TabsTrigger value="alcolici">Alcolici</TabsTrigger>
              <TabsTrigger value="alimentari">Alimentari</TabsTrigger>
              <TabsTrigger value="altri">Altri</TabsTrigger>
            </TabsList>

            <TabsContent value="tutti" className="mt-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === '' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory('')}
                  className={selectedCategory === '' ? "gradient-primary" : ""}
                >
                  Tutte le Categorie
                </Button>
                {categories.slice(0, 8).map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id.toString())}
                    className={selectedCategory === category.id.toString() ? "gradient-primary" : ""}
                    disabled={categoriesLoading}
                  >
                    {category.name} ({category.count})
                  </Button>
                ))}
              </div>
            </TabsContent>

            {['bevande', 'alcolici', 'alimentari', 'altri'].map((filterType) => (
              <TabsContent key={filterType} value={filterType} className="mt-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      variant={selectedCategory === '' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory('')}
                      className={selectedCategory === '' ? "gradient-primary" : ""}
                    >
                      Tutti {filterType}
                    </Button>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="subcategories">
                      <AccordionTrigger>
                        Sottocategorie {filterType.charAt(0).toUpperCase() + filterType.slice(1)} ({getCategoriesForFilter(filterType).length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {getCategoriesForFilter(filterType).map((category) => (
                            <Button
                              key={category.id}
                              variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedCategory(category.id.toString())}
                              className={selectedCategory === category.id.toString() ? "gradient-primary" : ""}
                              disabled={categoriesLoading}
                            >
                              {category.name} ({category.count})
                            </Button>
                          ))}
                          {getCategoriesForFilter(filterType).length === 0 && (
                            <p className="text-gray-500 text-sm">Nessuna sottocategoria disponibile</p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Ordinamento e Vista */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordina per" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Più recenti</SelectItem>
                  <SelectItem value="title">Nome A-Z</SelectItem>
                  <SelectItem value="price">Prezzo: Basso - Alto</SelectItem>
                  <SelectItem value="popularity">Popolarità</SelectItem>
                  <SelectItem value="rating">Valutazione</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {productsLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">
                {searchQuery ? 'Ricerca in corso...' : 'Caricamento prodotti...'}
              </p>
            </div>
          </div>
        )}

        {/* Products Count */}
        {!productsLoading && (
          <div className="mb-6">
            <p className="text-gray-600">
              {searchQuery 
                ? `Trovati ${transformedProducts.length} prodotti per "${searchQuery}"`
                : `Visualizzando ${transformedProducts.length} prodotti`
              }
              {selectedCategory && categories.find(c => c.id.toString() === selectedCategory) && (
                <span className="ml-2 text-blue-600 font-medium">
                  in "{categories.find(c => c.id.toString() === selectedCategory)?.name}"
                </span>
              )}
            </p>
          </div>
        )}

        {/* Products Grid */}
        {!productsLoading && transformedProducts.length > 0 && (
          <div className={
            viewMode === 'grid' 
              ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {transformedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* No Products Message */}
        {!productsLoading && transformedProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold mb-2">
              {searchQuery ? 'Nessun risultato trovato' : 'Nessun prodotto trovato'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? `Nessun prodotto trovato per "${searchQuery}". Prova con termini diversi.`
                : 'Prova a cambiare i filtri o cerca in una categoria diversa'
              }
            </p>
            <Button
              onClick={() => {
                setSelectedCategory('');
                setActiveMainFilter('tutti');
                if (searchQuery) {
                  window.location.href = '/products';
                }
              }}
              className="gradient-primary"
            >
              {searchQuery ? 'Mostra Tutti i Prodotti' : 'Rimuovi Filtri'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
