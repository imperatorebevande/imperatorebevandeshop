import React from 'react';
import RegularLogin from './RegularLogin';

interface LoginProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess, onClose }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <RegularLogin 
        onSuccess={onSuccess || onClose}
      />
    </div>
  );
};

export default Login;