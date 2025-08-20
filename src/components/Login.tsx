import React, { useState } from 'react';
import RegularLogin from './RegularLogin';
import Register from './Register';

interface LoginProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess, onClose }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSwitchToRegister = () => {
    setIsRegistering(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegistering(false);
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {isRegistering ? (
        <Register 
          onSuccess={handleSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      ) : (
        <RegularLogin 
          onSuccess={handleSuccess}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}
    </div>
  );
};

export default Login;