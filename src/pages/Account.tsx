
import React, { useState, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { User, MapPin, Package, Heart, Settings, LogOut, Loader2, Eye, EyeOff, Edit, Trash2, Plus, Key, CreditCard } from 'lucide-react';
import { useWooCommerceCustomer, useWooCommerceCustomerOrders, useWooCommerceCustomerByEmail, useUpdateWooCommerceCustomer } from '@/hooks/useWooCommerce';
import { wooCommerceService } from '@/services/woocommerce';
import { toast } from 'sonner'; // This is the one we keep
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EditProfile from '@/components/EditProfile';
import EditAddress from '@/components/EditAddress';
import OrderDetails from '@/components/OrderDetails';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
// Remove this line:
// import { woocommerceService } from '../services/woocommerceService';

// And change this line:
import { WooCommerceOrder } from '../services/woocommerce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { determineZoneFromAddress, getZoneById, determineZoneFromCoordinates } from '@/config/deliveryZones';
import { geocodeAddress } from '@/services/geocoding';
// import { toast } from 'sonner'; // Rimuovi questa importazione duplicata
import Login from './Login'; // Modificato da LoginPage a Login
import AddressAutocomplete from '@/components/AddressAutocomplete';


// Componente per la zona di consegna dell'indirizzo principale
const MainAddressZone: React.FC<{ customer: any }> = ({ customer }) => {
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
        
        const addressString = `${addressObj.address}, ${addressObj.city}, ${addressObj.province} ${addressObj.postalCode}`;
        
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
    <div className="flex items-center mt-2">
      <div className="w-3 h-3 rounded-full mr-2 bg-gray-400"></div>
      <span className="text-xs font-medium text-gray-500">
        Zona non identificata - Debug: {addressString}
      </span>
    </div>
  );
};

const Account: React.FC = () => {
  const { authState, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WooCommerceOrder | null>(null);
  const [searchCompleted, setSearchCompleted] = useState(false);
  
  // Add these missing state declarations:
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isNewAddressDialogOpen, setIsNewAddressDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [isEditSavedAddressOpen, setIsEditSavedAddressOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<any>(null);
  const [newAddressForm, setNewAddressForm] = useState({
    title: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notes: ''
  });

  // Stati per il cambio password
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Stato per il salvataggio degli indirizzi
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Determina l'ID del cliente dall'auth
  const authCustomerId = authState?.user?.id && authState.user.id > 0 ? authState.user.id : null;
  
  // Solo se non abbiamo un ID valido E abbiamo un'email, cerca per email
  const shouldSearchByEmail = !authCustomerId && !!authState?.user?.email && !searchCompleted;
  
  // Query per cercare per email - SOLO se necessario
  const { data: customerByEmail, isLoading: isLoadingByEmail } = useWooCommerceCustomerByEmail(
    authState?.user?.email || '',
    { 
      enabled: shouldSearchByEmail && !!authState?.isAuthenticated
    }
  );

  // Determina l'ID effettivo del cliente
  const effectiveCustomerId = useMemo(() => {
    if (authCustomerId) return authCustomerId;
    if (customerByEmail && customerByEmail.length > 0) {
      return customerByEmail[0].id;
    }
    return null;
  }, [authCustomerId, customerByEmail]);

  // Query per i dati del cliente - SOLO se abbiamo un ID valido
  const { data: customer, isLoading: isLoadingCustomer, error: customerError } = useWooCommerceCustomer(
    effectiveCustomerId || 0,
    { 
      enabled: !!effectiveCustomerId && effectiveCustomerId > 0 && !!authState?.isAuthenticated
    }
  );
  
  const { data: orders, isLoading: isLoadingOrders, error: ordersError } = useWooCommerceCustomerOrders(
    effectiveCustomerId || 0,
    { per_page: 5 },
    { 
      enabled: !!effectiveCustomerId && effectiveCustomerId > 0 && !!authState?.isAuthenticated
    }
  );

  const updateCustomer = useUpdateWooCommerceCustomer();

  // Effetto per marcare la ricerca come completata
  useEffect(() => {
    if (!shouldSearchByEmail || (shouldSearchByEmail && !isLoadingByEmail)) {
      setSearchCompleted(true);
    }
  }, [shouldSearchByEmail, isLoadingByEmail]);

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
                // Preserva tutti i meta_data esistenti e aggiorna solo saved_addresses
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

  // Funzione per gestire i cambiamenti nel form nuovo indirizzo
  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Funzione per salvare nuovo indirizzo
  const saveNewAddress = async () => {
    if (!newAddressForm.address || !newAddressForm.city || !newAddressForm.province || !newAddressForm.postalCode) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }
    
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
      notes: newAddressForm.notes,
      coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : undefined,
      deliveryZone: deliveryZone ? {
        id: deliveryZone.id,
        name: deliveryZone.name,
        color: deliveryZone.color
      } : null
    };
    
    // Mostra un messaggio informativo sulla zona assegnata
    if (deliveryZone) {
      toast.success(`Indirizzo assegnato alla ${deliveryZone.name}`);
    } else {
      toast.warning('Zona di consegna non determinata automaticamente');
    }
    
    const updatedAddresses = [...savedAddresses, newAddress];
    setSavedAddresses(updatedAddresses);
    
    // Salva in WooCommerce
    if (effectiveCustomerId && authState.isAuthenticated) {
      try {
        await updateCustomer.mutateAsync({
          id: effectiveCustomerId,
          customerData: {
            meta_data: [
              {
                key: 'saved_addresses',
                value: JSON.stringify(updatedAddresses)
              }
            ]
          }
        });
        
        toast.success('Indirizzo salvato con successo!');
        setIsNewAddressDialogOpen(false);
        setNewAddressForm({
          title: '',
          address: '',
          city: '',
          province: '',
          postalCode: '',
          notes: ''
        });
      } catch (error) {
        console.error('Errore nel salvataggio dell\'indirizzo:', error);
        toast.error('Errore nel salvataggio dell\'indirizzo');
      }
    }
  };

  // Funzione per eliminare un indirizzo
  const deleteAddress = async (addressId: number) => {
    const updatedAddresses = savedAddresses.filter((addr: any) => addr.id !== addressId);
    setSavedAddresses(updatedAddresses);
    
    // Aggiorna in WooCommerce
    if (effectiveCustomerId && authState.isAuthenticated) {
      try {
        await updateCustomer.mutateAsync({
          id: effectiveCustomerId,
          customerData: {
            meta_data: [
              {
                key: 'saved_addresses',
                value: JSON.stringify(updatedAddresses)
              }
            ]
          }
        });
        
        toast.success('Indirizzo eliminato con successo!');
      } catch (error) {
        console.error('Errore nell\'eliminazione dell\'indirizzo:', error);
        toast.error('Errore nell\'eliminazione dell\'indirizzo');
      }
    }
  };

  // Funzione per modificare un indirizzo esistente
  const updateExistingAddress = async (addressId: number, updatedData: any) => {
    // Ricalcola la zona di consegna se sono stati modificati città, provincia, CAP o indirizzo
    let finalUpdatedData = { ...updatedData };
    
    if (updatedData.city || updatedData.province || updatedData.postalCode || updatedData.address) {
      const currentAddress = savedAddresses.find((addr: any) => addr.id === addressId);
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
          toast.success(`Indirizzo aggiornato e assegnato alla ${deliveryZone.name}`);
        } else {
          toast.warning('Zona di consegna non determinata per l\'indirizzo aggiornato');
        }
      }
    }
    
    const updatedAddresses = savedAddresses.map((addr: any) => 
      addr.id === addressId ? { ...addr, ...finalUpdatedData } : addr
    );
    
    setSavedAddresses(updatedAddresses);
    
    // Aggiorna in WooCommerce
    if (effectiveCustomerId && authState.isAuthenticated && customer) {
      try {
        // Pulisci gli indirizzi prima della serializzazione
        const cleanedAddresses = updatedAddresses.map(addr => ({
          id: addr.id,
          title: addr.title || '',
          address: addr.address || '',
          city: addr.city || '',
          province: addr.province || '',
          postalCode: addr.postalCode || '',
          notes: addr.notes || '',
          coordinates: addr.coordinates || null,
          deliveryZone: addr.deliveryZone || null
        }));
        
        // Preserva tutti i meta_data esistenti e aggiorna solo saved_addresses
        const existingMetaData = customer?.meta_data || [];
        const updatedMetaData = existingMetaData.filter((meta: any) => meta.key !== 'saved_addresses');
        
        // Verifica che la serializzazione JSON sia valida
        const addressesJson = JSON.stringify(cleanedAddresses);
        JSON.parse(addressesJson); // Test di validazione
        
        updatedMetaData.push({
          key: 'saved_addresses',
          value: addressesJson
        });
        
        await updateCustomer.mutateAsync({
          id: effectiveCustomerId,
          customerData: {
            meta_data: updatedMetaData
          }
        });
        
        toast.success('Indirizzo aggiornato con successo!');
        setEditingAddressId(null);
      } catch (error) {
        console.error('Errore nell\'aggiornamento dell\'indirizzo:', error);
        toast.error('Errore nell\'aggiornamento dell\'indirizzo');
      }
    }
  };

  // Funzioni per il cambio password
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const changePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('La password deve essere di almeno 6 caratteri');
      return;
    }

    setIsChangingPassword(true);

    try {
      if (effectiveCustomerId && authState.isAuthenticated) {
        // Utilizza il nuovo metodo changePassword del servizio WooCommerce
        const result = await wooCommerceService.changePassword(effectiveCustomerId, passwordForm.newPassword);
        
        if (result.success) {
          toast.success(result.message);
          setPasswordForm({
            newPassword: '',
            confirmPassword: ''
          });
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('Errore nel cambio password:', error);
      toast.error('Errore nell\'invio della richiesta');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Verifica che authState esista
  if (!authState) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inizializzazione...</p>
        </div>
      </div>
    );
  }

  // Se non siamo autenticati, mostra subito la pagina di login
  if (!authState.isAuthenticated) {
    return <Login />;
  }

  // Stati di loading
  if (isLoadingByEmail) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ricerca profilo cliente...</p>
        </div>
      </div>
    );
  }

  if (effectiveCustomerId && isLoadingCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dati account...</p>
        </div>
      </div>
    );
  }

  // Se non troviamo un customer ID valido DOPO aver completato la ricerca
  if (!effectiveCustomerId && searchCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profilo Temporaneo</h2>
          <p className="text-gray-600 mb-4">Benvenuto, {authState.user?.email}</p>
          <p className="text-sm text-gray-500 mb-6">Il tuo account non è ancora collegato a un profilo WooCommerce.</p>
          <button 
            onClick={logout}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Se non abbiamo un ID e non dobbiamo cercare per email
  if (!effectiveCustomerId && !shouldSearchByEmail) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profilo Non Trovato</h2>
          <p className="text-gray-600 mb-4">Benvenuto, {authState.user?.email}</p>
          <p className="text-sm text-gray-500 mb-6">Non è possibile trovare il tuo profilo WooCommerce.</p>
          <button 
            onClick={logout}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Fallback: se non abbiamo un customer ID e la ricerca è completata
  if (!effectiveCustomerId && searchCompleted && !isLoadingByEmail) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profilo Non Trovato</h2>
          <p className="text-gray-600 mb-4">Benvenuto, {authState.user?.email}</p>
          <p className="text-sm text-gray-500 mb-6">Non è stato possibile trovare il tuo profilo WooCommerce.</p>
          <button 
            onClick={logout}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Se stiamo ancora caricando, mostra il loading
  if (isLoadingByEmail || isLoadingCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoadingByEmail ? 'Ricerca profilo cliente...' : 'Caricamento dati account...'}
          </p>
        </div>
      </div>
    );
  }
  
  // FUNZIONI HELPER
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatPrice = (price: string) => {
    return `${parseFloat(price).toFixed(2)}€`;
  };

  const handleLogout = () => {
    logout();
    toast.success('Logout effettuato con successo!');
  };

  const handleOrderClick = (order: WooCommerceOrder) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  // RETURN PRINCIPALE DEL COMPONENTE
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#1B5AAB]">Il Mio Account</h1>
            <Button 
              onClick={handleLogout}
              style={{ backgroundColor: '#A40800' }}
              className="text-white flex items-center gap-2 px-4 py-2 rounded-md hover:opacity-90"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b">
            {[
              { id: 'profile', label: 'Profilo', icon: User },
              { id: 'orders', label: 'Ordini', icon: Package },
              { id: 'address', label: 'Indirizzo', icon: MapPin },
              { id: 'payments', label: 'Pagamenti', icon: CreditCard },
              { id: 'settings', label: 'Impostazioni', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#1B5AAB] text-white border-b-2 border-[#1B5AAB]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#1B5AAB]">
                      <User className="w-5 h-5" />
                      Informazioni Profilo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customer ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Nome</label>
                            <p className="text-lg">{customer.first_name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Cognome</label>
                            <p className="text-lg">{customer.last_name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Email</label>
                            <p className="text-lg">{customer.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Data registrazione</label>
                            <p className="text-lg">{formatDate(customer.date_created)}</p>
                          </div>
                        </div>
                        <Button onClick={() => setIsEditProfileOpen(true)} className="mt-4">
                          Modifica Profilo
                        </Button>
                      </div>
                    ) : (
                      <p>Caricamento dati profilo...</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'orders' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#1B5AAB]">
                      <Package className="w-5 h-5" />
                      I Miei Ordini
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingOrders ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : orders && orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map(order => (
                          <div 
                            key={order.id} 
                            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleOrderClick(order)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">Ordine #{order.number}</h3>
                                <p className="text-sm text-gray-600">{formatDate(order.date_created)}</p>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <div>
                                  <p className="font-semibold">{formatPrice(order.total)}</p>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                </div>
                                <Eye className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {order.line_items.map(item => (
                                <div key={item.id}>
                                  {item.name} x {item.quantity}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-gray-500">Nessun ordine trovato</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'address' && (
                <div className="space-y-6">
                  {/* Indirizzo principale */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#1B5AAB]">
                        <MapPin className="w-5 h-5" />
                        Indirizzo Principale
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {customer?.shipping ? (
                        <div className="space-y-2">
                          <p>{customer.shipping.first_name} {customer.shipping.last_name}</p>
                          <p>{customer.shipping.address_1}</p>
                          <p>{customer.shipping.postcode} {customer.shipping.city}</p>
                          <p>{customer.shipping.state}, {customer.shipping.country}</p>
                          
                          {/* Zona di consegna */}
                          <MainAddressZone customer={customer} />
                          
                          <Button onClick={() => setIsEditAddressOpen(true)} className="mt-4">
                            Modifica Indirizzo Principale
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-500 mb-4">Nessun indirizzo di spedizione configurato</p>
                          <Button onClick={() => setIsEditAddressOpen(true)}>
                            Aggiungi Indirizzo Principale
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Indirizzi salvati */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2 text-[#1B5AAB]">
                          <MapPin className="w-5 h-5" />
                          Altri indirizzi di Consegna
                        </CardTitle>
                        <Button
                        onClick={() => setIsNewAddressDialogOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        Aggiungi Indirizzo
                      </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {savedAddresses.length > 0 ? (
                        <div className="space-y-4">
                          {savedAddresses.map((address: any) => (
                            <div key={address.id} className="border-2 rounded-lg p-4" style={{ borderColor: address.deliveryZone?.color || '#d1d5db' }}>
                              {editingAddressId === address.id ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor={`edit-title-${address.id}`}>Titolo</Label>
                                      <Input
                                        id={`edit-title-${address.id}`}
                                        value={address.title}
                                        onChange={(e) => {
                                          const updatedAddresses = savedAddresses.map((addr: any) => 
                                            addr.id === address.id ? { ...addr, title: e.target.value } : addr
                                          );
                                          setSavedAddresses(updatedAddresses);
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`edit-address-${address.id}`}>Indirizzo *</Label>
                                      <Input
                                        id={`edit-address-${address.id}`}
                                        value={address.address}
                                        onChange={(e) => {
                                          const updatedAddresses = savedAddresses.map((addr: any) => 
                                            addr.id === address.id ? { ...addr, address: e.target.value } : addr
                                          );
                                          setSavedAddresses(updatedAddresses);
                                        }}
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`edit-city-${address.id}`}>Città *</Label>
                                      <Input
                                        id={`edit-city-${address.id}`}
                                        value={address.city}
                                        onChange={(e) => {
                                          const updatedAddresses = savedAddresses.map((addr: any) => 
                                            addr.id === address.id ? { ...addr, city: e.target.value } : addr
                                          );
                                          setSavedAddresses(updatedAddresses);
                                        }}
                                        placeholder="Inserisci la città"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`edit-province-${address.id}`}>Provincia *</Label>
                                      <Input
                                        id={`edit-province-${address.id}`}
                                        value={address.province}
                                        onChange={(e) => {
                                          const updatedAddresses = savedAddresses.map((addr: any) => 
                                            addr.id === address.id ? { ...addr, province: e.target.value } : addr
                                          );
                                          setSavedAddresses(updatedAddresses);
                                        }}
                                        placeholder="Inserisci la provincia"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`edit-postal-${address.id}`}>CAP *</Label>
                                      <Input
                                        id={`edit-postal-${address.id}`}
                                        value={address.postalCode}
                                        onChange={(e) => {
                                          const updatedAddresses = savedAddresses.map((addr: any) => 
                                            addr.id === address.id ? { ...addr, postalCode: e.target.value } : addr
                                          );
                                          setSavedAddresses(updatedAddresses);
                                        }}
                                        placeholder="Inserisci il CAP"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`edit-notes-${address.id}`}>Note</Label>
                                      <Input
                                        id={`edit-notes-${address.id}`}
                                        value={address.notes || ''}
                                        onChange={(e) => {
                                          const updatedAddresses = savedAddresses.map((addr: any) => 
                                            addr.id === address.id ? { ...addr, notes: e.target.value } : addr
                                          );
                                          setSavedAddresses(updatedAddresses);
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={() => updateExistingAddress(address.id, address)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Salva
                                    </Button>
                                    <Button 
                                      onClick={() => setEditingAddressId(null)}
                                      variant="outline"
                                    >
                                      Annulla
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-lg">{address.title}</h3>
                                      </div>
                                      <p className="text-gray-600">{address.address}</p>
                                      <p className="text-gray-600">{address.postalCode} {address.city}, {address.province}</p>
                                      {address.notes && (
                                        <p className="text-sm text-gray-500 mt-1">Note: {address.notes}</p>
                                      )}

                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => {
                                          setAddressToEdit(address);
                                          setNewAddressForm({
                                            title: address.title,
                                            address: address.address,
                                            city: address.city,
                                            province: address.province,
                                            postalCode: address.postalCode,
                                            notes: address.notes || ''
                                          });
                                          setIsEditSavedAddressOpen(true);
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1"
                                      >
                                        <Edit className="w-4 h-4" />
                                        Modifica
                                      </Button>
                                      <Button
                                        onClick={() => deleteAddress(address.id)}
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Elimina
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-8 text-gray-500">Nessun indirizzo salvato</p>
                      )}


                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'settings' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#1B5AAB]">
                      <Settings className="w-5 h-5" />
                      Impostazioni Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Sezione Cambio Password */}
                      <div className="border rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Key className="w-5 h-5 text-[#1B5AAB]" />
                          <h3 className="text-lg font-semibold text-[#1B5AAB]">Cambia Password</h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                              Nuova Password *
                            </Label>
                            <div className="relative mt-1">
                              <Input
                                id="newPassword"
                                name="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="Inserisci la nuova password (min. 6 caratteri)"
                                className="pr-10"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                              >
                                {showNewPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                              Conferma Nuova Password *
                            </Label>
                            <div className="relative mt-1">
                              <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="Conferma la nuova password"
                                className="pr-10"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <Button
                            onClick={changePassword}
                            disabled={isChangingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                            className="bg-[#1B5AAB] hover:bg-[#164a94] text-white"
                          >
                            {isChangingPassword ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Elaborazione...
                              </>
                            ) : (
                              'Cambia Password'
                            )}
                          </Button>
                        </div>
                        <div className="mt-4 p-3 bg-green-50 rounded-md">
                          <p className="text-sm text-green-700">
                            <strong>Nota:</strong> Essendo già autenticato, puoi cambiare direttamente la password senza inserire quella attuale.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'payments' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#1B5AAB]">
                      <CreditCard className="w-5 h-5" />
                      Metodi di Pagamento
                    </CardTitle>
                    <CardDescription>
                      La gestione delle carte salvate è stata rimossa per semplificare l'applicazione
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      I pagamenti vengono ora gestiti direttamente durante il checkout senza salvare le carte.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#1B5AAB]">Riepilogo Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Benvenuto,</p>
                    <p className="font-semibold">{customer?.first_name} {customer?.last_name}</p>
                    <p className="text-sm text-gray-600">{customer?.email}</p>
                  </div>
                </CardContent>
              </Card>

              {orders && orders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#1B5AAB]">Ultimo Ordine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-semibold">#{orders[0].number}</p>
                      <p className="text-sm text-gray-600">{formatDate(orders[0].date_created)}</p>
                      <p className="font-semibold">{formatPrice(orders[0].total)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {/* Dialogs */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Modifica Profilo</DialogTitle>
            <DialogDescription>
              Aggiorna le informazioni del tuo profilo utente.
            </DialogDescription>
          </DialogHeader>
          <EditProfile 
            customer={customer} 
            onClose={() => setIsEditProfileOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditAddressOpen} onOpenChange={setIsEditAddressOpen}>
        <DialogContent className="max-w-sm mx-2 sm:mx-4 rounded-xl shadow-2xl border-0 max-h-[85vh] overflow-y-auto backdrop-blur-sm">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="flex items-center text-lg sm:text-xl font-bold text-gray-800">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mr-2" style={{ color: '#1B5AAB' }} />
              Modifica Indirizzo
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Modifica le informazioni del tuo indirizzo di consegna.
            </DialogDescription>
          </DialogHeader>
          <EditAddress 
            customer={customer} 
            onClose={() => setIsEditAddressOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="max-w-4xl backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Dettagli Ordine</DialogTitle>
            <DialogDescription>
              Visualizza i dettagli completi del tuo ordine.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <OrderDetails 
              order={selectedOrder}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* MODALE PER NUOVO INDIRIZZO */}
      <Dialog open={isNewAddressDialogOpen} onOpenChange={setIsNewAddressDialogOpen}>
        <DialogContent className="max-w-sm mx-2 sm:mx-4 rounded-xl shadow-2xl border-0 max-h-[85vh] overflow-y-auto backdrop-blur-sm">
          <DialogHeader className="space-y-1 sm:space-y-2 pb-3 sm:pb-4">
            <DialogTitle className="flex items-center text-lg sm:text-xl font-bold text-[#1B5AAB]">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mr-2" style={{ color: '#1B5AAB' }} />
              Nuovo Indirizzo
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Aggiungi un nuovo indirizzo per le tue consegne future.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 sm:space-y-3 pt-2">
            <div>
              <Label htmlFor="newTitle" className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">
                Titolo (es. Casa, Ufficio)
              </Label>
              <Input
                id="newTitle"
                name="title"
                value={newAddressForm.title}
                onChange={handleNewAddressChange}
                placeholder="Casa"
                className="h-8 sm:h-9 border border-[#1B5AAB] rounded-md focus:border-[#1B5AAB] focus:ring-1 focus:ring-[#1B5AAB]/20 transition-all duration-200 text-[#1B5AAB] placeholder:text-[#1B5AAB]/60 selection:bg-[#1B5AAB]/20 text-xs sm:text-sm"
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
                className="text-xs sm:text-sm"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Città *</Label>
                <Input
                  value={newAddressForm.city}
                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Inserisci la Città"
                  className="text-xs sm:text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Provincia *</Label>
                <Input
                  value={newAddressForm.province}
                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, province: e.target.value }))}
                  placeholder="Inserisci la Provincia"
                  className="text-xs sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">CAP *</Label>
                <Input
                  value={newAddressForm.postalCode}
                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="Inserisci il Cap"
                  className="text-xs sm:text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Paese</Label>
                <Input
                  value="IT"
                  className="h-8 sm:h-9 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed text-xs sm:text-sm"
                  readOnly
                />
              </div>
            </div>
            
            <div className="flex gap-2 sm:gap-3 pt-4 sm:pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewAddressDialogOpen(false);
                  setNewAddressForm({
                    title: '',
                    address: '',
                    city: '',
                    province: '',
                    postalCode: '',
                    notes: ''
                  });
                }}
                className="flex-1 h-8 sm:h-9 border border-[#1B5AAB] text-[#1B5AAB] hover:bg-[#1B5AAB] hover:text-white rounded-md font-medium transition-all duration-200 text-xs sm:text-sm"
              >
                Annulla
              </Button>
              <Button
                onClick={saveNewAddress}
                className="flex-1 h-8 sm:h-9 bg-[#1B5AAB] hover:bg-[#164a94] text-white rounded-md font-medium transition-all duration-200 shadow-sm hover:shadow-md text-xs sm:text-sm"
              >
                Salva Indirizzo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal for editing saved addresses - Same as Checkout */}
      <Dialog open={isEditSavedAddressOpen} onOpenChange={setIsEditSavedAddressOpen}>
        <DialogContent className="max-w-sm mx-2 sm:mx-4 rounded-xl shadow-2xl border-0 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="flex items-center text-lg sm:text-xl font-bold text-gray-800">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mr-2" style={{ color: '#1B5AAB' }} />
              Modifica Indirizzo
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Modifica i dettagli del tuo indirizzo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 sm:space-y-3">
            <div>
              <Label htmlFor="editTitle" className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Titolo (es. Casa, Ufficio)</Label>
              <Input
                id="editTitle"
                name="title"
                value={newAddressForm.title}
                onChange={(e) => setNewAddressForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Casa"
                className="h-8 sm:h-9 focus:ring-[#1B5AAB] rounded-md text-[#1B5AAB] placeholder:text-[#1B5AAB]/60 selection:bg-[#1B5AAB]/20 text-sm border-gray-300 focus:border-[#1B5AAB]"
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
                required
                focusTargetId="save-address-button"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Città *</Label>
                <Input
                  value={newAddressForm.city}
                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Inserisci la Città"
                  required
                />
              </div>
              
              <div>
                <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Provincia *</Label>
                <Input
                  value={newAddressForm.province}
                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, province: e.target.value }))}
                  placeholder="Inserisci la Provincia"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">CAP *</Label>
                <Input
                  value={newAddressForm.postalCode}
                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="Inserisci il Cap"
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
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditSavedAddressOpen(false);
                setAddressToEdit(null);
                setNewAddressForm({
                  title: '',
                  address: '',
                  city: '',
                  province: '',
                  postalCode: '',
                  notes: ''
                });
              }}
              className="flex-1 h-8 sm:h-9 border-2 border-gray-300 text-gray-700 hover:bg-[#A40800] hover:text-white hover:border-[#A40800] transition-all duration-200 rounded-md font-medium text-sm"
            >
              Annulla
            </Button>
            <Button
               onClick={async () => {
                 // Valida i campi obbligatori
                 if (!newAddressForm.address || !newAddressForm.city || !newAddressForm.province || !newAddressForm.postalCode) {
                   toast.error('Compila tutti i campi obbligatori');
                   return;
                 }
                 
                 setIsSavingAddress(true);
                 
                 try {
                   // Ottieni le coordinate dell'indirizzo
                   const coordinates = await geocodeAddress({
                     address: newAddressForm.address,
                     city: newAddressForm.city,
                     province: newAddressForm.province,
                     postalCode: newAddressForm.postalCode
                   });
                   
                   // Determina automaticamente la zona di consegna
                   const deliveryZone = determineZoneFromAddress({
                     city: newAddressForm.city,
                     province: newAddressForm.province,
                     postalCode: newAddressForm.postalCode,
                     coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : undefined
                   });
                   
                   const updatedData = {
                     title: newAddressForm.title || addressToEdit?.title,
                     address: newAddressForm.address,
                     city: newAddressForm.city,
                     province: newAddressForm.province,
                     postalCode: newAddressForm.postalCode,
                     notes: newAddressForm.notes,
                     coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : undefined,
                     deliveryZone: deliveryZone ? {
                       id: deliveryZone.id,
                       name: deliveryZone.name,
                       color: deliveryZone.color
                     } : null
                   };
                   
                   const updatedAddresses = savedAddresses.map(addr => 
                     addr.id === addressToEdit?.id ? { ...addr, ...updatedData } : addr
                   );
                   
                   // Aggiorna in WooCommerce se l'utente è autenticato
                   if (customer && authState.isAuthenticated) {
                     try {
                       // Pulisci gli indirizzi prima della serializzazione
                       const cleanedAddresses = updatedAddresses.map(addr => ({
                         id: addr.id,
                         title: addr.title || '',
                         address: addr.address || '',
                         city: addr.city || '',
                         province: addr.province || '',
                         postalCode: addr.postalCode || '',
                         notes: addr.notes || '',
                         coordinates: addr.coordinates || null,
                         deliveryZone: addr.deliveryZone || null
                       }));
                       
                       const existingMetaData = customer?.meta_data || [];
                       const updatedMetaData = existingMetaData.filter((meta: any) => meta.key !== 'saved_addresses');
                       
                       // Verifica che la serializzazione JSON sia valida
                       const addressesJson = JSON.stringify(cleanedAddresses);
                       JSON.parse(addressesJson); // Test di validazione
                       
                       updatedMetaData.push({
                         key: 'saved_addresses',
                         value: addressesJson
                       });
                       
                       await updateCustomer.mutateAsync({
                         id: customer.id,
                         customerData: {
                           meta_data: updatedMetaData
                         }
                       });
                     } catch (error) {
                       console.error('Errore nella serializzazione degli indirizzi:', error);
                       toast.error('Errore nel salvataggio dell\'indirizzo');
                       return;
                     }
                   }
                   
                   setSavedAddresses(updatedAddresses);
                   setIsEditSavedAddressOpen(false);
                   setAddressToEdit(null);
                   
                   if (deliveryZone) {
                     toast.success(`Indirizzo aggiornato e assegnato alla ${deliveryZone.name}`);
                   } else {
                     toast.success('Indirizzo modificato con successo!');
                   }
                 } catch (error) {
                   console.error('Errore nel salvataggio:', error);
                   toast.error('Errore nel salvataggio dell\'indirizzo');
                 } finally {
                   setIsSavingAddress(false);
                 }
               }}
                id="save-address-button"
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
                  'Salva Modifiche'
                )}
              </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Account;