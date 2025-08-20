import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { waitForGoogleMaps } from '@/config/googleMaps';

interface PostalCodeSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface PostalCodeAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onPostalCodeSelect?: (postalCodeData: {
    postalCode: string;
    city: string;
    province: string;
  }) => void;
  className?: string;
  required?: boolean;
  error?: boolean;
}

const PostalCodeAutocomplete: React.FC<PostalCodeAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onPostalCodeSelect,
  className = '',
  required = false,
  error = false
}) => {
  const [suggestions, setSuggestions] = useState<PostalCodeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSelecting, setIsSelecting] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        await waitForGoogleMaps();
        autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
        
        // Crea un div temporaneo per il PlacesService
        const mapDiv = document.createElement('div');
        const map = new (window as any).google.maps.Map(mapDiv);
        placesService.current = new (window as any).google.maps.places.PlacesService(map);
      } catch (error) {
        console.error('Errore nell\'inizializzazione di Google Maps:', error);
      }
    };

    initializeGoogleMaps();
  }, []);

  const searchPostalCodes = async (query: string) => {
    if (!autocompleteService.current || query.length < 3) {
      setSuggestions([]);
      return;
    }

    // Verifica se è un CAP italiano valido (5 cifre)
    const isValidItalianPostalCode = /^\d{5}$/.test(query) || /^\d{1,4}$/.test(query);
    if (!isValidItalianPostalCode && query.length < 5) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const request = {
        input: query,
        types: ['postal_code'],
        componentRestrictions: { country: 'IT' }
      };

      autocompleteService.current.getPlacePredictions(request, (predictions: any, status: any) => {
        setIsLoading(false);
        
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Filtra per CAP italiani
          const filteredPredictions = predictions.filter((prediction: any) => 
            prediction.types.includes('postal_code')
          );
          
          const mappedSuggestions = filteredPredictions.map((prediction: any) => ({
            place_id: prediction.place_id,
            description: prediction.description,
            structured_formatting: prediction.structured_formatting,
            types: prediction.types
          }));
          
          setSuggestions(mappedSuggestions);
          if (!isSelecting) {
            setShowSuggestions(true);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      console.error('Errore nella ricerca dei CAP:', error);
      setIsLoading(false);
      setSuggestions([]);
    }
  };

  // Debounce per la ricerca
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value && value.length >= 3 && !isSelecting && !manualMode) {
      debounceTimer.current = setTimeout(() => {
        searchPostalCodes(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, isSelecting, manualMode]);

  // Forza la chiusura dei suggerimenti quando isSelecting o manualMode sono true
  useEffect(() => {
    if (isSelecting || manualMode) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [isSelecting, manualMode]);

  const selectSuggestion = async (suggestion: PostalCodeSuggestion) => {
    if (!placesService.current) return;

    setIsSelecting(true);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSuggestions([]);
    
    try {
      placesService.current.getDetails(
        {
          placeId: suggestion.place_id,
          fields: ['address_components', 'formatted_address']
        },
        (place: any, status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
            const addressComponents = place.address_components || [];
            
            let postalCode = '';
            let city = '';
            let province = '';
            
            addressComponents.forEach((component: any) => {
              const types = component.types;
              
              if (types.includes('postal_code')) {
                postalCode = component.long_name;
              } else if (types.includes('locality')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_3') && !city) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_2')) {
                province = component.short_name;
              }
            });
            
            onChange(postalCode);
            setHasSelected(true);
            
            if (onPostalCodeSelect) {
              onPostalCodeSelect({
                postalCode,
                city,
                province
              });
            }
          }
          
          setTimeout(() => {
            setIsSelecting(false);
          }, 1000);
        }
      );
    } catch (error) {
      console.error('Errore nel recupero dei dettagli del CAP:', error);
      setTimeout(() => {
        setIsSelecting(false);
      }, 300);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Permetti solo numeri per il CAP
    if (!/^\d*$/.test(newValue)) return;
    
    onChange(newValue);
    
    if (hasSelected && newValue !== value) {
      setHasSelected(false);
      setManualMode(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    if (value && value.length >= 3 && suggestions.length > 0 && !isSelecting) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      <Label htmlFor="postalcode-input" className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="postalcode-input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={5}
          className={`mt-1 pr-10 ${
            error ? 'border-red-500 focus:border-red-500' : ''
          }`}
          required={required}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => selectSuggestion(suggestion)}
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostalCodeAutocomplete;