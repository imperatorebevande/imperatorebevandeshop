import React, { useState, useCallback, useEffect } from 'react';
import DeliveryCalendar from '@/components/DeliveryCalendar/DeliveryCalendar';
import PaymentSection from '@/components/PaymentSection';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EditAddress from '@/components/EditAddress';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWooCommerceCustomer, useWooCommercePaymentGateways, useUpdateWooCommerceCustomer } from '@/hooks/useWooCommerce';
import { wooCommerceService, CalendarData, DeliveryTimeSlot } from '@/services/woocommerce';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Loader2, ShoppingBag, MapPin, Package, Receipt, CreditCard as PaymentIcon, User, Mail, Phone, Home, Calendar as CalendarIcon, Clock, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateWooCommerceOrder } from '@/hooks/useWooCommerce';
import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const Checkout = () => {
  const { state, dispatch } = useCart();
  const navigate = useNavigate(); 
  const createOrder = useCreateWooCommerceOrder();
  const updateCustomer = useUpdateWooCommerceCustomer();
  const { authState } = useAuth();
  
  console.log('Checkout component authState:', authState); // Add this debug log
  
  // Step management - ora 4 step
  const [currentStep, setCurrentStep] = useState(0);
  const [allowAutoSkip, setAllowAutoSkip] = useState(true);
  const steps = [
    { id: 0, name: 'INDIRIZZO di CONSEGNA', icon: MapPin },
    { id: 1, name: 'DATA CONSEGNA', icon: Package },
    { id: 2, name: 'RIEPILOGO ORDINE', icon: ShoppingBag },
    { id: 3, name: 'TIPO di PAGAMENTO', icon: PaymentIcon }
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
    deliveryDate: '',
    deliveryTimeSlot: '',
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState('');
  
  // Avvolgi setPaymentMethod con useCallback
  const handleSetPaymentMethod = useCallback((method: string) => {
    setPaymentMethod(method);
  }, []); // Nessuna dipendenza, quindi la funzione viene creata una sola volta

  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedPaymentDetails, setExpandedPaymentDetails] = useState<string | null>(null);
  
  // (Stati calendario rimossi perché gestiti da DeliveryCalendar)

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

  // Imposta il primo metodo di pagamento disponibile come default, solo se non già impostato
  useEffect(() => {
    if (!paymentMethod && filteredPaymentGateways && filteredPaymentGateways.length > 0) {
      const defaultPaymentMethod = filteredPaymentGateways[0].id;
      if (filteredPaymentGateways.some(gateway => gateway.id === defaultPaymentMethod)) {
        handleSetPaymentMethod(defaultPaymentMethod); // Usa la versione memoizzata
      }
    }
  }, [filteredPaymentGateways, paymentMethod, handleSetPaymentMethod]); // Aggiungi handleSetPaymentMethod alle dipendenze

  // Salta automaticamente al riepilogo se l'indirizzo è già completo
  useEffect(() => {
    if (currentStep === 0 && validateStep(0) && allowAutoSkip) {
      setCurrentStep(1);
    }
  }, [formData, currentStep, allowAutoSkip]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Non gestire direttamente deliveryDate e deliveryTimeSlot qui, sono gestiti da DeliveryCalendar
    if (name === 'deliveryDate' || name === 'deliveryTimeSlot') return;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler per DeliveryCalendar
  const handleDateTimeChange = (date: string, timeSlot: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryDate: date,
      deliveryTimeSlot: timeSlot,
    }));
  };

  // Validazione per ogni step
  const validateStep = (step: number) => {
    switch (step) {
      case 0: // INDIRIZZO
        return formData.firstName && formData.lastName && formData.email && formData.phone &&
               formData.address && formData.city && formData.postalCode && formData.province;
      case 1: // DATA CONSEGNA
        return formData.deliveryDate !== '' && formData.deliveryTimeSlot !== '';
      case 2: // RIEPILOGO
        return true; // Sempre valido
      case 3: // PAGAMENTO
        return paymentMethod !== '';
      default:
        return false;
    }
  };

  // Funzione per renderizzare il contenuto di ogni step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // INDIRIZZO
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={!formData.firstName ? 'border-red-300' : ''}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Cognome *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={!formData.lastName ? 'border-red-300' : ''}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={!formData.email ? 'border-red-300' : ''}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefono *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={!formData.phone ? 'border-red-300' : ''}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Indirizzo *</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={!formData.address ? 'border-red-300' : ''}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Città *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={!formData.city ? 'border-red-300' : ''}
                  required
                />
              </div>
              <div>
                <Label htmlFor="postalCode">CAP *</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className={!formData.postalCode ? 'border-red-300' : ''}
                  required
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
                placeholder="Inserisci provincia"
                className={!formData.province ? 'border-red-300' : ''}
              />
            </div>
          </div>
        );

      case 1: // DATA CONSEGNA
        return (
          <DeliveryCalendar
            formData={{
              deliveryDate: formData.deliveryDate,
              deliveryTimeSlot: formData.deliveryTimeSlot
            }}
            onDateTimeChange={handleDateTimeChange}
          />
        );

      case 2: // RIEPILOGO
        return (
          <div className="space-y-6">
            {/* Dati di spedizione */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center justify-between" style={{ color: '#1B5AAB' }}>
                <div className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Dati di Spedizione
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditAddressOpen(true)}
                  className="text-xs px-3 py-1 border-[#1B5AAB] text-[#1B5AAB] hover:bg-[#1B5AAB] hover:text-white"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  Modifica Indirizzo
                </Button>
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="flex items-center">
                  <User className="w-4 h-4 mr-2" style={{ color: '#1B5AAB' }} />
                  <span className="font-medium" style={{ color: '#1B5AAB' }}>Nome: </span> {formData.firstName} {formData.lastName}
                </p>
                <p className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" style={{ color: '#1B5AAB' }} />
                  <span className="font-medium" style={{ color: '#1B5AAB' }}>Email: </span> {formData.email}
                </p>
                <p className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" style={{ color: '#1B5AAB' }} />
                  <span className="font-medium" style={{ color: '#1B5AAB' }}>Telefono: </span> {formData.phone}
                </p>
                <p className="flex items-center">
                  <Home className="w-4 h-4 mr-2" style={{ color: '#1B5AAB' }} />
                  <span className="font-medium" style={{ color: '#1B5AAB' }}>Indirizzo: </span> {formData.address}
                </p>
                <p className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" style={{ color: '#1B5AAB' }} />
                  <span className="font-medium" style={{ color: '#1B5AAB' }}>Città: </span> {formData.city}, {formData.province} {formData.postalCode}
                </p>
              </div>
            </div>

            {/* Data e Orario di Consegna - Sezione separata */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center justify-between" style={{ color: '#1B5AAB' }}>
                <div className="flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Data e Orario di Consegna
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs px-3 py-1 border-[#1B5AAB] text-[#1B5AAB] hover:bg-[#1B5AAB] hover:text-white"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Modifica Data
                </Button>
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {formData.deliveryDate && (
                  <p className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2" style={{ color: '#1B5AAB' }} />
                    <span className="font-medium" style={{ color: '#1B5AAB' }}>Data: </span> {new Date(formData.deliveryDate).toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                )}
                {formData.deliveryTimeSlot && (
                  <p className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" style={{ color: '#1B5AAB' }} />
                    <span className="font-medium" style={{ color: '#1B5AAB' }}>Orario: </span> {formData.deliveryTimeSlot}
                  </p>
                )}
              </div>
            </div>

            {/* Prodotti nel carrello */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center" style={{ color: '#1B5AAB' }}>
                <Package className="w-5 h-5 mr-2" />
                Prodotti Ordinati
              </h3>
              <div className="space-y-3">
                {state.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {item.images && item.images.length > 0 && (
                        <img 
                          src={item.images[0].src} 
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantità: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold">{(item.price * item.quantity).toFixed(2)}€</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Note per l'ordine */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center" style={{ color: '#1B5AAB' }}>
                <MessageSquare className="w-5 h-5 mr-2" />
                Note per l'ordine
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <Textarea
                  name="orderNotes"
                  value={formData.orderNotes}
                  onChange={handleInputChange}
                  placeholder="Inserisci eventuali note per l'ordine (es. indirizzo di consegna temporaneo, istruzioni speciali, ecc.)"
                  className="min-h-[100px] resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  💡 Puoi utilizzare questo campo per comunicare informazioni aggiuntive come indirizzi di consegna temporanei o istruzioni speciali.
                </p>
              </div>
            </div>

            {/* Totali */}
            <div>
            <h3 className="font-semibold mb-3 flex items-center" style={{ color: '#1B5AAB' }}>
                <Package className="w-5 h-5 mr-2" />
                Riepilogo Costi
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotale:</span>
                  <span>{calculateSubtotal().toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Spedizione:</span>
                  <span className="text-green-600 font-medium">Gratuita</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg" style={{ color: '#A40800' }}>
                  <span>Totale:</span>
                  <span>{calculateTotal().toFixed(2)}€</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // PAGAMENTO
        if (paymentGatewaysLoading) { 
          return (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          );
        }
        return (
          <PaymentSection
            paymentGatewaysLoading={paymentGatewaysLoading}
            filteredPaymentGateways={filteredPaymentGateways}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            expandedPaymentDetails={expandedPaymentDetails}
            setExpandedPaymentDetails={setExpandedPaymentDetails}
            orderTotal={calculateTotal().toFixed(2)}
            onPayPalSuccess={handlePayPalSuccess}
            onPayPalError={handlePayPalError}
            onStripeSuccess={handleStripeSuccess}
            onStripeError={handleStripeError}
          />
        );

      default:
        return null;
    }
  };

  // Aggiungi questo stato per il dialog EditAddress
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  
  // Aggiungi queste funzioni per calcolare i totali
  const calculateSubtotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const calculateShipping = () => {
    // Spedizione sempre gratuita
    return 0;
  };
  
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    
    // Aggiungi commissione PayPal (3.5% + 0.50€) se PayPal è selezionato
    let paypalFee = 0;
    if (paymentMethod === 'paypal') {
      paypalFee = parseFloat(((subtotal * 0.035) + 0.50).toFixed(2)); // Round fee to 2 decimal places
    }
    
    // Round final total to 2 decimal places
    return parseFloat((subtotal + shipping + paypalFee).toFixed(2)); 
  };

  // Funzione per creare l'ordine (estratta per essere usata anche da PayPal)
  const createOrderAndNavigate = async (paymentDetails?: any) => {
    setIsProcessing(true);
    try {
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
        await updateCustomer.mutateAsync({
          id: customerId,
          customerData: customerUpdateData
        });
      }

      const orderData = {
        customer_id: customerId,
        payment_method: paymentMethod,
        payment_method_title: filteredPaymentGateways.find(g => g.id === paymentMethod)?.title || paymentMethod,
        set_paid: paymentMethod === 'paypal' && paymentDetails ? true : false, // Imposta set_paid a true se PayPal e ci sono dettagli
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
        customer_note: formData.orderNotes,
        meta_data: [
          {
            key: 'Delivery Date',
            value: `${new Date(formData.deliveryDate).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric'
            })} ${formData.deliveryTimeSlot}`
          },
          {
            key: '_orddd_timestamp',
            value: Math.floor(new Date(formData.deliveryDate).getTime() / 1000).toString()
          }
        ],
        // Aggiungi transaction_id se il pagamento è PayPal e i dettagli sono disponibili
        ...(paymentMethod === 'paypal' && paymentDetails && paymentDetails.purchase_units && paymentDetails.purchase_units[0]?.payments?.captures[0]?.id && {
          transaction_id: paymentDetails.purchase_units[0].payments.captures[0].id
        })
      };

      const createdOrder = await createOrder(orderData);
      dispatch({ type: 'CLEAR_CART' });
      toast.success('Ordine creato con successo!');
      navigate('/order-success', {
        state: {
          orderNumber: createdOrder.number,
          orderId: createdOrder.id,
          total: createdOrder.total
        }
      });
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine:', error);
      toast.error('Errore nella creazione dell\'ordine. Riprova.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalSuccess = (details: any) => {
    console.log('PayPal Success:', details);
    // Qui crei l'ordine DOPO che PayPal ha avuto successo
    // Passa i dettagli del pagamento a createOrderAndNavigate
    createOrderAndNavigate(details); 
  };

  const handlePayPalError = (error: any) => {
    console.error('PayPal Error:', error);
    toast.error('Pagamento PayPal fallito o annullato.');
    setIsProcessing(false); // Assicurati di resettare lo stato di processing
  };

  // Aggiungi queste funzioni QUI, all'interno del componente
  const handleStripeSuccess = (paymentIntent: any) => {
    console.log('Stripe payment successful:', paymentIntent);
    // Gestisci il successo del pagamento Stripe
    // Procedi con la creazione dell'ordine
    createOrderAndNavigate(paymentIntent);
  };

  const handleStripeError = (error: any) => {
    console.error('Stripe payment error:', error);
    toast.error('Errore nel pagamento con carta di credito');
    setIsProcessing(false);
  };


  // Modifica handleSubmit per gestire PayPal
  const handleSubmit = async () => {
    if (!validateAllSteps()) {
      toast.error('Completa tutti i campi obbligatori');
      return;
    }

    if (state.items.length === 0) {
      toast.error('Il carrello è vuoto');
      return;
    }

    // Se il metodo di pagamento NON è PayPal, procedi come prima
    if (paymentMethod !== 'paypal') {
      await createOrderAndNavigate();
    } else {
      // Se è PayPal, non fare nulla qui. 
      // Il pagamento e la creazione dell'ordine sono gestiti da PayPalNativeCheckout e handlePayPalSuccess.
      // Potresti voler mostrare un messaggio o semplicemente attendere che l'utente interagisca con i pulsanti PayPal.
      // Assicurati che i pulsanti PayPal siano visibili e attivi.
      toast.info('Procedi con il pagamento tramite PayPal.');
      // Non chiamare setIsProcessing(true) qui, perché PayPalNativeCheckout gestirà il suo stato di caricamento.
    }
  };

  // Funzioni di navigazione - ALL'INTERNO DEL COMPONENTE
  const nextStep = () => {
    if (currentStep === steps.length - 1) {
      // Se siamo all'ultimo step (Pagamento), chiama handleSubmit
      handleSubmit();
    } else if (currentStep < steps.length - 1 && validateStep(currentStep)) {
        // Se siamo nel riepilogo (step 2) e mancano data o fascia oraria, torna al calendario
        if (currentStep === 2 && (!formData.deliveryDate || !formData.deliveryTimeSlot)) {
            setCurrentStep(1); // Torna al calendario
            return;
        }
        setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Funzione per validare tutti gli step
  const validateAllSteps = () => {
    return validateStep(0) && validateStep(1) && validateStep(2) && validateStep(3);
  };

  // (Gestione calendario spostata in DeliveryCalendar)

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
                onClick={calculateTotal() === 0 ? () => navigate('/products') : handleSubmit}
                disabled={isProcessing || !validateStep(currentStep)}
                className="px-6 py-2 text-sm gradient-primary"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Elaborazione...
                  </>
                ) : calculateTotal() === 0 ? (
                  'Nessun Prodotto Selezionato - Vai allo SHOP'
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
      
      {/* Dialog per EditAddress */}
      {customer && (
        <Dialog open={isEditAddressOpen} onOpenChange={setIsEditAddressOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Indirizzo</DialogTitle>
            </DialogHeader>
            <EditAddress 
              customer={customer} 
              onClose={() => setIsEditAddressOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Funzioni helper che NON usano state - FUORI DAL COMPONENTE
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

export default Checkout;


  const handleStripeSuccess = (paymentIntent: any) => {
    console.log('Stripe payment successful:', paymentIntent);
    // Gestisci il successo del pagamento Stripe
    // Puoi procedere con la creazione dell'ordine
    handleOrderSubmit();
  };

  const handleStripeError = (error: any) => {
    console.error('Stripe payment error:', error);
    toast.error('Errore nel pagamento con carta di credito');
  };
