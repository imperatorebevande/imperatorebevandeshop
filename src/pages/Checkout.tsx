import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
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
      case 0: // INDIRIZZO
        return formData.firstName && formData.lastName && formData.email && formData.phone &&
               formData.address && formData.city && formData.postalCode && formData.province;
      case 1: // DATA CONSEGNA
        return formData.deliveryDate && formData.deliveryTimeSlot;
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
              <Select value={formData.province} onValueChange={(value) => setFormData(prev => ({ ...prev, province: value }))}>
                <SelectTrigger className={!formData.province ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Seleziona provincia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AG">Agrigento</SelectItem>
                  <SelectItem value="AL">Alessandria</SelectItem>
                  <SelectItem value="AN">Ancona</SelectItem>
                  <SelectItem value="AO">Aosta</SelectItem>
                  <SelectItem value="AR">Arezzo</SelectItem>
                  <SelectItem value="AP">Ascoli Piceno</SelectItem>
                  <SelectItem value="AT">Asti</SelectItem>
                  <SelectItem value="AV">Avellino</SelectItem>
                  <SelectItem value="BA">Bari</SelectItem>
                  <SelectItem value="BT">Barletta-Andria-Trani</SelectItem>
                  <SelectItem value="BL">Belluno</SelectItem>
                  <SelectItem value="BN">Benevento</SelectItem>
                  <SelectItem value="BG">Bergamo</SelectItem>
                  <SelectItem value="BI">Biella</SelectItem>
                  <SelectItem value="BO">Bologna</SelectItem>
                  <SelectItem value="BZ">Bolzano</SelectItem>
                  <SelectItem value="BS">Brescia</SelectItem>
                  <SelectItem value="BR">Brindisi</SelectItem>
                  <SelectItem value="CA">Cagliari</SelectItem>
                  <SelectItem value="CL">Caltanissetta</SelectItem>
                  <SelectItem value="CB">Campobasso</SelectItem>
                  <SelectItem value="CI">Carbonia-Iglesias</SelectItem>
                  <SelectItem value="CE">Caserta</SelectItem>
                  <SelectItem value="CT">Catania</SelectItem>
                  <SelectItem value="CZ">Catanzaro</SelectItem>
                  <SelectItem value="CH">Chieti</SelectItem>
                  <SelectItem value="CO">Como</SelectItem>
                  <SelectItem value="CS">Cosenza</SelectItem>
                  <SelectItem value="CR">Cremona</SelectItem>
                  <SelectItem value="KR">Crotone</SelectItem>
                  <SelectItem value="CN">Cuneo</SelectItem>
                  <SelectItem value="EN">Enna</SelectItem>
                  <SelectItem value="FM">Fermo</SelectItem>
                  <SelectItem value="FE">Ferrara</SelectItem>
                  <SelectItem value="FI">Firenze</SelectItem>
                  <SelectItem value="FG">Foggia</SelectItem>
                  <SelectItem value="FC">Forlì-Cesena</SelectItem>
                  <SelectItem value="FR">Frosinone</SelectItem>
                  <SelectItem value="GE">Genova</SelectItem>
                  <SelectItem value="GO">Gorizia</SelectItem>
                  <SelectItem value="GR">Grosseto</SelectItem>
                  <SelectItem value="IM">Imperia</SelectItem>
                  <SelectItem value="IS">Isernia</SelectItem>
                  <SelectItem value="SP">La Spezia</SelectItem>
                  <SelectItem value="AQ">L'Aquila</SelectItem>
                  <SelectItem value="LT">Latina</SelectItem>
                  <SelectItem value="LE">Lecce</SelectItem>
                  <SelectItem value="LC">Lecco</SelectItem>
                  <SelectItem value="LI">Livorno</SelectItem>
                  <SelectItem value="LO">Lodi</SelectItem>
                  <SelectItem value="LU">Lucca</SelectItem>
                  <SelectItem value="MC">Macerata</SelectItem>
                  <SelectItem value="MN">Mantova</SelectItem>
                  <SelectItem value="MS">Massa-Carrara</SelectItem>
                  <SelectItem value="MT">Matera</SelectItem>
                  <SelectItem value="VS">Medio Campidano</SelectItem>
                  <SelectItem value="ME">Messina</SelectItem>
                  <SelectItem value="MI">Milano</SelectItem>
                  <SelectItem value="MO">Modena</SelectItem>
                  <SelectItem value="MB">Monza e Brianza</SelectItem>
                  <SelectItem value="NA">Napoli</SelectItem>
                  <SelectItem value="NO">Novara</SelectItem>
                  <SelectItem value="NU">Nuoro</SelectItem>
                  <SelectItem value="OG">Ogliastra</SelectItem>
                  <SelectItem value="OT">Olbia-Tempio</SelectItem>
                  <SelectItem value="OR">Oristano</SelectItem>
                  <SelectItem value="PD">Padova</SelectItem>
                  <SelectItem value="PA">Palermo</SelectItem>
                  <SelectItem value="PR">Parma</SelectItem>
                  <SelectItem value="PV">Pavia</SelectItem>
                  <SelectItem value="PG">Perugia</SelectItem>
                  <SelectItem value="PU">Pesaro e Urbino</SelectItem>
                  <SelectItem value="PE">Pescara</SelectItem>
                  <SelectItem value="PC">Piacenza</SelectItem>
                  <SelectItem value="PI">Pisa</SelectItem>
                  <SelectItem value="PT">Pistoia</SelectItem>
                  <SelectItem value="PN">Pordenone</SelectItem>
                  <SelectItem value="PZ">Potenza</SelectItem>
                  <SelectItem value="PO">Prato</SelectItem>
                  <SelectItem value="RG">Ragusa</SelectItem>
                  <SelectItem value="RA">Ravenna</SelectItem>
                  <SelectItem value="RC">Reggio Calabria</SelectItem>
                  <SelectItem value="RE">Reggio Emilia</SelectItem>
                  <SelectItem value="RI">Rieti</SelectItem>
                  <SelectItem value="RN">Rimini</SelectItem>
                  <SelectItem value="RM">Roma</SelectItem>
                  <SelectItem value="RO">Rovigo</SelectItem>
                  <SelectItem value="SA">Salerno</SelectItem>
                  <SelectItem value="SS">Sassari</SelectItem>
                  <SelectItem value="SV">Savona</SelectItem>
                  <SelectItem value="SI">Siena</SelectItem>
                  <SelectItem value="SR">Siracusa</SelectItem>
                  <SelectItem value="SO">Sondrio</SelectItem>
                  <SelectItem value="TA">Taranto</SelectItem>
                  <SelectItem value="TE">Teramo</SelectItem>
                  <SelectItem value="TR">Terni</SelectItem>
                  <SelectItem value="TO">Torino</SelectItem>
                  <SelectItem value="TP">Trapani</SelectItem>
                  <SelectItem value="TN">Trento</SelectItem>
                  <SelectItem value="TV">Treviso</SelectItem>
                  <SelectItem value="TS">Trieste</SelectItem>
                  <SelectItem value="UD">Udine</SelectItem>
                  <SelectItem value="VA">Varese</SelectItem>
                  <SelectItem value="VE">Venezia</SelectItem>
                  <SelectItem value="VB">Verbano-Cusio-Ossola</SelectItem>
                  <SelectItem value="VC">Vercelli</SelectItem>
                  <SelectItem value="VR">Verona</SelectItem>
                  <SelectItem value="VV">Vibo Valentia</SelectItem>
                  <SelectItem value="VI">Vicenza</SelectItem>
                  <SelectItem value="VT">Viterbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 1: // DATA CONSEGNA
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-3 block">Seleziona la data di consegna</Label>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) {
                      setFormData(prev => ({
                        ...prev,
                        deliveryDate: date.toISOString().split('T')[0]
                      }));
                    }
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md border"
                />
              </div>
            </div>
            
            {formData.deliveryDate && (
              <div>
                <Label htmlFor="deliveryTimeSlot">Fascia oraria *</Label>
                <Select 
                  value={formData.deliveryTimeSlot} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, deliveryTimeSlot: value }))}
                >
                  <SelectTrigger className={!formData.deliveryTimeSlot ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Seleziona fascia oraria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00-12:00">Mattina (09:00 - 12:00)</SelectItem>
                    <SelectItem value="14:00-17:00">Pomeriggio (14:00 - 17:00)</SelectItem>
                    <SelectItem value="17:00-20:00">Sera (17:00 - 20:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );

      case 2: // RIEPILOGO
        return (
          <div className="space-y-6">
            {/* Dati di spedizione */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Dati di Spedizione
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><span className="font-medium">Nome:</span> {formData.firstName} {formData.lastName}</p>
                <p><span className="font-medium">Email:</span> {formData.email}</p>
                <p><span className="font-medium">Telefono:</span> {formData.phone}</p>
                <p><span className="font-medium">Indirizzo:</span> {formData.address}</p>
                <p><span className="font-medium">Città:</span> {formData.city}, {formData.province} {formData.postalCode}</p>
                {formData.deliveryDate && (
                  <p><span className="font-medium">Data consegna:</span> {new Date(formData.deliveryDate).toLocaleDateString('it-IT')}</p>
                )}
                {formData.deliveryTimeSlot && (
                  <p><span className="font-medium">Fascia oraria:</span> {formData.deliveryTimeSlot}</p>
                )}
              </div>
            </div>

            {/* Prodotti nel carrello */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
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

            {/* Totali */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Receipt className="w-5 h-5 mr-2" />
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
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Totale:</span>
                  <span>{calculateTotal().toFixed(2)}€</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // PAGAMENTO
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

  // Funzioni di navigazione - ALL'INTERNO DEL COMPONENTE
  const nextStep = () => {
    if (currentStep < steps.length - 1 && validateStep(currentStep)) {
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
