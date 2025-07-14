import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { wooCommerceService } from '@/services/woocommerce';

const AutoLogin: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Inizializzazione auto-login...');

  useEffect(() => {
    const performAutoLogin = async () => {
      const token = searchParams.get('token');
      
      if (!userId || !token) {
        setStatus('error');
        setMessage('Parametri mancanti per l\'auto-login');
        return;
      }

      try {
        setMessage('Verifica token di accesso...');
        
        // Verifica che il token sia quello corretto
        if (token !== 'impbev26') {
          throw new Error('Token non valido');
        }
        
        setMessage('Recupero dati utente...');
        
        // Ottieni i dati del cliente da WooCommerce
        const loginResult = await wooCommerceService.loginWithUserId(parseInt(userId));
        
        if (loginResult.success && loginResult.customer) {
          setMessage('Configurazione sessione...');
          
          // Imposta l'utente nel contesto
          setUser({
            id: loginResult.customer.id,
            email: loginResult.customer.email,
            firstName: loginResult.customer.first_name,
            lastName: loginResult.customer.last_name,
            phone: loginResult.customer.billing?.phone || '',
            isAuthenticated: true
          });
          
          // Salva anche nel localStorage per persistenza
          localStorage.setItem('user', JSON.stringify({
            id: loginResult.customer.id,
            email: loginResult.customer.email,
            firstName: loginResult.customer.first_name,
            lastName: loginResult.customer.last_name,
            phone: loginResult.customer.billing?.phone || '',
            isAuthenticated: true
          }));
          
          setStatus('success');
          setMessage('Login completato! Reindirizzamento alla tua area riservata...');
          
          // Reindirizza alla pagina account dell'app dopo 2 secondi
          setTimeout(() => {
            navigate('/account');
          }, 2000);
        } else {
          throw new Error('Impossibile recuperare i dati utente');
        }
        
      } catch (error) {
        console.error('Errore auto-login:', error);
        setStatus('error');
        setMessage(`Errore durante l'auto-login: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      }
    };

    performAutoLogin();
  }, [userId, searchParams, navigate, setUser]);

  const token = searchParams.get('token');
  const directLoginUrl = userId && token ? 
    `https://imperatorebevande.it/wp-json/custom/v1/auto-login/${userId}?token=${token}` : 
    null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Accesso Automatico
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-600 mb-2">Parametri ricevuti:</p>
                <p className="text-xs text-blue-500">✓ ID Utente: {userId}</p>
                <p className="text-xs text-blue-500">✓ Token: {token}</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto h-16 w-16 text-green-600 mb-4 text-4xl">
                ✅
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Accesso Completato!
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-600">Benvenuto nell'area riservata!</p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto h-16 w-16 text-red-600 mb-4 text-4xl">
                ❌
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Errore Auto-Login
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              
              <div className="bg-red-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-600 mb-2">Dettagli errore:</p>
                <p className="text-xs text-red-500">ID Utente: {userId || '✗ Mancante'}</p>
                <p className="text-xs text-red-500">Token: {token || '✗ Mancante'}</p>
              </div>
              
              <div className="space-y-3">
                {directLoginUrl && (
                  <button
                    onClick={() => window.location.href = directLoginUrl}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Prova Link Diretto WordPress
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Login Manuale
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
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