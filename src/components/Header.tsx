
import React from 'react';
import { ShoppingBag, User, Menu, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const { state } = useCart();
  const { authState } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMenuItems, setShowMenuItems] = useState(true);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  // Funzione per controllare se c'è abbastanza spazio per il menu
  useEffect(() => {
    const checkMenuSpace = () => {
      const screenWidth = window.innerWidth;
      // Se la larghezza è troppo piccola per contenere menu + logo + cart, nascondi il menu
      if (screenWidth < 1050) {
        setShowMenuItems(false);
      } else {
        setShowMenuItems(true);
      }
    };

    checkMenuSpace();
    window.addEventListener('resize', checkMenuSpace);
    
    return () => window.removeEventListener('resize', checkMenuSpace);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-28 relative">
            {/* Left Section - Menu Items a sinistra del logo */}
            {showMenuItems && (
              <nav className="flex space-x-4 mr-2">
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-2 rounded-md hover:bg-blue-50"
                >
                  Home
                </Link>
                <Link 
                  to="/products" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-2 rounded-md hover:bg-blue-50"
                >
                  Shop
                </Link>
                <Link 
                  to="/products?category=acqua" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-2 rounded-md hover:bg-blue-50"
                >
                  Acqua
                </Link>
                <Link 
                  to="/products?category=bevande" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-2 rounded-md hover:bg-blue-50"
                >
                  Bevande
                </Link>
              </nav>
            )}

            {/* Center Section - Logo */}
            <Link to="/" className="flex items-center mx-4">
              <img 
                src="http://www.imperatorebevande.it/wp-content/uploads/2022/08/logo-imperatore.png" 
                alt="Imperatore Bevande" 
                className="w-auto"
                style={{height: '170px'}}
              />
            </Link>

            {/* Right Section - Menu Items a destra del logo */}
            {showMenuItems && (
              <nav className="flex space-x-4 ml-2">
                <Link 
                  to="/products?category=birra" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-2 rounded-md hover:bg-blue-50"
                >
                  Birra
                </Link>
                <Link 
                  to="/products?category=vino" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-2 rounded-md hover:bg-blue-50"
                >
                  Vino
                </Link>
                <Link 
                  to="/contact" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-2 rounded-md hover:bg-blue-50"
                >
                  Contatti
                </Link>
                <Link 
                  to="/faq" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-2 rounded-md hover:bg-blue-50"
                >
                  FAQ
                </Link>
              </nav>
            )}
            
            {/* Menu hamburger per desktop quando le voci sono nascoste */}
            {!showMenuItems && (
              <div className="absolute left-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            )}
            
            {/* Cart e User - posizionati all'estrema destra */}
            <div className="absolute right-0 flex items-center space-x-4">
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="sm" className="relative flex flex-col items-center text-blue-600">
                  <ShoppingBag className="w-4 h-4" />
                  {itemCount > 0 && (
                    <>
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                        {itemCount}
                      </Badge>
                      <span className="text-xs mt-1">€{state.total.toFixed(2)}</span>
                    </>
                  )}
                </Button>
              </Link>
              {/* Sostituisci il Button con un Link all'account */}
              <Link to="/account">
                <Button variant="ghost" size="sm" className={authState.isAuthenticated ? "text-green-600" : "text-gray-600"}>
                  <User className="w-4 h-4" />
                  {authState.isAuthenticated && (
                    <span className="ml-1 text-xs">{authState.user?.first_name}</span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Menu dropdown per desktop quando le voci sono nascoste - Ora con lo stesso stile del menu mobile */}
        {!showMenuItems && isMenuOpen && (
          <div className="border-t bg-white shadow-lg">
            <nav className="container mx-auto px-4 py-2 space-y-2">
              <Link to="/" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <Link to="/products" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                </div>
                Shop
              </Link>
              <Link to="/products?category=acqua" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                Acqua
              </Link>
              <Link to="/products?category=birra" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                </div>
                Birra
              </Link>
              <Link to="/products?category=bevande" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                Bevande
              </Link>
              <Link to="/products?category=vino" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                Vino
              </Link>
              <Link to="/about" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <User className="w-4 h-4 mr-2" />
                Chi siamo
              </Link>
              <Link to="/contact" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <Search className="w-4 h-4 mr-2" />
                Contatti
              </Link>
              <Link to="/faq" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="text-xs font-bold">?</div>
                </div>
                FAQ
              </Link>
              <Link to="/cart" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Carrello ({itemCount})
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <Link to="/" className="flex items-center">
            <h1 className="text-lg font-bold" style={{color: '#1B5AAB'}}>IMPERATORE BEVANDE</h1>
          </Link>

          <div className="flex items-center space-x-2">
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="sm" className="relative flex flex-col items-center">
                <ShoppingBag className="w-4 h-4" />
                {itemCount > 0 && (
                  <>
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                      {itemCount}
                    </Badge>
                    <span className="text-xs mt-1 bg-blue-500 text-white px-2 py-1 rounded">{state.total.toFixed(2)}€</span>
                  </>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Menu (hamburger menu) */}
        {isMenuOpen && (
          <div className="border-t bg-white">
            <nav className="px-4 py-2 space-y-2">
              <Link to="/" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <Link to="/products" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                </div>
                Shop
              </Link>
              <Link to="/products?category=acqua" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                Acqua
              </Link>
              <Link to="/products?category=birra" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                </div>
                Birra
              </Link>
              <Link to="/products?category=bevande" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                Bevande
              </Link>
              <Link to="/products?category=vino" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                Vino
              </Link>
              <Link to="/about" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <User className="w-4 h-4 mr-2" />
                Chi siamo
              </Link>
              <Link to="/contact" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <Search className="w-4 h-4 mr-2" />
                Contatti
              </Link>
              <Link to="/faq" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="text-xs font-bold">?</div>
                </div>
                FAQ
              </Link>
              <Link to="/cart" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Carrello ({itemCount})
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="flex justify-around">
          <Link to="/" className="flex flex-col items-center py-2 px-3 text-gray-600">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/products" className="flex flex-col items-center py-2 px-3 text-gray-600">
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-2 h-2 bg-current rounded-sm"></div>
                <div className="w-2 h-2 bg-current rounded-sm"></div>
                <div className="w-2 h-2 bg-current rounded-sm"></div>
                <div className="w-2 h-2 bg-current rounded-sm"></div>
              </div>
            </div>
            <span className="text-xs mt-1">Categorie</span>
          </Link>
          <Link to="/products?search=focus" className="flex flex-col items-center py-2 px-3 text-blue-600 bg-blue-50 rounded-lg mx-1">
            <Search className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Cerca</span>
          </Link>
          <Link to="/cart" className="flex flex-col items-center py-2 px-3 text-gray-600 relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xs mt-1">Carrello</span>
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                {itemCount}
              </Badge>
            )}
          </Link>
          <Link to="/account" className="flex flex-col items-center py-2 px-3 text-gray-600">
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Account</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
