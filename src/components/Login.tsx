import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import PhoneLogin from './PhoneLogin';
import RegularLogin from './RegularLogin'; // Il componente login originale rinominato

interface LoginProps {
  onSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState('phone');

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="phone">Accesso Rapido</TabsTrigger>
          <TabsTrigger value="regular">Login Completo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="phone" className="mt-4">
          <PhoneLogin 
            onSuccess={onSuccess}
            onSwitchToRegularLogin={() => setActiveTab('regular')}
          />
        </TabsContent>
        
        <TabsContent value="regular" className="mt-4">
          <RegularLogin 
            onSuccess={onSuccess}
            onSwitchToPhoneLogin={() => setActiveTab('phone')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Login;