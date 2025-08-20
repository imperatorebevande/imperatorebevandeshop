import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import LoginComponent from '@/components/Login';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

const Login = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Controlla se l'utente arriva dal carrello
  const from = location.state?.from || '/account';

  // Se l'utente è già autenticato, reindirizza alla destinazione appropriata
  useEffect(() => {
    if (authState?.isAuthenticated) {
      navigate(from);
    }
  }, [authState?.isAuthenticated, navigate, from]);

  const handleLoginSuccess = () => {
    navigate(from);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-[#1B5AAB]">Accedi al tuo Account</h1>
          <LoginComponent onClose={handleLoginSuccess} />
        </div>
      </div>
    </div>
  );
};

export default Login;