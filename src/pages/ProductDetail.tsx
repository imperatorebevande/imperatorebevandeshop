
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useWooCommerceProduct, useWooCommerceProducts } from '@/hooks/useWooCommerce';
import { ShoppingCart, Heart, Star, ArrowLeft, Truck, Shield, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams();
  const { dispatch } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Recupera il prodotto da WooCommerce
  const { 
    data: wooProduct, 
    isLoading, 
    error 
  } = useWooCommerceProduct(parseInt(id || '0'));

  // Recupera prodotti correlati della stessa categoria
  const categoryId = wooProduct?.categories?.[0]?.id;
  const { 
    data: relatedWooProducts, 
    isLoading: isLoadingRelated 
  } = useWooCommerceProducts(
    { 
      category: categoryId?.toString(),
      per_page: 4,
      exclude: [parseInt(id || '0')] 
    },
    { enabled: !!categoryId }
  );

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

  // Trasforma il prodotto WooCommerce nel formato locale con controllo stock
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
    stock_status: wooProduct.stock_status,
    features: [
      'Prodotto di qualità',
      'Consegna rapida a Bari',
      'Garanzia di freschezza'
    ]
  };

  // Trasforma prodotti correlati nel formato locale
  const relatedProducts = relatedWooProducts?.map(wooProduct => ({
    id: wooProduct.id,
    name: wooProduct.name || 'Prodotto senza nome',
    price: wooProduct.price ? parseFloat(wooProduct.price) : 0,
    originalPrice: wooProduct.regular_price && wooProduct.sale_price && parseFloat(wooProduct.regular_price) > parseFloat(wooProduct.sale_price)
      ? parseFloat(wooProduct.regular_price) 
      : undefined,
    image: wooProduct.images && wooProduct.images.length > 0 ? wooProduct.images[0].src : '/placeholder.svg',
    rating: wooProduct.average_rating ? parseFloat(wooProduct.average_rating) : 0,
    reviews: wooProduct.rating_count || 0,
    inStock: wooProduct.stock_status === 'instock',
    stock_status: wooProduct.stock_status
  })) || [];

  console.log('Product stock status:', wooProduct.stock_status, 'Is in stock:', product.inStock);

  const handleAddToCart = () => {
    if (!product.inStock) {
      toast.error('Prodotto non disponibile');
      return;
    }
    
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

        {/* Product Card Layout */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex gap-6">
              {/* Product Image - Left Side */}
              <div className="flex-shrink-0 relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className={`w-[150px] h-[150px] object-cover rounded-lg bg-white p-2 ${!product.inStock ? 'grayscale opacity-75' : ''}`}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                {!product.inStock && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    Non Disponibile
                  </Badge>
                )}
                {product.inStock && discountPercentage && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    -{discountPercentage}%
                  </Badge>
                )}
              </div>

              {/* Product Info - Right Side */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-3">{product.name}</h1>
                
                {/* Rating */}
                {product.rating > 0 && (
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400 mr-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating) ? 'fill-current' : ''
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({product.reviews} recensioni)</span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-purple-600">
                      €{product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        €{product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {discountPercentage && product.inStock && (
                    <span className="text-green-600 font-medium text-sm">
                      Risparmi €{(product.originalPrice! - product.price).toFixed(2)}!
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div className="mb-4">
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
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Descrizione</h3>
                  <div 
                    className="text-gray-600 text-sm"
                    dangerouslySetInnerHTML={{ 
                      __html: product.description.replace(/<[^>]*>/g, '') 
                    }}
                  />
                </div>

                {/* Quantity and Add to Cart - Only show if in stock */}
                <div className="flex items-center space-x-4">
                  {product.inStock ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <label className="font-medium text-sm">Quantità:</label>
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-3 h-8"
                          >
                            -
                          </Button>
                          <span className="px-3 py-1 border-x text-sm">{quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuantity(quantity + 1)}
                            className="px-3 h-8"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <Button
                        className="gradient-primary hover:opacity-90"
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Aggiungi al Carrello
                      </Button>
                    </>
                  ) : (
                    <div className="text-gray-500 text-sm font-medium bg-gray-100 px-4 py-2 rounded-md">
                      Questo prodotto non è attualmente disponibile per l'acquisto
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => toast.info('Funzionalità wishlist in arrivo!')}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
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

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Prodotti Correlati</h2>
            {isLoadingRelated ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                <p className="text-gray-600">Caricamento prodotti correlati...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
