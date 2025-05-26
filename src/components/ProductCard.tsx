
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { dispatch } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      },
    });
    toast.success(`${product.name} aggiunto al carrello!`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info('Funzionalità wishlist in arrivo!');
  };

  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  // Gestisci nomi di prodotti molto lunghi
  const truncatedName = product.name.length > 60 
    ? product.name.substring(0, 60) + '...' 
    : product.name;

  return (
    <Link to={`/product/${product.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <div className="relative overflow-hidden flex justify-center items-center bg-gray-50">
          <img
            src={product.image}
            alt={product.name}
            className="w-[150px] h-[150px] object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          {discountPercentage && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
              -{discountPercentage}%
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={handleWishlist}
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors min-h-[3.5rem]">
            {truncatedName}
          </h3>
          
          {product.rating && product.rating > 0 && (
            <div className="flex items-center mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.floor(product.rating!) ? '★' : '☆'}>
                    ★
                  </span>
                ))}
              </div>
              {product.reviews && product.reviews > 0 && (
                <span className="text-sm text-gray-500 ml-2">({product.reviews})</span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-purple-600">
                €{product.price.toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  €{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            
            <Button
              size="sm"
              className="gradient-primary hover:opacity-90 transition-opacity"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Aggiungi
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
