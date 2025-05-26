
import React from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, MapPin, Package, Heart, Settings, LogOut } from 'lucide-react';

const Account = () => {
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <p className="text-gray-900">Mario Rossi</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">mario.rossi@example.com</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefono
                    </label>
                    <p className="text-gray-900">+39 123 456 7890</p>
                  </div>
                  <Button variant="outline" className="mt-4">
                    Modifica Profilo
                  </Button>
                </div>
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
              <div className="space-y-2">
                <p className="font-medium">Indirizzo Principale</p>
                <p className="text-gray-600">Via Roma 123</p>
                <p className="text-gray-600">70121 Bari (BA)</p>
                <p className="text-gray-600">Italia</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Modifica Indirizzo
                </Button>
              </div>
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
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessun ordine trovato</p>
                <p className="text-sm">I tuoi ordini appariranno qui</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;
