import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink } from 'lucide-react';

const AutoLogin: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!userId || !token) {
      console.error('Parametri mancanti:', { userId, token });
      return;
    }

    // Countdown prima del redirect
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Reindirizza direttamente all'endpoint WordPress
          window.location.href = `https://imperatorebevande.it/wp-json/custom/v1/auto-login/${userId}?token=${token}`;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [userId, searchParams]);

  const token = searchParams.get('token');
  const autoLoginUrl = userId && token ? 
    `https://imperatorebevande.it/wp-json/custom/v1/auto-login/${userId}?token=${token}` : 
    null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {userId && token ? (
            <>
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Accesso automatico
              </h2>
              <p className="text-gray-600 mb-4">
                Reindirizzamento in corso tra {countdown} secondi...
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Parametri:</p>
                <p className="text-xs text-gray-500">ID Utente: {userId}</p>
                <p className="text-xs text-gray-500">Token: ✓ Presente</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (autoLoginUrl) {
                      window.location.href = autoLoginUrl;
                    }
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Accedi Ora
                </button>
                
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Login Manuale
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto h-16 w-16 text-red-600 mb-4">
                ❌
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Parametri mancanti
              </h2>
              <p className="text-gray-600 mb-4">
                URL non valido per l'auto-login
              </p>
              
              <div className="bg-red-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-600 mb-2">Problemi rilevati:</p>
                <p className="text-xs text-red-500">ID Utente: {userId || '✗ Mancante'}</p>
                <p className="text-xs text-red-500">Token: {token || '✗ Mancante'}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Vai al Login
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Torna alla Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoLogin;