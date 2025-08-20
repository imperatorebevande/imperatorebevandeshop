import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Instagram, ExternalLink } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

// Immagini fallback per il feed Instagram
// Queste immagini rappresentano i prodotti e servizi di Imperatore Bevande
const instagramPosts = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center',
    caption: 'Acqua minerale fresca consegnata direttamente a casa tua! 💧 #ImperatoreBevande',
    likes: 45,
    timestamp: '2h'
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop&crop=center',
    caption: 'Le migliori birre artigianali per i tuoi momenti speciali 🍺 #ImperatoreBevande',
    likes: 67,
    timestamp: '5h'
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop&crop=center',
    caption: 'Vini pregiati selezionati per ogni occasione 🍷 #ImperatoreBevande',
    likes: 89,
    timestamp: '1d'
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop&crop=center',
    caption: 'Bevande fresche per l\'estate pugliese! ☀️🥤 #ImperatoreBevande',
    likes: 34,
    timestamp: '2d'
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=400&fit=crop&crop=center',
    caption: 'Consegna veloce e puntuale in tutta Bari 🚚 #ImperatoreBevande',
    likes: 78,
    timestamp: '3d'
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop&crop=center',
    caption: 'Qualità garantita dal 1985! ✨ #ImperatoreBevande',
    likes: 56,
    timestamp: '4d'
  }
];

interface InstagramFeedProps {
  className?: string;
}

const InstagramFeed: React.FC<InstagramFeedProps> = ({ className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-scroll ogni 4 secondi
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === instagramPosts.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === 0 ? instagramPosts.length - 1 : currentIndex - 1);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Riprende l'auto-play dopo 10 secondi
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === instagramPosts.length - 1 ? 0 : currentIndex + 1);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Riprende l'auto-play dopo 10 secondi
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Riprende l'auto-play dopo 10 secondi
  };

  const currentPost = instagramPosts[currentIndex];

  return (
    <div className={`relative ${className}`}>
      {/* Header con titolo e link Instagram */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Instagram className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Seguici su Instagram
          </h2>
        </div>
        <p className="text-gray-600 mb-4">Le ultime novità dal nostro account @imperatorebevande</p>
        <Button 
          variant="outline" 
          size="sm"
          className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white transition-colors"
          onClick={() => window.open('https://instagram.com/imperatorebevande', '_blank')}
        >
          <Instagram className="w-4 h-4 mr-2" />
          Seguici
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* Carousel principale */}
      <div className="relative max-w-md mx-auto">
        <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-pink-50 to-purple-50">
          <CardContent className="p-0">
            {/* Immagine */}
            <div className="relative aspect-square overflow-hidden">
              <img 
                src={currentPost.imageUrl} 
                alt={currentPost.caption}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              
              {/* Overlay con informazioni */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-sm font-medium mb-2 line-clamp-2">{currentPost.caption}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>❤️ {currentPost.likes} likes</span>
                    <span>{currentPost.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Pulsanti navigazione */}
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            {/* Caption e info sotto l'immagine */}
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-3 line-clamp-2">{currentPost.caption}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  ❤️ {currentPost.likes} likes
                </span>
                <span>{currentPost.timestamp}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indicatori di posizione */}
        <div className="flex justify-center mt-4 gap-2">
          {instagramPosts.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-pink-500 w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Griglia di miniature (visibile solo su desktop) */}
      <div className="hidden lg:block mt-8">
        <div className="grid grid-cols-6 gap-2 max-w-2xl mx-auto">
          {instagramPosts.map((post, index) => (
            <button
              key={post.id}
              onClick={() => goToSlide(index)}
              className={`aspect-square rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 ${
                index === currentIndex ? 'ring-2 ring-pink-500 ring-offset-2' : ''
              }`}
            >
              <img 
                src={post.imageUrl} 
                alt={post.caption}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstagramFeed;