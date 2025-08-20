import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { wooCommerceService } from '../services/woocommerce';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { User, Mail, Eye, EyeOff, Loader2, ArrowLeft, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import AddressAutocomplete from './AddressAutocomplete';

interface RegisterProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    province: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { setUser } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Pulisci l'errore quando l'utente inizia a digitare
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('Il nome è obbligatorio');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Il cognome è obbligatorio');
      return false;
    }
    if (!formData.email.trim()) {
      setError('L\'email è obbligatoria');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Inserisci un indirizzo email valido');
      return false;
    }
    if (!formData.password) {
      setError('La password è obbligatoria');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Crea il nuovo cliente
      const newCustomer = await wooCommerceService.createCustomer({
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        password: formData.password,
        billing: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address_1: formData.address,
          city: formData.city,
          postcode: formData.postalCode,
          state: formData.province,
          country: 'IT'
        },
        shipping: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          postcode: formData.postalCode,
          state: formData.province,
          country: 'IT'
        }
      });

      toast.success('Account creato con successo!');
      
      // Effettua automaticamente il login dopo la registrazione
      try {
        const loginResult = await wooCommerceService.loginWithCredential(formData.email, 'email');
        if (loginResult.success && loginResult.customer) {
          setUser({
            id: loginResult.customer.id,
            email: loginResult.customer.email,
            firstName: loginResult.customer.first_name,
            lastName: loginResult.customer.last_name,
            username: loginResult.customer.username,
            billing: loginResult.customer.billing,
            shipping: loginResult.customer.shipping
          });
          
          toast.success('Accesso effettuato automaticamente!');
          onSuccess?.();
        } else {
          toast.success('Account creato! Ora puoi effettuare l\'accesso.');
          onSwitchToLogin?.();
        }
      } catch (loginError) {
        console.error('Errore nel login automatico:', loginError);
        toast.success('Account creato! Ora puoi effettuare l\'accesso.');
        onSwitchToLogin?.();
      }
    } catch (error: any) {
      console.error('Errore nella registrazione:', error);
      setError(error.message || 'Errore durante la registrazione. Riprova.');
      toast.error('Errore durante la registrazione');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-[#1B5AAB]">
          Crea Account
        </CardTitle>
        <CardDescription className="text-center">
          Registrati per iniziare a fare acquisti
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome e Cognome */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Mario"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Cognome *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Rossi"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="mario.rossi@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Telefono */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="123 456 7890"
                value={formData.phone}
                onChange={handleInputChange}
                className="pl-10"
              />
            </div>
          </div>

          {/* Indirizzo */}
          <AddressAutocomplete
            label="Indirizzo"
            placeholder="Via Roma 123"
            value={formData.address}
            onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
            onAddressSelect={(addressData) => {
              setFormData(prev => ({
                ...prev,
                address: addressData.address,
                city: addressData.city,
                province: addressData.province,
                postalCode: addressData.postalCode
              }));
            }}
            focusTargetId="city"
          />

          {/* Città e CAP */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Città</Label>
              <Input
                id="city"
                name="city"
                type="text"
                placeholder="Milano"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">CAP</Label>
              <Input
                id="postalCode"
                name="postalCode"
                type="text"
                placeholder="20100"
                value={formData.postalCode}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Provincia */}
          <div className="space-y-2">
            <Label htmlFor="province">Provincia</Label>
            <Input
              id="province"
              name="province"
              type="text"
              placeholder="MI"
              value={formData.province}
              onChange={handleInputChange}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Almeno 6 caratteri"
                value={formData.password}
                onChange={handleInputChange}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Conferma Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Conferma Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Ripeti la password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full bg-[#1B5AAB] hover:bg-[#164A9A]" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creazione account...
              </>
            ) : (
              'Crea Account'
            )}
          </Button>

          {onSwitchToLogin && (
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={onSwitchToLogin}
                className="text-[#1B5AAB] hover:text-[#164A9A]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Hai già un account? Accedi
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default Register;