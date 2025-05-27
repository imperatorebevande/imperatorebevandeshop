
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ArrowLeft, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

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
    toast.info('Prodotto rimosso dal carrello');
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.info('Carrello svuotato');
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="text-6xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold mb-4">Il tuo carrello è vuoto</h1>
            <p className="text-gray-600 mb-8">
              Scopri i nostri fantastici prodotti e inizia a fare shopping!
            </p>
            <Link to="/products">
              <Button size="lg" className="gradient-primary">
                <ArrowLeft className="w-5 h-5 mr-2" />
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gradient">
            Il Tuo Carrello
          </h1>
          <p className="text-gray-600">
            {state.items.length} {state.items.length === 1 ? 'prodotto' : 'prodotti'} nel carrello
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {item.name}
                      </h3>
                      <p className="text-purple-600 font-bold text-xl">
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

            <div className="flex justify-between items-center pt-4">
              <Link to="/products">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continua lo Shopping
                </Button>
              </Link>
              
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Svuota Carrello
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Riepilogo Ordine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotale:</span>
                  <span>€{state.total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Spedizione:</span>
                  <span className="text-green-600 font-semibold">
                    Gratuita
                  </span>
                </div>
                
                <hr />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Totale:</span>
                  <span>€{state.total.toFixed(2)}</span>
                </div>

                <Link to="/checkout">
                  <Button size="lg" className="w-full gradient-primary hover:opacity-90">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Procedi al Checkout
                  </Button>
                </Link>

                <div className="text-center text-sm text-gray-500">
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
