import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { useWooCommerceCustomer, useWooCommercePaymentGateways } from '@/hooks/useWooCommerce';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateWooCommerceOrder } from '@/hooks/useWooCommerce';

const Checkout = () => {
  const { state, dispatch } = useCart();
  const navigate = useNavigate();
  const createOrder = useCreateWooCommerceOrder();
  
  // Per ora usiamo l'ID cliente 1 - in un'app reale questo verrebbe dall'autenticazione
  const customerId = 1;
  const { data: customer, isLoading: customerLoading } = useWooCommerceCustomer(customerId);
  const { data: paymentGateways, isLoading: paymentGatewaysLoading } = useWooCommercePaymentGateways();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Precompila i dati dal profilo utente quando vengono caricati
  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        email: customer.email || '',
        phone: '', // Phone field will remain empty as it's not available in the customer object
        address: customer.shipping.address_1 || customer.billing.address_1 || '',
        city: customer.shipping.city || customer.billing.city || '',
        postalCode: customer.shipping.postcode || customer.billing.postcode || '',
        province: customer.shipping.state || customer.billing.state || '',
      });
    }
  }, [customer]);

  // Imposta il primo metodo di pagamento disponibile come default
  useEffect(() => {
    if (paymentGateways && paymentGateways.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentGateways[0].id);
    }
  }, [paymentGateways, paymentMethod]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Trova il metodo di pagamento selezionato per ottenere il titolo
      const selectedPaymentGateway = paymentGateways?.find(gateway => gateway.id === paymentMethod);
      
      // Prepara i dati dell'ordine per WooCommerce
      const orderData = {
        customer_id: customerId, // ID del cliente attuale
        billing: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          state: formData.province,
          postcode: formData.postalCode,
          country: 'IT',
          email: formData.email,
          phone: formData.phone,
        },
        shipping: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          state: formData.province,
          postcode: formData.postalCode,
          country: 'IT',
        },
        line_items: state.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
        payment_method_title: selectedPaymentGateway?.title || paymentMethod,
        status: 'processing',
      };

      // Invia l'ordine a WooCommerce
      const wooCommerceOrder = await createOrder(orderData);
      
      console.log('Ordine WooCommerce creato:', wooCommerceOrder);
      
      // Svuota il carrello locale
      dispatch({ type: 'CLEAR_CART' });
      
      toast.success(`Ordine #${wooCommerceOrder.number} completato con successo!`);
      navigate('/order-success', { 
        state: { 
          orderNumber: wooCommerceOrder.number,
          orderId: wooCommerceOrder.id,
          total: wooCommerceOrder.total 
        } 
      });
      
    } catch (error) {
      console.error('Errore durante la creazione dell\'ordine:', error);
      toast.error('Errore durante la creazione dell\'ordine. Riprova più tardi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = () => {
    return Object.values(formData).every(value => value.trim() !== '') && paymentMethod;
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="text-6xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold mb-4">Il carrello è vuoto</h1>
            <p className="text-gray-600 mb-8">
              Aggiungi alcuni prodotti al carrello prima di procedere al checkout.
            </p>
            <Button onClick={() => navigate('/products')} className="gradient-primary">
              Vai ai Prodotti
            </Button>
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
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna al Carrello
          </Button>
          
          <h1 className="text-4xl font-bold mb-4 text-gradient">
            Finalizza Ordine
          </h1>
          <p className="text-gray-600">
            Completa i tuoi dati per finalizzare l'acquisto
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form di checkout */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Dati di Spedizione
                  {customerLoading && (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        disabled={customerLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Cognome *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        disabled={customerLoading}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefono *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Indirizzo *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Città *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        disabled={customerLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">CAP *</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        disabled={customerLoading}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="province">Provincia *</Label>
                    <Input
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Metodo di Pagamento
                  {paymentGatewaysLoading && (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentGatewaysLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">Caricamento metodi di pagamento...</p>
                    </div>
                  ) : paymentGateways && paymentGateways.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {paymentGateways.map((gateway) => (
                        <label 
                          key={gateway.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={gateway.id}
                            checked={paymentMethod === gateway.id}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-blue-600"
                            disabled={paymentGatewaysLoading}
                          />
                          <div className="flex items-center space-x-2">
                            {/* Icona personalizzata basata sul tipo di gateway */}
                            {gateway.id.includes('stripe') || gateway.id.includes('card') ? (
                              <CreditCard className="w-5 h-5" />
                            ) : gateway.id.includes('paypal') ? (
                              <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                                P
                              </div>
                            ) : gateway.id.includes('cod') || gateway.id.includes('cash') ? (
                              <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center text-white text-xs">
                                €
                              </div>
                            ) : (
                              <div className="w-5 h-5 bg-gray-600 rounded flex items-center justify-center text-white text-xs">
                                •
                              </div>
                            )}
                            <div>
                              <span className="font-medium">{gateway.title}</span>
                              {gateway.description && (
                                <p className="text-sm text-gray-500">{gateway.description}</p>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Nessun metodo di pagamento disponibile</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Riepilogo ordine */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Riepilogo Ordine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prodotti */}
                <div className="space-y-3">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 py-2 border-b">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-gray-500 text-sm">Quantità: {item.quantity}</p>
                      </div>
                      <p className="font-medium">
                        €{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex justify-between">
                    <span>Subtotale:</span>
                    <span>€{state.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Spedizione:</span>
                    <span className="text-green-600 font-semibold">Gratuita</span>
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Totale:</span>
                    <span>€{state.total.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isProcessing || customerLoading}
                  size="lg" 
                  className="w-full gradient-primary hover:opacity-90"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Elaborazione...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      Completa Ordine
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-gray-500 space-y-1">
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

export default Checkout;
