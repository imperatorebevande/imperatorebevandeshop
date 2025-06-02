import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateWooCommerceCustomer } from '@/hooks/useWooCommerce';
import { WooCommerceCustomer } from '@/services/woocommerce';
import { Loader2 } from 'lucide-react';

interface EditProfileProps {
  customer: WooCommerceCustomer;
  onClose: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ customer, onClose }) => {
  const [formData, setFormData] = useState({
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email,
    username: customer.username,
    billing: {
      ...customer.billing,
      phone: customer.billing.phone || ''
    }
  });

  const updateCustomer = useUpdateWooCommerceCustomer();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      setFormData({
        ...formData,
        billing: {
          ...formData.billing,
          phone: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="first_name">Nome</Label>
        <Input
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="last_name">Cognome</Label>
        <Input
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Telefono</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.billing.phone}
          onChange={handleChange}
        />
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

export default EditProfile;