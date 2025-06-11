import React, { useState, useEffect, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { wooCommerceService } from '@/services/woocommerce';
import { toast } from 'sonner';
import { it } from 'date-fns/locale'; // AGGIUNTO: Locale italiano

// Interfacce basate sulla risposta API reale
interface ApiSlot {
  date: string;  // formato "2025-06-09"
  day: string;   // "Lunedì", "Martedì", etc.
  slots: string[]; // array di fasce orarie
}

interface ApiResponse {
  success: boolean;
  data: ApiSlot[];
  message?: string;
}

interface DeliveryCalendarProps {
  formData: {
    deliveryDate: string;
    deliveryTimeSlot: string;
  };
  onDateTimeChange: (date: string, timeSlot: string) => void;
}

const DeliveryCalendar: React.FC<DeliveryCalendarProps> = ({ formData, onDateTimeChange }) => {
  const [apiData, setApiData] = useState<ApiSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    formData.deliveryDate ? new Date(formData.deliveryDate) : undefined
  );
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Aggiungi questa funzione helper per formattare le date
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // CORREZIONE: Rimuovi selectedDate dalle dipendenze per evitare loop infiniti
  const loadCalendarData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await wooCommerceService.getDeliveryCalendar() as any;
      
      // Gestisci diversi formati di risposta
      let slots: ApiSlot[] = [];
      
      if (Array.isArray(response)) {
        slots = response;
      } else if (response && Array.isArray(response.data)) {
        slots = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        slots = response.data;
      }
      
      setApiData(slots);
      
      if (slots && slots.length > 0) {
        const validDates = slots
          .filter(slot => slot.slots && slot.slots.length > 0)
          .map(slot => {
            const dateParts = slot.date.split('-');
            const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            date.setHours(0, 0, 0, 0);
            return date;
          })
          .filter(date => !isNaN(date.getTime()));
        
        const sortedDates = validDates.sort((a, b) => a.getTime() - b.getTime());
        setAvailableDates(sortedDates);
      } else {
        setAvailableDates([]);
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('❌ Errore caricamento calendario:', error);
      setError('Errore nel caricamento del calendario');
      setApiData([]);
      setAvailableDates([]);
      setAvailableTimeSlots([]);
      toast.error('Errore nel caricamento delle date disponibili');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTimeSlots = useCallback((date: Date, slots: ApiSlot[]) => {
    const dateString = formatDateLocal(date);
    console.log('🕐 Aggiornamento time slots per data:', dateString);
    console.log('🔍 Tutti gli slots disponibili:', slots);
    
    const daySlot = slots.find(slot => {
      const slotDate = formatDateLocal(new Date(slot.date));
      console.log('🔍 Confronto:', slotDate, 'con', dateString);
      return slotDate === dateString;
    });
    console.log('🔍 Slot trovato per la data:', daySlot);
    
    if (daySlot && daySlot.slots && daySlot.slots.length > 0) {
      console.log('✅ Time slots disponibili:', daySlot.slots);
      setAvailableTimeSlots(daySlot.slots);
    } else {
      console.log('❌ Nessun time slot disponibile per questa data');
      setAvailableTimeSlots([]);
    }
  }, []);

  // Aggiungi questa nuova funzione dopo updateTimeSlots
  const loadTimeSlotsForDate = useCallback((date: Date) => {
    console.log('🔄 Caricamento time slots per data:', formatDateLocal(date));
    updateTimeSlots(date, apiData);
  }, [updateTimeSlots, apiData]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // CORREZIONE: Aggiungi più logging e gestisci meglio l'aggiornamento dei time slots
  useEffect(() => {
    console.log('🔄 Effect per aggiornamento time slots');
    console.log('📅 selectedDate:', selectedDate?.toISOString().split('T')[0]);
    console.log('📊 apiData.length:', apiData.length);
    
    if (selectedDate && apiData.length > 0) {
      console.log('✅ Condizioni soddisfatte, aggiorno time slots');
      updateTimeSlots(selectedDate, apiData);
    } else {
      console.log('❌ Condizioni non soddisfatte, resetto time slots');
      setAvailableTimeSlots([]);
    }
  }, [selectedDate, apiData, updateTimeSlots]);

  // Modifica il useEffect esistente per aggiornare sempre gli slot quando cambia la data
  useEffect(() => {
    console.log('🔄 Effect per aggiornamento time slots');
    console.log('📅 selectedDate:', selectedDate ? formatDateLocal(selectedDate) : 'nessuna');
    console.log('📊 apiData.length:', apiData.length);
    
    if (selectedDate && apiData.length > 0) {
      console.log('✅ Condizioni soddisfatte, aggiorno time slots');
      // Usa loadTimeSlotsForDate invece di updateTimeSlots per avere sempre dati aggiornati
      loadTimeSlotsForDate(selectedDate);
    } else {
      console.log('❌ Condizioni non soddisfatte, resetto time slots');
      setAvailableTimeSlots([]);
    }
  }, [selectedDate, apiData, loadTimeSlotsForDate]);

  // Modifica handleDateSelect per essere più semplice
  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    const dateString = formatDateLocal(date);
    console.log('📅 Data selezionata manualmente:', dateString);
    setSelectedDate(date);
    onDateTimeChange(dateString, ''); // Reset time slot
    
    // Non serve chiamare loadTimeSlotsForDate qui perché lo fa già il useEffect
  };

  // AGGIUNTA: Funzione per gestire la selezione dello slot orario
  const handleTimeSlotSelect = (timeSlot: string) => {
    if (!selectedDate) return;
    const dateString = formatDateLocal(selectedDate);
    console.log('⏰ Slot orario selezionato:', timeSlot);
    onDateTimeChange(dateString, timeSlot);
  };

  // Aggiorna anche isDateDisabled
  const isDateDisabled = (date: Date) => {
    // Disabilita date passate E la data odierna
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date <= today) return true; // Cambiato da < a <= per includere oggi
    
    // Disabilita date non disponibili
    const dateString = formatDateLocal(date);
    return !availableDates.some(availableDate => 
      formatDateLocal(availableDate) === dateString
    );
  };

  // Funzione per personalizzare il rendering delle date
  const customDayContent = (date: Date) => {
    const isDisabled = isDateDisabled(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = date < today;
    const isSunday = date.getDay() === 0; // 0 = Domenica
    
    // Domenica - testo rosso in grassetto con tooltip "AZIENDA CHIUSA"
    if (isSunday) {
      return (
        <div 
          className="relative w-full h-full flex items-center justify-center"
          title="AZIENDA CHIUSA"
        >
          <span className="text-red-600 font-bold">{date.getDate()}</span>
        </div>
      );
    }
    
    // Date disabilitate (al completo) - X rossa con tooltip "AL COMPLETO"
    if (isDisabled && !isPast) {
      return (
        <div 
          className="relative w-full h-full flex items-center justify-center"
          title="AL COMPLETO"
        >
          <span className="text-gray-300">{date.getDate()}</span>
          <span className="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-lg">×</span>
        </div>
      );
    }
    
    return date.getDate();
  };

  // Sposta il useEffect PRIMA del return condizionale
  // Auto-selezione della prima data disponibile con delay
  useEffect(() => {
    // Verifica che availableDates sia definito e abbia elementi
    if (Array.isArray(availableDates) && availableDates.length > 0 && !selectedDate) {
      const timer = setTimeout(() => {
        // Ottieni la data odierna per il confronto
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let dateToSelect = availableDates[0]; // Prima data disponibile
        
        // Se la prima data è oggi e ci sono altre date disponibili, salta alla seconda
        if (availableDates.length > 1) {
          const firstDate = availableDates[0];
          const firstDateNormalized = new Date(firstDate);
          firstDateNormalized.setHours(0, 0, 0, 0);
          
          if (firstDateNormalized.getTime() === today.getTime()) {
            dateToSelect = availableDates[1]; // Usa la seconda data
          }
        }
        
        if (dateToSelect) {
          setSelectedDate(dateToSelect);
          onDateTimeChange(formatDateLocal(dateToSelect), '');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [availableDates, selectedDate, onDateTimeChange]);

  // Condizione di caricamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Caricamento calendario...</span>
      </div>
    );
  }

  // Condizione di errore
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <div className="space-y-2">
          <button
            onClick={loadCalendarData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Riprova
          </button>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              loadCalendarData();
            }}
            className="ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Aggiorna
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div>
        <Label className="text-base font-medium mb-3 block text-center text-blue-800">Seleziona la data in cui vorresti la consegna</Label>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            locale={it} // AGGIUNTO: Locale italiano
            weekStartsOn={1} // AGGIUNTO: Inizia da lunedì (1 = lunedì, 0 = domenica)
            className="rounded-md border"
            components={{
              DayContent: ({ date }) => customDayContent(date) // AGGIUNTO: Rendering personalizzato
            }}
          />
        </div>
      </div>

      {selectedDate && (
        <div>
        <Label className="text-base font-medium mb-3 block text-center text-blue-800">Seleziona la Fascia Oraria</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableTimeSlots.length > 0 ? (
              availableTimeSlots.map((timeSlot, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTimeSlotSelect(timeSlot)}
                  className={`
                    px-3 py-2 rounded-md border text-sm font-medium transition-colors flex items-center justify-center relative
                    ${
                      formData.deliveryTimeSlot === timeSlot
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                    }
                  `}
                >
                  {timeSlot}
                  {formData.deliveryTimeSlot === timeSlot && (
                    <span className="text-white font-bold absolute right-2">✓</span>
                  )}
                </button>
              ))
            ) : (
              <div className="col-span-full text-center py-4 text-gray-500">
                Nessuna fascia oraria disponibile per questa data
                {selectedDate && (
                  <div className="text-xs mt-1">
                    Data selezionata: {selectedDate.toISOString().split('T')[0]}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryCalendar;