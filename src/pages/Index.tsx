
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import DeliveryZoneMap from '@/components/DeliveryZoneMap';
import ImageCarousel from '@/components/ImageCarousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Truck, Clock, MapPin, RotateCcw, Phone, MessageCircle } from 'lucide-react'; // ✅ Aggiunta RotateCcw, Phone e MessageCircle

import { useWooCommerceSaleProducts, useWooCommerceCustomerOrders, useWooCommerceProducts } from '@/hooks/useWooCommerce';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { wooCommerceService } from '@/services/woocommerce';

// Import delle immagini del carousel - da sostituire con le tue immagini
// import waterDeliveryImg from '@/assets/carousel-images/water-delivery.svg';
// import qualityProductsImg from '@/assets/carousel-images/quality-products.svg';
// import fastDeliveryImg from '@/assets/carousel-images/fast-delivery.svg';


const Index = () => {
  const [isZoneCovered, setIsZoneCovered] = useState(false);
  const [hasZoneError, setHasZoneError] = useState(false);
  const { authState } = useAuth();
  const { dispatch } = useCart();
  const [shuffledImages, setShuffledImages] = useState<any[]>([]);

  // ✅ PRECARICAMENTO PRODOTTI - Carica tutti i prodotti in background
  // Questo renderà la navigazione verso lo shop molto più veloce
  const { data: allProductsPage1 } = useWooCommerceProducts({
    per_page: 100,
    page: 1
  });
  
  const { data: allProductsPage2 } = useWooCommerceProducts({
    per_page: 100,
    page: 2
  });

  // Hook per ottenere i prodotti più venduti
  const { data: bestSellingProducts = [], isLoading: bestSellingLoading } = useWooCommerceProducts({
    orderby: 'popularity',
    per_page: 20
  });

  // Hook per ottenere i prodotti in offerta
  const { data: saleProducts = [], isLoading: saleLoading } = useWooCommerceSaleProducts({
    per_page: 10
  });

  // Hook per ottenere l'ultimo ordine del cliente
  const customerId = authState?.isAuthenticated && authState?.user?.id ? authState.user.id : null;
  const { data: customerOrders = [], isLoading: ordersLoading } = useWooCommerceCustomerOrders(
    customerId,
    { per_page: 1, orderby: 'date', order: 'desc' },
    { enabled: !!customerId }
  );

  const lastOrder = customerOrders[0];

  // ✅ Log per verificare che i prodotti vengano precaricati
  useEffect(() => {
    if (allProductsPage1 && allProductsPage2) {
      const totalProducts = [...(allProductsPage1 || []), ...(allProductsPage2 || [])];
      console.log(`✅ Prodotti precaricati: ${totalProducts.length} prodotti in cache`);
    }
  }, [allProductsPage1, allProductsPage2]);

  // Funzione per aggiungere l'ultimo ordine al carrello
  const addLastOrderToCart = async () => { // ✅ Resa asincrona
    if (!lastOrder || !lastOrder.line_items) {
      toast.error('Nessun ordine precedente trovato');
      return;
    }
    
    let addedItems = 0;
    
    // ✅ Usa Promise.all per recuperare tutti i prodotti in parallelo
    try {
      const productPromises = lastOrder.line_items.map(async (item: any) => {
        try {
          // Recupera il prodotto dall'API per ottenere l'immagine reale
          const product = await wooCommerceService.getProduct(item.product_id);
          
          // Trasforma l'item dell'ordine nel formato del carrello
          const cartItem = {
            id: item.product_id,
            name: item.name,
            price: parseFloat(item.price),
            image: product.images && product.images.length > 0 
              ? product.images[0].src 
              : '/placeholder.svg', // ✅ Usa l'immagine reale o fallback
            category: 'altri'
          };
          
          return { cartItem, quantity: item.quantity };
        } catch (error) {
          console.error(`Errore nel recupero del prodotto ${item.product_id}:`, error);
          // ✅ Fallback in caso di errore
          const cartItem = {
            id: item.product_id,
            name: item.name,
            price: parseFloat(item.price),
            image: '/placeholder.svg',
            category: 'altri'
          };
          
          return { cartItem, quantity: item.quantity };
        }
      });
      
      // ✅ Attendi che tutti i prodotti siano recuperati
      const products = await Promise.all(productPromises);
      
      // ✅ Aggiungi tutti i prodotti al carrello
      products.forEach(({ cartItem, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          dispatch({ type: 'ADD_ITEM', payload: cartItem });
        }
        addedItems += quantity;
      });
      
      toast.success(`${addedItems} prodotti dall'ultimo ordine aggiunti al carrello!`);
    } catch (error) {
      console.error('Errore nel recupero dei prodotti:', error);
      toast.error('Errore nel recupero delle informazioni dei prodotti');
    }
  };
  
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
      description: product.description || product.short_description || '', // Aggiunta descrizione
      slug: product.slug
    };
  };

  const transformedBestSellingProducts = bestSellingProducts.map(transformWooCommerceProduct);
  const transformedSaleProducts = saleProducts.map(transformWooCommerceProduct);

  // Funzione per mescolare l'array
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Immagini del carousel di Imperatore Bevande - Tutte le immagini Instagram disponibili (21 immagini)
  const carouselImages = [
    {
      id: 1,
      src: '/carousel-images/imperatorebevande_1406013033_770015590557564890_27333214.jpg',
      alt: 'Imperatore Bevande',
      title: 'La Nostra Storia'
    },
    {
      id: 2,
      src: '/carousel-images/imperatorebevande_1415254167_847535841268088354_27333214.jpg',
      alt: 'Prodotti di qualità',
      title: 'Qualità Garantita'
    },
    {
      id: 3,
      src: '/carousel-images/imperatorebevande_1420786128_893941295590030957_27333214.jpg',
      alt: 'Servizio professionale',
      title: 'Professionalità'
    },
    {
      id: 4,
      src: '/carousel-images/imperatorebevande_1427868980_953356566603644688_27333214.jpg',
      alt: 'Distribuzione bevande',
      title: 'Distribuzione Capillare'
    },
    {
      id: 5,
      src: '/carousel-images/imperatorebevande_1430994432_979574760192229163_27333214.jpg',
      alt: 'Magazzino organizzato',
      title: 'Organizzazione Perfetta'
    },
    {
      id: 6,
      src: '/carousel-images/imperatorebevande_1436773285_1028051290786250374_27333214.jpg',
      alt: 'Magazzino con prodotti',
      title: 'Il Nostro Magazzino'
    },
    {
      id: 7,
      src: '/carousel-images/imperatorebevande_1462610040_1244785698678127791_27333214.jpg',
      alt: 'Prodotti Imperatore Bevande',
      title: 'Qualità Premium'
    },
    {
      id: 8,
      src: '/carousel-images/imperatorebevande_1469861951_1305619140468141396_27333214.jpg',
      alt: 'Servizio professionale',
      title: 'Servizio Professionale'
    },
    {
      id: 9,
      src: '/carousel-images/imperatorebevande_1470832134_1313757621509718696_27333214.jpg',
      alt: 'Consegna a domicilio',
      title: 'Consegna Rapida'
    },
    {
      id: 10,
      src: '/carousel-images/imperatorebevande_1471535446_1319657432016699014_27333214.jpg',
      alt: 'Bevande di qualità',
      title: 'Bevande Premium'
    },
    {
      id: 11,
      src: '/carousel-images/imperatorebevande_1475584080_1353619831467755871_27333214.jpg',
      alt: 'Magazzino organizzato',
      title: 'Organizzazione Perfetta'
    },
    {
      id: 12,
      src: '/carousel-images/imperatorebevande_1484982060_1432455805236264366_27333214.jpg',
      alt: 'Prodotti di qualità',
      title: 'Prodotti di Qualità'
    },
    {
      id: 13,
      src: '/carousel-images/imperatorebevande_1493272787_1502003463822068439_27333214.jpg',
      alt: 'Varietà di prodotti',
      title: 'Ampia Selezione'
    },
    {
      id: 14,
      src: '/carousel-images/imperatorebevande_1498539709_1546185606336767335_27333214.jpg',
      alt: 'Servizio clienti',
      title: 'Servizio Clienti'
    },
    {
      id: 15,
      src: '/carousel-images/imperatorebevande_1504674454_1597647577716095324_27333214.jpg',
      alt: 'Cassette di bevande',
      title: 'Prodotti di Qualità'
    },
    {
      id: 16,
      src: '/carousel-images/imperatorebevande_1523090230_1752130307959341920_27333214.jpg',
      alt: 'Distribuzione bevande',
      title: 'Distribuzione Capillare'
    },
    {
      id: 17,
      src: '/carousel-images/imperatorebevande_1528988443_1801608102854596101_27333214.jpg',
      alt: 'Furgone di consegna',
      title: 'Consegna a Domicilio'
    },
    {
      id: 18,
      src: '/carousel-images/imperatorebevande_1529932954_1809531234194122092_27333214.jpg',
      alt: 'Scaffali del magazzino',
      title: 'Organizzazione Professionale'
    },
    {
      id: 19,
      src: '/carousel-images/imperatorebevande_1532095117_1827668769969578855_27333214.jpg',
      alt: 'Bevande nel furgone',
      title: 'Trasporto Sicuro'
    },
    {
      id: 20,
      src: '/carousel-images/imperatorebevande_1533364881_1838320323458280186_27333214.jpg',
      alt: 'Team Imperatore Bevande',
      title: 'Il Nostro Team'
    },
    {
      id: 21,
      src: '/carousel-images/imperatorebevande_1542089258_1911505700475958487_27333214.jpg',
      alt: 'Esperienza e tradizione',
      title: 'Esperienza e Tradizione'
    }
  ];

  // Mescola le immagini al caricamento del componente
  useEffect(() => {
    setShuffledImages(shuffleArray(carouselImages));
  }, []);

  // Categorie principali
  const categories = [
    {
      name: 'Acqua',
      bgColor: 'bg-gradient-to-br from-blue-100 to-blue-200',
      textColor: 'text-blue-800',
      icon: '💧',
      link: '/prodotti?category=acqua'
    },
    {
      name: 'Birra',
      bgColor: 'bg-gradient-to-br from-amber-100 to-amber-200',
      textColor: 'text-amber-800',
      icon: '🍺',
      link: '/prodotti?category=birra'
    },
    {
      name: 'Vino',
      bgColor: 'bg-gradient-to-br from-purple-100 to-purple-200',
      textColor: 'text-purple-800',
      icon: '🍷',
      link: '/prodotti?category=vino'
    },
    {
      name: 'Bevande',
      bgColor: 'bg-gradient-to-br from-green-100 to-green-200',
      textColor: 'text-green-800',
      icon: '🥤',
      link: '/prodotti?category=bevande'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-[#1B5AAB] text-white py-8 sm:py-12 lg:py-20">
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
            <span className="px-2">Servizio di consegna a domicilio su Bari e dintorni</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link to="/prodotti">
              <Button size="lg" className="bg-white text-[#1B5AAB] hover:bg-gray-100 font-semibold px-8 py-3">
                Scopri i Prodotti
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            {/* Nuovo pulsante per l'ultimo ordine - solo se l'utente è loggato */}
            {authState?.isAuthenticated && lastOrder && (
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#1B5AAB] font-semibold px-8 py-3"
                onClick={addLastOrderToCart}
                disabled={ordersLoading}
              >
                {ordersLoading ? (
                  'Caricamento...'
                ) : (
                  <>
                    <RotateCcw className="mr-2 w-5 h-5" />
                    Riordina Ultimo Acquisto
                  </>
                )}
              </Button>
            )}          </div>
            
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
            <Link to="/prodotti">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white">
                Vedi Tutti i Prodotti
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Image Carousel Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,197,253,0.08),transparent_50%)] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative">
          {/* Titolo con icona Instagram cliccabile */}
          <div className="text-center mb-12">
            <a 
              href="https://www.instagram.com/imperatorebevande/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block group cursor-pointer transition-all duration-300 hover:scale-105"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent flex items-center justify-center gap-3 group-hover:from-pink-600 group-hover:via-purple-600 group-hover:to-blue-600 transition-all duration-300">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-pink-500 group-hover:text-pink-600 transition-colors duration-300 group-hover:rotate-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                #imperatorebevande
              </h2>
            </a>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Clicca per visitare il nostro profilo Instagram e scoprire tutte le novità
            </p>
          </div>
          
          <ImageCarousel 
            images={shuffledImages}
            className="max-w-7xl mx-auto"
          />
        </div>
      </section>

      {/* Zone di Consegna */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="container mx-auto px-4">
          <DeliveryZoneMap 
            onZoneDetected={(zone) => setIsZoneCovered(!!zone)} 
            onZoneError={(error) => setHasZoneError(!!error)}
          />
          
          {/* Call to Action Button */}
          <div className="text-center mt-8">
            {isZoneCovered && !hasZoneError && (
              <Link to="/prodotti">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                   Ordina Ora - Scopri i Nostri Prodotti
                 </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Special Offers */}
      {/* Rimuovi l'intera sezione Special Offers */}
      {/* 
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
      */}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
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
                <li><Link to="/prodotti" className="hover:text-white transition-colors">Prodotti</Link></li>
                <li><Link to="/chisiamo" className="hover:text-white transition-colors">Chi Siamo</Link></li>
                <li><Link to="/contatti" className="hover:text-white transition-colors">Contatti</Link></li>
              </ul>
            </div>
            
            <div className="md:col-span-1">
              <h4 className="font-semibold mb-4">Contatti</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📞</span>
                  <div>
                    <p className="font-medium text-white">Telefono</p>
                    <a href="tel:+393402486783" className="hover:text-blue-400 transition-colors">+39 340 2486783</a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📧</span>
                  <div>
                    <p className="font-medium text-white">Email</p>
                    <p>info@imperatorebevande.it</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="font-medium text-white">Ubicazione</p>
                    <p>Bari, Puglia</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🕒</span>
                  <div>
                    <p className="font-medium text-white">Orari</p>
                    <p>Lun-Ven: 07:00-16:00</p>
                    <p>Sab: 07:00-14:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Imperatore Bevande. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
