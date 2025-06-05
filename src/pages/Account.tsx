
import React, { useState, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, MapPin, Package, Heart, Settings, LogOut, Loader2 } from 'lucide-react';
import { useWooCommerceCustomer, useWooCommerceCustomerOrders, useWooCommerceCustomerByEmail } from '@/hooks/useWooCommerce';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EditProfile from '@/components/EditProfile';
import EditAddress from '@/components/EditAddress';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

const Account: React.FC = () => {
  const { authState, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);

  // Determina l'ID del cliente dall'auth
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
      enabled: !!effectiveCustomerId && effectiveCustomerId > 0 && !!authState?.isAuthenticated,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );
  
  const { data: orders, isLoading: isLoadingOrders, error: ordersError } = useWooCommerceCustomerOrders(
    effectiveCustomerId || 0,
    { per_page: 5 },
    { 
      enabled: !!effectiveCustomerId && effectiveCustomerId > 0 && !!authState?.isAuthenticated,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Effetto per marcare la ricerca come completata
  useEffect(() => {
    // Marca come completata se:
    // 1. Non dovremmo cercare per email (non abbiamo email o abbiamo già un ID)
    // 2. La ricerca per email è finita (con successo o errore)
    if (!shouldSearchByEmail || (shouldSearchByEmail && !isLoadingByEmail)) {
      setSearchCompleted(true);
    }
  }, [shouldSearchByEmail, isLoadingByEmail]);

  // NOW you can have conditional returns after all hooks are called
  // Verifica che authState esista
  if (!authState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inizializzazione...</p>
        </div>
      </div>
    );
  }

  // Se non siamo autenticati, mostra subito la pagina di login
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accesso Richiesto</h2>
          <p className="text-gray-600 mb-6">Devi effettuare l'accesso per visualizzare il tuo account.</p>
          <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Accedi
          </Link>
        </div>
      </div>
    );
  }

  // Stati di loading
  if (isLoadingByEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ricerca profilo cliente...</p>
        </div>
      </div>
    );
  }

  if (effectiveCustomerId && isLoadingCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
  return `€${parseFloat(price).toFixed(2)}`;
};

const handleLogout = () => {
  logout();
  toast.success('Logout effettuato con successo!');
};

// RETURN CONDIZIONALE DOPO TUTTI GLI HOOK
if (!authState.isAuthenticated) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Login />
        </div>
      </div>
    </div>
  );
}

// RETURN PRINCIPALE DEL COMPONENTE
return (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Il Mio Account</h1>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b">
          {[
            { id: 'profile', label: 'Profilo', icon: User },
            { id: 'orders', label: 'Ordini', icon: Package },
            { id: 'address', label: 'Indirizzo', icon: MapPin },
            { id: 'settings', label: 'Impostazioni', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white border-b-2 border-blue-600'
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
                  <CardTitle className="flex items-center gap-2">
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
                  <CardTitle className="flex items-center gap-2">
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
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">Ordine #{order.number}</h3>
                              <p className="text-sm text-gray-600">{formatDate(order.date_created)}</p>
                            </div>
                            <div className="text-right">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Indirizzo di Spedizione
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customer?.shipping ? (
                    <div className="space-y-2">
                      <p>{customer.shipping.first_name} {customer.shipping.last_name}</p>
                      <p>{customer.shipping.address_1}</p>
                      {customer.shipping.address_2 && <p>{customer.shipping.address_2}</p>}
                      <p>{customer.shipping.postcode} {customer.shipping.city}</p>
                      <p>{customer.shipping.state}, {customer.shipping.country}</p>
                      <Button onClick={() => setIsEditAddressOpen(true)} className="mt-4">
                        Modifica Indirizzo
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 mb-4">Nessun indirizzo di spedizione configurato</p>
                      <Button onClick={() => setIsEditAddressOpen(true)}>
                        Aggiungi Indirizzo
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Impostazioni Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={handleLogout}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Riepilogo Account</CardTitle>
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
                  <CardTitle>Ultimo Ordine</CardTitle>
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
    <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica Profilo</DialogTitle>
        </DialogHeader>
        <EditProfile 
          customer={customer} 
          onClose={() => setIsEditProfileOpen(false)}
        />
      </DialogContent>
    </Dialog>

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
  </div>
);

};

export default Account;