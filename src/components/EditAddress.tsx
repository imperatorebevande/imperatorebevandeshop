import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateWooCommerceCustomer } from '@/hooks/useWooCommerce';
import { WooCommerceCustomer } from '@/services/woocommerce';
import { Loader2 } from 'lucide-react';

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
      address_2: customer.shipping.address_2 || '',
      city: customer.shipping.city || '',
      state: customer.shipping.state || '',
      postcode: customer.shipping.postcode || '',
      country: customer.shipping.country || 'IT',
    },
    billing: {
      ...customer.billing,
      address_1: customer.billing.address_1 || '',
      address_2: customer.billing.address_2 || '',
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
    updateCustomer.mutate({
      id: customer.id,
      customerData: formData
    }, {
      onSuccess: () => {
        console.log('Chiusura del dialogo in corso...');
        // Chiusura immediata
        onClose();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Indirizzo di Spedizione</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="shipping_first_name">Nome</Label>
            <Input
              id="shipping_first_name"
              name="first_name"
              value={formData.shipping.first_name}
              onChange={(e) => handleChange(e, 'shipping')}
              required
            />
          </div>
          <div>
            <Label htmlFor="shipping_last_name">Cognome</Label>
            <Input
              id="shipping_last_name"
              name="last_name"
              value={formData.shipping.last_name}
              onChange={(e) => handleChange(e, 'shipping')}
              required
            />
          </div>
        </div>
        <div className="mt-2">
          <Label htmlFor="shipping_address_1">Indirizzo</Label>
          <Input
            id="shipping_address_1"
            name="address_1"
            value={formData.shipping.address_1}
            onChange={(e) => handleChange(e, 'shipping')}
            required
          />
        </div>
        <div className="mt-2">
          <Label htmlFor="shipping_address_2">Indirizzo (linea 2)</Label>
          <Input
            id="shipping_address_2"
            name="address_2"
            value={formData.shipping.address_2}
            onChange={(e) => handleChange(e, 'shipping')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label htmlFor="shipping_city">Città</Label>
            <Input
              id="shipping_city"
              name="city"
              value={formData.shipping.city}
              onChange={(e) => handleChange(e, 'shipping')}
              required
            />
          </div>
          <div>
            <Label htmlFor="shipping_state">Provincia</Label>
            <Input
              id="shipping_state"
              name="state"
              value={formData.shipping.state}
              onChange={(e) => handleChange(e, 'shipping')}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label htmlFor="shipping_postcode">CAP</Label>
            <Input
              id="shipping_postcode"
              name="postcode"
              value={formData.shipping.postcode}
              onChange={(e) => handleChange(e, 'shipping')}
              required
            />
          </div>
          <div>
            <Label htmlFor="shipping_country">Paese</Label>
            <Input
              id="shipping_country"
              name="country"
              value={formData.shipping.country}
              onChange={(e) => handleChange(e, 'shipping')}
              required
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Annulla
        </Button>
        <Button type="submit" disabled={updateCustomer.isPending}>
          {updateCustomer.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Salvataggio...
            </>
          ) : (
            'Salva Modifiche'
          )}
        </Button>
      </div>
    </form>
  );
};

export default EditAddress;