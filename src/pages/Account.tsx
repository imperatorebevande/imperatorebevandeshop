
import React from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, MapPin, Package, Heart, Settings, LogOut, Loader2 } from 'lucide-react';
import { useWooCommerceCustomer, useWooCommerceCustomerOrders } from '@/hooks/useWooCommerce';
import { toast } from 'sonner';

const Account = () => {
  // Per ora usiamo l'ID cliente 1 - in un'app reale questo verrebbe dall'autenticazione
  const customerId = 1;
  
  const { 
    data: customer, 
    isLoading: customerLoading, 
    error: customerError 
  } = useWooCommerceCustomer(customerId);
  
  const { 
    data: orders = [], 
    isLoading: ordersLoading, 
    error: ordersError 
  } = useWooCommerceCustomerOrders(customerId, { per_page: 5 });

  if (customerError || ordersError) {
    toast.error('Errore nel caricamento dei dati del cliente');
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatPrice = (price: string) => {
    return `€${parseFloat(price).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Il Mio Account</h1>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Info */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informazioni Profilo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customerLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Caricamento dati...
                  </div>
                ) : customer ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome
                      </label>
                      <p className="text-gray-900">
                        {customer.first_name} {customer.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900">{customer.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <p className="text-gray-900">{customer.username}</p>
                    </div>
                    {customer.billing.phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefono
                        </label>
                        <p className="text-gray-900">{customer.billing.phone}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente dal
                      </label>
                      <p className="text-gray-900">{formatDate(customer.date_created)}</p>
                    </div>
                    <Button variant="outline" className="mt-4">
                      Modifica Profilo
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Dati cliente non trovati</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Azioni Rapide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start">
                    <Package className="w-4 h-4 mr-2" />
                    I Miei Ordini
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Heart className="w-4 h-4 mr-2" />
                    Lista Desideri
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <MapPin className="w-4 h-4 mr-2" />
                    Indirizzi
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Impostazioni
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Address Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Indirizzo di Consegna
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerLoading ? (
                <div className="flex items-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Caricamento indirizzo...
                </div>
              ) : customer && (customer.shipping.address_1 || customer.billing.address_1) ? (
                <div className="space-y-2">
                  <p className="font-medium">
                    {customer.shipping.address_1 ? 'Indirizzo di Spedizione' : 'Indirizzo di Fatturazione'}
                  </p>
                  <p className="text-gray-600">
                    {customer.shipping.address_1 || customer.billing.address_1}
                  </p>
                  {(customer.shipping.address_2 || customer.billing.address_2) && (
                    <p className="text-gray-600">
                      {customer.shipping.address_2 || customer.billing.address_2}
                    </p>
                  )}
                  <p className="text-gray-600">
                    {(customer.shipping.postcode || customer.billing.postcode)} {' '}
                    {(customer.shipping.city || customer.billing.city)} {' '}
                    {(customer.shipping.state || customer.billing.state) && `(${customer.shipping.state || customer.billing.state})`}
                  </p>
                  <p className="text-gray-600">
                    {customer.shipping.country || customer.billing.country}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Modifica Indirizzo
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nessun indirizzo configurato</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Aggiungi Indirizzo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Ordini Recenti
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Caricamento ordini...
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Ordine #{order.number}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.date_created)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(order.total)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{order.line_items.length} prodotto{order.line_items.length > 1 ? 'i' : ''}</p>
                        {order.line_items.slice(0, 2).map((item, index) => (
                          <span key={item.id}>
                            {item.name}
                            {index < Math.min(order.line_items.length, 2) - 1 && ', '}
                          </span>
                        ))}
                        {order.line_items.length > 2 && ` e altri ${order.line_items.length - 2}...`}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-4">
                    Vedi Tutti gli Ordini
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nessun ordine trovato</p>
                  <p className="text-sm">I tuoi ordini appariranno qui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;

