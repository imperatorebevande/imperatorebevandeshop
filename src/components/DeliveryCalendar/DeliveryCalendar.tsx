import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { wooCommerceService } from '@/services/woocommerce';
import { toast } from 'sonner';
import { it } from 'date-fns/locale'; // AGGIUNTO: Locale italiano
import { DeliveryZone, getRecommendedTimeSlotsForZone, getExcludedTimeSlotsForZone } from '@/config/deliveryZones';

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
  deliveryZone?: DeliveryZone | null;
}

const DeliveryCalendar: React.FC<DeliveryCalendarProps> = ({ formData, onDateTimeChange, deliveryZone }) => {
  const [apiData, setApiData] = useState<ApiSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    formData.deliveryDate ? new Date(formData.deliveryDate) : undefined
  );
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false); // NUOVO
  const [retryAttempt, setRetryAttempt] = useState(0); // NUOVO: Contatore tentativi
  const [error, setError] = useState<string | null>(null);

  // Log della zona di consegna quando cambia
  useEffect(() => {
    if (deliveryZone) {
      console.log('🎯 Zona di consegna ricevuta nel calendario:', {
        id: deliveryZone.id,
        name: deliveryZone.name,
        description: deliveryZone.description
      });
    } else {
      console.log('⚠️ Nessuna zona di consegna specificata nel calendario');
    }
  }, [deliveryZone]);

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
          // Non filtrare per slot vuoti perché vengono caricati dinamicamente
          .map(slot => {
            const dateParts = slot.date.split('-');
            const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            date.setHours(0, 0, 0, 0);
            return date;
          })
          .filter(date => !isNaN(date.getTime()));
        
        const sortedDates = validDates.sort((a, b) => a.getTime() - b.getTime());
        setAvailableDates(sortedDates);
        console.log('📅 Date disponibili caricate:', sortedDates.length, 'date');
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
    setRetryAttempt(0); // Reset contatore tentativi
    
    try {
      // SEMPRE usa l'API dinamica per avere i dati più aggiornati
      console.log('🔄 Chiamata API dinamica per:', dateString);
      const timeSlots = await wooCommerceService.getDeliveryTimeSlotsForDate(
        dateString, 
        deliveryZone?.id // Passa l'ID della zona di consegna
      );
      
      console.log('📥 Risposta API ricevuta:', {
        type: typeof timeSlots,
        isArray: Array.isArray(timeSlots),
        length: Array.isArray(timeSlots) ? timeSlots.length : 'N/A',
        data: timeSlots
      });
      
      if (timeSlots && Array.isArray(timeSlots) && timeSlots.length > 0) {
        // Il nuovo metodo restituisce già un array di stringhe, non oggetti
        let availableSlots = timeSlots
          .filter(slot => slot && slot !== "NA" && slot.trim() !== "");
        
        // Filtra le fasce orarie in base alla zona di consegna
        if (deliveryZone) {
          console.log(`🔍 Filtraggio time slots per zona ${deliveryZone.name} (ID: ${deliveryZone.id})`);
          console.log('📋 Time slots originali dall\'API:', availableSlots);
          
          const excludedSlots = getExcludedTimeSlotsForZone(deliveryZone.id);
          const recommendedSlots = getRecommendedTimeSlotsForZone(deliveryZone.id);
          
          console.log('❌ Fasce orarie escluse:', excludedSlots);
          console.log('⭐ Fasce orarie raccomandate:', recommendedSlots);
          
          // Rimuovi le fasce orarie escluse
          const slotsBeforeExclusion = [...availableSlots];
          availableSlots = availableSlots.filter(slot => !excludedSlots.includes(slot));
          
          if (excludedSlots.length > 0) {
            console.log('🚫 Time slots dopo rimozione esclusi:', availableSlots);
            console.log('🗑️ Time slots rimossi:', slotsBeforeExclusion.filter(slot => !availableSlots.includes(slot)));
          }
          
          // Se ci sono fasce raccomandate, ordinale per prime
          if (recommendedSlots.length > 0) {
            const recommended = availableSlots.filter(slot => recommendedSlots.includes(slot));
            const others = availableSlots.filter(slot => !recommendedSlots.includes(slot));
            availableSlots = [...recommended, ...others];
            console.log('📊 Time slots riordinati (raccomandati primi):', availableSlots);
          }
          
          console.log(`✅ Time slots finali per zona ${deliveryZone.name}:`, availableSlots);
        } else {
          console.log('✅ Time slots dinamici disponibili (nessuna zona):', availableSlots);
        }
        
        setAvailableTimeSlots(availableSlots);
      } else {
        console.log('❌ Nessun time slot disponibile per questa data');
        setAvailableTimeSlots([]);
        toast.info('Nessuna fascia oraria disponibile per questa data');
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento time slots dinamici:', error);
      
      // Gestione migliorata per errori di rete e Axios
      const isNetworkError = (
        (error instanceof Error && (
          error.message.includes('Network Error') ||
          error.message.includes('ERR_NETWORK') ||
          error.message.includes('ECONNABORTED') ||
          error.message.includes('timeout')
        )) ||
        (error && typeof error === 'object' && 'code' in error && (
          error.code === 'ERR_NETWORK' ||
          error.code === 'ECONNABORTED' ||
          error.code === 'NETWORK_ERROR'
        ))
      );
      
      if (isNetworkError) {
        console.log('🔄 Errore di rete rilevato, utilizzo fasce orarie di fallback');
        
        // Fasce orarie di fallback per quando l'API non è raggiungibile
        const fallbackSlots = [
          '09:00-12:00',
          '15:00-18:00',
          '18:00-21:00'
        ];
        
        // Applica i filtri della zona se disponibile
        let filteredFallbackSlots = fallbackSlots;
        if (deliveryZone) {
          const excludedSlots = getExcludedTimeSlotsForZone(deliveryZone.id);
          filteredFallbackSlots = fallbackSlots.filter(slot => !excludedSlots.includes(slot));
        }
        
        setAvailableTimeSlots(filteredFallbackSlots);
        toast.warning('Connessione limitata. Mostrate fasce orarie standard.');
      } else {
        console.log('🔍 Errore non di rete, dettagli:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: typeof error,
          error: error
        });
        setAvailableTimeSlots([]);
        toast.error('Errore nel caricamento delle fasce orarie. Riprova più tardi.');
      }
    } finally {
      setIsLoadingTimeSlots(false); // NUOVO: Fine loading
    }
  }, [deliveryZone]); // Aggiungi deliveryZone alle dipendenze per ricaricare quando cambia la zona

  // Effetto per caricare gli slot quando cambia la data selezionata
  useEffect(() => {
    if (selectedDate) {
      console.log('📅 Data selezionata cambiata:', formatDateLocal(selectedDate));
      console.log('🎯 Zona corrente:', deliveryZone ? `${deliveryZone.name} (${deliveryZone.id})` : 'Nessuna zona');
      loadTimeSlotsForDate(selectedDate);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedDate]); // Rimuovi loadTimeSlotsForDate per evitare ricaricamenti non necessari

  // Effetto separato per ricaricare gli slot quando cambia la zona di consegna
  useEffect(() => {
    if (selectedDate && deliveryZone) {
      console.log('🎯 Zona di consegna cambiata, ricarico time slots per:', deliveryZone.name);
      loadTimeSlotsForDate(selectedDate);
    }
  }, [deliveryZone, selectedDate, loadTimeSlotsForDate]); // Aggiunte dipendenze mancanti

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
  }, [availableDates, selectedDate]); // Rimossa onDateTimeChange per evitare loop

  const handleDateSelect = (date: Date | undefined) => {
    console.log('📅 Data selezionata manualmente:', date ? formatDateLocal(date) : 'nessuna');
    setSelectedDate(date);
    
    if (date) {
      const dateString = formatDateLocal(date);
      onDateTimeChange(dateString, ''); // Reset time slot
      
      // Scroll automatico alla sezione degli orari
      setTimeout(() => {
        const timeSlotsSection = document.getElementById('time-slots-section');
        if (timeSlotsSection) {
          timeSlotsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100); // Piccolo delay per assicurarsi che la sezione sia renderizzata
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
  }, [availableDates, selectedDate]); // Rimossa onDateTimeChange per evitare loop

  // Funzione per ottenere il nome del mese in italiano
  const getMonthName = (date: Date) => {
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return months[date.getMonth()];
  };

  // Funzione per ottenere i giorni della settimana
  const getDaysOfWeek = () => {
    return ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];
  };

  // Funzione per generare il calendario del mese
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Trova il lunedì della settimana che contiene il primo giorno
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Genera 42 giorni (6 settimane)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Stato per il mese corrente visualizzato
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Funzione per verificare se una data ha slot disponibili
  const hasAvailableSlots = (date: Date) => {
    const dateString = formatDateLocal(date);
    return availableDates.some(availableDate => 
      formatDateLocal(availableDate) === dateString
    );
  };

  // Funzione per ottenere il colore dell'indicatore
  const getDateIndicatorColor = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = date < today;
    const isSunday = date.getDay() === 0;
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
    
    if (!isCurrentMonth || isPast) return null;
    if (isSunday) return 'bg-red-800'; // Rosso scuro per domenica (chiuso)
    if (hasAvailableSlots(date)) return 'bg-green-800'; // Verde scuro per disponibile
    return null;
  };

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

  const calendarDays = generateCalendarDays(currentMonth);

  return (
    <div className="space-y-6">
      {/* Layout responsive: mobile verticale, desktop orizzontale */}
      <div className="flex flex-col lg:flex-row lg:gap-8 space-y-6 lg:space-y-0">
        {/* Sezione Calendario - Sinistra su desktop */}
        <div className="lg:w-1/2">
          <Label className="text-base font-medium mb-3 block text-center text-blue-800">
            Seleziona la data in cui vorresti la consegna
          </Label>
          
          {/* Calendario personalizzato */}
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto lg:max-w-none">
            {/* Header con navigazione */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(currentMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}
                className="p-2 rounded-xl border-2 border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-blue-600" />
              </button>
              
              <h2 className="text-xl lg:text-2xl font-bold text-blue-800">
                {getMonthName(currentMonth)} {currentMonth.getFullYear()}
              </h2>
              
              <button
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(currentMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}
                className="p-2 rounded-xl border-2 border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-blue-600" />
              </button>
            </div>
            
            {/* Giorni della settimana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {getDaysOfWeek().map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Griglia del calendario */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isSelected = selectedDate && formatDateLocal(selectedDate) === formatDateLocal(date);
                const isDisabled = isDateDisabled(date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isToday = date.getTime() === today.getTime();
                const isSunday = date.getDay() === 0;
                const indicatorColor = getDateIndicatorColor(date);
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (!isDisabled && isCurrentMonth) {
                        handleDateSelect(date);
                      }
                    }}
                    disabled={isDisabled || !isCurrentMonth}
                    className={`
                      relative h-10 w-10 lg:h-12 lg:w-12 rounded-xl text-sm font-medium transition-all duration-200
                      ${
                        !isCurrentMonth
                          ? 'text-gray-300 cursor-default'
                          : isSelected
                          ? 'bg-green-600 text-white shadow-lg transform scale-105' // Verde per selezionato
                          : isDisabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-800 hover:bg-gray-100 cursor-pointer' // Blu per le date normali
                      }
                      ${
                        isToday && !isSelected
                          ? 'bg-gray-200 font-bold'
                          : ''
                      }
                    `}
                  >
                    <span className="relative z-10">{date.getDate()}</span>
                    
                    {/* Indicatore colorato */}
                    {indicatorColor && (
                      <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-4 lg:w-6 h-1 rounded-full ${indicatorColor}`} />
                    )}
                    
                    {/* X per date al completo */}
                    {isDisabled && !isSunday && isCurrentMonth && (
                      <span className="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-lg z-20">×</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sezione fasce orarie - Destra su desktop */}
        {selectedDate && (
          <div id="time-slots-section" className="lg:w-1/2">
            <Label className="text-base font-medium mb-3 block text-center text-blue-800">
              Seleziona la Fascia Oraria
            </Label>
            
            {isLoadingTimeSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">
                  {retryAttempt > 0 
                    ? `Tentativo di riconnessione ${retryAttempt}/2...` 
                    : 'Caricamento fasce orarie...'
                  }
                </span>
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="text-gray-500 py-8">
                  <p className="text-lg font-medium mb-2">😔 Nessuna fascia oraria disponibile</p>
                  <p className="text-sm">Per questa data non ci sono fasce orarie libere. Prova a selezionare un'altra data.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                 <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3">
                  {standardTimeSlots
                    .filter(timeSlot => {
                      if (selectedDate && selectedDate.getDay() === 6) {
                        return timeSlot !== "14:00 - 15:00" && timeSlot !== "15:00 - 16:00";
                      }
                      return true;
                    })
                    .map((timeSlot, index) => {
                    const isAvailable = availableTimeSlots.includes(timeSlot);
                    const isSelected = formData.deliveryTimeSlot === timeSlot;
                    
                    // Determina se la fascia è esclusa per zona (NON DISPONIBILE) o al completo (AL COMPLETO)
                    const excludedSlots = deliveryZone ? getExcludedTimeSlotsForZone(deliveryZone.id) : [];
                    const isExcludedForZone = excludedSlots.includes(timeSlot);
                    const isFullyBooked = !isAvailable && !isExcludedForZone;
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => isAvailable ? handleTimeSlotSelect(timeSlot) : null}
                        disabled={!isAvailable}
                        className={`
                          px-4 py-3 rounded-lg border-2 text-sm font-bold transition-colors flex flex-col items-center justify-center relative min-h-[80px] w-full
                          ${
                            !isAvailable
                              ? 'cursor-not-allowed bg-white'
                              : isSelected
                              ? 'cursor-pointer'
                              : 'cursor-pointer hover:opacity-80 bg-white'
                          }
                        `}
                        style={{
                          borderColor: !isAvailable 
                            ? (isExcludedForZone ? '#9CA3AF' : '#A40800') 
                            : isSelected ? '#3F691D' : '#1B5AAB',
                          backgroundColor: isSelected ? '#3F691D' : 'white',
                          color: isSelected ? 'white' : (!isAvailable 
                            ? (isExcludedForZone ? '#9CA3AF' : '#A40800') 
                            : '#1B5AAB')
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
                        ) : isExcludedForZone ? (
                          <span className="font-bold text-xs mt-1 text-center leading-tight" style={{ color: '#9CA3AF' }}>
                            NON DISPONIBILE PER LA ZONA
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryCalendar;