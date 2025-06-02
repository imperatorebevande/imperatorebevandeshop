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
  const [expandedPaymentDetails, setExpandedPaymentDetails] = useState<string | null>(null);

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

  // Aggiungi questa funzione dopo validateStep
  const validateAllSteps = () => {
    // Verifica tutti gli step
    return steps.every((_, index) => validateStep(index));
  };

  const handleSubmit = async () => {
    if (!validateAllSteps()) {
      toast.error('Completa tutti i campi obbligatori prima di procedere.');
      return;
    }

    setIsProcessing(true);

    try {
      const selectedPaymentGateway = filteredPaymentGateways.find(g => g.id === paymentMethod);
      
      const orderData = {
        payment_method: paymentMethod,
        payment_method_title: selectedPaymentGateway?.title || paymentMethod,
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
          phone: formData.phone
        },
        shipping: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          state: formData.province,
          postcode: formData.postalCode,
          country: 'IT'
        },
        line_items: state.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        customer_note: formData.orderNotes,
      };

      // Modifica qui: chiama direttamente createOrder invece di createOrder.mutateAsync
      const result = await createOrder(orderData);
      
      if (result) {
        toast.success('Ordine creato con successo!');
        dispatch({ type: 'CLEAR_CART' });
        navigate('/order-success', { 
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
            <div className="text-4xl mb-4">🛒</div>
            <h1 className="text-xl font-bold text-[#1B5AAB] mb-3">Il carrello è vuoto</h1>
            <p className="text-sm text-gray-600 mb-6">
              Aggiungi alcuni prodotti al carrello prima di procedere al checkout.
            </p>
            <Button onClick={() => navigate('/products')} className="gradient-primary text-sm px-6 py-2">
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
          <div className="space-y-6">
            {/* Dati Personali */}
            <div>
              <h3 className="text-base font-bold text-[#1B5AAB] mb-3">Dati Personali</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium">Nome</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                      className="mt-1 h-10 text-sm"
                      placeholder="Inserisci il tuo nome"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium">Cognome</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                      className="mt-1 h-10 text-sm"
                      placeholder="Inserisci il tuo cognome"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Numero telefonico</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    disabled={customerLoading}
                    className="mt-1 h-10 text-sm"
                    placeholder="Inserisci il tuo numero di telefono"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={customerLoading}
                    className="mt-1 h-10 text-sm"
                    placeholder="Inserisci la tua email"
                  />
                </div>
              </div>
            </div>

            {/* Separatore */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center mb-3">
                <Truck className="w-4 h-4 mr-2 text-blue-600" />
                <h3 className="text-base font-bold text-[#1B5AAB]">Indirizzo di Spedizione</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">Città</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    disabled={customerLoading}
                    className="mt-1 h-10 text-sm"
                    placeholder="Inserisci la tua città"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address" className="text-sm font-medium">Via</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    disabled={customerLoading}
                    className="mt-1 h-10 text-sm"
                    placeholder="Inserisci il tuo indirizzo"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode" className="text-sm font-medium">Codice Postale</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                      className="mt-1 h-10 text-sm"
                      placeholder="Inserisci il codice postale"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="province" className="text-sm font-medium">Provincia</Label>
                    <Input
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      required
                      disabled={customerLoading}
                      className="mt-1 h-10 text-sm"
                      placeholder="Inserisci la provincia"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pulsante per selezionare indirizzo */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <Button 
                variant="outline" 
                className="w-full h-10 text-sm border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                disabled
              >
                <MapPin className="w-4 h-4 mr-2" />
                SELEZIONARE L'INDIRIZZO
              </Button>
            </div>
          </div>
        );

      case 1: // RIEPILOGO
        return (
          <div className="space-y-4">
            {/* Prodotti */}
            <div className="space-y-3">
              {state.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 py-3 border-b border-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <p className="text-gray-600 text-xs">Quantità: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">€{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totali */}
            <div className="space-y-2 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span>Subtotale:</span>
                <span className="font-medium">€{calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Spedizione:</span>
                <span className="font-medium text-green-600">Gratuita</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span>Totale:</span>
                <span>€{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Note ordine */}
            <div className="pt-3">
              <Label htmlFor="orderNotes" className="text-sm font-medium text-[#CFA100]">Note sull'Ordine (opzionale)</Label>
              <textarea
                id="orderNotes"
                name="orderNotes"
                value={formData.orderNotes}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 w-full p-2 border-2 border-[#CFA100] rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#CFA100] focus:border-[#CFA100]"
                placeholder="Aggiungi note speciali per il tuo ordine..."
              />
            </div>
          </div>
        );

      case 2: // PAGAMENTO
        return (
          <div className="space-y-4">
            {paymentGatewaysLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-sm">Caricamento metodi di pagamento...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPaymentGateways.map((gateway) => (
                  <div
                    key={gateway.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      paymentMethod === gateway.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => setPaymentMethod(gateway.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">{getPaymentMethodIcon(gateway.id)}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{gateway.title}</h3>
                        <p className="text-gray-600 text-xs">{getMainDescription(gateway)}</p>
                        
                        {/* Dettagli espandibili */}
                        {expandedPaymentDetails === gateway.id && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                            {getFullDescription(gateway)}
                          </div>
                        )}
                      </div>
                      
                      {/* Icona info per espandere i dettagli */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPaymentDetails(
                            expandedPaymentDetails === gateway.id ? null : gateway.id
                          );
                        }}
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <div className={`w-4 h-4 rounded-full border-2 ${
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
      
      <div className="container mx-auto px-4 py-2 pb-24 md:pb-8">
        {/* Spazio responsive per compensare la barra fissa */}
        <div className="pt-2 md:pt-4"></div>
        
        {/* Titolo rimosso completamente */}

        {/* Tab Navigation - Modificata per essere responsive */}
        <div className="fixed top-[72px] md:top-[110px] left-0 right-0 bg-white shadow-md z-40">
          <div className="max-w-4xl mx-auto">
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
                    className={`flex-1 py-2 px-1 text-center border-b-2 font-medium text-xs transition-colors ${
                      isActive
                        ? 'border-[#1B5AAB] text-[#1B5AAB]'
                        : isCompleted
                        ? 'border-green-500 text-green-600'
                        : isAccessible
                        ? 'border-transparent text-gray-500 hover:text-gray-700'
                        : 'border-transparent text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{step.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Spazio responsive per compensare la barra fissa */}
        <div className="pt-12 md:pt-16"></div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto pb-16">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3">
              <CardTitle className="flex items-center text-base font-bold text-[#1B5AAB]">
                {React.createElement(steps[currentStep].icon, { className: "w-5 h-5 mr-2" })}
                {steps[currentStep].name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation Buttons - fissi sopra la nav bar mobile */}
          <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50">
            <div className="max-w-4xl mx-auto flex justify-between">
              <Button
                variant="outline"
                onClick={() => currentStep === 0 ? navigate('/cart') : prevStep()}
                className="px-6 py-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {currentStep === 0 ? 'Torna al Carrello' : 'Indietro'}
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="px-6 py-2 text-sm gradient-primary"
                >
                  {currentStep === 0 ? 'Continua' : 'Continua'}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing || !validateStep(currentStep)}
                  className="px-6 py-2 text-sm gradient-primary"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Elaborazione...
                    </>
                  ) : (
                    `Completa Ordine - ${calculateTotal().toFixed(2)}€`
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Rimuovi completamente questa sezione dei Security badges */}
        {/* Security badges - ELIMINATA */}
      </div>
    </div>
  );
};

export default Checkout;

  // Funzione per ottenere la descrizione principale (breve)
  const getMainDescription = (gateway: any) => {
    switch (gateway.id) {
      case 'cod':
        return 'Pagamento in CONTANTI o con CARTA DI CREDITO al momento della consegna.';
      case 'stripe':
        return 'Pagamento sicuro con carta di credito online.';
      case 'paypal':
        return 'Paga facilmente con il tuo account PayPal.';
      case 'satispay':
        return 'Pagamento veloce con Satispay.';
      case 'bacs':
        return 'Bonifico bancario.';
      default:
        return gateway.title;
    }
  };

  // Funzione per ottenere i dettagli completi
  const getFullDescription = (gateway: any) => {
    switch (gateway.id) {
      case 'cod':
        return 'I nostri collaboratori durante la consegna del vostro ordine, saranno muniti di contanti o con POS per agevolarvi nel pagamento.';
      default:
        return gateway.description;
    }
  };
