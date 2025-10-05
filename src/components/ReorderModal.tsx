import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X, RefreshCw, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { wooCommerceService } from '@/services/woocommerce';

interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastOrder: any;
}

const ReorderModal: React.FC<ReorderModalProps> = ({ isOpen, onClose, lastOrder }) => {
  const { dispatch } = useCart();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [quantities, setQuantities] = useState<{[key: number]: number}>({});

  // Inizializza le quantità quando si apre la modale
  useEffect(() => {
    if (lastOrder && lastOrder.line_items) {
      const initialQuantities: {[key: number]: number} = {};
      lastOrder.line_items.forEach((item: any, index: number) => {
        initialQuantities[index] = item.quantity;
      });
      setQuantities(initialQuantities);
    }
  }, [lastOrder]);

  // Funzione per determinare la categoria di un prodotto
  const getProductCategory = (product: any): string => {
    if (!product.categories || product.categories.length === 0) return 'altri';
    
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

  // Funzioni per gestire le quantità
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity >= 0) {
      setQuantities(prev => ({
        ...prev,
        [index]: newQuantity
      }));
    }
  };

  const increaseQuantity = (index: number) => {
    updateQuantity(index, (quantities[index] || 0) + 1);
  };

  const decreaseQuantity = (index: number) => {
    updateQuantity(index, Math.max(0, (quantities[index] || 0) - 1));
  };

  // Calcola il totale aggiornato
  const calculateUpdatedTotal = () => {
    if (!lastOrder || !lastOrder.line_items) return 0;
    
    return lastOrder.line_items.reduce((total: number, item: any, index: number) => {
      const quantity = quantities[index] || 0;
      const price = parseFloat(item.price);
      return total + (price * quantity);
    }, 0);
  };

  // Funzione per riordinare l'ultimo acquisto
  const handleReorderLast = async () => {
    if (!lastOrder || !lastOrder.line_items) {
      toast.error('Nessun ordine precedente trovato');
      return;
    }
    
    setIsLoading(true);
    let addedItems = 0;
    
    try {
      toast.info('Aggiunta prodotti al carrello...');
      
      const productPromises = lastOrder.line_items.map(async (item: any) => {
        try {
          const product = await wooCommerceService.getProduct(item.product_id);
          
          const category = getProductCategory(product);
          
          const cartItem = {
            id: item.product_id,
            name: item.name,
            price: parseFloat(item.price),
            image: product.images && product.images.length > 0 
              ? product.images[0].src 
              : '/placeholder.svg',
            category: category
          };
          
          return { cartItem, quantity: item.quantity };
        } catch (error) {
          console.error(`Errore nel recupero del prodotto ${item.product_id}:`, error);
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
      
      const products = await Promise.all(productPromises);
      
      products.forEach(({ cartItem }, index) => {
        const quantity = quantities[index] || 0;
        if (quantity > 0) {
          for (let i = 0; i < quantity; i++) {
            dispatch({ type: 'ADD_ITEM', payload: cartItem });
          }
          addedItems += quantity;
        }
      });
      
      if (addedItems > 0) {
        toast.success(`${addedItems} prodotti dall'ultimo ordine aggiunti al carrello!`);
      } else {
        toast.info('Nessun prodotto selezionato per l\'aggiunta al carrello');
        setIsLoading(false);
        return;
      }
      
      // Chiudi la modale
      onClose();
      
      // Reindirizza al carrello per mostrare i prodotti aggiunti
      setTimeout(() => {
        navigate('/cart');
      }, 1500);
      
    } catch (error) {
      console.error('Errore nel recupero dei prodotti:', error);
      toast.error('Errore nel recupero delle informazioni dei prodotti');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewOrder = () => {
    onClose();
    navigate('/prodotti');
  };

  if (!lastOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto !top-4 !translate-y-0 !left-[50%] !translate-x-[-50%] mx-4 sm:mx-0 w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-[#1B5AAB] flex items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Riordina Ultimo Acquisto
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Dettagli ultimo ordine */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              🎯 Cosa vuoi fare oggi?
            </h3>
            
            <div className="bg-white rounded-xl p-3 sm:p-5 border-2 border-blue-200 shadow-lg mb-4 sm:mb-6">
              <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 flex-wrap">
                📋 Ultimo Ordine #{lastOrder.number} 
                <span className="text-sm font-normal text-gray-600">
                  - {new Date(lastOrder.date_created).toLocaleDateString('it-IT')}
                </span>
              </h4>
              
              <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                {lastOrder.line_items?.map((item: any, index: number) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm bg-gradient-to-r from-gray-50 to-gray-100 p-2 sm:p-3 rounded-lg border border-gray-200 gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-900 block truncate">{item.name}</span>
                      <div className="text-xs text-gray-600 mt-1">€{parseFloat(item.price).toFixed(2)} cad.</div>
                    </div>
                    <div className="flex items-center justify-between sm:gap-3 gap-2">
                      {/* Controlli quantità */}
                      <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg border border-gray-300 p-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => decreaseQuantity(index)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          disabled={isLoading}
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <span className="font-bold text-sm sm:text-lg min-w-[1.5rem] sm:min-w-[2rem] text-center">
                          {quantities[index] || 0}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => increaseQuantity(index)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-green-100 hover:text-green-600"
                          disabled={isLoading}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      {/* Totale per prodotto */}
                      <div className="text-right min-w-[3rem] sm:min-w-[4rem]">
                        <div className="font-bold text-gray-900">
                          €{((quantities[index] || 0) * parseFloat(item.price)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t-2 border-gray-200 text-right">
                <div className="space-y-1">
                  {calculateUpdatedTotal() !== parseFloat(lastOrder.total) && (
                    <div className="text-xs sm:text-sm text-gray-500 line-through">
                      Originale: €{parseFloat(lastOrder.total).toFixed(2)}
                    </div>
                  )}
                  <span className="font-bold text-lg sm:text-xl text-green-600">
                    💰 Totale: €{calculateUpdatedTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Pulsanti azione */}
            <div className="space-y-3 sm:space-y-4">
              <Button
                onClick={handleReorderLast}
                disabled={isLoading || Object.values(quantities).every(q => q === 0)}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 sm:py-6 px-6 sm:px-8 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 font-bold text-lg sm:text-xl shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Aggiunta in corso...</span>
                    <span className="sm:hidden">Aggiunta...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="hidden sm:inline">Ripeti questo Ordine</span>
                    <span className="sm:hidden">Ripeti Ordine</span>
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleNewOrder}
                variant="outline"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Continua sul Sito</span>
                <span className="sm:hidden">Nuovo Ordine</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReorderModal;