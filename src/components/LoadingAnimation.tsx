import React from 'react';
import LottieAnimation from './LottieAnimation';
import loadingAnimationData from '../assets/animations/Loading.json';

interface LoadingAnimationProps {
  width?: number;
  height?: number;
  text?: string;
  className?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  width = 200,
  height = 200,
  text = "Caricamento...",
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <LottieAnimation
        animationData={loadingAnimationData}
        width={width}
        height={height}
        loop={true}
        autoplay={true}
      />
      {text && (
        <p className="mt-4 text-lg font-medium text-gray-700 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingAnimation;