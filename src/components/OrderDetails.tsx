import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, CreditCard, Calendar, User } from 'lucide-react';
import { WooCommerceOrder } from '@/services/woocommerce';

interface OrderDetailsProps {
  order: WooCommerceOrder;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: string) => {
    return `${parseFloat(price).toFixed(2)}€`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completato';
      case 'processing': return 'In elaborazione';
      case 'pending': return 'In attesa';
      case 'cancelled': return 'Annullato';
      case 'refunded': return 'Rimborsato';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header Ordine */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-[#1B5AAB]">Ordine #{order.number}</h2>
          <p className="text-gray-600">Creato il {formatDate(order.date_created)}</p>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {getStatusText(order.status)}
        </Badge>
      </div>

      {/* Prodotti Ordinati */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Prodotti Ordinati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.line_items.map((item, index) => (
              <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {item.image && (
                    <img 
                      src={item.image.src} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-600">Quantità: {item.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(item.total)}</p>
                  <p className="text-sm text-gray-600">{formatPrice((parseFloat(item.total) / item.quantity).toString())} cad.</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Riepilogo Prezzi */}
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Ordine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotale:</span>
              <span>{formatPrice((parseFloat(order.total) - parseFloat(order.shipping_total) - parseFloat(order.total_tax)).toString())}</span>
            </div>
            {parseFloat(order.shipping_total) > 0 && (
              <div className="flex justify-between">
                <span>Spedizione:</span>
                <span>{formatPrice(order.shipping_total)}</span>
              </div>
            )}
            {parseFloat(order.total_tax) > 0 && (
              <div className="flex justify-between">
                <span>Tasse:</span>
                <span>{formatPrice(order.total_tax)}</span>
              </div>
            )}
            {parseFloat(order.discount_total) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Sconto:</span>
                <span>-{formatPrice(order.discount_total)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Totale:</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indirizzi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Indirizzo di Fatturazione */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Indirizzo di Fatturazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-semibold">{order.billing.first_name} {order.billing.last_name}</p>
              {order.billing.company && <p>{order.billing.company}</p>}
              <p>{order.billing.address_1}</p>
              {order.billing.address_2 && <p>{order.billing.address_2}</p>}
              <p>{order.billing.postcode} {order.billing.city}</p>
              <p>{order.billing.state}, {order.billing.country}</p>
              <p className="text-sm text-gray-600">{order.billing.email}</p>
              {order.billing.phone && <p className="text-sm text-gray-600">{order.billing.phone}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Indirizzo di Spedizione */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Indirizzo di Spedizione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-semibold">{order.shipping.first_name} {order.shipping.last_name}</p>
              {order.shipping.company && <p>{order.shipping.company}</p>}
              <p>{order.shipping.address_1}</p>
              {order.shipping.address_2 && <p>{order.shipping.address_2}</p>}
              <p>{order.shipping.postcode} {order.shipping.city}</p>
              <p>{order.shipping.state}, {order.shipping.country}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informazioni Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Informazioni Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Metodo di Pagamento:</span>
              <span className="font-semibold">{order.payment_method_title}</span>
            </div>
            {order.transaction_id && (
              <div className="flex justify-between">
                <span>ID Transazione:</span>
                <span className="font-mono text-sm">{order.transaction_id}</span>
              </div>
            )}
            {order.date_paid && (
              <div className="flex justify-between">
                <span>Data Pagamento:</span>
                <span>{formatDate(order.date_paid)}</span>
              </div>
            )}
            {order.date_completed && (
              <div className="flex justify-between">
                <span>Data Completamento:</span>
                <span>{formatDate(order.date_completed)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Note Cliente */}
      {order.customer_note && (
        <Card>
          <CardHeader>
            <CardTitle>Note del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{order.customer_note}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderDetails;