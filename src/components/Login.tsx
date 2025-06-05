import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onClose?: () => void;
}

const Login: React.FC<LoginProps> = ({ onClose }) => {
  const { login, authState } = useAuth();
  const navigate = useNavigate(); // Aggiungi questo
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.emailOrUsername || !formData.password) {
      toast.error('Inserisci email/username e password');
      return;
    }

    try {
      await login(formData.emailOrUsername, formData.password);
      toast.success('Login effettuato con successo!');
      
      // Navigazione esplicita alla pagina account
      setTimeout(() => {
        navigate('/account');
        if (onClose) {
          onClose();
        }
      }, 1000);
    } catch (error) {
      toast.error('Credenziali non valide');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Accedi al tuo Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailOrUsername">Email o Username</Label>
            <Input
              id="emailOrUsername"
              name="emailOrUsername"
              type="text"
              value={formData.emailOrUsername}
              onChange={handleChange}
              placeholder="inserisci email o username"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="inserisci la tua password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Rimosso il blocco delle credenziali di test:
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
            <p><strong>Credenziali di test:</strong></p>
            <p>Email: admin@test.com</p>
            <p>Username: admin</p>
            <p>Password: password</p>
          </div>
          */}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={authState.isLoading} 
          >
            {authState.isLoading ? ( // Corretto: cambiato da 'state.isLoading' a 'authState.isLoading'
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accesso in corso...
              </>
            ) : (
              'Accedi'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Login;