import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink, ShoppingCart, RefreshCw, Eye } from 'lucide-react'; // ✅ Aggiunta Eye
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext'; // ✅ Aggiunta
import { toast } from 'sonner'; // ✅ Aggiunta
import { wooCommerceService } from '@/services/woocommerce';
import { useWooCommerceCustomerOrders } from '@/hooks/useWooCommerce'; // ✅ Aggiunta

const AutoLogin: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, authState } = useAuth();
  const { dispatch } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Inizializzazione auto-login...');
  const [userData, setUserData] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false); // ✅ Aggiunta questa linea

  // ✅ Hook per ottenere l'ultimo ordine del cliente
  const customerId = authState?.isAuthenticated && authState?.user?.id ? authState.user.id : null;
  const { data: customerOrders = [] } = useWooCommerceCustomerOrders(
    customerId,
    { per_page: 1, orderby: 'date', order: 'desc' },
    { enabled: !!customerId }
  );
  
  const lastOrder = customerOrders[0];

  // ✅ Funzione per determinare la categoria di un prodotto
  const getProductCategory = (product: any): string => {
    if (!product.categories || product.categories.length === 0) return 'altri';
    
    const categorySlug = product.categories[0].slug.toLowerCase();
    
    if (categorySlug === 'acqua' || categorySlug.includes('acqua-')) return 'acqua';
    if (categorySlug === 'birra' || categorySlug.includes('birra-')) return 'birra';
    if (categorySlug === 'vino' || categorySlug.includes('vino-')) return 'vino';
    if (categorySlug === 'bevande' || categorySlug.includes('bevande-') || 
        categorySlug === 'cocacola' || categorySlug === 'fanta' || 
        categorySlug === 'sanbenedetto' || categorySlug === 'sanpellegrino' || 
        categorySlug === 'schweppes' || categorySlug.includes('altre-bevande')) return 'bevande';
    
    return 'altri';
  };

  // ✅ Funzione corretta per riordinare l'ultimo acquisto
  const handleReorderLast = async () => {
    if (!lastOrder || !lastOrder.line_items) {
      toast.error('Nessun ordine precedente trovato');
      return;
    }
    
    let addedItems = 0;
    
    try {
      toast.info('Aggiunta prodotti al carrello...');
      
      const productPromises = lastOrder.line_items.map(async (item: any) => {
        try {
          const product = await wooCommerceService.getProduct(item.product_id);
          
          const category = getProductCategory(product);
          
          const cartItem = {
            id: item.product_id,
            name: item.name,
            price: parseFloat(item.price),
            image: product.images && product.images.length > 0 
              ? product.images[0].src 
              : '/placeholder.svg',
            category: category
          };
          
          return { cartItem, quantity: item.quantity };
        } catch (error) {
          console.error(`Errore nel recupero del prodotto ${item.product_id}:`, error);
          const cartItem = {
            id: item.product_id,
            name: item.name,
            price: parseFloat(item.price),
            image: '/placeholder.svg',
            category: 'altri'
          };
          
          return { cartItem, quantity: item.quantity };
        }
      });
      
      const products = await Promise.all(productPromises);
      
      products.forEach(({ cartItem, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          dispatch({ type: 'ADD_ITEM', payload: cartItem });
        }
        addedItems += quantity;
      });
      
      toast.success(`${addedItems} prodotti dall'ultimo ordine aggiunti al carrello!`);
      
      // Reindirizza al carrello per mostrare i prodotti aggiunti
      setTimeout(() => {
        navigate('/cart');
      }, 1500);
      
    } catch (error) {
      console.error('Errore nel recupero dei prodotti:', error);
      toast.error('Errore nel recupero delle informazioni dei prodotti');
    }
  };

  const handleNewOrder = () => {
    navigate('/prodotti');
  };

  // ✅ Funzione per mostrare/nascondere i dettagli dell'ultimo ordine
  const toggleOrderDetails = () => {
    setShowOrderDetails(!showOrderDetails);
  };

  useEffect(() => {
    const performAutoLogin = async () => {
      const token = searchParams.get('token');
      
      if (!userId || !token) {
        setStatus('error');
        setMessage('Parametri mancanti per l\'auto-login');
        return;
      }

      try {
        // ✅ RIMOSSA la linea: setMessage('Verifica token di accesso...');
        
        // Verifica che il token sia quello corretto
        if (token !== 'impbev26') {
          throw new Error('Token non valido');
        }
        
        // Ottieni i dati del cliente da WooCommerce
        const loginResult = await wooCommerceService.loginWithUserId(parseInt(userId));
        
        if (loginResult.success && loginResult.customer) {
          setMessage('Configurazione sessione...');
          
          // Salva i dati utente nello stato
          setUserData(loginResult.customer);
          
          // Imposta l'utente nel contesto
          setUser({
            id: loginResult.customer.id,
            email: loginResult.customer.email,
            firstName: loginResult.customer.first_name,
            lastName: loginResult.customer.last_name,
            username: loginResult.customer.username || loginResult.customer.email,
            billing: loginResult.customer.billing,
            shipping: loginResult.customer.shipping
          });
          
          // Salva anche nel localStorage per persistenza
          localStorage.setItem('user', JSON.stringify({
            id: loginResult.customer.id,
            email: loginResult.customer.email,
            firstName: loginResult.customer.first_name,
            lastName: loginResult.customer.last_name,
            username: loginResult.customer.username || loginResult.customer.email,
            billing: loginResult.customer.billing,
            shipping: loginResult.customer.shipping
          }));
          
          setStatus('success');
          setMessage('Login completato!');
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
                <p className="text-xs text-blue-500">✓ Token: ✓ Verificato</p>
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
              
              {/* Mostra i dati utente - versione semplificata e migliorata */}
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">
                      {userData?.first_name?.charAt(0)}{userData?.last_name?.charAt(0)}
                    </span>
                  </div>
                </div>
                
                {userData && (
                  <div className="text-center space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {userData.first_name} {userData.last_name}
                      </h3>
                    </div>
                    
                    {userData.billing?.address_1 && (
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm">{userData.billing.address_1}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tab personalizzato con opzioni ordine */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                  🎯 Cosa vuoi fare oggi?
                </h3>
                
                <div className="space-y-4">
                  {/* Pulsante Ripeti Ultimo Ordine - mostrato solo se c'è un ultimo ordine */}
                  {lastOrder && (
                    <div className="space-y-3">
                      <button
                        onClick={toggleOrderDetails}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-3 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <RefreshCw className="h-6 w-6" />
                        {/* Mostra il testo solo se i dettagli non sono visibili */}
                        {!showOrderDetails && "Ripeti Ultimo Ordine"}
                      </button>
                      
                      {/* Dettagli ultimo ordine con design migliorato */}
                      {showOrderDetails && (
                        <div className="bg-white rounded-xl p-5 border-2 border-blue-200 shadow-lg">
                          <h4 className="font-bold text-gray-900 mb-4 text-base flex items-center gap-2">
                            📋 Ultimo Ordine #{lastOrder.number} 
                            <span className="text-sm font-normal text-gray-600">
                              - {new Date(lastOrder.date_created).toLocaleDateString('it-IT')}
                            </span>
                          </h4>
                          <div className="space-y-3 max-h-48 overflow-y-auto">
                            {lastOrder.line_items?.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between items-center text-sm bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                                <div className="flex-1">
                                  <span className="font-semibold text-gray-900">{item.name}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-blue-600 font-medium">Qtà: {item.quantity}</div>
                                  <div className="font-bold text-gray-900">€{parseFloat(item.total).toFixed(2)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t-2 border-gray-200 text-right">
                            <span className="font-bold text-xl text-green-600">💰 Totale: €{parseFloat(lastOrder.total).toFixed(2)}</span>
                          </div>
                          
                          {/* Pulsante per aggiungere al carrello */}
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <button
                              onClick={handleReorderLast}
                              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              <ShoppingCart className="h-5 w-5" />
                              Ripeti questo Ordine
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Pulsante Nuovo Ordine con design migliorato */}
                  <button
                    onClick={handleNewOrder}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center gap-3 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    Nuovo Ordine
                  </button>
                </div>
                
                {/* Link Area Riservata con design migliorato */}
                <div className="mt-6 pt-4 border-t border-blue-200">
                  <button
                    onClick={() => navigate('/account')}
                    className="w-full text-blue-700 hover:text-blue-900 transition-colors text-base font-medium py-2 px-4 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
                  >
                    👤 Vai all'Area Riservata →
                  </button>
                </div>
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
                <p className="text-xs text-red-500">Token: {token ? '✓ Presente' : '✗ Mancante'}</p>
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

// RIMUOVERE QUESTE FUNZIONI DA QUI - ERANO FUORI DAL COMPONENTE
// const handleReorderLast = () => {
//   navigate('/account?tab=orders&action=reorder');
// };
//
// const handleNewOrder = () => {
//   navigate('/products');
// };