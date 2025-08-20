import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselImage {
  id: number;
  src: string;
  alt: string;
  title?: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  className?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  className = ''
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Gestione navigazione modal
  const openModal = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
    document.body.style.overflow = 'unset';
  };

  const goToPrevious = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1);
    }
  };

  // Gestione tasti keyboard
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isModalOpen) return;
      
      switch (event.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedImageIndex]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Container con scroll orizzontale su mobile */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 cursor-pointer flex-shrink-0 w-40 md:w-64 lg:w-72"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => openModal(index)}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Card Container */}
            <div className="relative aspect-square bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-2"
                loading={index < 3 ? 'eager' : 'lazy'}
              />
              
              {/* Overlay con effetto hover */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
                hoveredIndex === index ? 'opacity-100' : 'opacity-0'
              }`} />
              
              {/* Titolo con animazione */}
              {image.title && (
                <div className={`absolute bottom-0 left-0 right-0 p-3 text-white transform transition-all duration-300 ${
                  hoveredIndex === index 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-full opacity-0'
                }`}>
                  <h3 className="text-sm font-bold drop-shadow-lg text-center">
                    {image.title}
                  </h3>
                </div>
              )}
              
              {/* Effetto brillantezza */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            </div>
            
            {/* Bordo animato */}
            <div className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
              hoveredIndex === index 
                ? 'border-blue-400 shadow-lg shadow-blue-400/25' 
                : 'border-transparent'
            }`} />
          </div>
        ))}
      </div>

      {/* Modal per visualizzazione a schermo intero */}
      {isModalOpen && selectedImageIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          {/* Overlay per chiudere */}
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={closeModal}
          />
          
          {/* Contenuto Modal */}
          <div className="relative max-w-7xl max-h-[90vh] mx-4">
            {/* Pulsante chiudi */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-2 transition-all duration-300 text-white"
              aria-label="Chiudi"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Immagine principale */}
            <div className="relative">
              <img
                src={images[selectedImageIndex].src}
                alt={images[selectedImageIndex].alt}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                style={{ minHeight: '300px' }}
              />
              
              {/* Titolo immagine */}
              {images[selectedImageIndex].title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 rounded-b-lg">
                  <h3 className="text-white text-xl font-bold text-center">
                    {images[selectedImageIndex].title}
                  </h3>
                </div>
              )}
            </div>
            
            {/* Frecce di navigazione */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all duration-300 text-white group"
                  aria-label="Immagine precedente"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all duration-300 text-white group"
                  aria-label="Immagine successiva"
                >
                  <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              </>
            )}
            
            {/* Indicatori */}
            {images.length > 1 && (
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === selectedImageIndex
                        ? 'bg-white scale-125 shadow-lg'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Vai all'immagine ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;