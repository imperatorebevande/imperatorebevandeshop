import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Grid3X3, List, Loader2, Search, X } from 'lucide-react';
import { useWooCommerceProducts, useWooCommerceCategories } from '@/hooks/useWooCommerce';
import { useSearchParams } from 'react-router-dom';
import { getBorderColor } from '@/lib/utils';

const Products = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Focus automatico sulla barra di ricerca se si arriva dal pulsante Cerca
  useEffect(() => {
    if (searchParams.get('search') === 'focus' && searchInputRef.current) {
      searchInputRef.current.focus();
      // Rimuovi il parametro search=focus dall'URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('search');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  // Carica la prima pagina di prodotti (100 prodotti)
  const { data: firstPageProducts = [], error: firstPageError, isLoading: isLoadingFirstPage } = useWooCommerceProducts({
    per_page: 100,
    page: 1,
    status: 'publish'
  });
  
  // Carica la seconda pagina di prodotti (i rimanenti)
  const { data: secondPageProducts = [], error: secondPageError, isLoading: isLoadingSecondPage } = useWooCommerceProducts({
    per_page: 100,
    page: 2,
    status: 'publish'
  });
  
  // Definisci la variabile error combinando gli errori di entrambe le pagine
  const error = firstPageError || secondPageError;
  
  // Definisci la variabile isLoading combinando i loading states di entrambe le pagine
  const isLoading = isLoadingFirstPage || isLoadingSecondPage;
  
  // Combina i prodotti di entrambe le pagine
  useEffect(() => {
    const combinedProducts = [...firstPageProducts, ...secondPageProducts];
    // Rimuovi eventuali duplicati basandoti sull'ID
    const uniqueProducts = combinedProducts.filter((product, index, self) =>
      index === self.findIndex((p) => p.id === product.id)
    );
    setAllProducts(uniqueProducts);
  }, [firstPageProducts, secondPageProducts]);
  
  // Carica tutte le categorie
  const { data: allCategories = [] } = useWooCommerceCategories({
    per_page: 100,
    hide_empty: true
  });

  // Modifica l'effetto per gestire il cambio di categoria
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);
  
  // Categorie principali (aggiornate con gli slug corretti di WooCommerce)
  const categories = [
    {
      id: 'all',
      name: 'Tutti',
      bgColor: 'bg-gradient-to-br from-gray-100 to-gray-200',
      textColor: 'text-gray-800',
      icon: '🛒'
    },
    {
      id: 'acqua',
      name: 'Acqua',
      bgColor: 'bg-gradient-to-br from-blue-100 to-blue-200',
      textColor: 'text-blue-800',
      icon: '💧'
    },
    {
      id: 'birra',  // Corretto, era già giusto
      name: 'Birra',
      bgColor: 'bg-gradient-to-br from-amber-100 to-amber-200',
      textColor: 'text-amber-800',
      icon: '🍺'
    },
    {
      id: 'vino',
      name: 'Vino',
      bgColor: 'bg-gradient-to-br from-purple-100 to-purple-200',
      textColor: 'text-purple-800',
      icon: '🍷'
    },
    {
      id: 'bevande',
      name: 'Bevande',
      bgColor: 'bg-gradient-to-br from-green-100 to-green-200',
      textColor: 'text-green-800',
      icon: '🥤'
    }
  ];

  // Funzione per determinare la categoria di un prodotto
  const getProductCategory = (product: any): string => {
    if (!product.categories || product.categories.length === 0) return 'altri';
    
    // Usa lo slug della categoria invece del nome
    const categorySlug = product.categories[0].slug.toLowerCase();
    
    if (categorySlug === 'acqua' || categorySlug.includes('acqua-')) return 'acqua';
    if (categorySlug === 'birra' || categorySlug.includes('birra-')) return 'birra';
    if (categorySlug === 'vino' || categorySlug.includes('vino-')) return 'vino';
    if (categorySlug === 'bevande' || categorySlug.includes('bevande-') || 
        categorySlug === 'cocacola' || categorySlug === 'fanta' || 
        categorySlug === 'sanbenedetto' || categorySlug === 'sanpellegrino' || 
        categorySlug === 'schweppes' || categorySlug.includes('altre-bevande')) return 'bevande';
    
    return 'altri';
  };

  // Funzione per raggruppare prodotti per sottocategoria (aggiornata per la ricerca)
  const groupProductsBySubcategory = (products: any[]) => {
    // Se c'è una ricerca attiva e nessun filtro categoria, raggruppa sempre per sottocategoria
    if (searchQuery && selectedCategory === 'all') {
      const grouped: { [key: string]: any[] } = {};
      
      products.forEach(product => {
        if (product.categories && product.categories.length > 0) {
          // Trova la categoria principale del prodotto
          const mainCategory = product.categories.find((cat: any) => cat.parent === 0) || product.categories[0];
          const categoryName = mainCategory.name;
          
          if (!grouped[categoryName]) {
            grouped[categoryName] = [];
          }
          grouped[categoryName].push(product);
        } else {
          // Prodotti senza categoria
          if (!grouped['Altri']) {
            grouped['Altri'] = [];
          }
          grouped['Altri'].push(product);
        }
      });
      
      return grouped;
    }
    
    // Comportamento originale per altri casi
    if (selectedCategory === 'all' && !searchQuery) {
      return { 'Tutti i prodotti': products };
    }

    const grouped: { [key: string]: any[] } = {};
    
    products.forEach(product => {
      if (product.categories && product.categories.length > 0) {
        // Trova tutte le categorie del prodotto che appartengono alla categoria selezionata
        const relevantCategories = product.categories.filter((cat: any) => {
          const categorySlug = cat.slug.toLowerCase();
          
          // Verifica se la categoria corrisponde alla categoria selezionata
          if (selectedCategory === 'acqua' && (categorySlug === 'acqua' || categorySlug.includes('acqua-'))) return true;
          if (selectedCategory === 'birra' && (categorySlug === 'birra' || categorySlug.includes('birra-'))) return true;
          if (selectedCategory === 'vino' && (categorySlug === 'vino' || categorySlug.includes('vino-'))) return true;
          if (selectedCategory === 'bevande' && (
            categorySlug === 'bevande' || categorySlug.includes('bevande-') ||
            categorySlug === 'cocacola' || categorySlug === 'fanta' ||
            categorySlug === 'sanbenedetto' || categorySlug === 'sanpellegrino' ||
            categorySlug === 'schweppes' || categorySlug.includes('altre-bevande')
          )) return true;
          
          return false;
        });

        if (relevantCategories.length > 0) {
          // Usa la categoria più specifica (quella con parent diverso da 0 se esiste)
          const subcategory = relevantCategories.find((cat: any) => cat.parent !== 0) || relevantCategories[0];
          const subcategoryName = subcategory.name;
          
          if (!grouped[subcategoryName]) {
            grouped[subcategoryName] = [];
          }
          grouped[subcategoryName].push(product);
        }
      }
    });

    // Se non ci sono sottocategorie, raggruppa tutto sotto la categoria principale
    if (Object.keys(grouped).length === 0 && products.length > 0) {
      const categoryName = categories.find(c => c.id === selectedCategory)?.name || 'Prodotti';
      grouped[categoryName] = products;
    }

    return grouped;
  };

  // Trasforma e filtra i prodotti (aggiornato con filtro di ricerca)
  const transformedProducts = allProducts
    .filter(product => product.stock_status === 'instock')
    .map(product => {
      const category = getProductCategory(product);
      return {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        image: product.images?.[0]?.src || '/placeholder.svg',
        description: (product.description || product.short_description || '').replace(/<[^>]*>/g, '').trim(),
        inStock: product.stock_status === 'instock',
        category: category,
        categories: product.categories
      };
    })
    .filter(product => {
      // Filtro per categoria
      const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
      
      // Filtro per ricerca (case-insensitive)
      const searchMatch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return categoryMatch && searchMatch;
    })
    .sort((a, b) => a.price - b.price);

  // Raggruppa i prodotti per sottocategoria
  const groupedProducts = groupProductsBySubcategory(transformedProducts);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryId });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md mx-auto">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Errore nel caricamento</h3>
              <p className="text-gray-600 mb-4">Non è stato possibile caricare i prodotti.</p>
              <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700">
                Riprova
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Funzione per pulire la ricerca
  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Aggiungi pb-20 per evitare la sovrapposizione con la bottom navigation mobile */}
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Filtri per Categoria */}
        <section className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Filtra per Categoria
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 max-w-4xl mx-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`group transition-all duration-300 ${
                  selectedCategory === category.id ? 'scale-105 shadow-lg' : 'hover:scale-105 hover:shadow-lg'
                }`}
              >
                <Card className={`${category.bgColor} border-0 overflow-hidden h-24 md:h-28 ${
                  selectedCategory === category.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}>
                  <CardContent className="p-3 h-full flex flex-col justify-center items-center text-center">
                    <div className="text-2xl md:text-3xl mb-1">
                      {category.icon}
                    </div>
                    <h3 className={`text-sm md:text-base font-bold ${category.textColor}`}>
                      {category.name}
                    </h3>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </section>

        {/* Barra di Ricerca */}
        <section className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cerca prodotti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Header con controlli vista */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: selectedCategory !== 'all' ? getBorderColor(selectedCategory) : '#374151' }}>
              {searchQuery ? `Risultati ricerca` : (selectedCategory === 'all' ? 'Tutti i Prodotti' : categories.find(c => c.id === selectedCategory)?.name)}
            </h1>
            <p className="text-gray-600 mt-1">
              {transformedProducts.length} prodotti {searchQuery || selectedCategory !== 'all' ? 'trovati' : 'disponibili'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="p-2"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="p-2"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600">Caricamento prodotti...</p>
            </div>
          </div>
        )}

        {/* Products grouped by subcategory */}
        {!isLoading && transformedProducts.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedProducts).map(([subcategoryName, subcategoryProducts]) => (
              <div key={subcategoryName} className="space-y-4">
                {/* Titolo sottocategoria (solo se non è "Tutti i prodotti" e ci sono più sottocategorie) */}
                {Object.keys(groupedProducts).length > 1 && subcategoryName !== 'Tutti i prodotti' && (
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2" style={{ 
                      color: selectedCategory === 'all' 
                        ? getCategoryColorFromSubcategoryName(subcategoryName) 
                        : getBorderColor(selectedCategory) 
                    }}>
                      <span className="w-1 h-6 rounded" style={{ 
                        backgroundColor: selectedCategory === 'all' 
                          ? getCategoryColorFromSubcategoryName(subcategoryName) 
                          : getBorderColor(selectedCategory) 
                      }}></span>
                      {subcategoryName}
                      <span className="text-sm font-normal text-gray-500">({subcategoryProducts.length} prodotti)</span>
                    </h3>
                  </div>
                )}
                
                {/* Griglia prodotti per sottocategoria */}
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5' 
                    : 'grid-cols-1'
                }`}>
                  {subcategoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state aggiornato per la ricerca */}
        {!isLoading && transformedProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md mx-auto">
              <div className="text-6xl mb-4">{searchQuery ? '🔍' : '📦'}</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                {searchQuery ? 'Nessun risultato trovato' : 'Nessun prodotto trovato'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? `Non ci sono prodotti che corrispondono a "${searchQuery}".`
                  : 'Non ci sono prodotti disponibili al momento.'
                }
              </p>
              {searchQuery && (
                <Button onClick={clearSearch} variant="outline">
                  Cancella ricerca
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;


// Funzione per determinare il colore della categoria basandosi sul nome della sottocategoria
const getCategoryColorFromSubcategoryName = (subcategoryName: string): string => {
  const lowerName = subcategoryName.toLowerCase();
  
  if (lowerName.includes('acqua')) return '#1B5AAB'; // blu
  if (lowerName.includes('birra')) return '#CFA100'; // giallo/oro
  if (lowerName.includes('bevande') || lowerName.includes('coca') || lowerName.includes('fanta') || lowerName.includes('schweppes')) return '#558E28'; // verde
  if (lowerName.includes('vino')) return '#8500AF'; // viola
  
  return '#374151'; // grigio di default
};