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
  const [sortBy, setSortBy] = useState('price');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMainFilter, setActiveMainFilter] = useState('acqua'); // Default to ACQUA

  // Usa la ricerca se c'è una query, altrimenti carica tutti i prodotti
  const shouldUseSearch = searchQuery.length > 0;

  // Hook per ricerca prodotti
  const searchResults = useWooCommerceSearch(searchQuery, {
    per_page: 20,
    category: selectedCategory || undefined,
    orderby: sortBy as any,
    order: 'desc'
  }, {
    enabled: shouldUseSearch
  });

  // Hook per tutti i prodotti (quando non c'è ricerca)
  const allProductsResults = useWooCommerceProducts({
    per_page: 20,
    category: selectedCategory || undefined,
    orderby: sortBy as any,
    order: sortBy === 'price' ? 'asc' : 'desc'
  }, {
    enabled: !shouldUseSearch
  });

  // Seleziona i risultati appropriati
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError
  } = shouldUseSearch ? searchResults : allProductsResults;

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

  // Organizza le categorie usando i nomi esatti da WooCommerce
  const organizedCategories = {
    acqua: categories.filter(cat => {
      const name = cat.name.toLowerCase();
      return name === 'acqua' || name.includes('acqua effervescente') || name.includes('acqua frizzante') || name.includes('acqua naturale') || name.includes('acqua minerale');
    }),
    birre: categories.filter(cat => {
      const name = cat.name.toLowerCase();
      return name === 'birra' || name.includes('birra da') || name.includes('birra in lattina');
    }),
    vino: categories.filter(cat => {
      const name = cat.name.toLowerCase();
      return name === 'vino';
    }),
    bevande: categories.filter(cat => {
      const name = cat.name.toLowerCase();
      return name === 'bevande' || name === 'altre bevande' || name === 'cocacola' || name === 'fanta' || name === 'schweppes' || name.includes('sanbenedetto') && !name.includes('acqua') || name.includes('sanpellegrino') && !name.includes('acqua');
    }),
    altri: categories.filter(cat => {
      const name = cat.name.toLowerCase();
      // Escludi categorie già assegnate ad altre macro-categorie
      return !name.includes('acqua') && !name.includes('birra') && !name.includes('vino') && !name.includes('bevande') && name !== 'cocacola' && name !== 'fanta' && name !== 'schweppes' && !name.includes('sanbenedetto') && !name.includes('sanpellegrino');
    })
  };

  // Trasforma i prodotti WooCommerce nel formato atteso da ProductCard includendo stock status
  const transformedProducts = products.map(product => {
    console.log('Transforming product:', product.name, 'Stock status:', product.stock_status);
    console.log('Description:', product.description);
    console.log('Short description length:', product.short_description ? product.short_description.length : 'undefined');
    
    // Aggiungi log per clean description
    const description = product.description || product.short_description || '';
    const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
    console.log('Clean description:', cleanDescription);
    
    // Determina la categoria principale del prodotto
    const getMainCategory = (product: any) => {
      if (!product.categories || product.categories.length === 0) return undefined;
      
      const categoryName = product.categories[0].name.toLowerCase();
      
      if (categoryName.includes('acqua')) return 'acqua';
      if (categoryName.includes('birra')) return 'birra';
      if (categoryName.includes('vino')) return 'vino';
      if (categoryName.includes('bevande') || categoryName.includes('coca') || categoryName.includes('fanta') || categoryName.includes('schweppes')) return 'bevande';
      
      return 'altri';
    };
    
    return {
      id: product.id,
      name: product.name || 'Prodotto senza nome',
      price: product.price ? parseFloat(product.price) : 0,
      originalPrice: product.regular_price && product.sale_price && parseFloat(product.regular_price) > parseFloat(product.sale_price) ? parseFloat(product.regular_price) : undefined,
      image: product.images && product.images.length > 0 ? product.images[0].src : '/placeholder.svg',
      rating: product.average_rating ? parseFloat(product.average_rating) : 0,
      reviews: product.rating_count || 0,
      stock_status: product.stock_status,
      inStock: product.stock_status === 'instock',
      category: getMainCategory(product),
      description: product.description || product.short_description || ''
    };
  });

  // Filtra prodotti disponibili per primi
  const sortedProducts = transformedProducts.sort((a, b) => {
    if (a.inStock && !b.inStock) return -1;
    if (!a.inStock && b.inStock) return 1;
    return 0;
  });
  console.log('Products from API:', products.length);
  console.log('Transformed products:', transformedProducts.length);
  console.log('Search query:', searchQuery);
  if (productsError) {
    return <div className="min-h-screen bg-gray-50">
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
            <Button onClick={() => window.location.reload()} className="gradient-primary">
              Riprova
            </Button>
          </div>
        </div>
      </div>;
  }
  const getCategoriesForFilter = (filterType: string) => {
    switch (filterType) {
      case 'acqua':
        return organizedCategories.acqua;
      case 'birre':
        return organizedCategories.birre;
      case 'vino':
        return organizedCategories.vino;
      case 'bevande':
        return organizedCategories.bevande;
      case 'altri':
        return organizedCategories.altri;
      default:
        return categories;
    }
  };

  // Funzione per ottenere i colori dei bottoni delle categorie principali
  const getCategoryButtonClass = (category: string, isSelected: boolean) => {
    const baseClass = "font-medium transition-all duration-200 ";
    if (isSelected) {
      switch (category) {
        case 'acqua':
          return baseClass + "bg-blue-500 text-white hover:bg-blue-600";
        case 'birre':
          return baseClass + "bg-yellow-500 text-white hover:bg-yellow-600";
        case 'vino':
          return baseClass + "bg-purple-500 text-white hover:bg-purple-600";
        case 'bevande':
          return baseClass + "bg-green-500 text-white hover:bg-green-600";
        default:
          return baseClass + "bg-gray-500 text-white hover:bg-gray-600";
      }
    } else {
      switch (category) {
        case 'acqua':
          return baseClass + "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100";
        case 'birre':
          return baseClass + "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100";
        case 'vino':
          return baseClass + "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100";
        case 'bevande':
          return baseClass + "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100";
        default:
          return baseClass + "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100";
      }
    }
  };

  // Funzione per gestire il click sulla categoria principale
  const handleMainCategoryClick = (category: string) => {
    setActiveMainFilter(category);
    setSelectedCategory(''); // Reset sottocategoria quando cambia macro categoria
  };

  // Ottieni le categorie ID per il filtro della macro categoria
  const getMainCategoryIds = (filterType: string) => {
    const categoriesForFilter = getCategoriesForFilter(filterType);
    return categoriesForFilter.map(cat => cat.id.toString()).join(',');
  };

  // Hook per prodotti della macro categoria (quando non c'è sottocategoria selezionata)
  const mainCategoryProducts = useWooCommerceProducts({
    per_page: 50,
    category: !selectedCategory && activeMainFilter !== 'tutti' ? getMainCategoryIds(activeMainFilter) : undefined,
    orderby: sortBy as any,
    order: sortBy === 'price' ? 'asc' : 'desc'
  }, {
    enabled: !shouldUseSearch && !selectedCategory && activeMainFilter !== 'tutti'
  });

  // Usa i prodotti della macro categoria se non c'è sottocategoria selezionata
  const finalProducts = !selectedCategory && activeMainFilter !== 'tutti' && !shouldUseSearch ? mainCategoryProducts.data || [] : products;
  const finalTransformedProducts = finalProducts.map(product => {
    // Determina la categoria principale del prodotto
    const getMainCategory = (product: any) => {
      if (!product.categories || product.categories.length === 0) return undefined;
      
      const categoryName = product.categories[0].name.toLowerCase();
      
      if (categoryName.includes('acqua')) return 'acqua';
      if (categoryName.includes('birra')) return 'birra';
      if (categoryName.includes('vino')) return 'vino';
      if (categoryName.includes('bevande') || categoryName.includes('coca') || categoryName.includes('fanta') || categoryName.includes('schweppes')) return 'bevande';
      
      return 'altri';
    };
    
    return {
      id: product.id,
      name: product.name || 'Prodotto senza nome',
      price: product.price ? parseFloat(product.price) : 0,
      originalPrice: product.regular_price && product.sale_price && parseFloat(product.regular_price) > parseFloat(product.sale_price) ? parseFloat(product.regular_price) : undefined,
      image: product.images && product.images.length > 0 ? product.images[0].src : '/placeholder.svg',
      rating: product.average_rating ? parseFloat(product.average_rating) : 0,
      reviews: product.rating_count || 0,
      stock_status: product.stock_status,
      inStock: product.stock_status === 'instock',
      category: getMainCategory(product),
      description: product.description || product.short_description || ''
    };
  });
  const finalSortedProducts = finalTransformedProducts
    .filter(product => product.inStock) // Filtra solo prodotti disponibili
    .sort((a, b) => {
      if (a.inStock && !b.inStock) return -1;
      if (!a.inStock && b.inStock) return 1;
      return 0;
    });
  const isMainCategoryLoading = !selectedCategory && activeMainFilter !== 'tutti' && !shouldUseSearch ? mainCategoryProducts.isLoading : productsLoading;
  return <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gradient text-sky-500">
            {searchQuery ? `Risultati per "${searchQuery}"` : 'I Nostri Prodotti'}
          </h1>
          <p className="text-gray-600 text-lg">
            {searchQuery ? `Prodotti trovati per la tua ricerca` : 'Scopri la nostra vasta gamma di prodotti dal negozio Imperatore Bevande'}
          </p>
        </div>

        {/* Filtri Organizzati */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-xl bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">Filtri Prodotti</span>
          </div>

          <Tabs value={activeMainFilter} onValueChange={handleMainCategoryClick} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-gradient-to-r from-gray-100 to-gray-200 p-1.5 rounded-xl shadow-inner">
              <TabsTrigger value="acqua" className={getCategoryButtonClass('acqua', activeMainFilter === 'acqua') + " rounded-lg mx-1"}>
                <span className="flex items-center gap-2">
                  <span className="text-lg">💧</span>
                  <span className="font-semibold">ACQUA</span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="birre" className={getCategoryButtonClass('birre', activeMainFilter === 'birre') + " rounded-lg mx-1"}>
                <span className="flex items-center gap-2">
                  <span className="text-lg">🍺</span>
                  <span className="font-semibold">BIRRE</span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="vino" className={getCategoryButtonClass('vino', activeMainFilter === 'vino') + " rounded-lg mx-1"}>
                <span className="flex items-center gap-2">
                  <span className="text-lg">🍷</span>
                  <span className="font-semibold">VINO</span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="bevande" className={getCategoryButtonClass('bevande', activeMainFilter === 'bevande') + " rounded-lg mx-1"}>
                <span className="flex items-center gap-2">
                  <span className="text-lg">🥤</span>
                  <span className="font-semibold">BEVANDE</span>
                </span>
              </TabsTrigger>
            </TabsList>

            {['acqua', 'birre', 'vino', 'bevande'].map(filterType => <TabsContent key={filterType} value={filterType} className="mt-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button variant={selectedCategory === '' ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory('')} className={selectedCategory === '' ? getCategoryButtonClass(filterType, true) : getCategoryButtonClass(filterType, false)}>
                      Tutti {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg mb-3">
                      Sottocategorie {filterType.charAt(0).toUpperCase() + filterType.slice(1)} ({getCategoriesForFilter(filterType).length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getCategoriesForFilter(filterType).map(category => <Button key={category.id} variant={selectedCategory === category.id.toString() ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(category.id.toString())} className={selectedCategory === category.id.toString() ? getCategoryButtonClass(filterType, true) : getCategoryButtonClass(filterType, false)} disabled={categoriesLoading}>
                          {category.name} ({category.count})
                        </Button>)}
                      {getCategoriesForFilter(filterType).length === 0 && <p className="text-gray-500 text-sm">Nessuna sottocategoria disponibile</p>}
                    </div>
                  </div>
                </div>
              </TabsContent>)}
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
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="rounded-r-none">
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-l-none">
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isMainCategoryLoading && <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">
                {searchQuery ? 'Ricerca in corso...' : 'Caricamento prodotti...'}
              </p>
            </div>
          </div>}

        {/* Products Count */}
        {!isMainCategoryLoading && <div className="mb-6">
            <p className="text-gray-600">
              {searchQuery ? `Trovati ${finalSortedProducts.length} prodotti per "${searchQuery}"` : `Visualizzando ${finalSortedProducts.length} prodotti`}
              {selectedCategory && categories.find(c => c.id.toString() === selectedCategory) && <span className="ml-2 text-blue-600 font-medium">
                  in "{categories.find(c => c.id.toString() === selectedCategory)?.name}"
                </span>}
              {!selectedCategory && activeMainFilter !== 'tutti' && <span className="ml-2 text-blue-600 font-medium">
                  in categoria "{activeMainFilter.toUpperCase()}"
                </span>}
            </p>
          </div>}

        {/* Products Grid - layout responsive migliorato */}
        {!isMainCategoryLoading && finalSortedProducts.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className={viewMode === 'grid' ? 
              "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-6" : 
              "space-y-4"
            }>
              {finalSortedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* No Products Message */}
        {!isMainCategoryLoading && finalSortedProducts.length === 0 && <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold mb-2">
              {searchQuery ? 'Nessun risultato trovato' : 'Nessun prodotto trovato'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? `Nessun prodotto trovato per "${searchQuery}". Prova con termini diversi.` : 'Prova a cambiare i filtri o cerca in una categoria diversa'}
            </p>
            <Button onClick={() => {
          setSelectedCategory('');
          setActiveMainFilter('acqua');
          if (searchQuery) {
            window.location.href = '/products';
          }
        }} className="gradient-primary">
              {searchQuery ? 'Mostra Tutti i Prodotti' : 'Rimuovi Filtri'}
            </Button>
          </div>}
      </div>
    </div>;
};
export default Products;
