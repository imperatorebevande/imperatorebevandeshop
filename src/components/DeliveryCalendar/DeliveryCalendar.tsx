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
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false); // NUOVO
  const [error, setError] = useState<string | null>(null);

  // Fasce orarie standard sempre visibili
  const standardTimeSlots = [
    "07:00 - 08:00",
    "08:00 - 09:00", 
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00"
  ];

  // Funzione helper per formattare le date
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Caricamento iniziale del calendario
  const loadCalendarData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await wooCommerceService.getDeliveryCalendar() as any;
      
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
  }, []); // Nessuna dipendenza per evitare loop

  // Caricamento iniziale del calendario
  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Funzione per caricare gli slot per una data specifica
  const loadTimeSlotsForDate = useCallback(async (date: Date) => {
    const dateString = formatDateLocal(date);
    console.log('🔄 Caricamento time slots dinamici per data:', dateString);
    
    setIsLoadingTimeSlots(true); // NUOVO: Inizia loading
    
    try {
      // SEMPRE usa l'API dinamica per avere i dati più aggiornati
      console.log('🔄 Chiamata API dinamica per:', dateString);
      const timeSlots = await wooCommerceService.getDeliveryTimeSlotsForDate(dateString);
      
      if (timeSlots && Array.isArray(timeSlots) && timeSlots.length > 0) {
        const availableSlots = timeSlots.map(slot => slot.time_slot).filter(Boolean);
        console.log('✅ Time slots dinamici disponibili:', availableSlots);
        setAvailableTimeSlots(availableSlots);
      } else {
        console.log('❌ Nessun time slot disponibile per questa data');
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento time slots dinamici:', error);
      setAvailableTimeSlots([]);
      toast.error('Errore nel caricamento delle fasce orarie');
    } finally {
      setIsLoadingTimeSlots(false); // NUOVO: Fine loading
    }
  }, []); // Rimuovi apiData dalle dipendenze

  // Effetto per caricare gli slot quando cambia la data selezionata
  useEffect(() => {
    if (selectedDate) {
      console.log('📅 Data selezionata cambiata:', formatDateLocal(selectedDate));
      loadTimeSlotsForDate(selectedDate);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedDate, loadTimeSlotsForDate]);

  // Auto-selezione della prima data disponibile
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let dateToSelect = availableDates[0];
      
      // Se la prima data è oggi e ci sono altre date, usa la seconda
      if (availableDates.length > 1) {
        const firstDate = new Date(availableDates[0]);
        firstDate.setHours(0, 0, 0, 0);
        
        if (firstDate.getTime() === today.getTime()) {
          dateToSelect = availableDates[1];
        }
      }
      
      console.log('🎯 Auto-selezione prima data disponibile:', formatDateLocal(dateToSelect));
      setSelectedDate(dateToSelect);
      onDateTimeChange(formatDateLocal(dateToSelect), '');
    }
  }, [availableDates, selectedDate, onDateTimeChange]);

  const handleDateSelect = (date: Date | undefined) => {
    console.log('📅 Data selezionata manualmente:', date ? formatDateLocal(date) : 'nessuna');
    setSelectedDate(date);
    
    if (date) {
      const dateString = formatDateLocal(date);
      onDateTimeChange(dateString, ''); // Reset time slot
    } else {
      onDateTimeChange('', '');
      setAvailableTimeSlots([]);
    }
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    if (!selectedDate) return;
    const dateString = formatDateLocal(selectedDate);
    console.log('⏰ Slot orario selezionato:', timeSlot);
    onDateTimeChange(dateString, timeSlot);
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Caricamento calendario...</span>
      </div>
    );
  }

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
          
          {/* NUOVO: Mostra loading durante il caricamento */}
          {isLoadingTimeSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Caricamento fasce orarie...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {standardTimeSlots
                .filter(timeSlot => {
                  // Se è sabato, nascondi gli slot 14:00-15:00 e 15:00-16:00
                  if (selectedDate && selectedDate.getDay() === 6) { // 6 = sabato
                    return timeSlot !== "14:00 - 15:00" && timeSlot !== "15:00 - 16:00";
                  }
                  return true; // Mostra tutti gli slot per gli altri giorni
                })
                .map((timeSlot, index) => {
                const isAvailable = availableTimeSlots.includes(timeSlot);
                const isSelected = formData.deliveryTimeSlot === timeSlot;
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => isAvailable ? handleTimeSlotSelect(timeSlot) : null}
                    disabled={!isAvailable}
                    className={`
                      px-3 py-2 rounded-md border-2 text-sm font-bold transition-colors flex flex-col items-center justify-center relative min-h-[60px]
                      ${
                        !isAvailable
                          ? 'cursor-not-allowed bg-white'
                          : isSelected
                          ? 'cursor-pointer'
                          : 'cursor-pointer hover:opacity-80 bg-white'
                      }
                    `}
                    style={{
                      borderColor: !isAvailable ? '#A40800' : isSelected ? '#3F691D' : '#1B5AAB',
                      backgroundColor: isSelected ? '#3F691D' : 'white',
                      color: isSelected ? 'white' : (!isAvailable ? '#A40800' : '#1B5AAB')
                    }}
                  >
                    <span className="font-bold">
                      {timeSlot}
                    </span>
                    {isSelected ? (
                      <span className="text-white font-bold text-lg mt-1">✓</span>
                    ) : isAvailable ? (
                      <span className="font-bold text-xs mt-1" style={{ color: '#1B5AAB' }}>
                        DISPONIBILE
                      </span>
                    ) : (
                      <span className="font-bold text-xs mt-1" style={{ color: '#A40800' }}>
                        AL COMPLETO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryCalendar;