import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
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
      return {
        user: action.payload,
        isAuthenticated: true,
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
  state: AuthState;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Carica utente dal localStorage al mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    console.log('Tentativo di login con:', emailOrUsername);
    
    try {
      let customers = [];
      
      // Verifica se l'input è un'email (contiene @)
      if (emailOrUsername.includes('@')) {
        console.log('Ricerca per email...');
        customers = await wooCommerceService.getCustomerByEmail(emailOrUsername);
      } else {
        console.log('Ricerca per username...');
        customers = await wooCommerceService.getCustomerByUsername(emailOrUsername);
      }
      
      console.log('Clienti trovati:', customers.length);
      
      // Verifica se esiste un cliente con questa email o username
      if (customers && customers.length > 0) {
        const customer = customers[0];
        console.log('Cliente trovato:', customer.username);
        
        const user: User = {
          id: customer.id,
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          username: customer.username
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } else {
        console.log('Nessun cliente trovato');
        throw new Error('Credenziali non valide');
      }
    } catch (error) {
      console.error('Errore durante il login:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
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