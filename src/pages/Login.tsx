import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import LoginComponent from '@/components/Login';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

const Login = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  // Se l'utente è già autenticato, reindirizza alla pagina account
  useEffect(() => {
    if (authState?.isAuthenticated) {
      navigate('/account');
    }
  }, [authState?.isAuthenticated, navigate]);

  const handleLoginSuccess = () => {
    navigate('/account');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Accedi al tuo Account</h1>
          <LoginComponent onClose={handleLoginSuccess} />
        </div>
      </div>
    </div>
  );
};

export default Login;