
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Check, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getBorderColor, getBottleQuantity } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  stock_status?: string;
  inStock?: boolean;
  category?: string;
  description?: string;
  short_description?: string;
  bottleQuantity?: number;
  slug?: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { state, dispatch } = useCart();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isTouched, setIsTouched] = React.useState(false);
  
  const isAvailable = product.stock_status === 'instock' || product.inStock !== false;
  
  // Verifica se il prodotto è nel carrello
  const cartItem = state.items.find(item => item.id === product.id);
  const isInCart = !!cartItem;
  const quantityInCart = cartItem?.quantity || 0;
  
  const discountPercentage = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!isAvailable) {
      toast.error('Prodotto non disponibile');
      return;
    }

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category
      },
    });
    
    toast.success(`${product.name} aggiunto al carrello!`, {
      icon: (
        <div 
          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: getBorderColor(product.category) }}
        >
          ✓
        </div>
      ),
      style: {
        border: `2px solid ${getBorderColor(product.category)}`,
      }
    });
  };

  const handleCardTouch = () => {
    // Su mobile, al primo tocco mostra i controlli invece di aggiungere al carrello
    if (!isTouched && !isInCart) {
      setIsTouched(true);
      return;
    }
    // Se già toccato o già nel carrello, comportamento normale
    if (!isInCart) {
      handleAddToCart();
    }
  };

  const handleIncrement = () => {
    if (!isAvailable) return;
    
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category
      },
    });
    
    // Modifica il messaggio del toast in base se il prodotto è già nel carrello
    const message = isInCart 
      ? `Quantità aggiornata: ${quantityInCart + 1}x ${product.name}`
      : `${product.name} aggiunto al carrello!`;
      
    toast.success(message, {
      icon: (
        <div 
          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: getBorderColor(product.category) }}
        >
          ✓
        </div>
      ),
      style: {
        border: `2px solid ${getBorderColor(product.category)}`,
      }
    });
  };

  const handleDecrement = () => {
    if (quantityInCart > 1) {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: {
          id: product.id,
          quantity: quantityInCart - 1
        }
      });
      
      // Aggiungi il toast di conferma quando si decrementa la quantità
      toast.success(`Quantità aggiornata: ${quantityInCart - 1}x ${product.name}`, {
        icon: (
          <div 
            className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: getBorderColor(product.category) }}
          >
            ✓
          </div>
        ),
        style: {
          border: `2px solid ${getBorderColor(product.category)}`,
        }
      });
    } else {
      dispatch({
        type: 'REMOVE_ITEM',
        payload: product.id
      });
      
      // Aggiungi il toast di conferma quando si rimuove il prodotto
      toast.success(`${product.name} rimosso dal carrello`, {
        icon: (
          <div 
            className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: '#A11E26' }}
          >
            ✓
          </div>
        ),
        style: {
          border: `2px solid #A11E26`,
          backgroundColor: '#A11E26',
          color: 'white'
        }
      });
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group relative overflow-hidden border-2"
      style={{ borderColor: getBorderColor(product.category) }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsTouched(true)}
    >
      {/* Badge sconto */}
      {discountPercentage > 0 && (
        <div className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold z-10">
          -{discountPercentage}%
        </div>
      )}
      
      {/* Badge quantità bottiglie - colorato come il bordo */}
      {(product.bottleQuantity || getBottleQuantity(product.short_description || product.description)) && (
        <div 
          className="absolute top-2 -right-8 text-white px-8 py-1 text-xs font-bold z-10 flex items-center gap-1 transform rotate-45"
          style={{ backgroundColor: getBorderColor(product.category) }}
        >
          x{product.bottleQuantity || getBottleQuantity(product.short_description || product.description)} bott.
        </div>
      )}
      
      {/* Badge per prodotto nel carrello */}
      {isInCart && !isHovered && !isTouched && (
        <div className="absolute bottom-12 sm:bottom-20 left-1/2 -translate-x-1/2 text-white px-1.5 py-0.5 rounded text-xs font-bold z-10 flex items-center gap-1 whitespace-nowrap" style={{ backgroundColor: '#A40800' }}>
          <Check className="w-3 h-3" />
          Nel carrello ({quantityInCart})
        </div>
      )}

      <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden bg-gray-50">
        <Link to={`/prodotti/${product.slug || product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </Link>
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex flex-col items-center justify-center gap-3 sm:gap-2">
          {!isInCart ? (
            <Button
              onClick={handleCardTouch}
              disabled={!isAvailable}
              className={`${(isHovered || isTouched) ? 'opacity-100' : 'opacity-0'} transition-all duration-300 transform ${(isHovered || isTouched) ? 'translate-y-0' : 'translate-y-4'} text-white px-2 py-1 text-xs bg-gray-800 hover:bg-gray-900`}
            >
              <ShoppingBag className="w-3 h-3 mr-1" />
              {isAvailable ? 'Aggiungi' : 'Non Disponibile'}
            </Button>
          ) : (
            <div className={`${(isHovered || isTouched) ? 'opacity-100' : 'opacity-0'} transition-all duration-300 transform ${(isHovered || isTouched) ? 'translate-y-0' : 'translate-y-4'} flex items-center gap-2`}>
              <Button
                onClick={handleDecrement}
                className="text-white px-2 py-1 text-xs bg-red-600 hover:bg-red-700 min-w-[40px] sm:min-w-[32px] h-10 sm:h-8"
              >
                <Minus className="w-4 h-4 sm:w-3 sm:h-3" />
              </Button>
              
              <span className="text-white font-bold text-sm bg-black bg-opacity-50 px-3 py-1 rounded min-w-[50px] sm:min-w-[40px] text-center">
                {quantityInCart}
              </span>
              
              <Button
                onClick={handleIncrement}
                disabled={!isAvailable}
                className="text-white px-2 py-1 text-xs bg-green-600 hover:bg-green-700 min-w-[40px] sm:min-w-[32px] h-10 sm:h-8"
              >
                <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
              </Button>
            </div>
          )}
          
          {/* Pulsante "Vai al Carrello" - appare solo se il prodotto è nel carrello */}
          {isInCart && (
            <div className="mt-2">
              <Link to="/cart">
                <Button
                  className={`${(isHovered || isTouched) ? 'opacity-100' : 'opacity-0'} transition-all duration-300 transform ${(isHovered || isTouched) ? 'translate-y-0' : 'translate-y-4'} text-white px-2 py-1 text-xs`}
                  style={{ backgroundColor: '#1B5AAB' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#154a9a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1B5AAB'}
                >
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Vai al Carrello
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="p-2">
        <Link to={`/prodotti/${product.slug || product.id}`}>
          <h3 className="font-bold mb-1 text-xs sm:text-sm line-clamp-2 hover:opacity-80 transition-colors" style={{color: '#1B5AAB'}}>
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {product.originalPrice && (
              <span className="text-xs text-gray-500 line-through">
                {product.originalPrice.toFixed(2)}€
              </span>
            )}
            <span className="font-bold text-sm" style={{color: '#A40800'}}>
              {product.price.toFixed(2)}€
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
