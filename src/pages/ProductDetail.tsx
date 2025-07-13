import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useWooCommerceProduct, useWooCommerceProducts } from '@/hooks/useWooCommerce';
import { ShoppingBag, Heart, Star, ArrowLeft, Truck, Shield, RotateCcw, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { getBorderColor } from "../lib/utils";

const ProductDetail = () => {
  const { id } = useParams();
  const { state, dispatch } = useCart();
  
  // TUTTI gli hooks devono essere chiamati SEMPRE nello stesso ordine
  const [quantity, setQuantity] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Hooks personalizzati - sempre nello stesso ordine
  const { data: wooProduct, isLoading, error } = useWooCommerceProduct(parseInt(id || '0'));
  
  // Questo hook deve essere sempre chiamato, anche se categoryId è undefined
  const categoryId = wooProduct?.categories?.[0]?.id;
  const { data: relatedWooProducts, isLoading: isLoadingRelated } = useWooCommerceProducts({
    category: categoryId?.toString() || '',
    per_page: 12, // Aumentato da 4 a 12 per avere più prodotti da cui filtrare
    exclude: [parseInt(id || '0')]
  }, {
    enabled: !!categoryId
  });

  // useEffect per inizializzare la quantità dal carrello
  React.useEffect(() => {
    const cartItem = state.items.find(item => item.id === parseInt(id || '0'));
    if (cartItem) {
      setQuantity(cartItem.quantity);
    } else {
      setQuantity(0); // Mostra 0 se non è nel carrello
    }
    setHasInitialized(true);
  }, [state.items, id]);

  // IMPORTANTE: Tutti i return condizionali devono essere DOPO tutti gli hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <h1 className="text-2xl font-bold mb-4">Caricamento prodotto...</h1>
          <p className="text-gray-600">Stiamo recuperando le informazioni del prodotto.</p>
        </div>
      </div>
    );
  }

  if (error || !wooProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Prodotto non trovato</h1>
          <p className="text-gray-600 mb-6">Il prodotto che stai cercando non esiste o è stato rimosso.</p>
          <Link to="/products">
            <Button className="gradient-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna ai Prodotti
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Trova il prodotto nel carrello
  const cartItem = state.items.find(item => item.id === parseInt(id || '0'));

  // Trasforma il prodotto WooCommerce nel formato locale
  const product = {
    id: wooProduct.id,
    name: wooProduct.name || 'Prodotto senza nome',
    price: wooProduct.price ? parseFloat(wooProduct.price) : 0,
    originalPrice: wooProduct.regular_price && wooProduct.sale_price && 
      parseFloat(wooProduct.regular_price) > parseFloat(wooProduct.sale_price) 
      ? parseFloat(wooProduct.regular_price) : undefined,
    image: wooProduct.images && wooProduct.images.length > 0 
      ? wooProduct.images[0].src : '/placeholder.svg',
    rating: wooProduct.average_rating ? parseFloat(wooProduct.average_rating) : 0,
    reviews: wooProduct.rating_count || 0,
    description: wooProduct.short_description || wooProduct.description || 'Nessuna descrizione disponibile',
    inStock: wooProduct.stock_status === 'instock',
    category: wooProduct.categories && wooProduct.categories.length > 0 
      ? wooProduct.categories[0].name : undefined,
    short_description: wooProduct.short_description || wooProduct.description
  };

  // Funzione per gestire l'aggiunta al carrello
  const handleAddToCart = () => {
    if (!product.inStock) {
      toast.error('Prodotto non disponibile');
      return;
    }
    
    if (quantity === 0) return;
    
    if (cartItem) {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: {
          id: product.id,
          quantity: quantity
        }
      });
      toast.success(`Quantità aggiornata: ${quantity}x ${product.name}`);
    } else {
      // Sostituisci il ciclo for con una singola azione ADD_ITEM
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category
        }
      });
      
      // Se la quantità è maggiore di 1, aggiorna immediatamente la quantità
      if (quantity > 1) {
        dispatch({
          type: 'UPDATE_QUANTITY',
          payload: {
            id: product.id,
            quantity: quantity
          }
        });
      }
      
      toast.success(`${quantity}x ${product.name} aggiunto al carrello`);
    }
  };

  // Funzione per rimuovere dal carrello
  const handleRemoveFromCart = () => {
    if (cartItem) {
      dispatch({
        type: 'REMOVE_ITEM',
        payload: product.id
      });
      setQuantity(0);
      toast.success(`${product.name} rimosso dal carrello`, {
        icon: (
          <div 
            className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: '#A11E26' }}
          >
            ✓
          </div>
        ),
        style: {
          border: `2px solid #A11E26`,
          backgroundColor: '#A11E26',
          color: 'white'
        }
      });
    }
  };

  // Trasforma prodotti correlati
  const relatedProducts = relatedWooProducts?.map(wooProduct => ({
    id: wooProduct.id,
    name: wooProduct.name || 'Prodotto senza nome',
    price: wooProduct.price ? parseFloat(wooProduct.price) : 0,
    originalPrice: wooProduct.regular_price && wooProduct.sale_price && 
      parseFloat(wooProduct.regular_price) > parseFloat(wooProduct.sale_price) 
      ? parseFloat(wooProduct.regular_price) : undefined,
    image: wooProduct.images && wooProduct.images.length > 0 
      ? wooProduct.images[0].src : '/placeholder.svg',
    rating: wooProduct.average_rating ? parseFloat(wooProduct.average_rating) : 0,
    reviews: wooProduct.rating_count || 0,
    inStock: wooProduct.stock_status === 'instock',
    category: wooProduct.categories && wooProduct.categories.length > 0 
      ? wooProduct.categories[0].name : undefined,
    short_description: wooProduct.short_description || wooProduct.description,
    stock_status: wooProduct.stock_status
  })).filter(product => product.inStock) || []; // ✅ AGGIUNTO FILTRO per mostrare solo prodotti disponibili

  const discountPercentage = product.originalPrice 
    ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100) 
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-purple-600">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-purple-600">Prodotti</Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </nav>

        {/* Product Card Layout */}
        <Card className="overflow-hidden" style={{
          borderLeft: `4px solid ${getBorderColor(product.category)}`,
          borderColor: getBorderColor(product.category)
        }}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Product Image */}
              <div className="flex-shrink-0 relative mx-auto md:mx-0">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className={`w-[150px] h-[150px] object-cover rounded-lg bg-white p-2 ${
                    !product.inStock ? 'grayscale opacity-75' : ''
                  }`} 
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }} 
                />
                {!product.inStock && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    Non Disponibile
                  </Badge>
                )}
                {product.inStock && discountPercentage && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    -{discountPercentage}%
                  </Badge>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-3" style={{color: '#A40800'}}>{product.name}</h1>
                
                {/* Rimuovi completamente la sezione Rating/Recensioni */}
                
                {/* Price - Formato modificato */}
                <div className="mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-sky-600">
                      {product.price.toFixed(2)}€
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        {product.originalPrice.toFixed(2)}€
                      </span>
                    )}
                  </div>
                  {discountPercentage && product.inStock && (
                    <span className="text-green-600 font-medium text-sm">
                      Risparmi {(product.originalPrice! - product.price).toFixed(2)}€!
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div className="mb-4">
                  {product.inStock ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      ✓ Disponibile
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      ✗ Non disponibile
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Descrizione</h3>
                  <div 
                    className="text-gray-600 text-sm" 
                    dangerouslySetInnerHTML={{
                      __html: product.description.replace(/<[^>]*>/g, '')
                    }} 
                  />
                </div>

               {/* Quantity Selector */}
                <div className="flex flex-col space-y-4">
                  {product.inStock ? (
                    <>
                      {/* Quantity Selector */}
                      <div className="flex items-center justify-center">
                        <div className="flex items-center bg-gray-100 rounded-full p-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              const newQuantity = Math.max(0, quantity - 1);
                              setQuantity(newQuantity);
                              
                              // Se il prodotto è nel carrello, aggiorna la quantità
                              if (cartItem) {
                                if (newQuantity === 0) {
                                  // Se la quantità diventa 0, rimuovi dal carrello
                                  dispatch({
                                    type: 'REMOVE_ITEM',
                                    payload: product.id
                                  });
                                  toast.success(`${product.name} rimosso dal carrello`, {
                                    icon: (
                                      <div 
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ backgroundColor: '#A11E26' }}
                                      >
                                        ✓
                                      </div>
                                    ),
                                    style: {
                                      border: `2px solid #A11E26`,
                                      backgroundColor: '#A11E26',
                                      color: 'white'
                                    }
                                  });
                                } else {
                                  // Altrimenti aggiorna la quantità
                                  dispatch({
                                    type: 'UPDATE_QUANTITY',
                                    payload: {
                                      id: product.id,
                                      quantity: newQuantity
                                    }
                                  });
                                  toast.success(`Quantità aggiornata: ${newQuantity}x ${product.name}`, {
                                    icon: (
                                      <div 
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ backgroundColor: getBorderColor(product.category) }}
                                      >
                                        ✓
                                      </div>
                                    ),
                                    style: {
                                      border: `2px solid ${getBorderColor(product.category)}`,
                                    }
                                  });
                                }
                              }
                            }}
                            className="w-12 h-12 rounded-full bg-white shadow-sm hover:bg-gray-50 text-teal-600 font-bold text-lg"
                          >
                            −
                          </Button>
                          <span className="px-6 py-2 text-lg font-semibold text-gray-800 min-w-[60px] text-center">
                            {quantity}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              const newQuantity = quantity + 1;
                              setQuantity(newQuantity);
                              
                              if (!product.inStock) {
                                toast.error('Prodotto non disponibile');
                                return;
                              }
                              
                              // Se passiamo da 0 a 1, aggiungi al carrello
                              if (quantity === 0 && newQuantity === 1) {
                                dispatch({
                                  type: 'ADD_ITEM',
                                  payload: {
                                    id: product.id,
                                    name: product.name,
                                    price: product.price,
                                    image: product.image,
                                    category: product.category // Aggiungi la categoria qui
                                  }
                                });
                                toast.success(`${product.name} aggiunto al carrello`, {
                                  icon: (
                                    <div 
                                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                      style={{ backgroundColor: getBorderColor(product.category) }}
                                    >
                                      ✓
                                    </div>
                                  ),
                                  style: {
                                    border: `2px solid ${getBorderColor(product.category)}`,
                                  }
                                });
                              } 
                              // Se il prodotto è già nel carrello, aggiorna la quantità
                              else if (cartItem && newQuantity > 1) {
                                dispatch({
                                  type: 'UPDATE_QUANTITY',
                                  payload: {
                                    id: product.id,
                                    quantity: newQuantity
                                  }
                                });
                                toast.success(`Quantità aggiornata: ${newQuantity}x ${product.name}`, {
                                  icon: (
                                    <div 
                                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                      style={{ backgroundColor: getBorderColor(product.category) }}
                                    >
                                      ✓
                                    </div>
                                  ),
                                  style: {
                                    border: `2px solid ${getBorderColor(product.category)}`,
                                  }
                                });
                              }
                            }}
                            className="w-12 h-12 rounded-full bg-white shadow-sm hover:bg-gray-50 text-teal-600 font-bold text-lg"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      
                      {/* Messaggio informativo dinamico */}
                      {quantity === 0 ? (
                        <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                          <ShoppingBag className="w-4 h-4 inline mr-2 text-red-600" />
                          Prodotto non inserito nel carrello
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="flex items-center">
                            <ShoppingBag className="w-4 h-4 inline mr-2 text-green-600" />
                            {cartItem ? 
                              `Quantità nel carrello: ${cartItem.quantity}` : 
                              `Quantità da aggiungere: ${quantity}`
                            }
                          </div>
                          {cartItem && (
                            <Link to="/cart">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="ml-3 text-green-700 border-green-300 hover:bg-green-100"
                              >
                                Vai al carrello
                              </Button>
                            </Link>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500 text-sm font-medium bg-gray-100 px-4 py-2 rounded-md w-full text-center">
                      Questo prodotto non è attualmente disponibile per l'acquisto
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            {
              id: 'certified',
              icon: <Shield className="w-6 h-6 text-green-600" />,
              title: 'Prodotto CERTIFICATO e GARANTITO',
              borderColor: 'border-green-600',
              titleColor: 'text-green-600',
              ringColor: 'ring-green-500',
              content: (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">La conservazione di questo prodotto avviene in un luogo asciutto e lontano dai raggi solari, che ne potrebbero alterare il contenuto. La certificazione è concessa dall'azienda Meloam S.p.a leader nel settore SICUREZZA SUL LAVORO che garantisce la tutela dei consumatori.</p>
                  <p className="text-xs text-orange-500 font-medium">☀️ Paura della plastica esposta al sole ☀️?? 😱😱</p>
                  <p className="text-xs text-green-600 font-medium">😊 Niente paura 😊 stai tranquillo</p>
                </div>
              )
            },
            {
              id: 'delivery',
              icon: <Truck className="w-6 h-6 text-blue-600" />,
              title: 'Consegna direttamente al piano',
              borderColor: 'border-[#1B5AAB]',
              titleColor: 'text-[#1B5AAB]',
              ringColor: 'ring-[#1B5AAB]',
              content: (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">Questo prodotto verrà consegnato direttamente fin dietro la porta di casa vostra o dove vi risulterà più comodo. Ovviamente non ci saranno costi aggiuntivi. È tutto incluso nel prezzo che vedete esposto.</p>
                  <p className="text-xs text-red-500 font-bold">⚡ NESSUNO SFORZO DA PARTE VOSTRA 😊</p>
                  <p className="text-xs text-gray-500 text-[10px]">N.B. Gli appartamenti non muniti di ascensore potranno essere serviti ma la consegna potrà avvenire massimo al primo piano</p>
                </div>
              )
            },
            {
              id: 'timing',
              icon: <RotateCcw className="w-6 h-6 text-[#A40800]" />,
              title: 'Tempi di consegna immediati',
              borderColor: 'border-[#A40800]',
              titleColor: 'text-[#A40800]',
              ringColor: 'ring-[#A40800]',
              content: (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">Questo prodotto è presente nei nostri magazzini e sarà consegnato a distanza di un solo giorno lavorativo.</p>
                  <p className="text-xs text-red-500 font-bold">⏰ TEMPI DI ATTESA NULLI</p>
                  <p className="text-xs text-orange-500 font-medium">📅 Ordina OGGI, consegnamo DOMANI 😊</p>
                </div>
              )
            }
          ].map((item) => {
            const isOpen = expandedCard === item.id;
            return (
              <Card 
                key={item.id} 
                className={`transition-all duration-300 cursor-pointer hover:shadow-lg border-2 ${
                  item.borderColor
                } ${
                  isOpen ? `ring-2 ${item.ringColor} shadow-lg` : 'hover:shadow-md'
                }`}
                onClick={() => setExpandedCard(isOpen ? null : item.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <h3 className={`text-sm font-semibold ${item.titleColor}`}>{item.title}</h3>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform duration-300 ${
                        item.titleColor
                      } ${
                        isOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                  
                  <div className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
                  }`}>
                    {item.content}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Banner Promozionale sopra Prodotti Simili */}
        <div className="mt-16 mb-8">
          <div className={`bg-gradient-to-r ${getBannerColor(product.category)} text-white py-6 overflow-hidden relative rounded-lg shadow-lg`}>
            <div className="animate-marquee whitespace-nowrap flex text-xl font-bold">
              {getBannerMessages(product.category).map((message, index) => (
                <span key={index} className="mx-12">{message}</span>
              ))}
              {/* Duplicazione delle frasi per scorrimento continuo */}
              {getBannerMessages(product.category).map((message, index) => (
                <span key={`duplicate-${index}`} className="mx-12">{message}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 mb-8 md:mb-4">
            <h2 className="text-2xl mb-6 font-bold text-center text-red-700">
              Prodotti Simili
            </h2>
            {isLoadingRelated ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                <p className="text-gray-600">Caricamento prodotti correlati...</p>
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide scroll-smooth cursor-grab active:cursor-grabbing"
                  style={{
                    scrollBehavior: 'smooth'
                  }}
                  onMouseDown={(e) => {
                    const container = e.currentTarget;
                    const startX = e.pageX - container.offsetLeft;
                    const scrollLeft = container.scrollLeft;
                    
                    const handleMouseMove = (e: MouseEvent) => {
                      const x = e.pageX - container.offsetLeft;
                      const walk = (x - startX) * 2;
                      container.scrollLeft = scrollLeft - walk;
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                      container.style.cursor = 'grab';
                    };
                    
                    container.style.cursor = 'grabbing';
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                    
                    // Previeni la selezione del testo durante il drag
                    e.preventDefault();
                  }}
                >
                  <div className="flex gap-6">
                    {relatedProducts.map(relatedProduct => (
                      <div key={relatedProduct.id} className="flex-shrink-0 w-48">
                        <ProductCard product={relatedProduct} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

// Aggiungi questa funzione helper dopo gli import (intorno alla riga 13)
const getBannerColor = (category?: string) => {
  if (!category) return 'from-gray-400 via-gray-500 to-gray-400'; // grigio di default

  const lowerCategory = category.toLowerCase();

  if (lowerCategory.includes('acqua')) return 'from-blue-400 via-blue-500 to-blue-400';
  if (lowerCategory.includes('birra')) return 'from-amber-400 via-amber-500 to-amber-400';
  if (lowerCategory.includes('bevande') || lowerCategory.includes('coca') || lowerCategory.includes('fanta') || lowerCategory.includes('schweppes')) return 'from-green-400 via-green-500 to-green-400';
  if (lowerCategory.includes('vino')) return 'from-purple-400 via-purple-500 to-purple-400';

  return 'from-gray-400 via-gray-500 to-gray-400'; // grigio di default per altre categorie
};

// Aggiungi questa funzione dopo getBannerColor
// Modifica la funzione getBannerMessages per essere più robusta
const getBannerMessages = (category: string) => {
  if (!category) {
    // Default per categorie non definite: mostra le frasi delle bevande quando la categoria non viene trovata o non è definita.
    return [
      '🍹 Un Momento di Piacere in Ogni Sorso!',
      '❄️ Rinfresca le Tue Giornate con Stile e Gusto!',
      '🌸 Ogni Bevanda è un\'Esperienza da Vivere!'
    ];
  }
  
  const normalizedCategory = category.toLowerCase().trim();
  
  // Debug: aggiungi un console.log per vedere la categoria
  console.log('Categoria prodotto:', category, 'Normalizzata:', normalizedCategory);
  
  if (normalizedCategory.includes('birra')) {
    return [
      '🍺 Ricca di Vitamine del Gruppo B: Gusto e Benessere!',
      '🍻 Stimola il Relax e Favorisce la Socialità!',
      '🌾 Fonte Naturale di Antiossidanti dai Cereali!',
      '🫀 Se Consumata con Moderazione, Fa Bene al Cuore!'
    ];
  }
  
  if (normalizedCategory.includes('vino')) {
    return [
      '🍷 Un Bicchiere al Giorno, per il Benessere del Cuore!',
      '🍇 Ricco di Polifenoli: Gusto e Proprietà Antiossidanti!',
      '🧘‍♂️ Favorisce il Relax e la Buona Compagnia!',
      '🫀 Il Piacere del Vino, con Benefici per la Circolazione!'
    ];
  }
  
  if (normalizedCategory.includes('bevande') || normalizedCategory.includes('bevanda')) {
    return [
      '🍹 Un Momento di Piacere in Ogni Sorso!',
      '❄️ Rinfresca le Tue Giornate con Stile e Gusto!',
      '🌸 Ogni Bevanda è un\'Esperienza da Vivere!'
    ];
  }
  
  if (normalizedCategory.includes('acqua')) {
    return [
      '💧 Idratazione Ottimale per Tutta la Giornata!',
      '🧠 Aiuta la Concentrazione e la Memoria!',
      '🌿 Favorisce la Depurazione dell\'Organismo!',
      '💪 Supporta le Prestazioni Fisiche e Sportive!',
      '🛌 Migliora la Qualità del Sonno!',
      '🌞 Essenziale Durante le Giornate Calde!',
      '🧴 Pelle più Luminosa e Sana!',
      '⚖️ Aiuta a Mantenere il Peso Forma!',
      '🫀 Stimola la Circolazione e la Salute del Cuore!',
      '🚿 Purifica e Rinfresca in Ogni Momento!'
    ];
  }
  
  // Default per tutte le altre categorie: mostra le frasi delle bevande
  return [
    '🍹 Un Momento di Piacere in Ogni Sorso!',
    '🍵 Coccole Calde per l\'Anima e il Corpo!',
    '❄️ Rinfresca le Tue Giornate con Stile e Gusto!',
    '🌸 Ogni Bevanda è un\'Esperienza da Vivere!'
  ];
};