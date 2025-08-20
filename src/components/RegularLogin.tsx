import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { wooCommerceService } from '../services/woocommerce';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Mail, Eye, EyeOff, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface RegularLoginProps {
  onSuccess?: () => void;
  onSwitchToPhoneLogin?: () => void;
  onSwitchToRegister?: () => void;
}

const RegularLogin: React.FC<RegularLoginProps> = ({ onSuccess, onSwitchToPhoneLogin, onSwitchToRegister }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { login } = useAuth();

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!emailOrUsername.trim()) {
      setError('Inserisci email/username');
      setIsLoading(false);
      return;
    }

    // Validazione solo se sembra essere un'email
    if (emailOrUsername.includes('@') && !isValidEmail(emailOrUsername)) {
      setError('Inserisci un indirizzo email valido');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Inserisci la password');
      setIsLoading(false);
      return;
    }

    try {
      await login(emailOrUsername, password);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Errore durante il login:', err);
      setError('Email/username o password non validi');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsResetting(true);

    if (!resetEmail.trim()) {
      setError('Inserisci email');
      setIsResetting(false);
      return;
    }

    if (!isValidEmail(resetEmail)) {
      setError('Inserisci un indirizzo email valido');
      setIsResetting(false);
      return;
    }

    try {
      // Chiamata reale all'API per il reset password
      const result = await wooCommerceService.resetPassword(resetEmail);
      
      if (result.success) {
        toast.success(result.message + ' Controlla la tua casella di posta.');
        setIsPasswordReset(false);
        setResetEmail('');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('Errore durante il reset password:', err);
      setError('Errore durante il reset della password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackToLogin = () => {
    setIsPasswordReset(false);
    setResetEmail('');
    setError('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-[#1B5AAB]">
          {isPasswordReset ? 'Recupera Password' : 'Accedi'}
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          {isPasswordReset 
            ? 'Inserisci la tua email per ricevere il link di recupero password'
            : 'Inserisci email e password per accedere'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPasswordReset ? (
          // Form di recupero password
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Inserisci la tua email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isResetting}>
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                'Invia Email di Recupero'
              )}
            </Button>

            <div className="text-center">
              <Button 
                type="button" 
                variant="link" 
                onClick={handleBackToLogin}
                className="text-sm flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="h-3 w-3" />
                Torna al Login
              </Button>
            </div>
          </form>
        ) : (
          // Form di login normale
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrUsername">Email o Username</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder="Inserisci email o username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button 
                  type="button" 
                  variant="link" 
                  onClick={() => setIsPasswordReset(true)}
                  className="text-xs text-[#1B5AAB] hover:text-[#164a94] p-0 h-auto"
                >
                  Password dimenticata?
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Inserisci la tua password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                'Accedi'
              )}
            </Button>

            {onSwitchToPhoneLogin && (
              <div className="text-center">
                <Button 
                  type="button" 
                  variant="link" 
                  onClick={onSwitchToPhoneLogin}
                  className="text-sm"
                >
                  Accesso rapido con telefono
                </Button>
              </div>
            )}

            {onSwitchToRegister && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Non hai ancora un account?
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onSwitchToRegister}
                  className="w-full border-[#1B5AAB] text-[#1B5AAB] hover:bg-[#1B5AAB] hover:text-white"
                >
                  Crea un nuovo account
                </Button>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default RegularLogin;