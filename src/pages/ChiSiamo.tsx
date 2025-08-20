import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Construction, Users, Clock } from 'lucide-react';

const ChiSiamo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* Icona di costruzione animata */}
          <div className="mb-8 animate-bounce">
            <Construction className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
          </div>
          
          {/* Titolo principale */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 animate-fade-in">
            Chi Siamo
          </h1>
          
          {/* Messaggio di costruzione */}
          <Card className="bg-white shadow-lg border-0 mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-lg font-semibold text-gray-700">Pagina in Costruzione</span>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Stiamo lavorando per portarti una sezione dedicata alla nostra storia, 
                ai nostri valori e al team che rende possibile tutto questo.
              </p>
              <div className="flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-600 font-medium">Presto disponibile!</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Messaggio temporaneo */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">
              Nel frattempo...
            </h2>
            <p className="text-blue-700">
              Puoi esplorare i nostri prodotti e scoprire le zone di consegna disponibili.
            </p>
          </div>
          
          {/* Link di navigazione */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/prodotti" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Scopri i Prodotti
            </Link>
            <Link 
              to="/zone-map" 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Zone di Consegna
            </Link>
            <Link 
              to="/" 
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Torna alla Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiSiamo;