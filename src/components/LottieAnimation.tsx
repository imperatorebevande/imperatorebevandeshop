import React from 'react';
import Lottie from 'lottie-react';

interface LottieAnimationProps {
  animationData: any;
  width?: number | string;
  height?: number | string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
  speed?: number;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({
  animationData,
  width = 200,
  height = 200,
  loop = true,
  autoplay = true,
  className = '',
  style = {},
  onComplete,
  speed = 1
}) => {
  const defaultStyle: React.CSSProperties = {
    width,
    height,
    ...style
  };

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      style={defaultStyle}
      className={className}
      onComplete={onComplete}
      speed={speed}
    />
  );
};

export default LottieAnimation;