import React, { useEffect, useState } from 'react';

interface Bubble {
  id: number;
  size: number;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  color: string;
}

interface BubbleEffectProps {
  count?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  minSpeed?: number;
  maxSpeed?: number;
  zIndex?: number;
}

const BubbleEffect: React.FC<BubbleEffectProps> = ({
  count = 15, // Numero ridotto di bolle per non appesantire
  colors = ['#1B5AAB', '#CFA100', '#558E28', '#8500AF'], // Colori delle categorie
  minSize = 10,
  maxSize = 50,
  minSpeed = 1,
  maxSpeed = 3,
  zIndex = -1
}) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Aggiorna le dimensioni della finestra quando cambia
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Crea le bolle iniziali
  useEffect(() => {
    const newBubbles: Bubble[] = [];
    
    for (let i = 0; i < count; i++) {
      newBubbles.push({
        id: i,
        size: Math.random() * (maxSize - minSize) + minSize,
        x: Math.random() * windowSize.width,
        y: Math.random() * windowSize.height,
        speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        opacity: Math.random() * 0.5 + 0.1, // Opacità bassa per un effetto leggero
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    setBubbles(newBubbles);
  }, [windowSize, count, colors, minSize, maxSize, minSpeed, maxSpeed]);

  // Anima le bolle
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setBubbles(prevBubbles => 
        prevBubbles.map(bubble => {
          // Muovi la bolla verso l'alto
          let y = bubble.y - bubble.speed;
          
          // Se la bolla esce dallo schermo, riposizionala in basso
          if (y < -bubble.size) {
            return {
              ...bubble,
              y: windowSize.height + bubble.size,
              x: Math.random() * windowSize.width
            };
          }
          
          return { ...bubble, y };
        })
      );
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, [bubbles, windowSize]);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden" 
      style={{ zIndex }}
    >
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute rounded-full"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.x}px`,
            top: `${bubble.y}px`,
            backgroundColor: bubble.color,
            opacity: bubble.opacity,
            filter: 'blur(1px)',
            transition: 'opacity 0.3s ease',
            willChange: 'transform' // Ottimizzazione per le performance
          }}
        />
      ))}
    </div>
  );
};

export default BubbleEffect;