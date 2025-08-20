import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Smartphone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SatispayCheckoutProps {
  amount: string;
  currency?: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
}

const SatispayCheckout: React.FC<SatispayCheckoutProps> = ({
  amount,
  currency = 'EUR',
  onSuccess,
  onError
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'input' | 'processing' | 'success'>('input');

  const handleSatispayPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Inserisci un numero di telefono valido');
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // Simula una chiamata API per iniziare il pagamento Satispay
      // In un'implementazione reale, qui faresti una chiamata al tuo backend
      // che comunica con l'API di Satispay
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simula attesa
      
      // Simula successo del pagamento
      const paymentDetails = {
        id: `satispay_${Date.now()}`,
        status: 'completed',
        amount: amount,
        currency: currency,
        phone_number: phoneNumber,
        payment_method: 'satispay',
        created_at: new Date().toISOString()
      };

      setPaymentStep('success');
      toast.success('Pagamento Satispay completato con successo!');
      
      // Attendi un momento per mostrare il successo, poi chiama onSuccess
      setTimeout(() => {
        onSuccess(paymentDetails);
      }, 1500);
      
    } catch (error) {
      console.error('Errore pagamento Satispay:', error);
      toast.error('Errore nel pagamento Satispay. Riprova.');
      onError(error);
      setPaymentStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Rimuovi tutti i caratteri non numerici
    const numbers = value.replace(/\D/g, '');
    
    // Aggiungi il prefisso +39 se non presente
    if (numbers.length > 0 && !numbers.startsWith('39')) {
      return '+39 ' + numbers;
    } else if (numbers.startsWith('39')) {
      return '+' + numbers.slice(0, 2) + ' ' + numbers.slice(2);
    }
    
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  if (paymentStep === 'processing') {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Smartphone className="w-16 h-16 text-red-500" />
            <Loader2 className="w-6 h-6 animate-spin absolute -top-1 -right-1 text-blue-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Pagamento in corso...
            </h3>
            <p className="text-sm text-gray-600">
              Controlla il tuo smartphone per confermare il pagamento Satispay
            </p>
            <p className="text-xs text-gray-500">
              Importo: {amount}€
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-green-700">
              Pagamento completato!
            </h3>
            <p className="text-sm text-gray-600">
              Il tuo ordine è stato processato con successo
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Smartphone className="w-5 h-5 text-red-500" />
        <span className="text-sm font-medium text-gray-700">
          Pagamento con Satispay
        </span>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="satispay-phone" className="text-sm font-medium text-gray-700">
            Numero di telefono associato a Satispay
          </Label>
          <Input
            id="satispay-phone"
            type="tel"
            placeholder="+39 123 456 7890"
            value={phoneNumber}
            onChange={handlePhoneChange}
            className="mt-1"
            disabled={isProcessing}
          />
          <p className="text-xs text-gray-500 mt-1">
            Inserisci il numero di telefono collegato al tuo account Satispay
          </p>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Importo da pagare:</span>
            <span className="text-lg font-bold text-blue-600">{amount}€</span>
          </div>
        </div>
        
        <Button
          onClick={handleSatispayPayment}
          disabled={!phoneNumber || phoneNumber.length < 10 || isProcessing}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Elaborazione...
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 mr-2" />
              Paga con Satispay
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          Riceverai una notifica sul tuo smartphone per confermare il pagamento
        </p>
      </div>
    </div>
  );
};

export default SatispayCheckout;