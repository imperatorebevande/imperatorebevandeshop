import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import RegisterComponent from '@/components/Register';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Register = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  // Se l'utente è già autenticato, reindirizza alla pagina account
  useEffect(() => {
    if (authState?.isAuthenticated) {
      navigate('/account');
    }
  }, [authState?.isAuthenticated, navigate]);

  const handleRegistrationSuccess = () => {
    navigate('/account');
  };

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Pulsante per tornare al login */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleSwitchToLogin}
              className="text-[#1B5AAB] hover:text-[#164A9A] hover:bg-blue-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna al Login
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-8 text-[#1B5AAB]">
            Crea il tuo Account
          </h1>
          
          <RegisterComponent 
            onSuccess={handleRegistrationSuccess}
            onSwitchToLogin={handleSwitchToLogin}
          />
        </div>
      </div>
    </div>
  );
};

export default Register;