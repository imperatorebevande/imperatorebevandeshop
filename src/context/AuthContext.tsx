import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { wooCommerceService } from '@/services/woocommerce';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      console.log('Reducer LOGIN_SUCCESS, payload:', action.payload);
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false
      };
    case 'LOGIN_FAILURE':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false
      };
    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false
};

interface AuthContextType {
  authState: AuthState; // Cambiato da 'state' a 'authState'
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Carica utente dal localStorage al mount
  useEffect(() => {
    const savedUserString = localStorage.getItem('user');
    if (savedUserString) {
      try {
        const savedUserData = JSON.parse(savedUserString);
        // Transform to ensure the User interface is matched, prioritizing 'id' then 'customer_id'
        const userForState: User = {
          id: savedUserData.id || savedUserData.customer_id || 0, // Ensure 'id' is populated
          email: savedUserData.email || '',
          first_name: savedUserData.first_name || '',
          last_name: savedUserData.last_name || '',
          username: savedUserData.username || '',
        };

        // Only dispatch if a valid user ID was found/transformed
        if (userForState.id > 0) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: userForState });
        } else {
          // Optional: handle case where user in localStorage has no valid ID
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing user from localStorage or invalid user structure:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      console.log('Tentativo di login con:', usernameOrEmail);
      
      const loginResponse = await wooCommerceService.loginWithJwt(usernameOrEmail, password);
      console.log('JWT Response completa:', loginResponse);
      
      // Verifica se il token è presente nella risposta
      if (!loginResponse.token) {
        dispatch({ type: 'LOGIN_FAILURE' });
        throw new Error('Login fallito: token non ricevuto');
      }
      
      // Recupera direttamente l'ID cliente WooCommerce usando l'ID utente WordPress
      let userId = 0;
      try {
        // Se loginResponse contiene l'ID utente WordPress
        if (loginResponse.user_id) {
          const customers = await wooCommerceService.getCustomerByWordPressUserId(loginResponse.user_id);
          if (customers && customers.length > 0) {
            userId = customers[0].id; // This should be the WooCommerce customer ID
            console.log('ID cliente WooCommerce trovato tramite ID WordPress:', userId);
          }
        } else {
          // Fallback alla ricerca per email/username
          const isEmail = usernameOrEmail.includes('@');
          let customers;
          
          if (isEmail) {
            customers = await wooCommerceService.getCustomerByEmail(usernameOrEmail);
          } else {
            customers = await wooCommerceService.getCustomerByUsername(usernameOrEmail);
          }
          
          if (customers && customers.length > 0) {
            userId = customers[0].id; // This should be the WooCommerce customer ID
            console.log('ID cliente WooCommerce trovato:', userId);
          }
        }
      } catch (error) {
        console.error('Errore nel recupero ID cliente WooCommerce:', error);
      }
      
      // Ensure userData conforms to the User interface with an 'id' property
      const userData: User = {
        id: userId,
        email: loginResponse.user_email || usernameOrEmail,
        username: loginResponse.user_nicename || usernameOrEmail,
        first_name: loginResponse.user_display_name?.split(' ')[0] || '',
        last_name: loginResponse.user_display_name?.split(' ').slice(1).join(' ') || ''
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
      console.log('Login completato con successo');
    } catch (error) {
      console.error('Errore durante il login:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      // Assicurati che l'errore venga propagato
      throw error;
    }
  };

  const logout = () => {
    console.log('Eseguo il logout, rimuovo user e jwtToken');
    localStorage.removeItem('user');
    localStorage.removeItem('jwtToken');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ authState: state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


interface UserData {
  customer_id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}