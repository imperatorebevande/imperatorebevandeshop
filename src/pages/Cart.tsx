
import React from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ArrowLeft, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getBorderColor } from '@/lib/utils';

const Cart = () => {
  const { state, dispatch } = useCart();

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
      toast.info('Prodotto rimosso dal carrello');
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    }
  };

  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    toast.success('Prodotto rimosso dal carrello', {
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
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.info('Carrello svuotato');
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="text-center">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🛒</div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4" style={{color: '#1B5AAB'}}>Il tuo carrello è vuoto</h1>
            <p className="text-gray-600 mb-6 sm:mb-8 px-4">
              Scopri i nostri fantastici prodotti e inizia a fare shopping!
            </p>
            <Link to="/products">
              <Button size="lg" className="gradient-primary w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Continua lo Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6 sm:py-8 pb-32 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4" style={{color: '#1B5AAB'}}>
            Il Tuo Carrello
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {state.items.length} {state.items.length === 1 ? 'prodotto' : 'prodotti'} nel carrello
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 mb-6 lg:mb-0">
            {state.items.map((item) => (
              <Card 
                key={item.id}
                className="border-2"
                style={{ borderColor: getBorderColor(item.category) }}
              >
                <CardContent className="p-4 sm:p-6">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden space-y-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base leading-tight mb-1" style={{color: '#1B5AAB'}}>
                          {item.name}
                        </h3>
                        <p className="font-bold text-lg" style={{color: '#A40800'}}>
                          €{item.price.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        
                        <span className="w-8 text-center font-medium text-sm">
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          €{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate" style={{color: '#1B5AAB'}}>
                        {item.name}
                      </h3>
                      <p className="font-bold text-xl" style={{color: '#A40800'}}>
                        €{item.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-lg">
                        €{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0 pt-4">
              <Link to="/products" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continua lo Shopping
                </Button>
              </Link>
              
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Svuota Carrello
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:order-last mb-8 lg:mb-0">
            <Card className="lg:sticky lg:top-32">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Riepilogo Ordine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Subtotale:</span>
                  <span style={{color: '#A40800'}}>€{state.total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Spedizione:</span>
                  <span className="text-green-600 font-semibold">
                    Gratuita
                  </span>
                </div>
                
                <hr />
                
                <div className="flex justify-between text-base sm:text-lg font-bold">
                  <span>Totale:</span>
                  <span style={{color: '#A40800'}}>€{state.total.toFixed(2)}</span>
                </div>

                <Link to="/checkout">
                  <Button size="lg" className="w-full hover:opacity-90" style={{backgroundColor: '#1B5AAB', color: 'white'}}>
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Procedi all'Ordine
                  </Button>
                </Link>

                <div className="text-center text-xs sm:text-sm text-gray-500 space-y-1">
                  <p>🔒 Pagamento sicuro e protetto</p>
                  <p>✓ Garanzia soddisfatti o rimborsati</p>
                  <p>🚚 Spedizione sempre gratuita</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
