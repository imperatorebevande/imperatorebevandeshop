import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { wooCommerceService } from '../services/woocommerce';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

const PhoneLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { setUser } = useAuth();

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidEmail(email)) {
      setError('Inserisci un indirizzo email valido');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const loginResult = await wooCommerceService.loginWithCredential(email, 'email');
      
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
        setError('Email non trovata');
      }
    } catch (error) {
      console.error('Errore durante il login:', error);
      setError('Errore durante il login. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-5 w-5" />
          Accesso con Email
        </CardTitle>
        <CardDescription>
          Inserisci la tua email per accedere
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Indirizzo Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder="Inserisci la tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            disabled={loading || !email.trim()}
          >
            {loading ? 'Accesso in corso...' : 'Accedi con Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PhoneLogin;