
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Star, Truck, Shield, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWooCommerceFeaturedProducts, useWooCommerceSaleProducts } from '@/hooks/useWooCommerce';

const Index = () => {
  const { data: featuredProducts = [], isLoading: featuredLoading } = useWooCommerceFeaturedProducts({ per_page: 4 });
  const { data: saleProducts = [], isLoading: saleLoading } = useWooCommerceSaleProducts({ per_page: 4 });

  // Trasforma i prodotti WooCommerce nel formato atteso da ProductCard
  const transformWooCommerceProduct = (product: any) => ({
    id: product.id,
    name: product.name,
    price: parseFloat(product.price),
    originalPrice: product.regular_price ? parseFloat(product.regular_price) : undefined,
    image: product.images?.[0]?.src || '/placeholder.svg',
    rating: parseFloat(product.average_rating) || 0,
    reviews: product.rating_count || 0,
  });

  const transformedFeaturedProducts = featuredProducts.map(transformWooCommerceProduct);
  const transformedSaleProducts = saleProducts.map(transformWooCommerceProduct);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="gradient-primary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Il Tuo Shop
            <span className="block text-yellow-300">del Futuro</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
            Scopri i migliori prodotti tech con spedizione veloce e garanzia di qualità
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3">
                Scopri i Prodotti
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-3">
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
                <Truck className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-semibold mb-2">Spedizione Veloce</h3>
                <p className="text-gray-600">Consegna gratuita per ordini sopra i 50€</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Shield className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-semibold mb-2">Garanzia Totale</h3>
                <p className="text-gray-600">2 anni di garanzia su tutti i prodotti</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Headphones className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-semibold mb-2">Supporto 24/7</h3>
                <p className="text-gray-600">Assistenza clienti sempre disponibile</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
              Prodotti in Evidenza
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              I nostri prodotti più popolari selezionati per te
            </p>
          </div>
          
          {featuredLoading ? (
            <div className="text-center py-8">
              <p>Caricamento prodotti in evidenza...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {transformedFeaturedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          <div className="text-center">
            <Link to="/products">
              <Button size="lg" className="gradient-primary hover:opacity-90">
                Vedi Tutti i Prodotti
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Special Offers */}
      <section className="py-16 bg-gradient-to-r from-pink-100 to-purple-100">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cosa Dicono i Nostri Clienti
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Marco Rossi",
                rating: 5,
                review: "Ottima qualità e spedizione velocissima! Consiglio vivamente questo shop.",
              },
              {
                name: "Laura Bianchi",
                rating: 5,
                review: "Prodotti eccellenti e assistenza clienti fantastica. Tornerò sicuramente!",
              },
              {
                name: "Giuseppe Verdi",
                rating: 4,
                review: "Buon rapporto qualità-prezzo e molte opzioni di pagamento. Molto soddisfatto.",
              },
            ].map((review, index) => (
              <Card key={index} className="p-6">
                <CardContent className="pt-0">
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
                  <p className="text-gray-600 mb-4">"{review.review}"</p>
                  <p className="font-semibold">- {review.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-gradient">ShopApp</h3>
              <p className="text-gray-400">
                Il tuo negozio online di fiducia per tecnologia e innovazione.
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
              <h4 className="font-semibold mb-4">Assistenza</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Spedizioni</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Resi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Garanzia</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Seguici</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ShopApp. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
