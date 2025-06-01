
import React from 'react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Star, Truck, Shield, Headphones, MapPin, Clock, Droplets, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWooCommerceBestSellingProducts, useWooCommerceSaleProducts } from '@/hooks/useWooCommerce';

const Index = () => {
  // Calcola il numero di prodotti per 2 righe basato sulla griglia responsive
  // Mobile: 2 colonne × 2 righe = 4 prodotti
  // Medium: 4 colonne × 2 righe = 8 prodotti  
  // Large/XL: 5 colonne × 2 righe = 10 prodotti
  // Usiamo 10 come massimo per coprire tutti i casi
  const { data: bestSellingProducts = [], isLoading: bestSellingLoading } = useWooCommerceBestSellingProducts({ per_page: 10 });
  const { data: saleProducts = [], isLoading: saleLoading } = useWooCommerceSaleProducts({ per_page: 4 });

  // Trasforma i prodotti WooCommerce nel formato atteso da ProductCard includendo stock status
  const transformWooCommerceProduct = (product: any) => {
    const getMainCategory = (product: any): string => {
      if (!product.categories || product.categories.length === 0) return 'altri';
      
      const categoryName = product.categories[0].name.toLowerCase();
      
      if (categoryName.includes('acqua')) return 'acqua';
      if (categoryName.includes('birra')) return 'birra';
      if (categoryName.includes('vino')) return 'vino';
      if (categoryName.includes('bevande') || categoryName.includes('coca') || categoryName.includes('fanta') || categoryName.includes('schweppes')) return 'bevande';
      
      return 'altri';
    };
    
    return {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      originalPrice: product.regular_price && product.sale_price && parseFloat(product.regular_price) > parseFloat(product.sale_price) ? parseFloat(product.regular_price) : undefined,
      image: product.images?.[0]?.src || '/placeholder.svg',
      rating: parseFloat(product.average_rating) || 0,
      reviews: product.rating_count || 0,
      stock_status: product.stock_status,
      inStock: product.stock_status === 'instock',
      category: getMainCategory(product),
      description: product.description || product.short_description || '' // Aggiunta descrizione
    };
  };

  const transformedBestSellingProducts = bestSellingProducts.map(transformWooCommerceProduct);
  const transformedSaleProducts = saleProducts.map(transformWooCommerceProduct);

  // Categorie principali
  const categories = [
    {
      name: 'Acqua',
      bgColor: 'bg-gradient-to-br from-blue-100 to-blue-200',
      textColor: 'text-blue-800',
      icon: '💧',
      link: '/products?category=acqua'
    },
    {
      name: 'Birre',
      bgColor: 'bg-gradient-to-br from-amber-100 to-amber-200',
      textColor: 'text-amber-800',
      icon: '🍺',
      link: '/products?category=birre'
    },
    {
      name: 'Vino',
      bgColor: 'bg-gradient-to-br from-purple-100 to-purple-200',
      textColor: 'text-purple-800',
      icon: '🍷',
      link: '/products?category=vino'
    },
    {
      name: 'Bevande',
      bgColor: 'bg-gradient-to-br from-green-100 to-green-200',
      textColor: 'text-green-800',
      icon: '🥤',
      link: '/products?category=bevande'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 sm:py-12 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Imperatore
            <span className="block text-blue-200">Bevande</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 opacity-90 max-w-3xl mx-auto px-2">
            Consegna di acqua e bevande direttamente a casa tua a Bari
          </p>
          <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg">
            <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-blue-200" />
            <span className="px-2">Servizio di consegna a domicilio su Bari</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link to="/products">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3">
                Scopri i Prodotti
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3">
              Offerte Speciali
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section - Horizontal scroll on mobile */}
      <section className="py-6 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-3 md:gap-4 md:max-w-4xl md:mx-auto">
            {/* Step 1 - SCEGLI */}
            <div className="bg-gray-50 rounded-lg p-3 text-center hover:shadow-md transition-all duration-300 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
              <div className="mb-2">
                <span className="text-2xl md:text-3xl font-black text-red-500 block leading-none">
                  01.
                </span>
                <h3 className="text-base md:text-lg font-black text-gray-800 mt-1">
                  SCEGLI
                </h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Scegli l'acqua o le bevande che più ti interessano
              </p>
            </div>

            {/* Step 2 - ORDINA */}
            <div className="bg-gray-50 rounded-lg p-3 text-center hover:shadow-md transition-all duration-300 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
              <div className="mb-2">
                <span className="text-2xl md:text-3xl font-black text-red-500 block leading-none">
                  02.
                </span>
                <h3 className="text-base md:text-lg font-black text-gray-800 mt-1">
                  ORDINA
                </h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Seleziona la quantità desiderata. Nessun ordine minimo!
              </p>
            </div>

            {/* Step 3 - RICEVI */}
            <div className="bg-gray-50 rounded-lg p-3 text-center hover:shadow-md transition-all duration-300 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
              <div className="mb-2">
                <span className="text-2xl md:text-3xl font-black text-red-500 block leading-none">
                  03.
                </span>
                <h3 className="text-base md:text-lg font-black text-gray-800 mt-1">
                  RICEVI
                </h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Ricevi la consegna a casa entro un giorno lavorativo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Shop By Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Categorie prodotti
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <Link key={index} to={category.link} className="group">
                <Card className={`${category.bgColor} border-0 overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-105 h-32 md:h-36`}>
                  <CardContent className="p-4 h-full flex flex-col justify-center items-center text-center">
                    <div className="text-4xl md:text-5xl mb-2">
                      {category.icon}
                    </div>
                    <h3 className={`text-lg md:text-xl font-bold ${category.textColor}`}>
                      {category.name}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Prodotti Più Acquistati */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Prodotti Più Acquistati
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              I prodotti preferiti dai nostri clienti
            </p>
          </div>
          
          {bestSellingLoading ? (
            <div className="text-center py-8">
              <p>Caricamento prodotti più acquistati...</p>
            </div>
          ) : (
            <>
              {/* Mobile: mostra solo 4 prodotti */}
              <div className="grid grid-cols-2 gap-6 mb-8 md:hidden">
                {transformedBestSellingProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {/* Medium: mostra 8 prodotti */}
              <div className="hidden md:grid md:grid-cols-4 lg:hidden gap-6 mb-8">
                {transformedBestSellingProducts.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {/* Large e XL: mostra 10 prodotti */}
              <div className="hidden lg:grid lg:grid-cols-5 xl:grid-cols-5 gap-6 mb-8">
                {transformedBestSellingProducts.slice(0, 10).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
          
          <div className="text-center">
            <Link to="/products">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white">
                Vedi Tutti i Prodotti
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Features Section - Compact and always horizontal */}
      <section className="py-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-5 left-5 w-20 h-20 bg-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-5 right-5 w-16 h-16 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
            {/* Consegna Veloce - Compact */}
            <div className="group">
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 h-full border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="text-center">
                  <div className="relative mb-3">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold mb-2 text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                    <span className="text-transparent bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text">
                      Consegna Veloce
                    </span>
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Consegna gratuita su Bari per ordini superiori a 5€                 </p>
                </div>
              </div>
            </div>
            
            {/* Orari Flessibili - Compact */}
            <div className="group">
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 h-full border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="text-center">
                  <div className="relative mb-3">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold mb-2 text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                    <span className="text-transparent bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text">
                      Orari Flessibili
                    </span>
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Consegne dal lunedì al sabato negli orari che preferisci
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offers */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🔥 Offerte Speciali
            </h2>
            <p className="text-gray-600">Sconti limitati nel tempo!</p>
          </div>
          
          {saleLoading ? (
            <div className="text-center py-8">
              <p>Caricamento offerte...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-6">
              {transformedSaleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Le RECENSIONI dei nostri clienti
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* ... existing reviews code ... */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Imperatore Bevande</h3>
              <p className="text-gray-400">
                Consegna di acqua e bevande a domicilio su Bari. Qualità e puntualità garantite.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Link Utili</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/products" className="hover:text-white transition-colors">Prodotti</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Chi Siamo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contatti</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Servizi</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Consegna a Domicilio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Zona di Consegna</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Orari di Consegna</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Modalità di Pagamento</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contatti</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📞 Tel: +39 XXX XXX XXXX</li>
                <li>📧 Email: info@imperatorebevande.it</li>
                <li>📍 Bari, Puglia</li>
                <li>🕒 Lun-Sab: 8:00-18:00</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Imperatore Bevande. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
