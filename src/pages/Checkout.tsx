import React, { useState, useCallback, useEffect, useMemo } from 'react';
import DeliveryCalendar from '@/components/DeliveryCalendar/DeliveryCalendar';
import WooCommercePaymentSection from '@/components/WooCommercePaymentSection';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import EditAddress from '@/components/EditAddress';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import PayPalNativeCheckout from '@/components/PayPalNativeCheckout';
import StripeCheckout from '@/components/StripeCheckout';
import LottieAnimation from '@/components/LottieAnimation';
import paypalAnimationData from '@/assets/animations/paypal-payment.json';
import stripeAnimationData from '@/assets/animations/stripe-payment.json';
import cashAnimationData from '@/assets/animations/cash-payment.json';
import bankAnimationData from '@/assets/animations/bank.json';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWooCommerceCustomer, useWooCommercePaymentGateways, useUpdateWooCommerceCustomer, useWooCommerceCustomerByEmail } from '@/hooks/useWooCommerce';
import { wooCommerceService, CalendarData, DeliveryTimeSlot } from '@/services/woocommerce';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Loader2, ShoppingBag, MapPin, Package, Receipt, CreditCard as PaymentIcon, User, Mail, Phone, Home, Calendar as CalendarIcon, Clock, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useCreateWooCommerceOrder } from '@/hooks/useWooCommerce';
import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { getBorderColor } from '@/lib/utils';
import { determineZoneFromAddress, getZoneById, determineZoneFromCoordinates } from '@/config/deliveryZones';
import { geocodeAddress } from '@/services/geocoding';

// Componente per la zona di consegna dell'indirizzo principale nel checkout
const CheckoutMainAddressZone: React.FC<{ customer: any; onZoneDetected?: (zone: any) => void }> = ({ customer, onZoneDetected }) => {
  const [zone, setZone] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const determineMainAddressZone = async () => {
      setIsLoading(true);
      try {
        const addressObj = {
          city: customer.shipping?.city || customer.billing?.city || '',
          province: customer.shipping?.state || customer.billing?.state || '',
          postalCode: customer.shipping?.postcode || customer.billing?.postcode || '',
          address: customer.shipping?.address_1 || customer.billing?.address_1 || ''
        };
        
        // Prima prova con la determinazione diretta
        let detectedZone = determineZoneFromAddress(addressObj);
        
        // Se non trova la zona, prova con la geocodifica
        if (!detectedZone && addressObj.address && addressObj.city) {
          try {
            const coordinates = await geocodeAddress(addressObj);
            if (coordinates) {
              detectedZone = determineZoneFromCoordinates(coordinates.lat, coordinates.lng);
            }
          } catch (error) {
            console.warn('Errore nella geocodifica:', error);
          }
        }
        
        setZone(detectedZone);
        onZoneDetected?.(detectedZone);
      } catch (error) {
        console.error('Errore nella determinazione della zona:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (customer?.shipping || customer?.billing) {
      determineMainAddressZone();
    } else {
      setIsLoading(false);
    }
  }, [customer]);

  if (isLoading) {
    return (
      <div className="flex items-center mt-2">
        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
        <span className="text-xs text-gray-500">Determinazione zona...</span>
      </div>
    );
  }

  const addressString = `${customer.shipping?.address_1 || customer.billing?.address_1}, ${customer.shipping?.city || customer.billing?.city}, ${customer.shipping?.state || customer.billing?.state} ${customer.shipping?.postcode || customer.billing?.postcode}`;

  return zone ? (
    <div className="flex items-center mt-2">
      <div 
        className="w-3 h-3 rounded-full mr-2" 
        style={{ backgroundColor: zone.color }}
      ></div>
      <span className="text-xs font-medium" style={{ color: zone.color }}>
        {zone.name}
      </span>
    </div>
  ) : (
    <div className="mt-2">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2 bg-red-500"></div>
        <span className="text-xs font-medium text-red-600">
          Zona non identificata - Debug: {addressString}
        </span>
      </div>
      <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
        <span className="text-xs text-red-700">
          ⚠️ Inserisci nuovamente l'indirizzo per identificare correttamente la zona di consegna
        </span>
      </div>
    </div>
  );
};

const Checkout = () => {
  const { state, dispatch } = useCart();
  const navigate = useNavigate(); 
  const createOrder = useCreateWooCommerceOrder();
  const updateCustomer = useUpdateWooCommerceCustomer();
  const { authState } = useAuth();
  
  console.log('=== CHECKOUT COMPONENT DEBUG ===');
  console.log('authState:', authState);
  console.log('authState.isAuthenticated:', authState?.isAuthenticated);
  console.log('authState.user:', authState?.user);
  console.log('authState.user.id:', authState?.user?.id);
  console.log('authState.user.email:', authState?.user?.email);
  
  // Step management - ora 4 step
  const [currentStep, setCurrentStep] = useState(0);
  const [allowAutoSkip, setAllowAutoSkip] = useState(false);
  
  // Aggiungi questo stato per mostrare/nascondere i dettagli prodotti
  const [showProductDetails, setShowProductDetails] = useState(false);
  
  // AGGIUNGI QUESTE RIGHE QUI - Stati per il secondo indirizzo
  const [useSecondAddress, setUseSecondAddress] = useState(false);
  const [secondAddressData, setSecondAddressData] = useState({
    address: '',
    city: '',
    postalCode: '',
    province: '',

  });
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [editingAddressType, setEditingAddressType] = useState<'main' | 'second' | null>(null);
  
  // Aggiungi questi nuovi stati dopo gli stati esistenti
  const [savedAddresses, setSavedAddresses] = useState([]); // Array vuoto invece di indirizzi di esempio
  const [selectedAddressId, setSelectedAddressId] = useState('main'); // 'main' o id dell'indirizzo
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    title: '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  });
  
  // ADD THESE MISSING STATE VARIABLES:
  const [isManageAddressesOpen, setIsManageAddressesOpen] = useState(false);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState('main');
  const [addressToEdit, setAddressToEdit] = useState<'main' | 'new' | number | null>(null);
  
  // Aggiungi questo stato per il loading
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  // Stato per la modale pagamento
  const [openPaymentModal, setOpenPaymentModal] = useState<string | null>(null);
  
  // Stato per il loading del pulsante Continua
  const [isNextStepLoading, setIsNextStepLoading] = useState(false);
  
  // Stato per memorizzare la zona dell'indirizzo principale
  const [mainAddressZone, setMainAddressZone] = useState<any>(null);
  
  // Stato per controllare se la sezione dati personali è aperta su mobile
  const [isPersonalDataOpen, setIsPersonalDataOpen] = useState(false);
  
  // Stato per tracciare se l'utente sta modificando attivamente i dati personali
  const [isEditingPersonalData, setIsEditingPersonalData] = useState(false);
  
  // Stati per la validazione degli errori
  const [newAddressErrors, setNewAddressErrors] = useState({
    address: false,
    city: false,
    postalCode: false,
    province: false
  });
  
  const steps = [
    { id: 0, name: 'INDIRIZZO di CONSEGNA', icon: MapPin },
    { id: 1, name: 'DATA CONSEGNA', icon: Package },
    { id: 2, name: 'RIEPILOGO ORDINE', icon: ShoppingBag },
    { id: 3, name: 'TIPO di PAGAMENTO', icon: PaymentIcon }
  ];
  
  // Add search completed state
  const [searchCompleted, setSearchCompleted] = useState(false);
  
  // Rimuovere questa riga
  const [showLoginBox] = useState(true); // Sempre visibile per ora
  
  // Determina l'ID del cliente dall'auth (stessa logica di Account.tsx)
  const authCustomerId = authState?.user?.id && authState.user.id > 0 ? authState.user.id : null;
  
  // Solo se non abbiamo un ID valido E abbiamo un'email, cerca per email
  const shouldSearchByEmail = !authCustomerId && !!authState?.user?.email && !searchCompleted;
  
  // Query per cercare per email - SOLO se necessario
  const { data: customerByEmail, isLoading: isLoadingByEmail } = useWooCommerceCustomerByEmail(
    authState?.user?.email || '',
    { 
      enabled: shouldSearchByEmail && !!authState?.isAuthenticated,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  // Determina l'ID effettivo del cliente
  const effectiveCustomerId = useMemo(() => {
    console.log('=== CALCULATING EFFECTIVE CUSTOMER ID ===');
    console.log('authCustomerId:', authCustomerId);
    console.log('customerByEmail:', customerByEmail);
    
    if (authCustomerId) {
      console.log('Using authCustomerId:', authCustomerId);
      return authCustomerId;
    }
    if (customerByEmail && customerByEmail.length > 0) {
      console.log('Using customerByEmail ID:', customerByEmail[0].id);
      return customerByEmail[0].id;
    }
    console.log('No effective customer ID found');
    return null;
  }, [authCustomerId, customerByEmail]);

  const customerId = effectiveCustomerId;
  
  // Query per i dati del cliente - aggiorna le opzioni
  const { data: customer, isLoading: customerLoading } = useWooCommerceCustomer(
    effectiveCustomerId || 0,
    { 
      enabled: !!effectiveCustomerId && effectiveCustomerId > 0 && !!authState?.isAuthenticated
    }
  );
  
  // Debug log per customer
  useEffect(() => {
    console.log('=== CUSTOMER DATA DEBUG ===');
    console.log('effectiveCustomerId:', effectiveCustomerId);
    console.log('customerLoading:', customerLoading);
    console.log('customer:', customer);
    console.log('customer?.id:', customer?.id);
    console.log('customer?.meta_data:', customer?.meta_data);
  }, [effectiveCustomerId, customerLoading, customer]);
  const { data: paymentGateways, isLoading: paymentGatewaysLoading } = useWooCommercePaymentGateways();
  
  // Filtra i metodi di pagamento per mostrare solo quelli desiderati
  const allowedPaymentMethods = ['cod', 'bacs', 'paypal', 'stripe', 'satispay'];
  let filteredPaymentGateways = paymentGateways?.filter(gateway => 
    allowedPaymentMethods.includes(gateway.id)
  ) || [];
  // Se PayPal non è presente, aggiungilo manualmente
  if (!filteredPaymentGateways.some(g => g.id === 'paypal')) {
    filteredPaymentGateways.push({
      id: 'paypal',
      title: 'PayPal',
      description: 'Paga facilmente e in sicurezza con il tuo account PayPal.'
    });
  }
  
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

  // Stato per tracciare i dati originali del cliente
  const [originalCustomerData, setOriginalCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Funzione per controllare se tutti i campi dei dati personali sono compilati
  const arePersonalDataComplete = () => {
    return formData.firstName.trim() !== '' && 
           formData.lastName.trim() !== '' && 
           formData.email.trim() !== '' && 
           formData.phone.trim() !== '';
  };
  
  // Effetto per gestire l'apertura/chiusura automatica della sezione dati personali
  useEffect(() => {
    // Non modificare lo stato se l'utente sta attivamente modificando i dati
    if (isEditingPersonalData) return;
    
    const isComplete = arePersonalDataComplete();
    // Se i dati sono completi, chiudi la sezione; se non sono completi, aprila
    setIsPersonalDataOpen(!isComplete);
  }, [formData.firstName, formData.lastName, formData.email, formData.phone, isEditingPersonalData]);

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
      const customerData = {
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        email: customer.email || '',
        phone: customer.billing.phone || '',
      };
      
      setFormData(prev => ({
        ...customerData,
        address: customer.shipping.address_1 || customer.billing.address_1 || '',
        city: customer.shipping.city || customer.billing.city || '',
        postalCode: customer.shipping.postcode || customer.billing.postcode || '',
        province: customer.shipping.state || customer.billing.state || '',
        orderNotes: prev.orderNotes || '',
        deliveryDate: prev.deliveryDate || '', // Preserva il valore esistente
        deliveryTimeSlot: prev.deliveryTimeSlot || '', // Preserva il valore esistente
      }));
      
      // Salva i dati originali per il confronto
      setOriginalCustomerData(customerData);
    } else if (!authState.isAuthenticated) {
      // Se l'utente non è loggato, lascia i campi vuoti
      const emptyData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      };
      
      setFormData(prev => ({
        ...emptyData,
        address: '',
        city: '',
        postalCode: '',
        province: '',
        orderNotes: prev.orderNotes || '',
        deliveryDate: prev.deliveryDate || '', // Preserva il valore esistente
        deliveryTimeSlot: prev.deliveryTimeSlot || '', // Preserva il valore esistente
      }));
      
      setOriginalCustomerData(emptyData);
    }
  }, [authState.isAuthenticated, customer]);

  // Aggiorna il formData quando cambia l'indirizzo selezionato
  useEffect(() => {
    if (selectedAddressId !== 'main') {
      // Trova l'indirizzo selezionato
      const selectedAddress = savedAddresses.find(addr => addr.id.toString() === selectedAddressId);
      if (selectedAddress) {
        // Aggiorna il formData con i dati dell'indirizzo selezionato
        setFormData(prev => ({
          ...prev,
          address: selectedAddress.address,
          city: selectedAddress.city,
          province: selectedAddress.province,
          postalCode: selectedAddress.postalCode
        }));
      }
    } else if (customer && selectedAddressId === 'main') {
      // Ripristina l'indirizzo principale quando si seleziona 'main'
      setFormData(prev => ({
        ...prev,
        address: customer.shipping?.address_1 || customer.billing?.address_1 || '',
        city: customer.shipping?.city || customer.billing?.city || '',
        province: customer.shipping?.state || customer.billing?.state || '',
        postalCode: customer.shipping?.postcode || customer.billing?.postcode || ''
      }));
    }
  }, [selectedAddressId, savedAddresses, customer]);

  // Funzione per ricaricare i colori delle zone per tutti gli indirizzi
  const reloadZoneColors = async (addresses: any[]) => {
    const updatedAddresses = await Promise.all(
      addresses.map(async (address) => {
        // Ricalcola la zona di consegna per ogni indirizzo
        const deliveryZone = determineZoneFromAddress({
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          coordinates: address.coordinates
        });
        
        return {
          ...address,
          deliveryZone: deliveryZone ? {
            id: deliveryZone.id,
            name: deliveryZone.name,
            color: deliveryZone.color
          } : null
        };
      })
    );
    
    return updatedAddresses;
  };

  // Carica gli indirizzi salvati dai meta_data del customer
  useEffect(() => {
    if (customer && customer.meta_data) {
      // Cerca gli indirizzi salvati nei meta_data
      const savedAddressesMeta = customer.meta_data.find(
        (meta: any) => meta.key === 'saved_addresses'
      );
      
      if (savedAddressesMeta && savedAddressesMeta.value) {
        try {
          const addresses = JSON.parse(savedAddressesMeta.value);
          
          // Ricarica i colori delle zone per tutti gli indirizzi
          reloadZoneColors(addresses).then((updatedAddresses) => {
            setSavedAddresses(updatedAddresses);
            
            // Salva gli indirizzi aggiornati con i nuovi colori se necessario
            if (JSON.stringify(addresses) !== JSON.stringify(updatedAddresses)) {
              console.log('Aggiornamento colori zone per indirizzi salvati');
              
              // Aggiorna in WooCommerce se l'utente è autenticato
              if (effectiveCustomerId && authState.isAuthenticated && customer) {
                const existingMetaData = customer?.meta_data || [];
                const updatedMetaData = existingMetaData.filter((meta: any) => meta.key !== 'saved_addresses');
                updatedMetaData.push({
                  key: 'saved_addresses',
                  value: JSON.stringify(updatedAddresses)
                });
                
                updateCustomer.mutateAsync({
                  id: effectiveCustomerId,
                  customerData: {
                    meta_data: updatedMetaData
                  }
                }).catch((error) => {
                  console.error('Errore nell\'aggiornamento colori zone:', error);
                });
              }
            }
          });
        } catch (error) {
          console.error('Errore nel parsing degli indirizzi salvati:', error);
        }
      }
    }
  }, [customer, effectiveCustomerId, authState.isAuthenticated]);

  // Aggiungi questo useEffect per marcare la ricerca come completata
  useEffect(() => {
    if (!shouldSearchByEmail || (shouldSearchByEmail && !isLoadingByEmail)) {
      setSearchCompleted(true);
    }
  }, [shouldSearchByEmail, isLoadingByEmail]);

  // Rimosso: Non impostare più automaticamente il primo metodo di pagamento come default
  // Il cliente deve selezionare manualmente il metodo di pagamento
  // useEffect(() => {
  //   if (!paymentMethod && filteredPaymentGateways && filteredPaymentGateways.length > 0) {
  //     const defaultPaymentMethod = filteredPaymentGateways[0].id;
  //     if (filteredPaymentGateways.some(gateway => gateway.id === defaultPaymentMethod)) {
  //       handleSetPaymentMethod(defaultPaymentMethod); // Usa la versione memoizzata
  //     }
  //   }
  // }, [filteredPaymentGateways, paymentMethod, handleSetPaymentMethod]); // Aggiungi handleSetPaymentMethod alle dipendenze

  // Salta automaticamente al riepilogo se l'indirizzo è già completo
  /*
  useEffect(() => {
    if (currentStep === 0 && validateStep(0) && allowAutoSkip) {
      setCurrentStep(1);
    }
  }, [formData, currentStep, allowAutoSkip]);
  */

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
    console.log('🗓️ handleDateTimeChange chiamato con:', { date, timeSlot });
    setFormData(prev => {
      const newFormData = {
        ...prev,
        deliveryDate: date,
        deliveryTimeSlot: timeSlot,
      };
      console.log('🗓️ Nuovo formData dopo aggiornamento:', { deliveryDate: newFormData.deliveryDate, deliveryTimeSlot: newFormData.deliveryTimeSlot });
      return newFormData;
    });
  };

  // Funzione per gestire i cambiamenti nel form nuovo indirizzo
  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset errore per il campo specifico quando l'utente inizia a digitare
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  // Funzione per validare il nuovo indirizzo
  const validateNewAddress = () => {
    const errors = {
      address: !newAddressForm.address.trim(),
      city: !newAddressForm.city.trim(),
      postalCode: !newAddressForm.postalCode.trim(),
      province: !newAddressForm.province.trim()
    };
    setNewAddressErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  // Funzione per salvare nuovo indirizzo
  const saveNewAddress = async () => {
    // Valida i campi e mostra errori se necessario
    if (!validateNewAddress()) {
      toast({
          title: "Errore",
          description: "Compila tutti i campi obbligatori",
          variant: "destructive"
        });
      return;
    }
    
    console.log('=== DEBUG SAVE ADDRESS ===');
    console.log('authState.user.id:', authState.user?.id);
    console.log('authCustomerId:', authCustomerId);
    console.log('customerByEmail:', customerByEmail);
    console.log('effectiveCustomerId:', effectiveCustomerId);
    console.log('authState.isAuthenticated:', authState.isAuthenticated);
    console.log('customer presente:', !!customer);
    console.log('customer.id:', customer?.id);
    
    // Verifica la condizione completa
    const condition = effectiveCustomerId && authState.isAuthenticated && customer;
    console.log('Condizione API soddisfatta?', condition);
    console.log('- effectiveCustomerId:', !!effectiveCustomerId);
    console.log('- authState.isAuthenticated:', !!authState.isAuthenticated);
    console.log('- customer:', !!customer);
    
    // Ottieni le coordinate dell'indirizzo
    const coordinates = await geocodeAddress({
      address: newAddressForm.address,
      city: newAddressForm.city,
      province: newAddressForm.province,
      postalCode: newAddressForm.postalCode
    });
    
    // Determina automaticamente la zona di consegna con le coordinate
    const deliveryZone = determineZoneFromAddress({
      city: newAddressForm.city,
      province: newAddressForm.province,
      postalCode: newAddressForm.postalCode,
      coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : undefined
    });
    
    const newAddress = {
      id: Date.now(),
      title: newAddressForm.title || `Indirizzo ${savedAddresses.length + 1}`,
      address: newAddressForm.address,
      city: newAddressForm.city,
      province: newAddressForm.province,
      postalCode: newAddressForm.postalCode,
      coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : undefined,
      deliveryZone: deliveryZone ? {
        id: deliveryZone.id,
        name: deliveryZone.name,
        color: deliveryZone.color
      } : null
    };
    
    // Mostra un messaggio informativo sulla zona assegnata
    if (deliveryZone) {
      toast({
            title: "Successo",
            description: `Indirizzo assegnato alla ${deliveryZone.name}`,
            variant: "default"
          });
    } else {
      toast({
            title: "Attenzione",
            description: "Zona di consegna non determinata automaticamente",
            variant: "default"
          });
    }
    
    const updatedAddresses = [...savedAddresses, newAddress];
    console.log('Indirizzi aggiornati da salvare:', updatedAddresses);
    
    // Salva in WooCommerce se l'utente è autenticato
    if (effectiveCustomerId && authState.isAuthenticated && customer) {
      console.log('Condizioni soddisfatte, procedo con il salvataggio API');
      try {
        setIsSavingAddress(true);
        
        // Preserva tutti i meta_data esistenti e aggiorna solo saved_addresses
        const existingMetaData = customer?.meta_data || [];
        console.log('Meta data esistenti:', existingMetaData);
        
        const updatedMetaData = existingMetaData.filter((meta: any) => meta.key !== 'saved_addresses');
        updatedMetaData.push({
          key: 'saved_addresses',
          value: JSON.stringify(updatedAddresses)
        });
        
        console.log('Meta data da inviare:', updatedMetaData);
        console.log('Customer ID:', effectiveCustomerId);
        
        const result = await updateCustomer.mutateAsync({
          id: effectiveCustomerId,
          customerData: {
            meta_data: updatedMetaData
          }
        });
        
        console.log('Risultato aggiornamento:', result);
        
        // Aggiorna lo stato locale DOPO il successo della chiamata API
        setSavedAddresses(updatedAddresses);
        setSelectedAddressId(newAddress.id.toString());
        toast({
              title: "Successo",
              description: "Indirizzo salvato nell'account!",
              variant: "default"
            });
      } catch (error) {
        console.error('Errore nel salvataggio indirizzo:', error);
        console.error('Dettagli errore:', JSON.stringify(error, null, 2));
        toast({
        title: "Errore",
        description: "Errore nel salvataggio dell'indirizzo",
        variant: "destructive"
      });
        return; // Non aggiornare lo stato locale se c'è un errore
      } finally {
        setIsSavingAddress(false);
      }
    } else {
      console.log('Condizioni NON soddisfatte per API:');
      console.log('- effectiveCustomerId:', effectiveCustomerId);
      console.log('- authState.isAuthenticated:', authState.isAuthenticated);
      console.log('- customer presente:', !!customer);
      console.log('Salvataggio solo locale');
      // Se non autenticato, aggiorna solo lo stato locale
      setSavedAddresses(updatedAddresses);
      setSelectedAddressId(newAddress.id.toString());
      toast({
          title: "Successo",
          description: "Indirizzo salvato localmente!",
          variant: "default"
        });
    }
    
    setShowAddNewAddress(false);
    setNewAddressForm({ title: '', address: '', city: '', province: '', postalCode: '' });
  };

  const deleteAddress = async (addressId: string) => {
    const updatedAddresses = savedAddresses.filter(addr => addr.id.toString() !== addressId);
    console.log('=== DEBUG DELETE ADDRESS ===');
    console.log('effectiveCustomerId:', effectiveCustomerId);
    console.log('authState.isAuthenticated:', authState.isAuthenticated);
    console.log('customer:', customer);
    console.log('Indirizzi dopo eliminazione:', updatedAddresses);
    
    // Se l'indirizzo eliminato era selezionato, torna al principale
    if (selectedAddressId === addressId) {
      setSelectedAddressId('main');
    }
    
    // Aggiorna in WooCommerce
    if (effectiveCustomerId && authState.isAuthenticated && customer) {
      console.log('Condizioni soddisfatte, procedo con eliminazione API');
      try {
        setIsSavingAddress(true);
        
        // Preserva tutti i meta_data esistenti e aggiorna solo saved_addresses
        const existingMetaData = customer?.meta_data || [];
        console.log('Meta data esistenti (delete):', existingMetaData);
        
        const updatedMetaData = existingMetaData.filter((meta: any) => meta.key !== 'saved_addresses');
        updatedMetaData.push({
          key: 'saved_addresses',
          value: JSON.stringify(updatedAddresses)
        });
        
        console.log('Meta data da inviare (delete):', updatedMetaData);
        
        const result = await updateCustomer.mutateAsync({
          id: effectiveCustomerId,
          customerData: {
            meta_data: updatedMetaData
          }
        });
        
        console.log('Risultato eliminazione:', result);
        
        // Aggiorna lo stato locale DOPO il successo della chiamata API
        setSavedAddresses(updatedAddresses);
        toast({
              title: "Successo",
              description: "Indirizzo eliminato!",
              variant: "default"
            });
      } catch (error) {
        console.error('Errore nell\'eliminazione indirizzo:', error);
        console.error('Dettagli errore (delete):', JSON.stringify(error, null, 2));
        toast({
              title: "Errore",
              description: "Errore nell'eliminazione dell'indirizzo",
              variant: "destructive"
            });
        return; // Non aggiornare lo stato locale se c'è un errore
      } finally {
        setIsSavingAddress(false);
      }
    } else {
      console.log('Condizioni NON soddisfatte per API eliminazione:');
      console.log('- effectiveCustomerId:', effectiveCustomerId);
      console.log('- authState.isAuthenticated:', authState.isAuthenticated);
      console.log('- customer presente:', !!customer);
      console.log('Eliminazione solo locale');
      // Se non autenticato, aggiorna solo lo stato locale
      setSavedAddresses(updatedAddresses);
      toast({
          title: "Successo",
          description: "Indirizzo eliminato localmente!",
          variant: "default"
        });
    }
  };

  const updateExistingAddress = async (addressId: string, updatedData: any) => {
    // Ricalcola la zona di consegna se sono stati modificati città, provincia, CAP o indirizzo
    let finalUpdatedData = { ...updatedData };
    
    if (updatedData.city || updatedData.province || updatedData.postalCode || updatedData.address) {
      const currentAddress = savedAddresses.find(addr => addr.id.toString() === addressId);
      if (currentAddress) {
        const addressForZone = {
          address: updatedData.address || currentAddress.address,
          city: updatedData.city || currentAddress.city,
          province: updatedData.province || currentAddress.province,
          postalCode: updatedData.postalCode || currentAddress.postalCode
        };
        
        // Ottieni le coordinate dell'indirizzo aggiornato
        const coordinates = await geocodeAddress(addressForZone);
        
        const deliveryZone = determineZoneFromAddress({
          ...addressForZone,
          coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : undefined
        });
        
        finalUpdatedData.deliveryZone = deliveryZone ? {
          id: deliveryZone.id,
          name: deliveryZone.name,
          color: deliveryZone.color
        } : null;
        
        // Salva anche le coordinate
        if (coordinates) {
          finalUpdatedData.coordinates = { lat: coordinates.lat, lng: coordinates.lng };
        }
        
        // Mostra un messaggio informativo sulla zona aggiornata
        if (deliveryZone) {
          toast({
              title: "Successo",
              description: `Indirizzo aggiornato e assegnato alla ${deliveryZone.name}`,
              variant: "default"
            });
        } else {
          toast({
              title: "Attenzione",
              description: "Zona di consegna non determinata per l'indirizzo aggiornato",
              variant: "default"
            });
        }
      }
    }
    
    const updatedAddresses = savedAddresses.map(addr => 
      addr.id.toString() === addressId ? { ...addr, ...finalUpdatedData } : addr
    );
    
    setSavedAddresses(updatedAddresses);
    
    // Aggiorna in WooCommerce
    if (effectiveCustomerId && authState.isAuthenticated && customer) {
      try {
        // Preserva tutti i meta_data esistenti e aggiorna solo saved_addresses
        const existingMetaData = customer?.meta_data || [];
        const updatedMetaData = existingMetaData.filter((meta: any) => meta.key !== 'saved_addresses');
        updatedMetaData.push({
          key: 'saved_addresses',
          value: JSON.stringify(updatedAddresses)
        });
        
        await updateCustomer.mutateAsync({
          id: effectiveCustomerId,
          customerData: {
            meta_data: updatedMetaData
          }
        });
        toast({
              title: "Successo",
              description: "Indirizzo aggiornato!",
              variant: "default"
            });
      } catch (error) {
        console.error('Errore nell\'aggiornamento indirizzo:', error);
        toast({
              title: "Errore",
              description: "Errore nell'aggiornamento dell'indirizzo",
              variant: "destructive"
            });
      }
    }
  };

  // Aggiungi questa funzione per resettare il form:
  const resetNewAddressForm = () => {
    setNewAddressForm({
      title: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',

    });
  };

  // AGGIUNGI QUESTA FUNZIONE - Handler per il secondo indirizzo
  const handleSecondAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSecondAddressData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validazione per ogni step
  const validateStep = (step: number) => {
    switch (step) {
      case 0: // INDIRIZZO
        // Validazione dei dati personali sempre richiesta (per tutti gli indirizzi)
        const personalDataValid = formData.firstName && formData.lastName && formData.email && formData.phone;
        
        if (selectedAddressId === 'main') {
          // Validazione per indirizzo principale
          return personalDataValid &&
                 formData.address && formData.city && formData.postalCode && formData.province;
        } else {
          // Validazione per indirizzo salvato selezionato - richiede sempre i dati personali
          const selectedAddress = savedAddresses.find(addr => addr.id && addr.id.toString() === selectedAddressId);
          return personalDataValid && selectedAddress !== undefined;
        }
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
          <div className="space-y-3 md:space-y-4">
            {/* Sezione Selezione Indirizzo */}
            <div>
              <h3 className="font-semibold mb-2 md:mb-3 flex items-center" style={{ color: '#1B5AAB' }}>
                <MapPin className="w-5 h-5 mr-2" />
                Seleziona Indirizzo di Spedizione
              </h3>
              
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Indirizzo Principale Account */}
                {customer && (
                  <div 
                    className={`relative border-2 p-3 md:p-4 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                      selectedAddressId === 'main' && mainAddressZone 
                        ? 'border-green-500 bg-green-50 shadow-sm' 
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedAddressId('main')}
                  >
                    {/* Pulsante Modifica nell'angolo */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddressToEdit('main');
                        setNewAddressForm({
                          title: 'Indirizzo Principale',
                          address: customer.shipping?.address_1 || customer.billing?.address_1 || '',
                          city: customer.shipping?.city || customer.billing?.city || '',
                          province: customer.shipping?.state || customer.billing?.state || '',
                          postalCode: customer.shipping?.postcode || customer.billing?.postcode || '',
                  
                        });
                        setIsManageAddressesOpen(true);
                      }}
                      className="absolute top-3 right-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 h-8 w-8"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-start space-x-3 pr-10">
                      <input
                        type="radio"
                        name="selectedAddress"
                        value="main"
                        checked={selectedAddressId === 'main'}
                        onChange={() => setSelectedAddressId('main')}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <Home className="w-5 h-5 mr-2 text-blue-600" />
                          <h4 className="font-semibold text-blue-700 text-base">
                            Indirizzo Principale Account
                          </h4>
                          {selectedAddressId === 'main' && (
                            <ShieldCheck className="w-5 h-5 ml-2 text-green-600" />
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="text-gray-700 font-medium">
                            {customer.shipping?.address_1 || customer.billing?.address_1}
                          </p>
                          <p>
                            {customer.shipping?.city || customer.billing?.city}, {customer.shipping?.state || customer.billing?.state} {customer.shipping?.postcode || customer.billing?.postcode}
                          </p>
                          <CheckoutMainAddressZone customer={customer} onZoneDetected={setMainAddressZone} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Indirizzi Salvati */}
                {savedAddresses.map((address) => (
                  <div 
                    key={address.id}
                    className={`relative border-2 p-5 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                      selectedAddressId === address.id.toString() 
                        ? 'border-green-500 bg-green-50 shadow-sm' 
                        : 'hover:border-blue-300'
                    }`}
                    style={{
                      borderColor: selectedAddressId === address.id.toString() 
                        ? '#10b981' 
                        : address.deliveryZone?.color || '#d1d5db'
                    }}
                    onClick={() => setSelectedAddressId(address.id.toString())}
                  >
                    {/* Pulsanti nell'angolo */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddressToEdit(address.id);
                          setNewAddressForm({
                            title: address.title,
                            address: address.address,
                            city: address.city,
                            province: address.province,
                            postalCode: address.postalCode,
                    
                          });
                          setIsManageAddressesOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAddress(address.id.toString());
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-8 w-8"
                      >
                        ✕
                      </Button>
                    </div>
                    
                    <div className="flex items-start space-x-3 pr-16">
                      <input
                        type="radio"
                        name="selectedAddress"
                        value={address.id}
                        checked={selectedAddressId === address.id.toString()}
                        onChange={() => setSelectedAddressId(address.id.toString())}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <MapPin className="w-5 h-5 mr-2 text-gray-600" />
                          <h4 className="font-semibold text-gray-800 text-base">
                            {address.title}
                          </h4>

                          {selectedAddressId === address.id.toString() && (
                            <ShieldCheck className="w-5 h-5 ml-2 text-green-600" />
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="text-gray-700 font-medium">
                            {address.address}
                          </p>
                          <p>
                            {address.city}, {address.province} {address.postalCode}
                          </p>

                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Pulsante Aggiungi Nuovo Indirizzo */}
                {!showAddNewAddress ? (
                  <button
                    onClick={() => {
                      setAddressToEdit(null);
                      setNewAddressForm({ title: '', address: '', city: '', province: '', postalCode: '' });
                      setIsManageAddressesOpen(true);
                    }}
                    className="w-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 py-6 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    ➕ Aggiungi un nuovo indirizzo
                  </button>
                ) : (
                  /* Form Nuovo Indirizzo */
                  <div className="border-2 border-blue-300 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Nuovo Indirizzo
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="newTitle" className="text-sm font-medium">Titolo (es. Casa, Ufficio)</Label>
                        <Input
                          id="newTitle"
                          name="title"
                          value={newAddressForm.title}
                          onChange={handleNewAddressChange}
                          placeholder="Casa"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <AddressAutocomplete
                          label="Indirizzo"
                          placeholder="Inizia a digitare l'indirizzo..."
                          value={newAddressForm.address}
                          onChange={(value) => {
                            setNewAddressForm({
                              ...newAddressForm,
                              address: value
                            });
                          }}
                          onAddressSelect={(addressDetails) => {
                            setNewAddressForm({
                              ...newAddressForm,
                              address: addressDetails.address,
                              city: addressDetails.city,
                              province: addressDetails.province,
                              postalCode: addressDetails.postalCode
                            });
                          }}
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium">Città</Label>
                          <Input
                            placeholder="Inserisci la città"
                            value={newAddressForm.city}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Provincia</Label>
                          <Input
                            placeholder="Inserisci la provincia"
                            value={newAddressForm.province}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, province: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium">CAP</Label>
                          <Input
                            placeholder="Inserisci il CAP"
                            value={newAddressForm.postalCode}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, postalCode: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Paese</Label>
                          <Input
                            value="IT"
                            className="mt-1 bg-gray-100"
                            readOnly
                          />
                        </div>
                      </div>
                      

                      
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddNewAddress(false);
                            setNewAddressForm({ title: '', address: '', city: '', province: '', postalCode: '' });
                          }}
                          className="flex-1"
                        >
                          Annulla
                        </Button>
                        <Button
                          onClick={saveNewAddress}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Salva Indirizzo
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Dati Personali (collassabile su mobile) */}
            <div>
              {/* Header cliccabile su mobile */}
              <div 
                className="md:cursor-default cursor-pointer md:pointer-events-none"
                onClick={() => setIsPersonalDataOpen(!isPersonalDataOpen)}
              >
                <h3 className="font-semibold mb-4 flex items-center justify-between" style={{ color: '#1B5AAB' }}>
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Dati Personali
                    {arePersonalDataComplete() && (
                      <span className="ml-2 text-green-600 text-sm md:hidden">✓ Completi</span>
                    )}
                  </div>
                  <div className="md:hidden">
                    {isPersonalDataOpen ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </h3>
              </div>
              
              {/* Contenuto collassabile */}
              <div className={`${isPersonalDataOpen ? 'block' : 'hidden'} md:block`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onFocus={() => setIsEditingPersonalData(true)}
                    onBlur={() => setIsEditingPersonalData(false)}
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
                    onFocus={() => setIsEditingPersonalData(true)}
                    onBlur={() => setIsEditingPersonalData(false)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setIsEditingPersonalData(true)}
                    onBlur={() => setIsEditingPersonalData(false)}
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
                    onFocus={() => setIsEditingPersonalData(true)}
                    onBlur={() => setIsEditingPersonalData(false)}
                    className={!formData.phone?.trim() ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    required
                  />
                  {!formData.phone?.trim() && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <p className="text-sm text-red-700 font-medium">
                          Inserisci il numero di telefono per completare l'ordine
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Indirizzo di Fatturazione - SEZIONE NASCOSTA */}
              {false && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 flex items-center" style={{ color: '#1B5AAB' }}>
                    <Receipt className="w-5 h-5 mr-2" />
                    Indirizzo di Fatturazione
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Indirizzo *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Città *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Provincia *</Label>
                      <Input
                        id="province"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
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
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        );

      case 1: // DATA CONSEGNA
        // Determina la zona di consegna basata sull'indirizzo selezionato
        const getSelectedDeliveryZone = () => {
          if (selectedAddressId === 'main' && customer) {
            // Usa la zona determinata dal componente CheckoutMainAddressZone se disponibile
            if (mainAddressZone) {
              console.log('✅ Usando zona determinata dal CheckoutMainAddressZone:', mainAddressZone.name);
              return mainAddressZone;
            }
            
            // Fallback: usa l'indirizzo principale dell'account con indirizzo completo
            const addressObj = {
              city: customer.shipping?.city || customer.billing?.city || '',
              province: customer.shipping?.state || customer.billing?.state || '',
              postalCode: customer.shipping?.postcode || customer.billing?.postcode || '',
              address: customer.shipping?.address_1 || customer.billing?.address_1 || ''
            };
            
            // Prima prova con la determinazione diretta
            let detectedZone = determineZoneFromAddress(addressObj);
            
            // Se non trova la zona, prova con la geocodifica (sincrona per ora)
            if (!detectedZone && addressObj.address && addressObj.city) {
              // Per ora restituisce null, la geocodifica asincrona sarà gestita dal componente CheckoutMainAddressZone
              console.log('⚠️ Zona non trovata per indirizzo principale, sarà determinata asincronamente');
            }
            
            return detectedZone;
          } else {
            // Usa l'indirizzo salvato selezionato
            const selectedAddress = savedAddresses.find(addr => addr.id.toString() === selectedAddressId);
            if (selectedAddress && selectedAddress.deliveryZone) {
              return getZoneById(selectedAddress.deliveryZone.id);
            } else if (selectedAddress) {
              // Calcola la zona se non è già salvata
              return determineZoneFromAddress({
                city: selectedAddress.city,
                province: selectedAddress.province,
                postalCode: selectedAddress.postalCode,
                address: selectedAddress.address
              });
            }
          }
          return null;
        };
        
        return (
          <DeliveryCalendar
            formData={{
              deliveryDate: formData.deliveryDate,
              deliveryTimeSlot: formData.deliveryTimeSlot
            }}
            onDateTimeChange={handleDateTimeChange}
            deliveryZone={getSelectedDeliveryZone()}
          />
        );

      case 2: // RIEPILOGO
        return (
          <div className="space-y-6">
            {/* Layout Desktop: Due colonne */}
            <div className="lg:grid lg:grid-cols-5 lg:gap-8 space-y-6 lg:space-y-0">
              {/* Colonna Sinistra - Informazioni principali */}
              <div className="lg:col-span-3 space-y-6">
                {/* Dati di spedizione */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center justify-between" style={{ color: '#1B5AAB' }}>
                    <div className="flex items-center">
                      <Truck className="w-5 h-5 mr-2" />
                      Indirizzo di Spedizione
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(0)}
                      className="text-xs px-3 py-1 border-[#1B5AAB] text-[#1B5AAB] hover:bg-[#1B5AAB] hover:text-white"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Cambia Indirizzo
                    </Button>
                  </h3>
                  
                  {/* Mostra solo l'indirizzo selezionato */}
                  <div className="bg-green-50 border-2 border-green-500 p-4 rounded-lg">
                    {selectedAddressId === 'main' && customer ? (
                      <div>
                        <h4 className="text-base font-semibold text-blue-800 mb-2 flex items-center">
                          <Home className="w-4 h-4 mr-2" />
                          Indirizzo dell'account
                          <ShieldCheck className="w-4 h-4 ml-2 text-green-600" />
                        </h4>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p><span className="font-medium">Via:</span> {customer.shipping?.address_1 || customer.billing?.address_1}</p>
                          <p><span className="font-medium">Città:</span> {customer.shipping?.city || customer.billing?.city}, {customer.shipping?.state || customer.billing?.state} {customer.shipping?.postcode || customer.billing?.postcode}</p>
                          <CheckoutMainAddressZone customer={customer} onZoneDetected={setMainAddressZone} />
                        </div>
                      </div>
                    ) : (
                      // Mostra l'indirizzo salvato selezionato
                      (() => {
                        const selectedAddress = savedAddresses.find(addr => addr.id.toString() === selectedAddressId);
                        if (selectedAddress) {
                          return (
                            <div>
                              <h4 className="text-base font-semibold text-blue-800 mb-2 flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                {selectedAddress.title}
                                <ShieldCheck className="w-4 h-4 ml-2 text-green-600" />
                              </h4>
                              <div className="space-y-1 text-sm text-gray-700">
                                <p><span className="font-medium">Via:</span> {selectedAddress.address}</p>
                                <p><span className="font-medium">Città:</span> {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}</p>
                                {(() => {
                                  // Prima prova con la zona salvata
                                  if (selectedAddress.deliveryZone) {
                                    const zone = getZoneById(selectedAddress.deliveryZone.id);
                                    if (zone) {
                                      return (
                                        <div className="flex items-center mt-2">
                                          <div 
                                            className="w-3 h-3 rounded-full mr-2" 
                                            style={{ backgroundColor: zone.color }}
                                          ></div>
                                          <span className="text-xs font-medium" style={{ color: zone.color }}>
                                            {zone.name}
                                          </span>
                                        </div>
                                      );
                                    }
                                  }
                                  
                                  // Fallback: calcola la zona dinamicamente
                                  const dynamicZone = determineZoneFromAddress({
                                    city: selectedAddress.city,
                                    province: selectedAddress.province,
                                    postalCode: selectedAddress.postalCode
                                  });
                                  
                                  return dynamicZone ? (
                                    <div className="flex items-center mt-2">
                                      <div 
                                        className="w-3 h-3 rounded-full mr-2" 
                                        style={{ backgroundColor: dynamicZone.color }}
                                      ></div>
                                      <span className="text-xs font-medium" style={{ color: dynamicZone.color }}>
                                        {dynamicZone.name}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center mt-2">
                                      <div className="w-3 h-3 rounded-full mr-2 bg-gray-400"></div>
                                      <span className="text-xs font-medium text-gray-500">
                                        Zona non identificata
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        }
                        
                        // Fallback se nessun indirizzo è selezionato
                        return (
                          <div className="text-center text-red-600">
                            <MapPin className="w-8 h-8 mx-auto mb-2" />
                            <p className="font-medium">Nessun indirizzo selezionato</p>
                            <p className="text-sm">Torna al primo step per selezionare un indirizzo</p>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Data e Orario di Consegna */}
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
                  <div className="bg-gray-50 p-2 md:p-3 rounded-lg space-y-1 md:space-y-2">
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
                <div className="hidden">
                  <h3 className="font-semibold mb-2 flex items-center" style={{ color: '#1B5AAB' }}>
                    <Package className="w-5 h-5 mr-2" />
                    Prodotti Ordinati
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {state.items.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-2"
                        style={{ 
                          borderColor: getBorderColor(item.category),
                          backgroundColor: `${getBorderColor(item.category)}10` // Sfondo leggero con opacità
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          {item.image && Array.isArray(item.image) && item.image.length > 0 && (
                            <img 
                              src={typeof item.image[0] === 'string' ? item.image[0] : (item.image[0] as any)?.src || ''} 
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
                  <h3 className="font-semibold mb-2 flex items-center" style={{ color: '#1B5AAB' }}>
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Note per l'ordine
                  </h3>
                  <div className="bg-gray-50 p-2 md:p-3 rounded-lg">
                    <Textarea
                      name="orderNotes"
                      value={formData.orderNotes}
                      onChange={handleInputChange}
                      placeholder="Inserisci eventuali note per l'ordine ( Cognome sul citofono , piano o istruzioni speciali, ecc.)"
                      className="min-h-[80px] resize-none border-2"
                      style={{ borderColor: '#CFA100' }}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      💡 Puoi utilizzare questo campo per comunicare informazioni aggiuntive come indirizzi di consegna temporanei o istruzioni speciali.
                    </p>
                  </div>
                </div>
              </div>

              {/* Colonna Destra - Riepilogo Costi (Sticky) */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-6">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-3 md:p-4 shadow-lg">
                    <h3 className="font-semibold mb-2 md:mb-3 flex items-center text-base md:text-lg" style={{ color: '#1B5AAB' }}>
                      <Receipt className="w-5 h-5 mr-2" />
                      Riepilogo Ordine
                    </h3>
                    
                    {/* Conteggio prodotti con controlli quantità */}
                    <div className="mb-3 p-2 md:p-3 bg-blue-50 rounded-lg">
                      <button
                        onClick={() => setShowProductDetails(!showProductDetails)}
                        className="w-full text-left text-sm text-blue-800 font-medium hover:text-blue-900 transition-colors flex items-center justify-between"
                      >
                        <span>{state.items.reduce((total, item) => total + item.quantity, 0)} prodotti nel carrello</span>
                        <span className="text-xs">{showProductDetails ? '▼' : '▶'}</span>
                      </button>
                      
                      {/* Dettagli prodotti espandibili con controlli quantità */}
                      {showProductDetails && (
                        <div className="mt-3 space-y-2 border-t border-blue-200 pt-3">
                          {state.items.map((item) => (
                            <div key={item.id} className="bg-white rounded border p-3">
                              {/* Riga superiore: Nome prodotto e prezzo unitario */}
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  {item.image && Array.isArray(item.image) && item.image.length > 0 && (
                                    <img 
                                      src={typeof item.image[0] === 'string' ? item.image[0] : (item.image[0] as any)?.src || ''} 
                                      alt={item.name}
                                      className="w-10 h-10 object-cover rounded flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                                    <p className="text-gray-600 text-xs">{item.price.toFixed(2)}€ cad.</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Riga inferiore: Controlli quantità e prezzo totale */}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center border rounded bg-gray-50">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-200 text-sm font-medium transition-colors"
                                    disabled={item.quantity <= 1}
                                  >
                                    -
                                  </button>
                                  <span className="px-4 py-1 text-sm font-semibold min-w-[40px] text-center bg-white border-x">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-200 text-sm font-medium transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900 text-base">
                                    {(item.price * item.quantity).toFixed(2)}€
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Totale parziale nella sezione espandibile */}
                          <div className="border-t pt-3 mt-3">
                            <div className="flex justify-between items-center text-sm font-semibold text-blue-800 bg-blue-50 p-3 rounded">
                              <span>Subtotale prodotti:</span>
                              <span className="text-base">{calculateSubtotal().toFixed(2)}€</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Totali */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotale:</span>
                        <span className="font-medium">{calculateSubtotal().toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Spedizione:</span>
                        <span className="text-green-600 font-medium">Gratuita</span>
                      </div>
                      {/* Commissione PayPal */}
                      {paymentMethod === 'paypal' && calculatePayPalFee() > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>Commissione PayPal:</span>
                          <span className="font-medium text-orange-600">+{calculatePayPalFee().toFixed(2)}€</span>
                        </div>
                      )}
                      {/* Commissione Stripe */}
                      {paymentMethod === 'stripe' && calculateStripeFee() > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>Commissione Stripe:</span>
                          <span className="font-medium text-blue-600">+{calculateStripeFee().toFixed(2)}€</span>
                        </div>
                      )}
                      <div className="border-t-2 pt-3 flex justify-between font-bold text-xl" style={{ color: '#A40800' }}>
                        <span>Totale:</span>
                        <span>{calculateTotal().toFixed(2)}€</span>
                      </div>
                    </div>

                    {/* Informazioni aggiuntive */}
                    <div className="mt-6 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ Spedizione gratuita inclusa
                      </p>
                      <p className="text-sm text-green-800 mt-1">
                        🚚 Consegna programmata
                      </p>
                    </div>
                  </div>
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
        // Card stile immagine + modale dettagli
        const paymentOptions = [
          {
            id: 'cod',
            emoji: '💵',
            title: 'Pagamento in contanti o POS',
            description: 'Paga in contanti o con carta alla consegna',
            animationData: cashAnimationData,
          },
          {
            id: 'stripe',
            emoji: '💳',
            title: 'Carta di Credito/Debito',
            description: 'Paga con Visa, Mastercard, American Express e altre carte',
            animationData: stripeAnimationData,
          },
          {
            id: 'paypal',
            emoji: '💙',
            title: 'PayPal',
            description: 'Paga in modo sicuro con il tuo account PayPal',
            animationData: paypalAnimationData,
          },
          {
            id: 'bacs',
            emoji: '🏦',
            title: 'Bonifico Bancario',
            description: 'Effettua un bonifico bancario',
            animationData: bankAnimationData,
          },
        ];
        
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><span>💳</span> Metodo di Pagamento</h2>
            <div className="space-y-3">
              {paymentOptions.map(option => (
                <div
                  key={option.id}
                  className={`flex items-center border rounded-xl px-3 py-3 bg-white shadow-sm cursor-pointer transition-all duration-150 ${paymentMethod === option.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  onClick={() => {
                    setPaymentMethod(option.id);
                    setOpenPaymentModal(option.id);
                  }}
                  style={{ fontSize: '1rem' }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === option.id}
                    onChange={() => {
                      setPaymentMethod(option.id);
                      setOpenPaymentModal(option.id);
                    }}
                    className="mr-3 w-4 h-4 accent-blue-600"
                  />
                  <div className="flex items-center flex-1">
                    {option.animationData ? (
                      <div className="mr-3">
                        <LottieAnimation
                          animationData={option.animationData}
                          width={40}
                          height={40}
                          loop={true}
                          autoplay={true}
                          className="drop-shadow-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-2xl mr-3">{option.emoji}</span>
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold text-base">{option.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Modale dettagli pagamento */}
            <Dialog open={!!openPaymentModal} onOpenChange={val => !val && setOpenPaymentModal(null)}>
              <DialogContent className="max-w-sm sm:max-w-lg mx-auto rounded-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                    {(() => {
                      const currentOption = paymentOptions.find(opt => opt.id === openPaymentModal);
                      return currentOption?.animationData ? (
                        <LottieAnimation 
                          animationData={currentOption.animationData} 
                          width={32} 
                          height={32} 
                          loop={true} 
                          autoplay={true}
                        />
                      ) : (
                        currentOption?.emoji
                      );
                    })()}
                    {paymentOptions.find(opt => opt.id === openPaymentModal)?.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm sm:text-base text-gray-700 mt-2">
                    {paymentOptions.find(opt => opt.id === openPaymentModal)?.description}
                  </DialogDescription>
                </DialogHeader>
                {/* Sezione carte salvate rimossa per semplificare l'applicazione */}
                {openPaymentModal === 'saved_card' && (
                  <div className="mt-4">
                    <p className="text-gray-600 text-center py-8">
                      La funzionalità delle carte salvate è stata rimossa per semplificare l'applicazione.
                      Utilizza i metodi di pagamento disponibili.
                    </p>
                  </div>
                )}
                {openPaymentModal === 'paypal' && (
                  <div className="mt-4">
                    {/* Accordion per commissioni PayPal */}
                    <div className="mb-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="paypal-commission" className="border border-orange-200 rounded-lg bg-orange-50">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center space-x-2">
                              <span className="text-orange-500 text-lg">⚠️</span>
                              <span className="font-semibold text-orange-800 text-sm">Commissioni PayPal</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <p className="text-orange-700 text-xs mb-3">
                              Utilizzando PayPal verranno applicate delle piccole commissioni che verranno aggiunte al totale dell'ordine.
                            </p>
                            
                            {/* Riepilogo totale con commissione */}
                            <div className="p-3 bg-white rounded border border-orange-100">
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Totale ordine:</span>
                                  <span className="font-medium">€{(calculateSubtotal() + calculateShipping()).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Commissione PayPal:</span>
                                  <span className="font-medium">€{calculatePayPalFee().toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-1 mt-2">
                                  <div className="flex justify-between">
                                    <span className="font-semibold text-orange-800">Totale da pagare:</span>
                                    <span className="font-bold text-orange-800">€{calculateTotal().toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                    <PayPalNativeCheckout
                      amount={calculateTotal()}
                      currency="EUR"
                      env="production"
                      billingAddress={{
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        address: formData.address,
                        city: formData.city,
                        province: formData.province,
                        postalCode: formData.postalCode,
                        country: 'IT',
                        email: formData.email,
                        phone: formData.phone
                      }}
                      onSuccess={async (details) => {
                        await createOrderAndNavigate(details);
                      }}
                      onError={(err) => {
                        toast({
                          title: "Errore PayPal",
                          description: "Si è verificato un errore con PayPal. Riprova.",
                          variant: "destructive"
                        });
                      }}
                      onCancel={() => {
                        toast({
                          title: "Pagamento annullato",
                          description: "Hai annullato il pagamento PayPal.",
                          variant: "default"
                        });
                      }}
                    />
                  </div>
                )}
                {openPaymentModal === 'bacs' && (
                  <div className="mt-4">
                    <div className="bg-yellow-50 rounded-lg p-4 mb-3">
                      <h4 className="font-bold text-lg mb-2" style={{ color: '#8B5C2A' }}>Bonifico Bancario</h4>
                      <div className="space-y-1 text-base">
                        <div><span className="font-semibold">Importo totale:</span> €{calculateTotal().toFixed(2)}</div>
                        <div><span className="font-semibold">Beneficiario:</span> Imperatore Pietro</div>
                        <div><span className="font-semibold">IBAN:</span> IT53U0306904013100000018868</div>
                        <div><span className="font-semibold">Banca:</span> Intesa SanPaolo</div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <span className="font-semibold text-blue-700">Istruzioni:</span> Effettua il bonifico utilizzando i dati bancari forniti. Inserisci il numero dell'ordine come causale.
                    </div>
                    <Button className="w-full text-lg py-3 flex items-center justify-center" onClick={async () => { setIsProcessing(true); await createOrderAndNavigate(); setIsProcessing(false); }} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                      Conferma Ordine con Bonifico
                    </Button>
                  </div>
                )}
                {openPaymentModal === 'cod' && (
                  <div className="mt-4">
                    <div className="bg-green-50 rounded-lg p-3 sm:p-4 mb-3">
                      <h4 className="font-bold text-base sm:text-lg mb-2" style={{ color: '#256029' }}>Pagamento alla Consegna</h4>
                      <div className="space-y-1 text-sm sm:text-base">
                        <div><span className="font-semibold">Importo totale:</span> €{calculateTotal().toFixed(2)}</div>
                        <div><span className="font-semibold">Modalità:</span> Contanti o POS</div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <span className="font-semibold text-blue-700 text-sm sm:text-base">Istruzioni:</span> 
                      <span className="text-sm sm:text-base"> Paga in contanti o con POS al momento della consegna.</span>
                    </div>
                    <Button className="w-full text-sm sm:text-lg py-2 sm:py-3 flex items-center justify-center" onClick={async () => { setIsProcessing(true); await createOrderAndNavigate(); setIsProcessing(false); }} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" /> : null}
                      Conferma Ordine con Pagamento alla consegna
                    </Button>
                  </div>
                )}
                {openPaymentModal === 'stripe' && (
                  <div className="mt-4">
                    {/* Accordion per commissioni Stripe */}
                    <div className="mb-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="stripe-commission" className="border border-blue-200 rounded-lg bg-blue-50">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-500 text-lg">⚠️</span>
                              <span className="font-semibold text-blue-800 text-sm">Commissioni Stripe</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <p className="text-blue-700 text-xs mb-3">
                              Utilizzando Stripe verranno applicate delle piccole commissioni che verranno aggiunte al totale dell'ordine.
                            </p>
                            
                            {/* Riepilogo totale con commissione */}
                            <div className="p-3 bg-white rounded border border-blue-100">
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Totale ordine:</span>
                                  <span className="font-medium">€{(calculateSubtotal() + calculateShipping()).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Commissione Stripe:</span>
                                  <span className="font-medium">€{calculateStripeFee().toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-1 mt-2">
                                  <div className="flex justify-between">
                                    <span className="font-semibold text-blue-800">Totale da pagare:</span>
                                    <span className="font-bold text-blue-800">€{calculateTotal().toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                    <StripeCheckout
                      amount={calculateTotal()}
                      currency="EUR"
                      customerId={effectiveCustomerId?.toString()}
                      billingAddress={{
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        address: formData.address,
                        city: formData.city,
                        province: formData.province,
                        postalCode: formData.postalCode,
                        country: 'IT',
                        email: formData.email,
                        phone: formData.phone
                      }}
                      onSuccess={async (paymentIntent) => {
                        await createOrderAndNavigate(paymentIntent);
                      }}
                      onError={(error) => {
                        toast({
                          title: "Errore Pagamento",
                          description: "Si è verificato un errore durante il pagamento con carta.",
                          variant: "destructive"
                        });
                      }}
                      onCancel={() => {
                        setOpenPaymentModal(null);
                      }}
                    />
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
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
  
  // Aggiungi questa funzione per aggiornare le quantità
  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: productId });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity: newQuantity } });
    }
  };
  
  const calculateShipping = () => {
    // Spedizione sempre gratuita
    return 0;
  };
  
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    let fee = 0;
    
    // Calcola commissione PayPal se selezionato
    if (paymentMethod === 'paypal') {
      fee = parseFloat(((subtotal * 0.035) + 0.30).toFixed(2));
    }
    
    // Calcola commissione Stripe se selezionato
    if (paymentMethod === 'stripe') {
      fee = parseFloat(((subtotal * 0.035) + 0.30).toFixed(2));
    }
       
    // Debug: log del calcolo finale
    const finalTotal = parseFloat((subtotal + shipping + fee).toFixed(2));
    console.log('calculateTotal - Debug finale:', {
      paymentMethod,
      subtotal,
      shipping,
      fee,
      finalTotal
    });
    
    // Round final total to 2 decimal places
    return finalTotal; 
  };

  // Funzione per calcolare solo la commissione PayPal
  const calculatePayPalFee = () => {
    if (paymentMethod === 'paypal') {
      const subtotal = calculateSubtotal();
      return parseFloat(((subtotal * 0.035) + 0.30).toFixed(2));
    }
    return 0;
  };

  // Funzione per calcolare solo la commissione Stripe
  const calculateStripeFee = () => {
    if (paymentMethod === 'stripe') {
      const subtotal = calculateSubtotal();
      return parseFloat(((subtotal * 0.035) + 0.30).toFixed(2));
    }
    return 0;
  };

  // Funzione per creare l'ordine (estratta per essere usata anche da PayPal)
  const createOrderAndNavigate = async (paymentDetails?: any) => {
    setIsProcessing(true);
    
    try {
      // Determina quale indirizzo usare per la spedizione
      let shippingAddress;
      
      if (selectedAddressId === 'main') {
        // Usa l'indirizzo principale
        shippingAddress = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          state: formData.province,
          postcode: formData.postalCode,
          country: 'IT'
        };
      } else {
        // Usa l'indirizzo salvato selezionato
        const selectedAddress = savedAddresses.find(addr => addr.id.toString() === selectedAddressId);
        if (selectedAddress) {
          shippingAddress = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            address_1: selectedAddress.address,
            city: selectedAddress.city,
            state: selectedAddress.province,
            postcode: selectedAddress.postalCode,
            country: 'IT'
          };
        } else {
          // Fallback all'indirizzo principale se non trovato
          shippingAddress = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            address_1: formData.address,
            city: formData.city,
            state: formData.province,
            postcode: formData.postalCode,
            country: 'IT'
          };
        }
      }

      // USA L'INDIRIZZO DI SPEDIZIONE ANCHE COME INDIRIZZO DI FATTURAZIONE
      // Questo sostituisce temporaneamente l'indirizzo di fatturazione solo per questo ordine
      const billingAddress = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        address_1: shippingAddress.address_1,  // Usa l'indirizzo di spedizione
        city: shippingAddress.city,            // Usa la città di spedizione
        state: shippingAddress.state,          // Usa la provincia di spedizione
        postcode: shippingAddress.postcode,    // Usa il CAP di spedizione
        country: 'IT',
        email: formData.email,
        phone: formData.phone
      };

      // Calcola il totale con le commissioni
      const subtotal = calculateSubtotal();
      const shipping = calculateShipping();
      let fee = 0;
      if (paymentMethod === 'native_paypal') {
        fee = parseFloat(((subtotal * 0.015) + 0.50).toFixed(2));
      } else if (paymentMethod === 'native_stripe') {
        fee = parseFloat(((subtotal * 0.015) + 0.50).toFixed(2));
      } else if (paymentMethod === 'paypal') {
        fee = parseFloat(((subtotal * 0.035) + 0.30).toFixed(2));
      } else if (paymentMethod === 'stripe') {
        fee = parseFloat(((subtotal * 0.035) + 0.30).toFixed(2));
      }
      const totalWithFees = parseFloat((subtotal + shipping + fee).toFixed(2));

      const orderData = {
        customer_id: effectiveCustomerId,
        payment_method: paymentMethod,
        payment_method_title: paymentMethod === 'cod' ? 'Pagamento in contanti o POS' : paymentMethod === 'bacs' ? 'Bonifico Bancario' : (filteredPaymentGateways.find(g => g.id === paymentMethod)?.title || paymentMethod),
        set_paid: false,
        billing: billingAddress,   // Ora usa l'indirizzo di spedizione
        shipping: shippingAddress, // Usa l'indirizzo di spedizione corretto
        total: totalWithFees.toFixed(2), // Aggiungi il totale con le commissioni
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
          },
          // Aggiungi secondo indirizzo se presente
          ...(useSecondAddress ? [{
            key: 'Secondo Indirizzo',
            value: `${secondAddressData.address}, ${secondAddressData.city}, ${secondAddressData.province} ${secondAddressData.postalCode}`
          }] : [])
        ],
        // Aggiungi transaction_id se il pagamento è PayPal e i dettagli sono disponibili
        ...(paymentMethod === 'paypal' && paymentDetails && paymentDetails.purchase_units && paymentDetails.purchase_units[0]?.payments?.captures[0]?.id && {
          transaction_id: paymentDetails.purchase_units[0].payments.captures[0].id
        })
      };

      // DEBUG: Verifica i valori di consegna prima della creazione dell'ordine
      console.log('=== DEBUG VALORI CONSEGNA ===');
      console.log('formData.deliveryDate:', formData.deliveryDate);
      console.log('formData.deliveryTimeSlot:', formData.deliveryTimeSlot);
      console.log('orderData.meta_data:', JSON.stringify(orderData.meta_data, null, 2));
      console.log('orderData completo:', JSON.stringify(orderData, null, 2));

      const createdOrder = await createOrder(orderData);
      dispatch({ type: 'CLEAR_CART' });
      toast({
          title: "Successo",
          description: "Ordine creato con successo!",
          variant: "default"
        });
      navigate('/order-success', {
        state: {
          orderNumber: createdOrder.number,
          orderId: createdOrder.id,
          total: createdOrder.total
        }
      });
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine:', error);
      toast({
          title: "Errore",
          description: "Errore nella creazione dell'ordine. Riprova.",
          variant: "destructive"
        });
    } finally {
      setIsProcessing(false);
    }
  };


  // Modifica handleSubmit per gestire correttamente tutti i metodi di pagamento
  const handleSubmit = async () => {
    if (!validateAllSteps()) {
      toast({
        title: "Errore",
        description: "Completa tutti i campi obbligatori",
        variant: "destructive"
      });
      return;
    }

    if (state.items.length === 0) {
      toast({
        title: "Errore",
        description: "Il carrello è vuoto",
        variant: "destructive"
      });
      return;
    }

    // Verifica che sia stato selezionato un metodo di pagamento
    if (!paymentMethod) {
      toast({
        title: "Errore",
        description: "Seleziona un metodo di pagamento",
        variant: "destructive"
      });
      return;
    }

    // Per metodi di pagamento che richiedono elaborazione immediata (cod, bacs)
    if (['cod', 'bacs'].includes(paymentMethod)) {
      await createOrderAndNavigate();
    } else {
      // Fallback per altri metodi
      await createOrderAndNavigate();
    }
  };

  // Funzione per determinare se mostrare il pulsante "Completa Ordine"
  const shouldShowCompleteOrderButton = () => {
    // Nascondi sempre il pulsante "Conferma Ordine (Pagamento alla Consegna)"
    return false;
  };

  // Funzione per confrontare i dati personali attuali con quelli originali
  const hasPersonalDataChanged = () => {
    const currentData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone
    };
    
    return (
      currentData.firstName !== originalCustomerData.firstName ||
      currentData.lastName !== originalCustomerData.lastName ||
      currentData.email !== originalCustomerData.email ||
      currentData.phone !== originalCustomerData.phone
    );
  };

  // Funzione per salvare automaticamente i dati personali
  const savePersonalData = async () => {
    if (!authState.isAuthenticated || !authState.user?.id) {
      console.log('Utente non autenticato, salto il salvataggio automatico');
      return;
    }

    // Controlla se i dati sono effettivamente cambiati
    if (!hasPersonalDataChanged()) {
      console.log('=== SALVATAGGIO SALTATO ===');
      console.log('I dati personali non sono cambiati, salto il salvataggio su WooCommerce');
      return;
    }

    try {
      console.log('=== SALVATAGGIO AUTOMATICO DATI PERSONALI ===');
      console.log('Dati originali:', originalCustomerData);
      console.log('Dati attuali:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      });

      await updateCustomer.mutateAsync({
        id: authState.user.id,
        customerData: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          billing: {
            ...customer?.billing,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone
          },
          shipping: {
            ...customer?.shipping,
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      // Aggiorna i dati originali dopo il salvataggio riuscito
      setOriginalCustomerData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      });

      console.log('Dati personali salvati automaticamente con successo');
      toast({
          title: "Successo",
          description: "Dati personali aggiornati automaticamente!",
          variant: "default"
        });
    } catch (error) {
      console.error('Errore nel salvataggio automatico dei dati personali:', error);
      // Non mostrare errore all'utente per non interrompere il flusso
    }
  };

  // Funzioni di navigazione - ALL'INTERNO DEL COMPONENTE
  const nextStep = async () => {
    if (currentStep === steps.length - 1) {
      // Se siamo all'ultimo step (Pagamento), chiama handleSubmit
      handleSubmit();
    } else if (currentStep < steps.length - 1) {
      // Validazione specifica per il campo telefono nel primo step
      if (currentStep === 0 && !formData.phone.trim()) {
        toast({
          title: "Campo obbligatorio",
          description: "Il numero di telefono è obbligatorio per completare l'ordine.",
          variant: "destructive",
        });
        return;
      }
      
      if (validateStep(currentStep)) {
        setIsNextStepLoading(true);
        
        try {
          // Se siamo nel primo step (Indirizzo), salva automaticamente i dati personali
          if (currentStep === 0) {
            await savePersonalData();
          }
          
          // Se siamo nel riepilogo (step 2) e mancano data o fascia oraria, torna al calendario
          if (currentStep === 2 && (!formData.deliveryDate || !formData.deliveryTimeSlot)) {
              setCurrentStep(1); // Torna al calendario
              return;
          }
          
          // Aggiungi un piccolo delay per mostrare il loading
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setCurrentStep(currentStep + 1);
        } finally {
          setIsNextStepLoading(false);
        }
      }
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
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      
      {/* Contenuto direttamente sotto l'header */}

      {/* Titolo rimosso completamente */}

      {/* Tab Navigation - Posizionata direttamente sotto l'header */}
      <div className="fixed top-[114px] md:top-[120px] lg:top-[162px] left-0 right-0 bg-white shadow-md z-40">
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

      {/* Contenuto direttamente sotto la barra di navigazione */}

      {/* Step Content */}
      <div className="max-w-4xl mx-auto pb-32 md:pb-28 lg:pb-32 pt-20 md:pt-18 lg:pt-20">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3">
            <CardTitle className="flex items-center text-base font-bold text-[#1B5AAB]">
              {React.createElement(steps[currentStep].icon, { className: "w-5 h-5 mr-2" })}
              {steps[currentStep].name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons - fissi sopra la nav bar mobile */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 md:p-3 z-50">
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
                disabled={!validateStep(currentStep) || isNextStepLoading}
                className="px-6 py-2 text-sm gradient-primary"
              >
                {isNextStepLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  currentStep === 0 ? 'Continua' : 'Continua'
                )}
              </Button>
            ) : (
              shouldShowCompleteOrderButton() && (
                <Button
                  onClick={calculateTotal() === 0 ? () => navigate('/prodotti') : handleSubmit}
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
                    paymentMethod === 'cod' ? `Conferma Ordine (Pagamento alla Consegna) - ${calculateTotal().toFixed(2)}€` :
                    paymentMethod === 'bacs' ? `Conferma Ordine (Bonifico Bancario) - ${calculateTotal().toFixed(2)}€` :
                    `Conferma Ordine - ${calculateTotal().toFixed(2)}€`
                  )}
                </Button>
              )
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
              <DialogDescription>
                Modifica le informazioni del tuo indirizzo di consegna.
              </DialogDescription>
            </DialogHeader>
            <EditAddress 
              customer={customer} 
              onClose={() => setIsEditAddressOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* MODALE PER MODIFICA INDIRIZZI */}
      <Dialog open={isManageAddressesOpen} onOpenChange={setIsManageAddressesOpen}>
        <DialogContent className="max-w-lg mx-auto rounded-2xl shadow-2xl border-0 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="flex items-center text-lg sm:text-xl font-bold text-gray-800">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mr-2" style={{ color: '#1B5AAB' }} />
              {addressToEdit ? 'Modifica Indirizzo' : 'Nuovo Indirizzo'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {addressToEdit ? 'Modifica i dettagli del tuo indirizzo.' : 'Aggiungi un nuovo indirizzo.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 sm:space-y-3">
            <div>
              <Label htmlFor="editTitle" className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Titolo (es. Casa, Ufficio)</Label>
              <Input
                id="editTitle"
                name="title"
                value={newAddressForm.title}
                onChange={handleNewAddressChange}
                placeholder="Casa"
                className={`h-8 sm:h-9 focus:ring-[#1B5AAB] rounded-md text-[#1B5AAB] placeholder:text-[#1B5AAB]/60 selection:bg-[#1B5AAB]/20 text-sm ${
                  fieldErrors.address 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-[#1B5AAB]'
                }`}
              />
            </div>
            
            <div>
              <AddressAutocomplete
                label="Indirizzo"
                placeholder="Inizia a digitare l'indirizzo..."
                value={newAddressForm.address}
                onChange={(value) => {
                  setNewAddressForm({
                    ...newAddressForm,
                    address: value
                  });
                }}
                onAddressSelect={(addressDetails) => {
                  setNewAddressForm({
                    ...newAddressForm,
                    address: addressDetails.address,
                    city: addressDetails.city,
                    province: addressDetails.province,
                    postalCode: addressDetails.postalCode
                  });
                }}
                error={fieldErrors.address}
                required
                focusTargetId="save-address-button"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Città</Label>
                <Input
                  placeholder="Inserisci la città"
                  value={newAddressForm.city}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Provincia</Label>
                <Input
                  placeholder="Inserisci la provincia"
                  value={newAddressForm.province}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, province: e.target.value })}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">CAP</Label>
                <Input
                  placeholder="Inserisci il CAP"
                  value={newAddressForm.postalCode}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, postalCode: e.target.value })}
                  className={`h-8 sm:h-9 rounded-md text-sm ${fieldErrors.postalCode ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#1B5AAB]'}`}
                  required
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Paese</Label>
                <Input
                  value="IT"
                  className="h-8 sm:h-9 bg-gray-50 border-gray-200 text-gray-500 rounded-md text-sm"
                  readOnly
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsManageAddressesOpen(false);
                  setAddressToEdit(null);
                  setNewAddressForm({ title: '', address: '', city: '', province: '', postalCode: '' });
                }}
                className="flex-1 h-8 sm:h-9 border-2 border-gray-300 text-gray-700 hover:bg-[#A40800] hover:text-white hover:border-[#A40800] transition-all duration-200 rounded-md font-medium text-sm"
              >
                Annulla
              </Button>
              <Button
                id="save-address-button"
                onClick={async () => {
                  // Reset errori precedenti
                  setFieldErrors({});
                  
                  // Controlla campi obbligatori
                  const errors: {[key: string]: boolean} = {};
                  if (!newAddressForm.address) errors.address = true;
                  if (!newAddressForm.city) errors.city = true;
                  if (!newAddressForm.province) errors.province = true;
                  if (!newAddressForm.postalCode) errors.postalCode = true;
                  
                  if (Object.keys(errors).length > 0) {
                    setFieldErrors(errors);
                    toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori evidenziati in rosso",
        variant: "destructive"
      });
                    return;
                  }
                  
                  setIsSavingAddress(true);
                  
                  try {
                    if (addressToEdit) {
                      if (addressToEdit === 'main') {
                        // Modifica indirizzo principale del customer
                        await updateCustomer.mutateAsync({
                          id: effectiveCustomerId!,
                          customerData: {
                            shipping: {
                              first_name: customer?.first_name || '',
                              last_name: customer?.last_name || '',
                              company: '',
                              address_1: newAddressForm.address,
                              address_2: '',
                              city: newAddressForm.city,
                              state: newAddressForm.province,
                              postcode: newAddressForm.postalCode,
                              country: 'IT'
                            },
                            billing: {
                              first_name: customer?.first_name || '',
                              last_name: customer?.last_name || '',
                              company: '',
                              address_1: newAddressForm.address,
                              address_2: '',
                              city: newAddressForm.city,
                              state: newAddressForm.province,
                              postcode: newAddressForm.postalCode,
                              country: 'IT',
                              email: customer?.email || '',
                              phone: customer?.billing?.phone || ''
                            }
                          }
                        });
                        toast({
          title: "Successo",
          description: "Indirizzo principale aggiornato!",
          variant: "default"
        });
                      } else {
                        // Modifica indirizzo salvato esistente
                        const updatedData = {
                          title: newAddressForm.title || savedAddresses.find(addr => addr.id === addressToEdit)?.title,
                          address: newAddressForm.address,
                          city: newAddressForm.city,
                          province: newAddressForm.province,
                          postalCode: newAddressForm.postalCode,
                    
                        };
                        
                        await updateExistingAddress(addressToEdit.toString(), updatedData);
                      }
                    } else {
                      // Nuovo indirizzo - usa la funzione saveNewAddress con debug
                      await saveNewAddress();
                    }
                    
                    setIsManageAddressesOpen(false);
                    setAddressToEdit(null);
                    setNewAddressForm({ title: '', address: '', city: '', province: '', postalCode: '' });
                  } catch (error) {
                    console.error('Errore nel salvataggio:', error);
                    toast({
              title: "Errore",
              description: "Errore nel salvataggio dell'indirizzo",
              variant: "destructive"
            });
                  } finally {
                    setIsSavingAddress(false);
                  }
                }}
                disabled={isSavingAddress}
                className="flex-1 h-8 sm:h-9 bg-[#1B5AAB] hover:bg-[#164a94] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-md font-medium shadow-lg hover:shadow-xl text-sm"
              >
                {isSavingAddress ? (
                  <div className="flex items-center justify-center gap-1">
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden sm:inline">Salvando...</span>
                    <span className="sm:hidden">...</span>
                  </div>
                ) : (
                   <>
                     <span className="hidden sm:inline">{addressToEdit ? 'Salva Modifiche' : 'Salva Indirizzo'}</span>
                     <span className="sm:hidden">{addressToEdit ? 'Salva' : 'Salva'}</span>
                   </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Funzioni helper che NON usano state - FUORI DAL COMPONENTE
const getMainDescription = (gateway: any) => {
  switch (gateway.id) {
    case 'cod':
      return 'Pagamento in contanti o POS.';
    case 'bacs':
      return 'Bonifico bancario.';
    case 'paypal':
      return 'Paga facilmente e in sicurezza con il tuo account PayPal.';
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