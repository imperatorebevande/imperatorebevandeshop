import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import LoadingAnimation from '@/components/LoadingAnimation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useWooCommerceProduct, useWooCommerceProducts, useWooCommerceProductBySlug } from '@/hooks/useWooCommerce';
import { ShoppingBag, ArrowLeft, Truck, Shield, RotateCcw, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getBorderColor } from "../lib/utils";
import { chatGPTService, ProductTechnicalSheet } from '@/services/chatgptService';

const ProductDetail = () => {
  const { slug } = useParams();
  const { state, dispatch } = useCart();
  const navigate = useNavigate();
  
  // TUTTI gli hooks devono essere chiamati SEMPRE nello stesso ordine
  const [quantity, setQuantity] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [isNaturaleDescriptionOpen, setIsNaturaleDescriptionOpen] = useState(false);
  const [isEffervescenteDescriptionOpen, setIsEffervescenteDescriptionOpen] = useState(false);
  const [isFrizzanteDescriptionOpen, setIsFrizzanteDescriptionOpen] = useState(false);
  const [isBirraDescriptionOpen, setIsBirraDescriptionOpen] = useState(false);
  const [isVinoDescriptionOpen, setIsVinoDescriptionOpen] = useState(false);
  const [isBevandeDescriptionOpen, setIsBevandeDescriptionOpen] = useState(false);
  const [showDesktopBar, setShowDesktopBar] = useState(false);
  const quantitySelectorRef = useRef<HTMLDivElement>(null);
  
  // Stati per la scheda tecnica
  const [technicalSheet, setTechnicalSheet] = useState<ProductTechnicalSheet | null>(null);
  const [isLoadingTechnicalSheet, setIsLoadingTechnicalSheet] = useState(false);
  const [technicalSheetError, setTechnicalSheetError] = useState<string | null>(null);

  // Hooks personalizzati - sempre nello stesso ordine
  const { data: wooProduct, isLoading, error } = useWooCommerceProductBySlug(slug || '');
  
  // Questo hook deve essere sempre chiamato, anche se categoryId è undefined
  const categoryId = wooProduct?.categories?.[0]?.id;
  const { data: relatedWooProducts, isLoading: isLoadingRelated } = useWooCommerceProducts({
    category: categoryId?.toString() || '',
    per_page: 12, // Aumentato da 4 a 12 per avere più prodotti da cui filtrare
    exclude: [wooProduct?.id || 0]
  }, {
    enabled: !!categoryId
  });

  // useEffect per inizializzare la quantità dal carrello
  React.useEffect(() => {
    const cartItem = state.items.find(item => item.id === (wooProduct?.id || 0));
    if (cartItem) {
      setQuantity(cartItem.quantity);
    } else {
      setQuantity(0); // Mostra 0 se non è nel carrello
    }
    setHasInitialized(true);
  }, [state.items, wooProduct?.id]);

  // useEffect per resettare la scheda tecnica quando cambia il prodotto
  useEffect(() => {
    setTechnicalSheet(null);
    setTechnicalSheetError(null);
    setIsLoadingTechnicalSheet(false);
  }, [slug]);

  // useEffect per rilevare quando il selettore principale esce dal viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowDesktopBar(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-100px 0px 0px 0px'
      }
    );

    if (quantitySelectorRef.current) {
      observer.observe(quantitySelectorRef.current);
    }

    return () => {
      if (quantitySelectorRef.current) {
        observer.unobserve(quantitySelectorRef.current);
      }
    };
  }, [wooProduct]);

  // IMPORTANTE: Tutti i return condizionali devono essere DOPO tutti gli hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-16 md:pb-0">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <LoadingAnimation 
              width={200}
              height={200}
              text="Caricamento prodotto..."
              className="py-16"
            />
            <div className="text-center mt-4">
              <p className="text-gray-600 text-lg">Stiamo recuperando le informazioni del prodotto</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !wooProduct) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Prodotto non trovato</h1>
          <p className="text-gray-600 mb-6">Il prodotto che stai cercando non esiste o è stato rimosso.</p>
          <Link to="/prodotti">
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
  const cartItem = state.items.find(item => item.id === (wooProduct?.id || 0));

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
    short_description: wooProduct.short_description || wooProduct.description,
    slug: wooProduct.slug
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

  // Funzione per generare la scheda tecnica
  const handleGenerateTechnicalSheet = async () => {
    if (!chatGPTService.isConfigured()) {
      toast.error('Servizio scheda tecnica non configurato');
      return;
    }

    setIsLoadingTechnicalSheet(true);
    setTechnicalSheetError(null);

    try {
      const sheet = await chatGPTService.generateTechnicalSheet(
        product.name,
        product.description,
        product.category || 'Bevanda'
      );
      setTechnicalSheet(sheet);
      toast.success('Scheda tecnica generata con successo!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore nella generazione della scheda tecnica';
      setTechnicalSheetError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingTechnicalSheet(false);
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
    stock_status: wooProduct.stock_status,
    slug: wooProduct.slug
  })).filter(product => product.inStock) || []; // ✅ AGGIUNTO FILTRO per mostrare solo prodotti disponibili

  const discountPercentage = product.originalPrice 
    ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100) 
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-purple-600">Home</Link>
            <span>/</span>
            <Link to="/prodotti" className="hover:text-purple-600">Prodotti</Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </nav>

        {/* Product Card Layout */}
        <Card className="overflow-hidden shadow-xl border-0 bg-gradient-to-br from-white to-gray-50" style={{
          borderLeft: `6px solid ${getBorderColor(product.category)}`,
        }}>
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Product Image Gallery */}
              <div className="flex-shrink-0 relative mx-auto lg:mx-0">
                <div className="relative group flex flex-col items-center">
                  {/* Main Image */}
                  <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border-4 border-gray-100 hover:border-gray-200 transition-all duration-300 flex items-center justify-center">
                    <img 
                      src={wooProduct?.images?.[selectedImageIndex]?.src || product.image} 
                      alt={product.name} 
                      className={`w-[280px] h-[280px] object-cover object-center transition-all duration-500 ${
                        !product.inStock ? 'grayscale opacity-75' : 'hover:scale-105'
                      }`} 
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }} 
                    />
                    

                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {!product.inStock && (
                        <Badge className="bg-red-500/90 text-white shadow-lg backdrop-blur-sm">
                          Non Disponibile
                        </Badge>
                      )}
                      {product.inStock && discountPercentage && (
                        <Badge className="bg-red-500/90 text-white shadow-lg backdrop-blur-sm animate-pulse">
                          -{discountPercentage}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Image Thumbnails */}
                  {wooProduct?.images && wooProduct.images.length > 1 && (
                    <div className="flex gap-2 mt-4 justify-center">
                      {wooProduct.images.slice(0, 4).map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                            selectedImageIndex === index 
                              ? `border-[${getBorderColor(product.category)}] shadow-lg` 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image.src}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover object-center hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Stock Status - Under Image */}
                  <div className="mt-4 flex justify-center">
                    {product.inStock ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-700 font-medium">Disponibile - Spedizione immediata</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-200">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-red-700 font-medium">Non disponibile</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1 space-y-6">
                {/* Product Title with Animation */}
                <div className="space-y-2">
                  <h1 className="text-3xl lg:text-4xl font-bold leading-tight animate-fade-in" style={{color: '#A40800'}}>
                    {product.name}
                  </h1>
                  {product.category && (
                    <Badge 
                      variant="outline" 
                      className="text-sm font-medium px-3 py-1"
                      style={{
                        borderColor: getBorderColor(product.category),
                        color: getBorderColor(product.category),
                        backgroundColor: `${getBorderColor(product.category)}10`
                      }}
                    >
                      {product.category}
                    </Badge>
                  )}
                </div>
                


                {/* Price Section - Enhanced */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 shadow-sm">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-sky-600 animate-pulse">
                      {product.price.toFixed(2)}€
                    </span>
                    {product.originalPrice && (
                      <span className="text-xl text-gray-500 line-through">
                        {product.originalPrice.toFixed(2)}€
                      </span>
                    )}
                  </div>
                  {discountPercentage && product.inStock && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500 text-white animate-bounce">
                        RISPARMIO {discountPercentage}%
                      </Badge>
                      <span className="text-green-600 font-medium text-sm">
                        Risparmi {(product.originalPrice! - product.price).toFixed(2)}€!
                      </span>
                    </div>
                  )}
                </div>



               {/* Quantity Selector - Modernized - Hidden on Mobile and Tablet */}
                <div ref={quantitySelectorRef} className="space-y-6 hidden lg:block">
                  {product.inStock ? (
                    <>
                      {/* Quantity Selector */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold flex items-center gap-2" style={{color: '#A40800'}}>
                            <ShoppingBag className="w-5 h-5" />
                            Seleziona Quantità
                          </h4>
                          <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1 shadow-inner border border-gray-200">
                              <Button 
                                onClick={() => {
                                  const newQuantity = Math.max(0, quantity - 1);
                                  setQuantity(newQuantity);
                                  
                                  // Se la nuova quantità è 0, rimuovi il prodotto dal carrello
                                  if (newQuantity === 0 && cartItem) {
                                    dispatch({
                                      type: 'REMOVE_ITEM',
                                      payload: product.id
                                    });
                                    toast.success(`${product.name} rimosso dal carrello`, {
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
                                  // Se il prodotto è nel carrello e la quantità è > 0, aggiorna la quantità
                                  else if (cartItem && newQuantity > 0) {
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
                                disabled={quantity <= 0}
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 font-bold text-lg border-2 border-transparent hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  color: getBorderColor(product.category),
                                  backgroundColor: 'white'
                                }}
                              >
                                -
                              </Button>
                              
                              <div className="mx-3 text-center">
                                <div 
                                  className="text-2xl font-bold px-4 py-2 bg-white rounded-lg shadow-md border-2 min-w-[60px] flex items-center justify-center"
                                  style={{
                                    borderColor: getBorderColor(product.category),
                                    color: getBorderColor(product.category)
                                  }}
                                >
                                  {quantity}
                                </div>

                              </div>
                              
                              <Button 
                                onClick={() => {
                                  const newQuantity = quantity + 1;
                                  setQuantity(newQuantity);
                                  
                                  // Se il prodotto è già nel carrello, aggiorna la quantità
                                  if (cartItem) {
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
                                  // Se il prodotto non è nel carrello ma la quantità è > 1, aggiungilo e poi aggiorna
                                  else if (!cartItem && newQuantity > 1) {
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
                                    
                                    // Aggiorna immediatamente la quantità
                                    dispatch({
                                      type: 'UPDATE_QUANTITY',
                                      payload: {
                                        id: product.id,
                                        quantity: newQuantity
                                      }
                                    });
                                    
                                    toast.success(`${product.name} aggiunto al carrello (${newQuantity}x)`, {
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
                                  // Se il prodotto non è nel carrello e la quantità è 1, aggiungilo normalmente
                                  else if (!cartItem && newQuantity === 1) {
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
                                }}
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 font-bold text-lg border-2 border-transparent hover:border-green-200"
                                style={{
                                  color: getBorderColor(product.category),
                                  backgroundColor: 'white'
                                }}
                              >
                                +
                              </Button>
                            </div>
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

                {/* Description - Enhanced */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2" style={{color: '#A40800'}}>
                    <div className="w-1 h-6 rounded-full" style={{backgroundColor: getBorderColor(product.category)}}></div>
                    Descrizione Prodotto
                  </h3>
                  <div 
                    className="text-gray-700 leading-relaxed" 
                    dangerouslySetInnerHTML={{
                      __html: product.description.replace(/<[^>]*>/g, '')
                    }} 
                  />
                  
                  {/* Pulsante Scheda Tecnica */}
                  <div className="mt-6">
                    <Button
                      onClick={handleGenerateTechnicalSheet}
                      disabled={isLoadingTechnicalSheet}
                      className="bg-gradient-to-r from-[#1B5AAB] to-[#164a99] hover:from-[#164a99] hover:to-[#1B5AAB] text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {isLoadingTechnicalSheet ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                      <span>{isLoadingTechnicalSheet ? 'Generando...' : 'Scheda Tecnica'}</span>
                    </Button>
                  </div>

                  {/* Visualizzazione Scheda Tecnica */}
                  {technicalSheet && (
                    <div className="mt-6">
                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-[#1B5AAB] border-opacity-30 shadow-lg">
                        <CardContent className="p-6">
                          <h4 className="text-xl font-bold text-[#1B5AAB] mb-4 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <FileText className="w-6 h-6" />
                            Scheda Tecnica e Benefici
                          </h4>

                          {/* Technical Specifications */}
                          <div className="mb-4">
                            <h5 className="font-semibold text-[#164a99] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Specifiche Tecniche</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {Object.entries(technicalSheet.technicalSpecs).map(([key, value]) => {
                                if (!value || value === 'Non specificato') return null;
                                
                                const keyLabels: { [key: string]: string } = {
                                  category: 'Categoria',
                                  ingredients: 'Ingredienti',
                                  alcoholContent: 'Gradazione alcolica',
                                  volume: 'Volume',
                                  producer: 'Produttore',
                                  vintage: 'Annata',
                                  servingTemperature: 'Temperatura di servizio',
                                  storageConditions: 'Condizioni di conservazione',
                                  fixedResidue: 'Residuo Fisso',
                                  ph: 'pH',
                                  calcium: 'Calcio',
                                  magnesium: 'Magnesio',
                                  sodium: 'Sodio',
                                  potassium: 'Potassio',
                                  bicarbonate: 'Bicarbonato',
                                  chlorides: 'Cloruri',
                                  sulfates: 'Solfati',
                                  nitrates: 'Nitrati',
                                  fluorides: 'Fluoruri'
                                };
                                
                                return (
                                  <div key={key} className="bg-white/70 p-2 rounded border border-purple-100">
                                    <span className="font-medium text-purple-700">{keyLabels[key] || key}:</span>
                                    <span className="ml-2 text-gray-700">{value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Benefits */}
                          {(technicalSheet.benefits.healthBenefits.length > 0 ||
                            technicalSheet.benefits.nutritionalInfo.length > 0 ||
                            technicalSheet.benefits.recommendations.length > 0) && (
                            <div className="mb-4">
                              <h5 className="font-semibold text-purple-700 mb-2">Benefici e Informazioni Nutrizionali</h5>
                              {technicalSheet.benefits.healthBenefits.length > 0 && (
                                <div className="mb-3">
                                  <h6 className="font-medium text-purple-600 mb-1">Benefici per la Salute:</h6>
                                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                    {technicalSheet.benefits.healthBenefits.map((benefit, index) => (
                                      <li key={index}>{benefit}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {technicalSheet.benefits.nutritionalInfo.length > 0 && (
                                <div className="mb-3">
                                  <h6 className="font-medium text-purple-600 mb-1">Informazioni Nutrizionali:</h6>
                                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                    {technicalSheet.benefits.nutritionalInfo.map((info, index) => (
                                      <li key={index}>{info}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {technicalSheet.benefits.recommendations.length > 0 && (
                                <div className="mb-3">
                                  <h6 className="font-medium text-purple-600 mb-1">Raccomandazioni:</h6>
                                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                    {technicalSheet.benefits.recommendations.map((rec, index) => (
                                      <li key={index}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Pairing Suggestions */}
                          {technicalSheet.pairingsSuggestions.length > 0 && (
                            <div className="mb-4">
                              <h5 className="font-semibold text-purple-700 mb-2">Suggerimenti di Abbinamento</h5>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                {technicalSheet.pairingsSuggestions.map((pairing, index) => (
                                  <li key={index}>{pairing}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Enhanced Description */}
                          <div>
                            <h5 className="font-semibold text-purple-700 mb-2">Descrizione Dettagliata</h5>
                            <p className="text-sm text-gray-700 leading-relaxed">{technicalSheet.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Errore Scheda Tecnica */}
                  {technicalSheetError && (
                    <div className="mt-6">
                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">Errore nella generazione della scheda tecnica</span>
                            </div>
                            <p className="text-sm text-red-600 mt-2">{technicalSheetError}</p>
                            <Button
                              onClick={handleGenerateTechnicalSheet}
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-700 hover:bg-red-100"
                            >
                              Riprova
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  

                  
                  {/* Descrizione aggiuntiva per prodotti NATURALE - Collassabile */}
                  {product.category && product.category.toUpperCase().includes('NATURALE') && (
                    <div className="mt-6">
                      <button
                        onClick={() => setIsNaturaleDescriptionOpen(!isNaturaleDescriptionOpen)}
                        className="w-full p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-lg">💧</span>
                            </div>
                            <h4 className="text-lg font-semibold text-blue-800">Acqua OLIGOMINERALE - Informazioni Dettagliate</h4>
                          </div>
                          <ChevronDown 
                            className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${
                              isNaturaleDescriptionOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isNaturaleDescriptionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="p-4 bg-blue-50 rounded-b-xl border-l border-r border-b border-blue-200 space-y-3 text-sm text-gray-700">
                          <p className="font-medium text-blue-700">Residuo Fisso 51 – 500 mg/L</p>
                          <p>
                            <strong>Le acque oligominerali</strong> sono le più rappresentate (circa 56% di quelle in commercio).
                          </p>
                          <p>
                            Insieme a quelle minimamente mineralizzate, fanno parte delle acque cosiddette "leggere", 
                            diventate di moda negli ultimi anni, ed adatte ad un consumo odierno di quantità abbastanza 
                            consistenti (1-2 litri).
                          </p>
                          <p>
                            Sono caratterizzate oltre che da un ridotto residuo fisso, da una scarsa presenza di metalli 
                            pesanti, di oligoelementi e da una quantità più o meno grande di gas disciolti.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Descrizione aggiuntiva per prodotti EFFERVESCENTE - Collassabile */}
                  {product.category && product.category.toUpperCase().includes('EFFERVESCENTE') && (
                    <div className="mt-6">
                      <button
                        onClick={() => setIsEffervescenteDescriptionOpen(!isEffervescenteDescriptionOpen)}
                        className="w-full p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-lg">🫧</span>
                            </div>
                            <h4 className="text-lg font-semibold text-green-800">Acqua MEDIOMINERALE - Informazioni Dettagliate</h4>
                          </div>
                          <ChevronDown 
                            className={`w-5 h-5 text-green-600 transition-transform duration-200 ${
                              isEffervescenteDescriptionOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isEffervescenteDescriptionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="p-4 bg-green-50 rounded-b-xl border-l border-r border-b border-green-200 space-y-3 text-sm text-gray-700">
                          <p className="font-medium text-green-700">Residuo Fisso 501 – 1500 mg/L</p>
                          <p>
                            <strong>Le acque effervescenti naturali</strong> sono acque minerali nelle quali è disciolto liberamente Co2 (biossido di carbonio o anidride carbonica), che non viene addizionato alla produzione, ma è già presente naturalmente in quantità significativa (almeno 250 mg./litro) nell'acqua che sgorga dalla sorgente.
                          </p>
                          <p>
                            Si tratta di acque ricche di minerali, per questo altamente digestive.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Descrizione aggiuntiva per prodotti FRIZZANTE - Collassabile */}
                  {product.category && product.category.toUpperCase().includes('FRIZZANTE') && (
                    <div className="mt-6">
                      <button
                        onClick={() => setIsFrizzanteDescriptionOpen(!isFrizzanteDescriptionOpen)}
                        className="w-full p-4 bg-cyan-50 rounded-xl border border-cyan-200 hover:bg-cyan-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                              <span className="text-cyan-600 text-lg">🥤</span>
                            </div>
                            <h4 className="text-lg font-semibold text-cyan-800">Acqua con ANIDRIDE CARBONICA - Informazioni Dettagliate</h4>
                          </div>
                          <ChevronDown 
                            className={`w-5 h-5 text-cyan-600 transition-transform duration-200 ${
                              isFrizzanteDescriptionOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isFrizzanteDescriptionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="p-4 bg-cyan-50 rounded-b-xl border-l border-r border-b border-cyan-200 space-y-3 text-sm text-gray-700">
                          <p>
                            Questa è un'acqua a cui è stata aggiunta anidride carbonica (CO2) in maniera artificiale. In questo modo l'acqua risulta essere molto più <strong>FRIZZANTE</strong> rispetto alla fonte naturale da cui è stata prelevata.
                          </p>
                        </div>
                      </div>
                    </div>
                   )}
                   
                   {/* Descrizione aggiuntiva per prodotti BIRRA - Collassabile */}
                   {product.category && product.category.toUpperCase().includes('BIRRA') && (
                     <div className="mt-6">
                       <button
                         onClick={() => setIsBirraDescriptionOpen(!isBirraDescriptionOpen)}
                         className="w-full p-4 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                       >
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                               <span className="text-amber-600 text-lg">🛡️</span>
                             </div>
                             <h4 className="text-lg font-semibold text-amber-800">Bevi RESPONSABILMENTE - Informazioni Dettagliate</h4>
                           </div>
                           <ChevronDown 
                             className={`w-5 h-5 text-amber-600 transition-transform duration-200 ${
                               isBirraDescriptionOpen ? 'rotate-180' : ''
                             }`}
                           />
                         </div>
                       </button>
                       
                       <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                         isBirraDescriptionOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                       }`}>
                         <div className="p-4 bg-amber-50 rounded-b-xl border-l border-r border-b border-amber-200 space-y-4 text-sm text-gray-700">
                           <p>
                             Bere responsabilmente significa fare un consumo moderato e consapevole di alcolici che risulti compatibile con la vita personale e sociale di ciascuno. La quantità di alcol giornaliera che si considera moderata è pari a: non più di 2 Unità alcoliche per l'uomo e non più di 1 Unità alcolica per la donna.
                           </p>
                           <p>
                             Sono da considerarsi 1 unità alcolica le seguenti categorie con le rispettive porzioni e gradazioni:
                           </p>
                           <div className="space-y-2 font-medium">
                             <p><strong>BIRRA – 330 ml – 4,5°</strong></p>
                             <p><strong>VINO – 125 ml – 12°</strong></p>
                             <p><strong>SUPERALCOLICO – 40 ml – 40°</strong></p>
                           </div>
                           <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                             <p className="text-red-700 font-medium text-center">
                               😊 Non arrivare al limite. <strong>BEVI RESPONSABILMENTE</strong> 😊
                             </p>
                           </div>
                         </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Descrizione aggiuntiva per prodotti VINO - Collassabile */}
                    {product.category && product.category.toUpperCase().includes('VINO') && (
                      <div className="mt-6">
                        <button
                          onClick={() => setIsVinoDescriptionOpen(!isVinoDescriptionOpen)}
                          className="w-full p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 text-lg">🍷</span>
                              </div>
                              <h4 className="text-lg font-semibold text-purple-800">Bevi RESPONSABILMENTE - Informazioni Dettagliate</h4>
                            </div>
                            <ChevronDown 
                              className={`w-5 h-5 text-purple-600 transition-transform duration-200 ${
                                isVinoDescriptionOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isVinoDescriptionOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="p-4 bg-purple-50 rounded-b-xl border-l border-r border-b border-purple-200 space-y-4 text-sm text-gray-700">
                            <p>
                              Bere responsabilmente significa fare un consumo moderato e consapevole di alcolici che risulti compatibile con la vita personale e sociale di ciascuno. La quantità di alcol giornaliera che si considera moderata è pari a: non più di 2 Unità alcoliche per l'uomo e non più di 1 Unità alcolica per la donna.
                            </p>
                            <p>
                              Sono da considerarsi 1 unità alcolica le seguenti categorie con le rispettive porzioni e gradazioni:
                            </p>
                            <div className="space-y-2 font-medium">
                              <p><strong>BIRRA – 330 ml – 4,5°</strong></p>
                              <p><strong>VINO – 125 ml – 12°</strong></p>
                              <p><strong>SUPERALCOLICO – 40 ml – 40°</strong></p>
                            </div>
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-red-700 font-medium text-center">
                                😊 Non arrivare al limite. <strong>BEVI RESPONSABILMENTE</strong> 😊
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Descrizione aggiuntiva per prodotti BEVANDE - Collassabile */}
                    {product.category && product.category.toUpperCase().includes('BEVANDE') && (
                      <div className="mt-6">
                        <button
                          onClick={() => setIsBevandeDescriptionOpen(!isBevandeDescriptionOpen)}
                          className="w-full p-4 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 text-lg">🥤</span>
                              </div>
                              <h4 className="text-lg font-semibold text-orange-800">Bevi MODERATAMENTE - Informazioni Dettagliate</h4>
                            </div>
                            <ChevronDown 
                              className={`w-5 h-5 text-orange-600 transition-transform duration-200 ${
                                isBevandeDescriptionOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isBevandeDescriptionOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="p-4 bg-orange-50 rounded-b-xl border-l border-r border-b border-orange-200 space-y-4 text-sm text-gray-700">
                            <p>
                              Le bevande zuccherate dovrebbero essere consumate con moderazione come parte di una dieta equilibrata. Un consumo eccessivo di bevande ad alto contenuto di zuccheri può contribuire a problemi di salute a lungo termine.
                            </p>
                            <p>
                              <strong>Raccomandazioni per un consumo responsabile:</strong>
                            </p>
                            <div className="space-y-2">
                              <p>• Limita il consumo di bevande zuccherate durante la giornata</p>
                              <p>• Preferisci l'acqua come bevanda principale per l'idratazione</p>
                              <p>• Leggi sempre le etichette per conoscere il contenuto di zuccheri</p>
                              <p>• Considera le bevande zuccherate come un piacere occasionale</p>
                            </div>
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-yellow-700 font-medium text-center">
                                ⚖️ <strong>MODERA IL CONSUMO</strong> per una vita più sana ⚖️
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>


              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Info - Modernized */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            {
              id: 'certified',
              icon: <Shield className="w-8 h-8 text-green-600" />,
              title: 'Prodotto CERTIFICATO e GARANTITO',
              borderColor: 'border-green-600',
              titleColor: 'text-green-600',
              ringColor: 'ring-green-500',
              bgGradient: 'from-green-50 to-emerald-50',
              iconBg: 'bg-green-100',
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 leading-relaxed">La conservazione di questo prodotto avviene in un luogo asciutto e lontano dai raggi solari, che ne potrebbero alterare il contenuto. La certificazione è concessa dall'azienda Meloam S.p.a leader nel settore SICUREZZA SUL LAVORO che garantisce la tutela dei consumatori.</p>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium flex items-center gap-2">
                      <span className="text-lg">☀️</span> Paura della plastica esposta al sole? 😱
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                      <span className="text-lg">😊</span> Niente paura, stai tranquillo!
                    </p>
                  </div>
                </div>
              )
            },
            {
              id: 'delivery',
              icon: <Truck className="w-8 h-8 text-blue-600" />,
              title: 'Consegna direttamente al piano',
              borderColor: 'border-[#1B5AAB]',
              titleColor: 'text-[#1B5AAB]',
              ringColor: 'ring-[#1B5AAB]',
              bgGradient: 'from-blue-50 to-sky-50',
              iconBg: 'bg-blue-100',
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 leading-relaxed">Questo prodotto verrà consegnato direttamente fin dietro la porta di casa vostra o dove vi risulterà più comodo. Ovviamente non ci saranno costi aggiuntivi. È tutto incluso nel prezzo che vedete esposto.</p>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600 font-bold flex items-center gap-2">
                      <span className="text-lg">⚡</span> NESSUNO SFORZO DA PARTE VOSTRA 😊
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600">N.B. Gli appartamenti non muniti di ascensore potranno essere serviti ma la consegna potrà avvenire massimo al primo piano</p>
                  </div>
                </div>
              )
            },
            {
              id: 'timing',
              icon: <RotateCcw className="w-8 h-8 text-[#A40800]" />,
              title: 'Tempi di consegna immediati',
              borderColor: 'border-[#A40800]',
              titleColor: 'text-[#A40800]',
              ringColor: 'ring-[#A40800]',
              bgGradient: 'from-red-50 to-rose-50',
              iconBg: 'bg-red-100',
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 leading-relaxed">Questo prodotto è presente nei nostri magazzini e sarà consegnato a distanza di un solo giorno lavorativo.</p>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600 font-bold flex items-center gap-2">
                      <span className="text-lg">⏰</span> TEMPI DI ATTESA NULLI
                    </p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium flex items-center gap-2">
                      <span className="text-lg">📅</span> Ordina OGGI, consegnamo DOMANI 😊
                    </p>
                  </div>
                </div>
              )
            }
          ].map((item) => {
            const isOpen = expandedCard === item.id;
            return (
              <Card 
                key={item.id} 
                className={`group transition-all duration-500 cursor-pointer hover:shadow-2xl border-0 bg-gradient-to-br ${item.bgGradient} hover:scale-105 transform ${
                  isOpen ? 'shadow-2xl scale-105' : 'hover:shadow-xl'
                } rounded-2xl overflow-hidden`}
                onClick={() => setExpandedCard(isOpen ? null : item.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-2xl ${item.iconBg} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        {item.icon}
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${item.titleColor} group-hover:text-opacity-80 transition-colors duration-300`}>
                          {item.title}
                        </h3>
                        <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${item.titleColor.replace('text-', 'from-')} to-transparent transition-all duration-500 rounded-full mt-1`}></div>
                      </div>
                    </div>
                    <div className={`p-2 rounded-full ${item.iconBg} group-hover:rotate-180 transition-all duration-500`}>
                      <ChevronDown 
                        className={`w-5 h-5 transition-transform duration-500 ${
                          item.titleColor
                        } ${
                          isOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </div>
                  
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="pt-2">
                      {item.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Banner Promozionale sopra Prodotti Simili */}
        <div className="mt-16 mb-8">
          <div className={`bg-gradient-to-r ${getBannerColor(product.category)} text-white py-6 overflow-hidden relative rounded-2xl shadow-2xl`}>
            {/* Effetti decorativi di sfondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20"></div>
            <div className="absolute top-2 left-4 w-12 h-12 bg-white/20 rounded-full blur-lg animate-pulse"></div>
            <div className="absolute bottom-2 right-8 w-8 h-8 bg-white/15 rounded-full blur-md animate-pulse" style={{animationDelay: '1s'}}></div>
            
            {/* Contenuto scorrevole */}
             <div className="relative z-10">
               <style>{`
                 @keyframes marquee {
                   0% { transform: translateX(100%); }
                   100% { transform: translateX(-100%); }
                 }
                 .animate-marquee {
                   animation: marquee 25s linear infinite;
                 }
               `}</style>
              
              <div className="animate-marquee whitespace-nowrap flex text-xl font-bold">
                {getBannerMessages(product.category).map((message, index) => (
                  <span key={index} className="mx-12 drop-shadow-lg">{message}</span>
                ))}
                {/* Duplicazione delle frasi per scorrimento continuo */}
                {getBannerMessages(product.category).map((message, index) => (
                  <span key={`duplicate-${index}`} className="mx-12 drop-shadow-lg">{message}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section - Modernized */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 mb-12">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent mb-3">
                Prodotti Simili
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-red-700 mx-auto rounded-full"></div>
              <p className="text-gray-600 mt-4 text-lg">Scopri altri prodotti che potrebbero interessarti</p>
            </div>
            {isLoadingRelated ? (
              <div className="text-center py-12">
                <LoadingAnimation 
                  width={120} 
                  height={120} 
                  text="Caricamento prodotti correlati..." 
                  className="mx-auto" 
                />
              </div>
            ) : (
              <div className="relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl shadow-lg border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-r from-red-50/20 via-transparent to-red-50/20 rounded-3xl"></div>
                <div className="relative">
                  <div 
                    className="flex overflow-x-auto gap-8 pb-6 scrollbar-hide scroll-smooth cursor-grab active:cursor-grabbing hover:cursor-grab"
                    style={{
                      scrollBehavior: 'smooth',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
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
                      
                      e.preventDefault();
                    }}
                  >
                    <div className="flex gap-8 px-4">
                      {relatedProducts.map((relatedProduct, index) => (
                        <div 
                          key={relatedProduct.id} 
                          className="flex-shrink-0 w-64 transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                          style={{
                            animationDelay: `${index * 0.1}s`
                          }}
                        >
                          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:border-red-200 transition-all duration-300">
                            <ProductCard product={relatedProduct} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Scroll indicators */}
                  <div className="flex justify-center mt-6 space-x-2">
                    {Array.from({ length: Math.ceil(relatedProducts.length / 3) }).map((_, index) => (
                      <div 
                        key={index}
                        className="w-2 h-2 rounded-full bg-red-200 hover:bg-red-400 transition-colors duration-300 cursor-pointer"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Mobile Fixed Bottom Bar - Quantity Selector */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white shadow-lg z-[60]" style={{borderBottom: '2px solid #1C5FB3'}}>
        <div className="px-3 py-2">
          {product.inStock ? (
            <div className="flex items-center justify-between gap-2">
              {/* Seleziona Quantità Text */}
              <div className="flex items-center gap-1 text-xs font-medium" style={{color: '#A40800'}}>
                <ShoppingBag className="w-3 h-3" />
                <span className="whitespace-nowrap text-xs">Quantità</span>
              </div>
              
              {/* Quantity Controls */}
              <div className="flex items-center bg-gray-50 rounded-lg p-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    const newQuantity = Math.max(0, quantity - 1);
                    setQuantity(newQuantity);
                    
                    if (cartItem) {
                      if (newQuantity === 0) {
                        dispatch({
                          type: 'REMOVE_ITEM',
                          payload: product.id
                        });
                        toast.success(`${product.name} rimosso dal carrello`);
                      } else {
                        dispatch({
                          type: 'UPDATE_QUANTITY',
                          payload: {
                            id: product.id,
                            quantity: newQuantity
                          }
                        });
                        toast.success(`Quantità aggiornata: ${newQuantity}x`);
                      }
                    }
                  }}
                  className="w-8 h-8 rounded-md bg-white shadow-sm hover:shadow-md transition-all duration-200 font-bold text-sm"
                  style={{
                    color: getBorderColor(product.category),
                    backgroundColor: 'white'
                  }}
                >
                  −
                </Button>
                <div className="px-3 py-1 bg-white rounded-md shadow-sm mx-1 min-w-[40px] text-center">
                  <span className="text-base font-bold text-gray-800">
                    {quantity}
                  </span>
                </div>
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
                          category: product.category
                        }
                      });
                      toast.success(`${product.name} aggiunto al carrello`);
                    } 
                    // Se il prodotto è già nel carrello, aggiorna sempre la quantità
                    else if (cartItem) {
                      dispatch({
                        type: 'UPDATE_QUANTITY',
                        payload: {
                          id: product.id,
                          quantity: newQuantity
                        }
                      });
                      toast.success(`Quantità aggiornata: ${newQuantity}x`);
                    }
                    // Se il prodotto non è nel carrello ma la quantità è > 1, aggiungilo e poi aggiorna
                    else if (!cartItem && newQuantity > 1) {
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
                      // Aggiorna la quantità dopo un breve delay
                      setTimeout(() => {
                        dispatch({
                          type: 'UPDATE_QUANTITY',
                          payload: {
                            id: product.id,
                            quantity: newQuantity
                          }
                        });
                      }, 50);
                      toast.success(`${product.name} aggiunto al carrello (${newQuantity}x)`);
                    }
                  }}
                  className="w-8 h-8 rounded-md bg-white shadow-sm hover:shadow-md transition-all duration-200 font-bold text-sm"
                  style={{
                    color: getBorderColor(product.category),
                    backgroundColor: 'white'
                  }}
                >
                  +
                </Button>
              </div>
              
              {/* Cart Button */}
               <Button 
                 onClick={() => {
                   // Se quantity è 0, vai direttamente al carrello
                   if (quantity === 0) {
                     navigate('/cart');
                   } else {
                     // Se quantity > 0, assicurati che il prodotto sia nel carrello con la quantità corretta
                     if (cartItem) {
                       // Se il prodotto è già nel carrello, aggiorna la quantità
                       dispatch({
                         type: 'UPDATE_QUANTITY',
                         payload: {
                           id: product.id,
                           quantity: quantity
                         }
                       });
                       toast.success(`Quantità aggiornata: ${quantity}x ${product.name}`);
                     } else {
                       // Se il prodotto non è nel carrello, aggiungilo
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
                       
                       // Se la quantità è maggiore di 1, aggiorna immediatamente
                       if (quantity > 1) {
                         setTimeout(() => {
                           dispatch({
                             type: 'UPDATE_QUANTITY',
                             payload: {
                               id: product.id,
                               quantity: quantity
                             }
                           });
                         }, 50);
                       }
                       
                       toast.success(`${quantity}x ${product.name} aggiunto al carrello`);
                     }
                     
                     // Redirect to cart after adding to cart
                     setTimeout(() => {
                       navigate('/cart');
                     }, 150);
                   }
                 }}
                 disabled={false}
                 className="flex-1 h-10 rounded-lg font-medium text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1 text-xs"
                 style={{
                   backgroundColor: quantity === 0 ? '#9CA3AF' : '#1C5FB3',
                   borderColor: quantity === 0 ? '#9CA3AF' : '#1C5FB3'
                 }}
               >
                 <ShoppingBag className="w-3 h-3" />
                 {quantity === 0 ? (
                   <span className="whitespace-nowrap">Carrello</span>
                 ) : (
                   <span className="whitespace-nowrap">{(product.price * quantity).toFixed(2)}€</span>
                 )}
               </Button>
            </div>
          ) : (
            <div className="text-center py-3">
              <div className="text-gray-500 font-medium bg-gray-100 px-4 py-3 rounded-xl">
                Prodotto non disponibile
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Desktop Fixed Bottom Bar - Product Info */}
      {showDesktopBar && product && (
        <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white shadow-lg z-[70] border-t-2" style={{borderTopColor: '#1C5FB3'}}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Left Section: Image + Name + Price */}
              <div className="flex items-center gap-4">
                {/* Product Image */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg shadow-sm"
                />
                
                {/* Product Name */}
                <h3 className="font-semibold text-gray-900 text-xl">{product.name}</h3>
                
                {/* Product Price */}
                <p className="text-2xl font-bold" style={{color: '#1C5FB3'}}>
                  {product.price.toFixed(2)}€
                </p>
              </div>
              
              {/* Right Section: Quantity Controls + Cart Button */}
              {product.inStock ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm font-medium" style={{color: '#A40800'}}>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Quantità</span>
                  </div>
                  
                  <div className="flex items-center bg-gray-50 rounded-lg p-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const newQuantity = Math.max(0, quantity - 1);
                        setQuantity(newQuantity);
                        
                        if (cartItem) {
                          if (newQuantity === 0) {
                            dispatch({
                              type: 'REMOVE_ITEM',
                              payload: product.id
                            });
                            toast.success(`${product.name} rimosso dal carrello`);
                          } else {
                            dispatch({
                              type: 'UPDATE_QUANTITY',
                              payload: {
                                id: product.id,
                                quantity: newQuantity
                              }
                            });
                            toast.success(`Quantità aggiornata: ${newQuantity}x`);
                          }
                        }
                      }}
                      className="w-8 h-8 rounded-md bg-white shadow-sm hover:shadow-md transition-all duration-200 font-bold text-sm"
                      style={{
                        color: getBorderColor(product.category),
                        backgroundColor: 'white'
                      }}
                    >
                      −
                    </Button>
                    <div className="px-3 py-1 bg-white rounded-md shadow-sm mx-1 min-w-[40px] text-center">
                      <span className="text-base font-bold text-gray-800">
                        {quantity}
                      </span>
                    </div>
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
                        
                        if (quantity === 0 && newQuantity === 1) {
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
                          toast.success(`${product.name} aggiunto al carrello`);
                        } else if (cartItem) {
                          dispatch({
                            type: 'UPDATE_QUANTITY',
                            payload: {
                              id: product.id,
                              quantity: newQuantity
                            }
                          });
                          toast.success(`Quantità aggiornata: ${newQuantity}x`);
                        } else if (!cartItem && newQuantity > 1) {
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
                          setTimeout(() => {
                            dispatch({
                              type: 'UPDATE_QUANTITY',
                              payload: {
                                id: product.id,
                                quantity: newQuantity
                              }
                            });
                          }, 50);
                          toast.success(`${product.name} aggiunto al carrello (${newQuantity}x)`);
                        }
                      }}
                      className="w-8 h-8 rounded-md bg-white shadow-sm hover:shadow-md transition-all duration-200 font-bold text-sm"
                      style={{
                        color: getBorderColor(product.category),
                        backgroundColor: 'white'
                      }}
                    >
                      +
                    </Button>
                  </div>
                  
                  {/* Cart Button */}
                  <Button 
                    onClick={() => {
                      if (quantity === 0) {
                        navigate('/cart');
                      } else {
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
                          
                          if (quantity > 1) {
                            setTimeout(() => {
                              dispatch({
                                type: 'UPDATE_QUANTITY',
                                payload: {
                                  id: product.id,
                                  quantity: quantity
                                }
                              });
                            }, 50);
                          }
                          
                          toast.success(`${quantity}x ${product.name} aggiunto al carrello`);
                        }
                        
                        setTimeout(() => {
                          navigate('/cart');
                        }, 150);
                      }
                    }}
                    className="px-6 py-2 rounded-lg font-medium text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                    style={{
                      backgroundColor: quantity === 0 ? '#9CA3AF' : '#1C5FB3',
                      borderColor: quantity === 0 ? '#9CA3AF' : '#1C5FB3'
                    }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {quantity === 0 ? (
                      <span>Carrello</span>
                    ) : (
                      <span>{(product.price * quantity).toFixed(2)}€</span>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-gray-500 font-medium bg-gray-100 px-4 py-2 rounded-lg">
                  Prodotto non disponibile
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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