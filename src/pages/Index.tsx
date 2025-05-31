
import React from 'react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Star, Truck, Shield, Headphones, MapPin, Clock, Droplets, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWooCommerceBestSellingProducts, useWooCommerceSaleProducts } from '@/hooks/useWooCommerce';

const Index = () => {
  const { data: bestSellingProducts = [], isLoading: bestSellingLoading } = useWooCommerceBestSellingProducts({ per_page: 4 });
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

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Truck className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-semibold mb-2">Consegna Veloce</h3>
                <p className="text-gray-600">Consegna gratuita a Bari per ordini sopra i 30€</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Droplets className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-semibold mb-2">Acqua di Qualità</h3>
                <p className="text-gray-600">Acqua naturale e bevande delle migliori marche</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Clock className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-semibold mb-2">Orari Flessibili</h3>
                <p className="text-gray-600">Consegne dal lunedì al sabato negli orari che preferisci</p>
              </CardContent>
            </Card>
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-6 mb-8">
              {transformedBestSellingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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
            {[
              {
                name: "Davis Dorwart",
                role: "Serial Entrepreneur",
                rating: 5,
                review: "Lorem ipsum dolor sit amet, adipiscing elit. Donec malesuada justo vitaeaugue suscipit beautiful vehicula",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
              },
              {
                name: "Wilson Dias",
                role: "Backend Developer",
                rating: 5,
                review: "Lorem ipsum dolor sit amet, adipiscing elit. Donec malesuada justo vitaeaugue suscipit beautiful vehicula",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
              },
              {
                name: "Maria Rossi",
                role: "Cliente Soddisfatta",
                rating: 5,
                review: "Servizio eccellente! Consegna puntuale e acqua sempre fresca. Consigliatissimo per chi cerca qualità!",
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
              },
              {
                name: "Giuseppe Bianchi",
                role: "Imprenditore Locale",
                rating: 5,
                review: "Finalmente un servizio di consegna acqua affidabile a Bari. Prezzi competitivi e qualità ottima.",
                avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face"
              },
            ].map((review, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                {/* Rating Stars */}
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Review Text */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {review.review}
                </p>
                
                {/* Reviewer Info */}
                <div className="flex items-center">
                  <img 
                    src={review.avatar} 
                    alt={review.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{review.name}</p>
                    <p className="text-sm text-gray-500">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
