
import React from 'react';
import { ShoppingBag, User, Menu, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const Header = () => {
  const { state } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-16 relative">
            {/* Logo centrato senza icona */}
            <Link to="/" className="flex items-center">
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Imperatore Bevande</span>
            </Link>

            {/* Right Section - Desktop (posizionato assolutamente) */}
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
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
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
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Imperatore Bevande</span>
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t bg-white">
            <nav className="px-4 py-2 space-y-2">
              <Link to="/" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <Link to="/products" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2">
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                  </div>
                </div>
                Prodotti
              </Link>
              <Link to="/cart" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors py-2">
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
          {/* Nuovo pulsante Cerca al centro */}
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
