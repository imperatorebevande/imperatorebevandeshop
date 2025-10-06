import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useWooCommerceProduct, useWooCommerceProducts } from '@/hooks/useWooCommerce';
import { ShoppingBag, Heart, Star, ArrowLeft, Truck, Shield, RotateCcw, Loader2, ChevronDown, FileText, Minus, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { getBorderColor } from "../lib/utils";
import { chatGPTService, ProductTechnicalSheet } from '@/services/chatgptService';

const ProductDetail = () => {
  const { id } = useParams();
  const { state, dispatch } = useCart();
  
  // TUTTI gli hooks devono essere chiamati SEMPRE nello stesso ordine
  const [quantity, setQuantity] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [technicalSheet, setTechnicalSheet] = useState<ProductTechnicalSheet | null>(null);
  const [isLoadingTechnicalSheet, setIsLoadingTechnicalSheet] = useState(false);
  const [technicalSheetError, setTechnicalSheetError] = useState<string | null>(null);

  // Hooks personalizzati - sempre nello stesso ordine
  const { data: wooProduct, isLoading, error } = useWooCommerceProduct(parseInt(id || '0'));
  
  // Questo hook deve essere sempre chiamato, anche se categoryId è undefined
  const categoryId = wooProduct?.categories?.[0]?.id;
  const { data: relatedWooProducts, isLoading: isLoadingRelated } = useWooCommerceProducts({
    category: categoryId?.toString() || '',
    per_page: 4,
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
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Caricamento prodotto...</p>
          </div>
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
  })) || [];

  const discountPercentage = product.originalPrice 
    ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100) 
    : null;

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
                
                {/* Rating */}
                {product.rating > 0 && (
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400 mr-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({product.reviews} recensioni)</span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-sky-600">
                      €{product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        €{product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {discountPercentage && product.inStock && (
                    <span className="text-green-600 font-medium text-sm">
                      Risparmi €{(product.originalPrice! - product.price).toFixed(2)}!
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Descrizione</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateTechnicalSheet}
                      disabled={isLoadingTechnicalSheet}
                      className="flex items-center space-x-2 text-[#1B5AAB] border-[#1B5AAB] hover:bg-[#1B5AAB] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {isLoadingTechnicalSheet ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      <span>{isLoadingTechnicalSheet ? 'Generando...' : 'Scheda Tecnica'}</span>
                    </Button>
                  </div>
                  <div 
                    className="text-gray-600 text-sm" 
                    dangerouslySetInnerHTML={{
                      __html: product.description.replace(/<[^>]*>/g, '')
                    }} 
                  />
                </div>

                {/* Technical Sheet Display */}
                {technicalSheet && (
                  <div className="mb-4">
                    <Card className="border-[#1B5AAB] border-opacity-30 bg-gradient-to-br from-blue-50 to-indigo-50">
                      <CardContent className="p-4">
                        <h4 className="text-lg font-semibold text-[#1B5AAB] mb-3 flex items-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <FileText className="w-5 h-5 mr-2" />
                          Scheda Tecnica e Benefici
                        </h4>
                        
                        {/* Technical Specifications */}
                        <div className="mb-4">
                          <h5 className="font-semibold text-[#164a99] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Specifiche Tecniche</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {Object.entries(technicalSheet.technicalSpecs).map(([key, value]) => {
                              if (!value) return null;
                              const label = {
                                category: 'Categoria',
                                ingredients: 'Ingredienti',
                                alcoholContent: 'Gradazione Alcolica',
                                volume: 'Volume',
                                producer: 'Produttore',
                                vintage: 'Annata',
                                servingTemperature: 'Temperatura di Servizio',
                                storageConditions: 'Conservazione',
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
                              }[key] || key;
                              
                              return (
                                <div key={key} className="flex">
                                  <span className="font-medium text-purple-700 min-w-[120px]">{label}:</span>
                                  <span className="text-gray-700">{value}</span>
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
                              <div className="mb-2">
                                <h6 className="font-medium text-purple-600 text-sm mb-1">Benefici per la Salute:</h6>
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                  {technicalSheet.benefits.healthBenefits.map((benefit, index) => (
                                    <li key={index}>{benefit}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {technicalSheet.benefits.nutritionalInfo.length > 0 && (
                              <div className="mb-2">
                                <h6 className="font-medium text-purple-600 text-sm mb-1">Informazioni Nutrizionali:</h6>
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                  {technicalSheet.benefits.nutritionalInfo.map((info, index) => (
                                    <li key={index}>{info}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {technicalSheet.benefits.recommendations.length > 0 && (
                              <div className="mb-2">
                                <h6 className="font-medium text-purple-600 text-sm mb-1">Raccomandazioni:</h6>
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                  {technicalSheet.benefits.recommendations.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Pairings */}
                        {technicalSheet.pairingsSuggestions.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-semibold text-purple-700 mb-2">Abbinamenti Consigliati</h5>
                            <div className="flex flex-wrap gap-2">
                              {technicalSheet.pairingsSuggestions.map((pairing, index) => (
                                <Badge key={index} variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                                  {pairing}
                                </Badge>
                              ))}
                            </div>
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

                {/* Technical Sheet Error */}
                {technicalSheetError && (
                  <div className="mb-4">
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-center text-red-700">
                          <FileText className="w-5 h-5 mr-2" />
                          <span className="font-medium">Errore nella generazione della scheda tecnica</span>
                        </div>
                        <p className="text-sm text-red-600 mt-2">{technicalSheetError}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateTechnicalSheet}
                          className="mt-2 text-red-600 border-red-300 hover:bg-red-100"
                        >
                          Riprova
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

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
              borderColor: 'border-blue-600',
              titleColor: 'text-blue-600',
              ringColor: 'ring-blue-500',
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
              icon: <RotateCcw className="w-6 h-6 text-red-600" />,
              title: 'Tempi di consegna immediati',
              borderColor: 'border-red-600',
              titleColor: 'text-red-600',
              ringColor: 'ring-red-500',
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

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl mb-6 font-bold text-center text-red-700">
              Prodotti Simili
            </h2>
            {isLoadingRelated ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                <p className="text-gray-600">Caricamento prodotti correlati...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                {relatedProducts.map(relatedProduct => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;