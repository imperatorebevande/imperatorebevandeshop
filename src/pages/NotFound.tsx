import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search, ShoppingBag } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: L'utente ha tentato di accedere a una route inesistente:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          {/* Animazione 404 */}
          <div className="mb-8 animate-bounce">
            <div className="text-8xl font-bold text-purple-600 mb-4 animate-pulse">
              404
            </div>
            <div className="text-6xl mb-4">🤔</div>
          </div>
          
          {/* Messaggio principale */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4 animate-fade-in">
            Pagina non trovata
          </h1>
          <p className="text-lg text-gray-600 mb-8 animate-fade-in-delay">
            Ops! La pagina che stai cercando non esiste o è stata spostata.
          </p>
          
          {/* URL tentato */}
          <div className="bg-gray-100 rounded-lg p-4 mb-8 animate-fade-in-delay-2">
            <p className="text-sm text-gray-500 mb-2">URL richiesto:</p>
            <code className="text-sm font-mono text-red-600 break-all">
              {location.pathname}
            </code>
          </div>
          
          {/* Opzioni di navigazione */}
          <div className="space-y-4 animate-fade-in-delay-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 hover:scale-105">
                  <Home className="w-4 h-4 mr-2" />
                  Torna alla Home
                </Button>
              </Link>
              
              <Link to="/prodotti">
                <Button variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-50 transition-all duration-300 hover:scale-105">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Vai ai Prodotti
                </Button>
              </Link>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="w-full text-gray-600 hover:text-gray-800 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna Indietro
            </Button>
          </div>
          
          {/* Suggerimenti */}
          <div className="mt-12 p-6 bg-white rounded-xl shadow-lg border border-gray-100 animate-fade-in-delay-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center">
              <Search className="w-5 h-5 mr-2 text-purple-600" />
              Cosa puoi fare:
            </h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Controlla l'URL per eventuali errori di battitura
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Usa la barra di ricerca per trovare i prodotti
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Naviga attraverso le categorie di prodotti
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Contattaci se il problema persiste
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
