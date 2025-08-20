import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Send,
  Facebook,
  Instagram,
  Truck,
  ShoppingBag,
  Users,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { sendWhatsAppMessage, WhatsAppFormData } from '@/services/whatsappService';

const Contatti = () => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validazione base
      if (!formData.name.trim() || !formData.subject.trim() || !formData.message.trim()) {
        toast.error('Per favore, compila tutti i campi obbligatori.');
        setIsSubmitting(false);
        return;
      }

      // Invia il messaggio tramite WhatsApp
      const whatsappData: WhatsAppFormData = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim()
      };

      const result = await sendWhatsAppMessage(whatsappData);
      
      if (result.success) {
        toast.success(result.message);
        // Reset del form
        setFormData({
          name: '',
          subject: '',
          message: ''
        });
      } else {
        toast.error(result.message || 'Errore nell\'invio del messaggio');
      }
    } catch (error) {
      console.error('Errore durante l\'invio:', error);
      toast.error('Errore nell\'invio del messaggio. Riprova più tardi o contattaci direttamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 pb-16 md:pb-0">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-green-600 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 animate-fade-in">
            Contattaci
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto animate-fade-in-delay-1">
            Siamo qui per aiutarti! Contattaci per qualsiasi informazione sui nostri prodotti e servizi di consegna.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Informazioni di Contatto */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Contatti Principali */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <Phone className="w-6 h-6 mr-3" />
                  Contatti Diretti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Telefono</p>
                    <a href="tel:+393402486783" className="text-blue-600 hover:text-blue-800 transition-colors">
                      +39 340 248 6783
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">WhatsApp</p>
                    <a href="https://wa.me/393402486783" className="text-green-600 hover:text-green-800 transition-colors">
                      +39 340 248 6783
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <Mail className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Email</p>
                    <a href="mailto:info@imperatorebevande.it" className="text-red-600 hover:text-red-800 transition-colors">
                      info@imperatorebevande.it
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indirizzo e Orari */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <MapPin className="w-6 h-6 mr-3" />
                  Dove Siamo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                     <p className="font-semibold text-gray-800">Indirizzo</p>
                     <p className="text-gray-600">
                       Via Casamassima 81<br />
                       Zona Industriale<br />
                       Capurso 70010 (BA)<br />
                       Italia
                     </p>
                   </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Orari di Apertura</p>
                     <div className="text-gray-600 space-y-1">
                       <p>Lun - Ven: 07:00 - 16:00</p>
                       <p>Sabato: 07:00 - 14:00</p>
                       <p>Domenica: Chiuso</p>
                     </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <Users className="w-6 h-6 mr-3" />
                  Seguici
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <a 
                    href="https://www.facebook.com/imperatore.bevande" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors duration-300 transform hover:scale-110"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://www.instagram.com/explore/tags/imperatorebevande/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form di Contatto */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl text-gray-800">
                  <MessageSquare className="w-7 h-7 mr-3 text-green-600" />
                  Inviaci un Messaggio su WhatsApp
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Compila il form sottostante e ti contatteremo tramite WhatsApp!
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700 font-medium">
                        Nome Completo *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Il tuo nome e cognome"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-gray-700 font-medium">
                        Oggetto *
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Oggetto del messaggio"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-700 font-medium">
                      Messaggio *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      placeholder="Scrivi qui il tuo messaggio..."
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-5 h-5 mr-3" />
                        Invia su WhatsApp
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sezione Servizi */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              I Nostri Servizi
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Scopri tutti i servizi che offriamo per garantirti la migliore esperienza di acquisto
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-8">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Consegna a Domicilio
                </h3>
                <p className="text-gray-600">
                   Consegniamo direttamente a casa tua in tutta la zona di Bari e provincia
                 </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-8">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Prodotti di Qualità
                </h3>
                <p className="text-gray-600">
                  Selezioniamo solo i migliori prodotti per garantire qualità e freschezza
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-8">
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Servizio Clienti
                </h3>
                <p className="text-gray-600">
                  Il nostro team è sempre disponibile per aiutarti e rispondere alle tue domande
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mappa */}
        <div className="mt-20">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-gray-800">
                <MapPin className="w-7 h-7 mr-3 text-red-600" />
                Come Raggiungerci
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gray-200 overflow-hidden">
                 <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3006.123456789!2d17.0234567!3d41.0567890!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1347e9c123456789%3A0x123456789abcdef0!2sVia%20Casamassima%2C%2081%2C%2070010%20Capurso%20BA%2C%20Italy!5e0!3m2!1sit!2sit!4v1640995200000!5m2!1sit!2sit"
                   width="100%"
                   height="100%"
                   style={{ border: 0 }}
                   allowFullScreen
                   loading="lazy"
                   referrerPolicy="no-referrer-when-downgrade"
                   title="Mappa Imperatore Bevande - Via Casamassima 81, Capurso"
                   className="absolute inset-0 w-full h-full"
                 ></iframe>
                 <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                   <p className="text-sm font-semibold text-gray-800">
                     Via Casamassima 81, Zona Industriale
                   </p>
                   <p className="text-xs text-gray-600">
                     Capurso 70010 (BA)
                   </p>
                 </div>
               </div>
             </CardContent>
          </Card>
        </div>
       </div>
     </div>
   );
 };
 
 export default Contatti;