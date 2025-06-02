import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { useWooCommerceCustomer, useWooCommercePaymentGateways } from '@/hooks/useWooCommerce';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Loader2, ShoppingBag, MapPin, Package, Receipt, CreditCard as PaymentIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateWooCommerceOrder } from '@/hooks/useWooCommerce';

const Checkout = () => {
  const { state, dispatch } = useCart();
  const navigate = useNavigate();
  const createOrder = useCreateWooCommerceOrder();
  
  // Step management - ora solo 3 step
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { id: 0, name: 'INDIRIZZO', icon: MapPin },
    { id: 1, name: 'RIEPILOGO', icon: ShoppingBag },
    { id: 2, name: 'PAGAMENTO', icon: PaymentIcon }
  ];
  
  // Per ora usiamo l'ID cliente 1 - in un'app reale questo verrebbe dall'autenticazione
  const customerId = 1;
  const { data: customer, isLoading: customerLoading } = useWooCommerceCustomer(customerId);
  const { data: paymentGateways, isLoading: paymentGatewaysLoading } = useWooCommercePaymentGateways();
  
  // Filtra i metodi di pagamento per mostrare solo quelli desiderati
  const allowedPaymentMethods = ['cod', 'stripe', 'paypal', 'satispay', 'bacs'];
  const filteredPaymentGateways = paymentGateways?.filter(gateway => 
    allowedPaymentMethods.includes(gateway.id)
  ) || [];
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    orderNotes: '',
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
        phone: customer.billing.phone || '',
        address: customer.shipping.address_1 || customer.billing.address_1 || '',
        city: customer.shipping.city || customer.billing.city || '',
        postalCode: customer.shipping.postcode || customer.billing.postcode || '',
        province: customer.shipping.state || customer.billing.state || '',
        orderNotes: '',
      });
    }
  }, [customer]);

  // Imposta il primo metodo di pagamento disponibile come default
  useEffect(() => {
    if (filteredPaymentGateways && filteredPaymentGateways.length > 0 && !paymentMethod) {
      setPaymentMethod(filteredPaymentGateways[0].id);
    }
  }, [filteredPaymentGateways, paymentMethod]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validazione per ogni step
  const validateStep = (step: number) => {
    switch (step) {
      case 0: // INDIRIZZO (include tutto)
        return formData.firstName && formData.lastName && formData.email && formData.phone &&
               formData.address && formData.city && formData.postalCode && formData.province;
      case 1: // RIEPILOGO
        return true; // Sempre valido
      case 2: // PAGAMENTO
        return paymentMethod;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error('Completa tutti i campi obbligatori');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      toast.error('Seleziona un metodo di pagamento');
      return;
    }

    setIsProcessing(true);

    try {
      const selectedPaymentGateway = paymentGateways?.find(gateway => gateway.id === paymentMethod);
      
      const orderData = {
        customer_id: customerId,
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
        customer_note: formData.orderNotes,
      };

      const result = await createOrder.mutateAsync(orderData);
      
      if (result) {
        toast.success('Ordine creato con successo!');
        dispatch({ type: 'CLEAR_CART' });
        navigate('/order-confirmation', { 
          state: { 
            orderId: result.id,
            orderNumber: result.number 
          } 
        });
      }
    } catch (error) {
      console.error('Errore durante la creazione dell\'ordine:', error);
      toast.error('Errore durante la creazione dell\'ordine. Riprova.');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getPaymentMethodIcon = (methodId: string) => {
    switch (methodId) {
      case 'stripe':
        return '💳';
      case 'paypal':
        return '🅿️';
      case 'cod':
        return '💵';
      case 'satispay':
        return '📱';
      case 'bacs':
        return '🏦';
      default:
        return '💳';
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="text-6xl mb-6">🛒</div>
            // Modifica il titolo del carrello vuoto
            <h1 className="text-2xl font-bold mb-4">Il carrello è vuoto</h1>

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // INDIRIZZO (include dati personali + spedizione)
        return (
          <div className="space-y-8">
            {/* Dati Personali */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Dati Personali</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName" className="text-base font-medium">Nome</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                      className="mt-2 h-12 text-base"
                      placeholder="Inserisci il tuo nome"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName" className="text-base font-medium">Cognome</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                      className="mt-2 h-12 text-base"
                      placeholder="Inserisci il tuo cognome"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">Numero telefonico</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    disabled={customerLoading}
                    className="mt-2 h-12 text-base"
                    placeholder="Inserisci il tuo numero di telefono"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-base font-medium">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={customerLoading}
                    className="mt-2 h-12 text-base"
                    placeholder="Inserisci la tua email"
                  />
                </div>
              </div>
            </div>

            {/* Separatore */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center mb-4">
                <Truck className="w-5 h-5 mr-2 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Indirizzo di Spedizione</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="city" className="text-base font-medium">Città</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    disabled={customerLoading}
                    className="mt-2 h-12 text-base"
                    placeholder="Inserisci la tua città"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address" className="text-base font-medium">Via</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    disabled={customerLoading}
                    className="mt-2 h-12 text-base"
                    placeholder="Inserisci il tuo indirizzo"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="postalCode" className="text-base font-medium">Codice Postale</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                      className="mt-2 h-12 text-base"
                      placeholder="Inserisci il codice postale"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="province" className="text-base font-medium">Provincia</Label>
                    <Input
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                      className="mt-2 h-12 text-base"
                      placeholder="Inserisci la provincia"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pulsante per selezionare indirizzo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <Button 
                variant="outline" 
                className="w-full h-12 text-base border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                disabled
              >
                <MapPin className="w-5 h-5 mr-2" />
                SELEZIONARE L'INDIRIZZO
              </Button>
            </div>
          </div>
        );

      case 1: // RIEPILOGO
        return (
          <div className="space-y-6">
            {/* Prodotti */}
            <div className="space-y-4">
              {state.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{item.name}</h3>
                    <p className="text-gray-600">Quantità: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">€{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totali */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-lg">
                <span>Subtotale:</span>
                <span className="font-medium">€{calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>Spedizione:</span>
                <span className="font-medium text-green-600">Gratuita</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-200">
                <span>Totale:</span>
                <span>€{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Note ordine */}
            <div className="pt-4">
              <Label htmlFor="orderNotes" className="text-base font-medium">Note sull'Ordine (opzionale)</Label>
              <textarea
                id="orderNotes"
                name="orderNotes"
                value={formData.orderNotes}
                onChange={handleInputChange}
                rows={4}
                className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Aggiungi note speciali per il tuo ordine..."
              />
            </div>
          </div>
        );

      case 2: // PAGAMENTO
        return (
          <div className="space-y-6">
            {paymentGatewaysLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Caricamento metodi di pagamento...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPaymentGateways.map((gateway) => (
                  <div
                    key={gateway.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      paymentMethod === gateway.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => setPaymentMethod(gateway.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getPaymentMethodIcon(gateway.id)}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{gateway.title}</h3>
                        <p className="text-gray-600 text-sm">{gateway.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        paymentMethod === gateway.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {paymentMethod === gateway.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="mb-4 text-lg p-4 h-auto"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Torna al Carrello
          </Button>
          
          <h1 className="text-4xl font-bold mb-4 text-gradient">
            Procedi all'acquisto
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex border-b border-gray-200">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              const isCompleted = currentStep > index;
              const isAccessible = index <= currentStep || validateStep(index - 1);
              
              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && setCurrentStep(index)}
                  disabled={!isAccessible}
                  className={`flex-1 py-4 px-2 text-center border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : isCompleted
                      ? 'border-green-500 text-green-600'
                      : isAccessible
                      ? 'border-transparent text-gray-500 hover:text-gray-700'
                      : 'border-transparent text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <Icon className="w-5 h-5" />
                    <span>{step.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center text-xl">
                {React.createElement(steps[currentStep].icon, { className: "w-6 h-6 mr-3" })}
                {steps[currentStep].name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-8 py-3 text-base"
            >
              Indietro
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="px-8 py-3 text-base gradient-primary"
              >
                {currentStep === 0 ? 'CONTINUA PER LA SPEDIZIONE' : 'Continua'}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isProcessing || !validateStep(currentStep)}
                className="px-8 py-3 text-base gradient-primary"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Elaborazione...
                  </>
                ) : (
                  `Completa Ordine - ${calculateTotal().toFixed(2)}€`
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Security badges */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="flex flex-col items-center space-y-2 text-center text-gray-600">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-green-600" />
                <span>Pagamento sicuro e protetto</span>
              </div>
              <div className="flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                <span>Garanzia soddisfatti o rimborsati</span>
              </div>
              <div className="flex items-center">
                <Truck className="w-5 h-5 mr-2 text-orange-600" />
                <span>Spedizione sempre gratuita</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
