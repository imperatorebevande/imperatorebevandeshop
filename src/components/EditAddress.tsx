import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateWooCommerceCustomer } from '@/hooks/useWooCommerce';
import { WooCommerceCustomer } from '@/services/woocommerce';
import { Loader2 } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';

interface EditAddressProps {
  customer: WooCommerceCustomer;
  onClose: () => void;
}

const EditAddress: React.FC<EditAddressProps> = ({ customer, onClose }) => {
  const [formData, setFormData] = useState({
    shipping: {
      ...customer.shipping,
      first_name: customer.shipping.first_name || customer.first_name,
      last_name: customer.shipping.last_name || customer.last_name,
      address_1: customer.shipping.address_1 || '',

      city: customer.shipping.city || '',
      state: customer.shipping.state || '',
      postcode: customer.shipping.postcode || '',
      country: customer.shipping.country || 'IT',
    },
    billing: {
      ...customer.billing,
      address_1: customer.billing.address_1 || '',

      city: customer.billing.city || '',
      state: customer.billing.state || '',
      postcode: customer.billing.postcode || '',
      country: customer.billing.country || 'IT',
    }
  });

  const updateCustomer = useUpdateWooCommerceCustomer();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, addressType: 'shipping' | 'billing') => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [addressType]: {
        ...formData[addressType],
        [name]: value
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Funzione per validare l'email
    const isValidEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return email && email.trim() && emailRegex.test(email.trim());
    };
    
    // Pulisci e valida i dati prima dell'invio
    const cleanedData: {
      shipping: {
        first_name: string;
        last_name: string;
        company: string;
        address_1: string;
        address_2: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
      };
      billing: {
        first_name: string;
        last_name: string;
        company: string;
        address_1: string;
        address_2: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
        phone: string;
        email?: string;
      };
    } = {
      shipping: {
        first_name: formData.shipping.first_name?.trim() || '',
        last_name: formData.shipping.last_name?.trim() || '',
        company: formData.shipping.company || '',
        address_1: formData.shipping.address_1?.trim() || '',
        address_2: formData.shipping.address_2 || '',
        city: formData.shipping.city?.trim() || '',
        state: formData.shipping.state?.trim() || '',
        postcode: formData.shipping.postcode?.trim() || '',
        country: formData.shipping.country || 'IT'
      },
      billing: {
        first_name: formData.shipping.first_name?.trim() || '',
        last_name: formData.shipping.last_name?.trim() || '',
        company: formData.billing.company || '',
        address_1: formData.shipping.address_1?.trim() || '',
        address_2: formData.billing.address_2 || '',
        city: formData.shipping.city?.trim() || '',
        state: formData.shipping.state?.trim() || '',
        postcode: formData.shipping.postcode?.trim() || '',
        country: formData.shipping.country || 'IT',
        phone: customer.billing?.phone || ''
      }
    };
    
    // Aggiungi email solo se è valida
    if (isValidEmail(customer.email)) {
      cleanedData.billing.email = customer.email.trim();
    }
    
    console.log('Dati puliti da inviare:', cleanedData);
    
    updateCustomer.mutate({
      id: customer.id,
      customerData: cleanedData
    }, {
      onSuccess: () => {
        console.log('Chiusura del dialogo in corso...');
        // Chiusura immediata
        onClose();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
      <div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <Label htmlFor="shipping_first_name" className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Nome</Label>
            <Input
              id="shipping_first_name"
              name="first_name"
              value={formData.shipping.first_name}
              onChange={(e) => handleChange(e, 'shipping')}
              className="h-8 sm:h-9 focus:ring-[#1B5AAB] rounded-md text-[#1B5AAB] placeholder:text-[#1B5AAB]/60 selection:bg-[#1B5AAB]/20 text-sm border-gray-300 focus:border-[#1B5AAB]"
              required
            />
          </div>
          <div>
            <Label htmlFor="shipping_last_name" className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Cognome</Label>
            <Input
              id="shipping_last_name"
              name="last_name"
              value={formData.shipping.last_name}
              onChange={(e) => handleChange(e, 'shipping')}
              className="h-8 sm:h-9 focus:ring-[#1B5AAB] rounded-md text-[#1B5AAB] placeholder:text-[#1B5AAB]/60 selection:bg-[#1B5AAB]/20 text-sm border-gray-300 focus:border-[#1B5AAB]"
              required
            />
          </div>
        </div>
        <div>
          <AddressAutocomplete
            label="Indirizzo"
            placeholder="Inizia a digitare l'indirizzo..."
            value={formData.shipping.address_1}
            onChange={(value) => {
              setFormData({
                ...formData,
                shipping: {
                  ...formData.shipping,
                  address_1: value
                }
              });
            }}
            onAddressSelect={(addressDetails) => {
              setFormData({
                ...formData,
                shipping: {
                  ...formData.shipping,
                  address_1: addressDetails.address,
                  city: addressDetails.city,
                  state: addressDetails.province,
                  postcode: addressDetails.postalCode
                }
              });
            }}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <Label htmlFor="shipping_city" className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Città *</Label>
            <Input
              id="shipping_city"
              name="city"
              value={formData.shipping.city}
              onChange={(e) => handleChange(e, 'shipping')}
              className="h-8 sm:h-9 focus:ring-[#1B5AAB] rounded-md text-[#1B5AAB] placeholder:text-[#1B5AAB]/60 selection:bg-[#1B5AAB]/20 text-sm border-gray-300 focus:border-[#1B5AAB]"
              required
            />
          </div>
          <div>
            <Label htmlFor="shipping_state" className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Provincia *</Label>
            <Input
              id="shipping_state"
              name="state"
              value={formData.shipping.state}
              onChange={(e) => handleChange(e, 'shipping')}
              className="h-8 sm:h-9 focus:ring-[#1B5AAB] rounded-md text-[#1B5AAB] placeholder:text-[#1B5AAB]/60 selection:bg-[#1B5AAB]/20 text-sm border-gray-300 focus:border-[#1B5AAB]"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <Label htmlFor="shipping_postcode" className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">CAP *</Label>
            <Input
              id="shipping_postcode"
              name="postcode"
              value={formData.shipping.postcode}
              onChange={(e) => handleChange(e, 'shipping')}
              className="h-8 sm:h-9 focus:ring-[#1B5AAB] rounded-md text-[#1B5AAB] placeholder:text-[#1B5AAB]/60 selection:bg-[#1B5AAB]/20 text-sm border-gray-300 focus:border-[#1B5AAB]"
              required
            />
          </div>
          <div>
            <Label htmlFor="shipping_country" className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">Paese</Label>
            <Input
              id="shipping_country"
              name="country"
              value={formData.shipping.country}
              onChange={(e) => handleChange(e, 'shipping')}
              className="h-8 sm:h-9 bg-gray-50 border-gray-200 text-gray-500 rounded-md text-sm"
              readOnly
            />
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          className="flex-1 h-8 sm:h-9 border-2 border-gray-300 text-gray-700 hover:bg-[#A40800] hover:text-white hover:border-[#A40800] transition-all duration-200 rounded-md font-medium text-sm"
        >
          Annulla
        </Button>
        <Button 
          type="submit" 
          disabled={updateCustomer.isPending}
          className="flex-1 h-8 sm:h-9 bg-[#1B5AAB] hover:bg-[#164a94] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-md font-medium shadow-lg hover:shadow-xl text-sm"
        >
          {updateCustomer.isPending ? (
            <div className="flex items-center justify-center gap-1">
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              <span className="hidden sm:inline">Salvando...</span>
              <span className="sm:hidden">...</span>
            </div>
          ) : (
            <>
              <span className="hidden sm:inline">Salva Modifiche</span>
              <span className="sm:hidden">Salva</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default EditAddress;