
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, Package } from 'lucide-react';

const OrderSuccess = () => {
  useEffect(() => {
    // Scroll to top quando la pagina si carica
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-3xl text-green-600">
                Ordine Completato!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600 text-lg">
                Grazie per il tuo acquisto! Il tuo ordine è stato registrato con successo.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-blue-600 mr-3" />
                  <span className="text-lg font-semibold">Numero Ordine: #12345</span>
                </div>
                <p className="text-gray-600">
                  Riceverai una email di conferma con tutti i dettagli del tuo ordine 
                  e le informazioni per il tracking della spedizione.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl mb-2">📧</div>
                    <h3 className="font-semibold mb-1">Email di Conferma</h3>
                    <p className="text-sm text-gray-600">Entro 5 minuti</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-2">🚚</div>
                    <h3 className="font-semibold mb-1">Spedizione</h3>
                    <p className="text-sm text-gray-600">Entro 24-48 ore</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/products">
                  <Button variant="outline" size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Continua lo Shopping
                  </Button>
                </Link>
                
                <Link to="/account">
                  <Button size="lg" className="gradient-primary">
                    Visualizza i Tuoi Ordini
                  </Button>
                </Link>
              </div>

              <div className="text-center text-sm text-gray-500 space-y-1">
                <p>Per qualsiasi domanda, contattaci:</p>
                <p>📞 +39 123 456 7890 | 📧 info@imperatobevande.it</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
