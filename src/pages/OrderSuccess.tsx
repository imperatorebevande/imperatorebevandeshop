
import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Truck, Home } from 'lucide-react';
import Lottie from 'lottie-react';
import successAnimation from '@/assets/animations/Success.json';

const OrderSuccess = () => {
  const location = useLocation();
  const orderData = location.state as { 
    orderNumber?: string; 
    orderId?: number; 
    total?: string; 
  } | null;

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto text-center">
          <CardContent className="pt-12 pb-8">
            <div className="w-32 h-32 mx-auto mb-6">
              <Lottie 
                animationData={successAnimation} 
                loop={false}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            
            <h1 className="text-3xl font-bold text-green-700 mb-4">
              Ordine Completato!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Grazie per il tuo acquisto. Il tuo ordine è stato ricevuto e sarà processato a breve.
            </p>

            {orderData && (
              <div className="bg-green-50 p-6 rounded-lg mb-8">
                <div className="space-y-2">
                  <p className="text-lg font-semibold">
                    Numero Ordine: <span className="text-green-700">#{orderData.orderNumber}</span>
                  </p>
                  {orderData.total && (
                    <p className="text-lg">
                      Totale: <span className="font-semibold">€{parseFloat(orderData.total).toFixed(2)}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                <Package className="w-8 h-8 text-blue-600 mr-3" />
                <div className="text-left">
                  <h3 className="font-semibold text-blue-700">Preparazione</h3>
                  <p className="text-sm text-blue-600">Il tuo ordine sarà preparato entro 24 ore</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                <Truck className="w-8 h-8 text-blue-600 mr-3" />
                <div className="text-left">
                  <h3 className="font-semibold text-blue-700">Consegna</h3>
                  <p className="text-sm text-blue-600">Consegna gratuita a Bari</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Riceverai una email di conferma con i dettagli del tuo ordine e il tracking della spedizione.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button className="gradient-primary">
                    <Home className="w-4 h-4 mr-2" />
                    Torna alla Home
                  </Button>
                </Link>
                
                <Link to="/prodotti">
                  <Button variant="outline">
                    Continua a Comprare
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderSuccess;
