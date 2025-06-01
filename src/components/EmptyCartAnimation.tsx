import React from 'react';
import LottieAnimation from './LottieAnimation';
// Animazione carrello vuoto da LottieFiles
import emptyCartAnimation from '../assets/animations/empty-cart.json';

const EmptyCartAnimation: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <LottieAnimation
        animationData={emptyCartAnimation}
        width={200}
        height={200}
        loop={true}
        autoplay={true}
      />
      <p className="text-gray-500 mt-4 text-center">
        Il tuo carrello è vuoto
      </p>
    </div>
  );
};

export default EmptyCartAnimation;