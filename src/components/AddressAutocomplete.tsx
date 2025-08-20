import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Edit3 } from 'lucide-react';
import { waitForGoogleMaps } from '@/config/googleMaps';

interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    coordinates?: { lat: number; lng: number };
  }) => void;
  className?: string;
  required?: boolean;
  error?: boolean;
  focusTargetId?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onAddressSelect,
  className = '',
  required = false,
  error = false,
  focusTargetId
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSelecting, setIsSelecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      await waitForGoogleMaps();
      const service = new window.google.maps.places.AutocompleteService();
      
      const request = {
         input: query,
         componentRestrictions: { country: 'it' },
         types: ['address'],
         bounds: new window.google.maps.LatLngBounds(
           new window.google.maps.LatLng(40.9, 16.5),
           new window.google.maps.LatLng(41.3, 17.1)
         ),
         location: new window.google.maps.LatLng(41.1171, 16.8719),
         radius: 25000
       };

       service.getPlacePredictions(request, (predictions, status) => {
         setIsLoading(false);
         if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
           const bariAreaKeywords = ['bari', 'ba', 'puglia', 'apulia', 'bitonto', 'molfetta', 'terlizzi', 'ruvo', 'corato', 'andria', 'trani', 'bisceglie', 'mola', 'polignano', 'monopoli', 'conversano', 'triggiano', 'capurso', 'cellamare', 'valenzano', 'modugno', 'bitetto', 'palo del colle', 'grumo', 'giovinazzo', 'altamura', 'gravina', 'santeramo', 'cassano', 'acquaviva', 'casamassima', 'sammichele', 'turi', 'putignano', 'noci', 'gioia del colle', 'adelfia', 'noicattaro'];
           
           const filteredPredictions = predictions.filter(prediction => {
             const description = prediction.description.toLowerCase();
             return bariAreaKeywords.some(keyword => description.includes(keyword));
           });
           
           const sortedPredictions = filteredPredictions.sort((a, b) => {
             const aDescription = a.description.toLowerCase();
             const bDescription = b.description.toLowerCase();
             
             const aHasBari = aDescription.includes('bari');
             const bHasBari = bDescription.includes('bari');
             
             if (aHasBari && !bHasBari) return -1;
             if (!aHasBari && bHasBari) return 1;
             return 0;
           });
           
           setSuggestions(sortedPredictions.slice(0, 8));
           setShowSuggestions(true);
           setSelectedIndex(-1);
         } else {
           setSuggestions([]);
           setShowSuggestions(false);
         }
       });
    } catch (error) {
      console.error('Errore nel caricamento di Google Maps:', error);
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (!isSelecting) {
        searchAddresses(newValue);
      }
    }, 300);
  };

  const selectSuggestion = async (suggestion: AddressSuggestion) => {
    setIsSelecting(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    if (onAddressSelect) {
      try {
        await waitForGoogleMaps();
        const service = new window.google.maps.places.PlacesService(
           document.createElement('div')
         );

        service.getDetails(
          {
            placeId: suggestion.place_id,
            fields: ['address_components', 'formatted_address', 'geometry']
          },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
              let streetNumber = '';
              let route = '';
              let city = '';
              let province = '';
              let postalCode = '';
              let coordinates: { lat: number; lng: number } | undefined;

              if (place.geometry?.location) {
                coordinates = {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                };
              }

              place.address_components?.forEach((component) => {
                const types = component.types;
                if (types.includes('street_number')) {
                  streetNumber = component.long_name;
                } else if (types.includes('route')) {
                  route = component.long_name;
                } else if (types.includes('locality') || types.includes('administrative_area_level_3')) {
                  city = component.long_name;
                } else if (types.includes('administrative_area_level_2')) {
                  province = component.short_name;
                } else if (types.includes('postal_code')) {
                  postalCode = component.long_name;
                }
              });

              const fullAddress = streetNumber && route 
                ? `${route} ${streetNumber}`
                : route || suggestion.structured_formatting.main_text;

              const address = fullAddress;
              
              onChange(address);
              
              if (onAddressSelect) {
                onAddressSelect({
                  address,
                  city,
                  province,
                  postalCode,
                  coordinates
                });
              }
              
              if (focusTargetId) {
                setTimeout(() => {
                  const targetElement = document.getElementById(focusTargetId);
                  if (targetElement) {
                    targetElement.focus();
                  }
                }, 100);
              }
              
              setTimeout(() => {
                setIsSelecting(false);
              }, 1000);
            } else {
              setTimeout(() => {
                setIsSelecting(false);
              }, 300);
            }
          }
        );
      } catch (error) {
        console.error('Errore nel recupero dettagli indirizzo:', error);
        setTimeout(() => {
          setIsSelecting(false);
        }, 300);
      }
    } else {
      onChange(suggestion.structured_formatting.main_text);
      
      if (focusTargetId) {
        setTimeout(() => {
          const targetElement = document.getElementById(focusTargetId);
          if (targetElement) {
            targetElement.focus();
          }
        }, 100);
      }
      
      setTimeout(() => {
        setIsSelecting(false);
      }, 300);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
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
        break;
    }
  };

  return (
    <div className="relative">
      <Label className="text-xs sm:text-sm font-semibold text-[#1B5AAB] mb-1 block">
        {label} {required && '*'}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length >= 3 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`pr-10 ${error ? 'border-red-500' : ''} ${className}`}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
                onClick={() => selectSuggestion(suggestion)}
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressAutocomplete;