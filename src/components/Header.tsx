
import { ShoppingCart, Search, User, Menu, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Header = () => {
  const { state } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowMobileSearch(false);
    }
  };

  const handleSearchInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e as any);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo area - migliorato per mobile */}
          <Link to="/" className="text-lg sm:text-2xl font-bold text-gradient flex-shrink-0">
            Shop
          </Link>

          {/* Search Bar - Hidden on mobile, migliorato spacing */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchInput}
                placeholder="Cerca prodotti..."
                className="pl-10 pr-4 py-2 w-full"
              />
            </form>
          </div>

          {/* Navigation - Desktop con spacing migliorato */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-6">
            <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-gray-900 transition-colors">
              Prodotti
            </Link>
            <Link to="/account">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                Account
              </Button>
            </Link>
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="sm">
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button con padding ridotto */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Search con margin ridotto */}
        {showMobileSearch && (
          <div className="md:hidden mt-2">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchInput}
                placeholder="Cerca prodotti..."
                className="pl-10 pr-4 py-2 w-full"
                autoFocus
              />
            </form>
          </div>
        )}

        {/* Mobile Navigation con padding ottimizzato */}
        {isMenuOpen && (
          <nav className="md:hidden mt-2 pb-2 border-t pt-2">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link to="/products" className="text-gray-700 hover:text-gray-900 transition-colors">
                Prodotti
              </Link>
              <Link to="/cart" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Carrello ({itemCount})
              </Link>
              <Link to="/account" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors">
                <User className="w-4 h-4 mr-2" />
                Account
              </Link>
            </div>
          </nav>
        )}
      </div>
      
      {/* Nuova Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-50 border-t border-gray-200">
        <div className="flex items-center justify-around">
          <Link to="/" className="flex flex-col items-center py-2 px-3 text-blue-600">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center py-2 px-3 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6" />
            <span className="text-xs mt-1">Menu</span>
          </Button>
          
          <div className="flex justify-center -mt-5">
            <Button 
              className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 flex items-center justify-center shadow-lg"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="w-6 h-6 text-white" />
            </Button>
          </div>
          
          <Link to="/cart" className="flex flex-col items-center py-2 px-3 text-gray-600 relative">
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
            <span className="text-xs mt-1">Carrello</span>
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
