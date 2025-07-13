import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { wooCommerceService } from '../services/woocommerce';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Phone, Mail, User, CheckCircle, AlertCircle } from 'lucide-react';

type LoginType = 'phone' | 'email' | 'userId';

const PhoneLogin: React.FC = () => {
  const [credential, setCredential] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<LoginType>('phone');
  const { setUser } = useAuth();

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9]?[0-9]{7,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidUserId = (userId: string): boolean => {
    const id = parseInt(userId);
    return !isNaN(id) && id > 0;
  };

  const validateCredential = (): boolean => {
    switch (activeTab) {
      case 'phone':
        if (!isValidPhone(credential)) {
          setError('Inserisci un numero di telefono valido');
          return false;
        }
        break;
      case 'email':
        if (!isValidEmail(credential)) {
          setError('Inserisci un indirizzo email valido');
          return false;
        }
        break;
      case 'userId':
        if (!isValidUserId(credential)) {
          setError('Inserisci un ID utente valido (solo numeri)');
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCredential()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const loginResult = await wooCommerceService.loginWithCredential(credential, activeTab);
      
      if (loginResult.success && loginResult.customer) {
        const userData = {
          id: loginResult.customer.id,
          email: loginResult.customer.email,
          firstName: loginResult.customer.first_name,
          lastName: loginResult.customer.last_name,
          username: loginResult.customer.username || loginResult.customer.email,
          billing: loginResult.customer.billing,
          shipping: loginResult.customer.shipping
        };
        
        // Se abbiamo un token JWT, salvalo
        if (loginResult.token) {
          localStorage.setItem('jwtToken', loginResult.token);
        }
        
        setUser(userData);
        setSuccess('Login effettuato con successo!');
        
        // Reindirizza dopo un breve delay
        setTimeout(() => {
          window.location.href = '/account';
        }, 1000);
      } else {
        const errorMessages = {
          phone: 'Numero di telefono non trovato',
          email: 'Email non trovata',
          userId: 'ID utente non trovato'
        };
        setError(errorMessages[activeTab]);
      }
    } catch (error) {
      console.error('Errore durante il login:', error);
      setError('Errore durante il login. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = (): string => {
    switch (activeTab) {
      case 'phone':
        return 'Inserisci il numero associato al tuo account';
      case 'email':
        return 'Inserisci la tua email';
      case 'userId':
        return 'Inserisci il tuo ID utente';
    }
  };

  const getIcon = () => {
    switch (activeTab) {
      case 'phone':
        return <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />;
      case 'email':
        return <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />;
      case 'userId':
        return <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />;
    }
  };

  const getInputType = (): string => {
    switch (activeTab) {
      case 'phone':
        return 'tel';
      case 'email':
        return 'email';
      case 'userId':
        return 'number';
    }
  };

  const getButtonText = (): string => {
    if (loading) return 'Accesso in corso...';
    
    switch (activeTab) {
      case 'phone':
        return 'Accedi con Telefono';
      case 'email':
        return 'Accedi con Email';
      case 'userId':
        return 'Accedi con ID Utente';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <User className="h-5 w-5" />
          Accesso Rapido
        </CardTitle>
        <CardDescription>
          Scegli il metodo di accesso che preferisci
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value as LoginType);
          setCredential('');
          setError('');
          setSuccess('');
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phone" className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Telefono</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="userId" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">ID</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="credential">
                  {activeTab === 'phone' && 'Numero di Telefono'}
                  {activeTab === 'email' && 'Indirizzo Email'}
                  {activeTab === 'userId' && 'ID Utente'}
                </Label>
                <div className="relative">
                  {getIcon()}
                  <Input
                    id="credential"
                    type={getInputType()}
                    placeholder={getPlaceholder()}
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !credential.trim()}
              >
                {getButtonText()}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PhoneLogin;