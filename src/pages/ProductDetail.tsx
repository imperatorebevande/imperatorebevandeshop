
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useWooCommerceProduct } from '@/hooks/useWooCommerce';
import { ShoppingCart, Heart, Star, ArrowLeft, Truck, Shield, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams();
  const { dispatch } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Recupera il prodotto da WooCommerce
  const { 
    data: wooProduct, 
    isLoading, 
    error 
  } = useWooCommerceProduct(parseInt(id || '0'));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Caricamento prodotto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !wooProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Prodotto non trovato</h1>
          <p className="text-gray-600 mb-6">Il prodotto che stai cercando non esiste o è stato rimosso.</p>
          <Link to="/products">
            <Button className="gradient-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna ai Prodotti
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Trasforma il prodotto WooCommerce nel formato locale
  const product = {
    id: wooProduct.id,
    name: wooProduct.name || 'Prodotto senza nome',
    price: wooProduct.price ? parseFloat(wooProduct.price) : 0,
    originalPrice: wooProduct.regular_price && wooProduct.sale_price && parseFloat(wooProduct.regular_price) > parseFloat(wooProduct.sale_price)
      ? parseFloat(wooProduct.regular_price) 
      : undefined,
    image: wooProduct.images && wooProduct.images.length > 0 ? wooProduct.images[0].src : '/placeholder.svg',
    rating: wooProduct.average_rating ? parseFloat(wooProduct.average_rating) : 0,
    reviews: wooProduct.rating_count || 0,
    description: wooProduct.short_description || wooProduct.description || 'Nessuna descrizione disponibile',
    inStock: wooProduct.stock_status === 'instock',
    features: [
      'Prodotto di qualità',
      'Consegna rapida a Bari',
      'Garanzia di freschezza'
    ]
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        },
      });
    }
    toast.success(`${quantity}x ${product.name} aggiunto al carrello!`);
  };

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  // Usa tutte le immagini disponibili o ripeti la prima
  const productImages = wooProduct.images && wooProduct.images.length > 0 
    ? wooProduct.images.map(img => img.src)
    : [product.image, product.image, product.image];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-purple-600">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-purple-600">Prodotti</Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="mb-4 relative">
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              {discountPercentage && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                  -{discountPercentage}%
                </Badge>
              )}
            </div>
            
            <div className="flex space-x-2">
              {productImages.slice(0, 3).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
                    selectedImage === index ? 'border-purple-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400 mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating) ? 'fill-current' : ''
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">({product.reviews} recensioni)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-purple-600">
                  €{product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    €{product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {discountPercentage && (
                <span className="text-green-600 font-medium">
                  Risparmi €{(product.originalPrice! - product.price).toFixed(2)}!
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.inStock ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ✓ Disponibile
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  ✗ Non disponibile
                </Badge>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Descrizione</h3>
              <div 
                className="text-gray-600"
                dangerouslySetInnerHTML={{ 
                  __html: product.description.replace(/<[^>]*>/g, '') 
                }}
              />
            </div>

            {/* Features */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Caratteristiche</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity and Add to Cart */}
            {product.inStock && (
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <label className="font-medium">Quantità:</label>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3"
                    >
                      -
                    </Button>
                    <span className="px-4 py-2 border-x">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    size="lg"
                    className="flex-1 gradient-primary hover:opacity-90"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Aggiungi al Carrello
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => toast.info('Funzionalità wishlist in arrivo!')}
                  >
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <CardContent className="p-0 text-center">
                  <Truck className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm font-medium">Spedizione Gratuita</div>
                  <div className="text-xs text-gray-500">Su ordini &gt; 50€</div>
                </CardContent>
              </Card>
              
              <Card className="p-4">
                <CardContent className="p-0 text-center">
                  <RotateCcw className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm font-medium">Reso Gratuito</div>
                  <div className="text-xs text-gray-500">Entro 30 giorni</div>
                </CardContent>
              </Card>
              
              <Card className="p-4">
                <CardContent className="p-0 text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm font-medium">Garanzia</div>
                  <div className="text-xs text-gray-500">2 anni</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
