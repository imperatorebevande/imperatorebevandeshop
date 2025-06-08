import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext'; // Aggiungi questo import
import { useWooCommerceCustomer, useWooCommercePaymentGateways, useUpdateWooCommerceCustomer } from '@/hooks/useWooCommerce';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Loader2, ShoppingBag, MapPin, Package, Receipt, CreditCard as PaymentIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateWooCommerceOrder } from '@/hooks/useWooCommerce';

const Checkout = () => {
  const { state, dispatch } = useCart();
  const navigate = useNavigate(); 
  const createOrder = useCreateWooCommerceOrder();
  const updateCustomer = useUpdateWooCommerceCustomer(); // Aggiungi questa riga
  const { authState } = useAuth(); // authState is defined here
  
  console.log('Checkout component authState:', authState); // Add this debug log
  
  // Step management - ora solo 3 step
  const [currentStep, setCurrentStep] = useState(0);
  const [allowAutoSkip, setAllowAutoSkip] = useState(true); // Nuova variabile per controllare il salto automatico
  const steps = [
    { id: 0, name: 'INDIRIZZO di CONSEGNA', icon: MapPin },
    { id: 1, name: 'RIEPILOGO ORDINE', icon: ShoppingBag },
    { id: 2, name: 'TIPO di PAGAMENTO', icon: PaymentIcon }
  ];
  
  // Rimuovere questa riga
  const [showLoginBox] = useState(true); // Sempre visibile per ora
  
  const customerId = authState?.isAuthenticated && authState?.user?.id ? authState.user.id : null;
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
    if (authState.isAuthenticated && customer) {
      // Se l'utente è loggato, precompila con i suoi dati
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
    } else if (!authState.isAuthenticated) {
      // Se l'utente non è loggato, lascia i campi vuoti
      setFormData({
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
    }
  }, [authState.isAuthenticated, customer]);

  // Imposta il primo metodo di pagamento disponibile come default
  useEffect(() => {
    if (filteredPaymentGateways && filteredPaymentGateways.length > 0 && !paymentMethod) {
      setPaymentMethod(filteredPaymentGateways[0].id);
    }
  }, [filteredPaymentGateways, paymentMethod]);

  // Salta automaticamente al riepilogo se l'indirizzo è già completo
  useEffect(() => {
    if (currentStep === 0 && validateStep(0) && allowAutoSkip) {
      setCurrentStep(1);
    }
  }, [formData, currentStep, allowAutoSkip]);

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
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setAllowAutoSkip(true); // Riabilita il salto automatico
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // INDIRIZZO
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Label htmlFor="firstName">Nome *</Label>
          <div className="relative">
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className={`pr-10 ${formData.firstName ? 'border-[#40691E] bg-[#40691E]/10 focus:border-[#40691E] focus:ring-[#40691E] focus:bg-[#40691E]/20' : 'border-[#A40800] bg-[#A40800]/10 focus:border-[#A40800] focus:ring-[#A40800] focus:bg-[#A40800]/20'}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {formData.firstName ? (
                <span className="text-[#40691E] text-lg font-bold">✓</span>
              ) : (
                <span className="text-[#A40800] text-lg font-bold">✗</span>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <Label htmlFor="lastName">Cognome *</Label>
          <div className="relative">
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className={`pr-10 ${formData.lastName ? 'border-[#40691E] bg-[#40691E]/10 focus:border-[#40691E] focus:ring-[#40691E] focus:bg-[#40691E]/20' : 'border-[#A40800] bg-[#A40800]/10 focus:border-[#A40800] focus:ring-[#A40800] focus:bg-[#A40800]/20'}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {formData.lastName ? (
                <span className="text-[#40691E] text-lg font-bold">✓</span>
              ) : (
                <span className="text-[#A40800] text-lg font-bold">✗</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Label htmlFor="email">Email *</Label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`pr-10 ${formData.email ? 'border-[#40691E] bg-[#40691E]/10 focus:border-[#40691E] focus:ring-[#40691E] focus:bg-[#40691E]/20' : 'border-[#A40800] bg-[#A40800]/10 focus:border-[#A40800] focus:ring-[#A40800] focus:bg-[#A40800]/20'}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {formData.email ? (
                <span className="text-[#40691E] text-lg font-bold">✓</span>
              ) : (
                <span className="text-[#A40800] text-lg font-bold">✗</span>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <Label htmlFor="phone">Telefono *</Label>
          <div className="relative">
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className={`pr-10 ${formData.phone ? 'border-[#40691E] bg-[#40691E]/10 focus:border-[#40691E] focus:ring-[#40691E] focus:bg-[#40691E]/20' : 'border-[#A40800] bg-[#A40800]/10 focus:border-[#A40800] focus:ring-[#A40800] focus:bg-[#A40800]/20'}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {formData.phone ? (
                <span className="text-[#40691E] text-lg font-bold">✓</span>
              ) : (
                <span className="text-[#A40800] text-lg font-bold">✗</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <Label htmlFor="address">Indirizzo *</Label>
        <div className="relative">
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            className={`pr-10 ${formData.address ? 'border-[#40691E] bg-[#40691E]/10 focus:border-[#40691E] focus:ring-[#40691E] focus:bg-[#40691E]/20' : 'border-[#A40800] bg-[#A40800]/10 focus:border-[#A40800] focus:ring-[#A40800] focus:bg-[#A40800]/20'}`}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {formData.address ? (
              <span className="text-[#40691E] text-lg font-bold">✓</span>
            ) : (
              <span className="text-[#A40800] text-lg font-bold">✗</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Label htmlFor="city">Città *</Label>
          <div className="relative">
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
              className={`pr-10 ${formData.city ? 'border-[#40691E] bg-[#40691E]/10 focus:border-[#40691E] focus:ring-[#40691E] focus:bg-[#40691E]/20' : 'border-[#A40800] bg-[#A40800]/10 focus:border-[#A40800] focus:ring-[#A40800] focus:bg-[#A40800]/20'}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {formData.city ? (
                <span className="text-[#40691E] text-lg font-bold">✓</span>
              ) : (
                <span className="text-[#A40800] text-lg font-bold">✗</span>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <Label htmlFor="postalCode">CAP *</Label>
          <div className="relative">
            <Input
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              required
              className={`pr-10 ${formData.postalCode ? 'border-[#40691E] bg-[#40691E]/10 focus:border-[#40691E] focus:ring-[#40691E] focus:bg-[#40691E]/20' : 'border-[#A40800] bg-[#A40800]/10 focus:border-[#A40800] focus:ring-[#A40800] focus:bg-[#A40800]/20'}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {formData.postalCode ? (
                <span className="text-[#40691E] text-lg font-bold">✓</span>
              ) : (
                <span className="text-[#A40800] text-lg font-bold">✗</span>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <Label htmlFor="province">Provincia *</Label>
          <div className="relative">
            <Input
              id="province"
              name="province"
              value={formData.province}
              onChange={handleInputChange}
              required
              className={`pr-10 ${formData.province ? 'border-[#40691E] bg-[#40691E]/10 focus:border-[#40691E] focus:ring-[#40691E] focus:bg-[#40691E]/20' : 'border-[#A40800] bg-[#A40800]/10 focus:border-[#A40800] focus:ring-[#A40800] focus:bg-[#A40800]/20'}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {formData.province ? (
                <span className="text-[#40691E] text-lg font-bold">✓</span>
              ) : (
                <span className="text-[#A40800] text-lg font-bold">✗</span>
              )}
            </div>
          </div>
        </div>
      </div>
            
            {/* Rimuovere questa sezione delle note */}
            {/* 
            <div>
              <Label htmlFor="orderNotes">Note per l'ordine (opzionale)</Label>
              <Input
                id="orderNotes"
                name="orderNotes"
                value={formData.orderNotes}
                onChange={handleInputChange}
              />
            </div>
            */}
          </div>
        );
        
      case 1: // RIEPILOGO
        return (
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold" style={{color: '#1B5AAB'}}>Dati di spedizione</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAllowAutoSkip(false); // Disabilita il salto automatico
                    setCurrentStep(0);
                  }}
                  className="text-xs px-2 py-1"
                >
                  Modifica
                </Button>
              </div>
              <p className="text-sm">
                {formData.firstName} {formData.lastName}<br />
                {formData.address}<br />
                {formData.postalCode}, {formData.city} ({formData.province})<br />
                Email: {formData.email}<br />
                Tel: {formData.phone}
              </p>
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="font-bold mb-2" style={{color: '#1B5AAB'}}>Prodotti nel carrello</h3>
              <div className="space-y-2">
                {state.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-md mr-3 flex-shrink-0">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover rounded-md"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-bold" style={{color: '#1B5AAB'}}>{item.name}</p>
                        <p className="text-sm text-gray-500">Quantità: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">
                      {(item.price * item.quantity).toFixed(2)}€
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Nuova sezione per le note dell'ordine */}
              <div className="mt-4 pt-4 border-t">
                <div>
                  <Label htmlFor="orderNotes" style={{color: '#CFA200'}} className="font-medium">Note per l'ordine (opzionale)</Label>
                  <Input
                    id="orderNotes"
                    name="orderNotes"
                    value={formData.orderNotes}
                    onChange={handleInputChange}
                    className="mt-2"
                    style={{borderColor: '#CFA200'}}
                    placeholder="Inserisci eventuali note per il tuo ordine..."
                  />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between">
                  <p>Subtotale</p>
                  <p className="font-medium">{calculateSubtotal().toFixed(2)}€</p>
                </div>
                <div className="flex justify-between mt-1">
                  <p>Spedizione</p>
                  <p className="text-green-600 font-semibold">
                    {calculateShipping() === 0 ? 'GRATUITA' : `${calculateShipping().toFixed(2)}€`}
                  </p>
                </div>
                <div className="flex justify-between mt-2 text-lg font-bold">
                  <p>Totale</p>
                  <p>{calculateTotal().toFixed(2)}€</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2: // PAGAMENTO
        return (
          <div className="space-y-4">
            {paymentGatewaysLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPaymentGateways.map((gateway) => {
                  // Definisci i colori per ogni metodo di pagamento - sempre visibili
                  const getPaymentColors = (gatewayId: string, isSelected: boolean) => {
                    switch (gatewayId) {
                      case 'cod': // Pagamento in CONTANTI o con CARTA DI CREDITO
                        return isSelected 
                          ? 'border-[#40691E] bg-[#40691E]/20' 
                          : 'border-[#40691E] bg-[#40691E]/10 hover:bg-[#40691E]/15';
                      case 'stripe': // Paga ADESSO con Carta di Credito
                      case 'paypal': // Paga ADESSO con PayPal
                      case 'satispay': // Satispay
                        return isSelected 
                          ? 'border-[#1B5AAB] bg-[#1B5AAB]/20' 
                          : 'border-[#1B5AAB] bg-[#1B5AAB]/10 hover:bg-[#1B5AAB]/15';
                      case 'bacs': // Bonifico Bancario
                        return isSelected 
                          ? 'border-[#CFA200] bg-[#CFA200]/20' 
                          : 'border-[#CFA200] bg-[#CFA200]/10 hover:bg-[#CFA200]/15';
                      default:
                        return isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50';
                    }
                  };

                  const getRadioColors = (gatewayId: string, isSelected: boolean) => {
                    switch (gatewayId) {
                      case 'cod':
                        return isSelected 
                          ? 'border-[#40691E] bg-[#40691E]' 
                          : 'border-[#40691E]';
                      case 'stripe':
                      case 'paypal':
                      case 'satispay':
                        return isSelected 
                          ? 'border-[#1B5AAB] bg-[#1B5AAB]' 
                          : 'border-[#1B5AAB]';
                      case 'bacs':
                        return isSelected 
                          ? 'border-[#CFA200] bg-[#CFA200]' 
                          : 'border-[#CFA200]';
                      default:
                        return isSelected 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300';
                    }
                  };

                  return (
                    <div 
                      key={gateway.id}
                      className={`border-2 rounded-md p-3 cursor-pointer transition-colors ${getPaymentColors(gateway.id, paymentMethod === gateway.id)}`}
                      onClick={() => setPaymentMethod(gateway.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {gateway.id === 'cod' && <CreditCard className="w-5 h-5" />}
                            {gateway.id === 'stripe' && <CreditCard className="w-5 h-5" />}
                            {gateway.id === 'paypal' && <CreditCard className="w-5 h-5" />}
                            {gateway.id === 'satispay' && <CreditCard className="w-5 h-5" />}
                            {gateway.id === 'bacs' && <CreditCard className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium">{gateway.title}</p>
                            <p className="text-sm text-gray-500">{getMainDescription(gateway)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button 
                            type="button"
                            className="text-blue-500 hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPaymentDetails(expandedPaymentDetails === gateway.id ? null : gateway.id);
                            }}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          <div className={`w-4 h-4 rounded-full border-2 ${getRadioColors(gateway.id, paymentMethod === gateway.id)}`}>
                            {paymentMethod === gateway.id && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {expandedPaymentDetails === gateway.id && (
                        <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                          {getFullDescription(gateway)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };
  
  // Aggiungi queste funzioni per calcolare i totali
  const calculateSubtotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const calculateShipping = () => {
    // Spedizione sempre gratuita
    return 0;
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  // Aggiungi questa funzione handleSubmit
  const handleSubmit = async () => {
    if (!validateAllSteps()) {
      toast.error('Completa tutti i campi obbligatori');
      return;
    }

    if (state.items.length === 0) {
      toast.error('Il carrello è vuoto');
      return;
    }

    setIsProcessing(true);

    try {
      // Se l'utente è loggato, aggiorna i suoi dati prima di creare l'ordine
      if (customerId && authState.isAuthenticated) {
        const customerUpdateData = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
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
          }
        };

        console.log('Aggiornamento dati cliente:', customerUpdateData);
        
        // Aggiorna i dati del cliente in WooCommerce
        await updateCustomer.mutateAsync({
          id: customerId,
          customerData: customerUpdateData
        });
      }

      const orderData = {
        customer_id: customerId,
        payment_method: paymentMethod,
        payment_method_title: filteredPaymentGateways.find(g => g.id === paymentMethod)?.title || paymentMethod,
        set_paid: false,
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
          quantity: item.quantity
        })),
        customer_note: formData.orderNotes
      };

      console.log('Creating order with customer_id:', customerId);
      
      await createOrder(orderData);
      
      dispatch({ type: 'CLEAR_CART' });
      
      toast.success('Ordine creato con successo!');
      navigate('/account?tab=orders');
      
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine:', error);
      toast.error('Errore nella creazione dell\'ordine. Riprova.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Spazio responsive per compensare la barra fissa */}
      <div className="pt-10 md:pt-16"></div>

      {/* Titolo rimosso completamente */}

      {/* Tab Navigation - Posizionata sotto la barra di ricerca */}
      <div className="fixed top-[120px] md:top-[165px] left-0 right-0 bg-white shadow-md z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex border-b border-gray-200">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              const isCompleted = currentStep > index;
              const isAccessible = index <= currentStep || validateStep(index - 1) || index === 0;

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (isAccessible) {
                      if (index === 0) {
                        setAllowAutoSkip(false); // Disabilita il salto automatico
                      }
                      setCurrentStep(index);
                    }
                  }}
                  disabled={!isAccessible}
                  className={`flex-1 py-3 md:py-2 px-1 text-center border-b-2 font-medium text-xs transition-colors ${
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
                    <Icon className="w-5 h-5 md:w-4 md:h-4" />
                    <span className="text-xs hidden md:block">{step.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spazio responsive per compensare la barra fissa */}
      <div className="pt-4 md:pt-1"></div>


      {/* Step Content */}
      <div className="max-w-4xl mx-auto pb-32 md:pb-16">
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
              onClick={() => {
                if (currentStep === 0) {
                  navigate('/cart');
                } else if (currentStep === 1 && authState.isAuthenticated) {
                  // Se è loggato e nel riepilogo, torna al carrello
                  navigate('/cart');
                } else {
                  prevStep();
                }
              }}
              className="px-6 py-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {(currentStep === 0 || (currentStep === 1 && authState.isAuthenticated)) ? 'Torna al Carrello' : 'Indietro'}
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
  );
};

  // Funzione per ottenere la descrizione principale (breve)
  const getMainDescription = (gateway: any) => {
    switch (gateway.id) {
      case 'cod':
        return 'Pagamento in CONTANTI o con CARTA DI CREDITO al momento della consegna.';
      case 'stripe':
        return 'Pagamento sicuro con carta di credito online.';
      case 'paypal':
        return 'Paga con PayPal.';
      case 'satispay':
        return 'Pagamento veloce con Satispay.';
      case 'bacs':
        return 'Bonifico bancario.';
      default:
        return gateway.title;
    }
  };

  // Funzione per ottenere i detta
  const getFullDescription = (gateway: any) => {
    switch (gateway.id) {
      case 'cod':
        return 'I nostri collaboratori durante la consegna del vostro ordine, saranno muniti di contanti o con POS per agevolarvi nel pagamento.';
      case 'paypal':
        return 'Paga facilmente e in sicurezza con il tuo account PayPal.';
      default:
        return gateway.description;
    }
  };

  // Rimuovi queste righe orfane:
  // 
  // return null;
  // };

// At the end of the file, DELETE this entire function
export default Checkout;
