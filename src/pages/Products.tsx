import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Grid3X3, List, Loader2 } from 'lucide-react';
import { useWooCommerceProducts } from '@/hooks/useWooCommerce';
import { useSearchParams } from 'react-router-dom';

const Products = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Leggi la categoria dai parametri URL
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);
  
  // Carica tutti i prodotti
  const {
    data: products = [],
    isLoading,
    error
  } = useWooCommerceProducts({
    per_page: 50,
    orderby: 'price',
    order: 'asc',
    stock_status: 'instock'
  });

  // Categorie principali (stessi della pagina index)
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
      id: 'birra', // Cambiato da 'birre' a 'birra'
      name: 'Birre',
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
    
    const categoryName = product.categories[0].name.toLowerCase();
    
    if (categoryName.includes('acqua')) return 'acqua';
    if (categoryName.includes('birra')) return 'birra'; // Cambiato da 'birre' a 'birra'
    if (categoryName.includes('vino')) return 'vino';
    if (categoryName.includes('bevande') || categoryName.includes('coca') || categoryName.includes('fanta') || categoryName.includes('schweppes')) return 'bevande';
    
    return 'altri';
  };

  // Trasforma e filtra i prodotti
  const transformedProducts = products
    .filter(product => product.stock_status === 'instock')
    .map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      image: product.images?.[0]?.src || '/placeholder.svg',
      description: (product.description || product.short_description || '').replace(/<[^>]*>/g, '').trim(),
      inStock: product.stock_status === 'instock',
      category: getProductCategory(product)
    }))
    .filter(product => selectedCategory === 'all' || product.category === selectedCategory)
    .sort((a, b) => a.price - b.price);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
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

        {/* Header con controlli vista */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {selectedCategory === 'all' ? 'Tutti i Prodotti' : categories.find(c => c.id === selectedCategory)?.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {transformedProducts.length} prodotti disponibili
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

        {/* Products grid/list */}
        {!isLoading && transformedProducts.length > 0 && (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5' 
              : 'grid-cols-1'
          }`}>
            {transformedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && transformedProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md mx-auto">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Nessun prodotto trovato</h3>
              <p className="text-gray-600">Non ci sono prodotti disponibili al momento.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;