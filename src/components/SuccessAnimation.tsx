import React from 'react';
import LottieAnimation from './LottieAnimation';
// Animazione di successo da LottieFiles
import successAnimation from '../assets/animations/success.json';

interface SuccessAnimationProps {
  onComplete?: () => void;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ onComplete }) => {
  return (
    <LottieAnimation
      animationData={successAnimation}
      width={60}
      height={60}
      loop={false}
      autoplay={true}
      onComplete={onComplete}
    />
  );
};

export default SuccessAnimation;