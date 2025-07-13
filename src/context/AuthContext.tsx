import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { wooCommerceService } from '@/services/woocommerce';

export interface User {
  id: number;
  email: string;
  firstName: string;  // Cambiato da first_name per consistenza
  lastName: string;   // Cambiato da last_name per consistenza
  username: string;
  billing?: any;      // Aggiunto per supportare i dati di fatturazione
  shipping?: any;     // Aggiunto per supportare i dati di spedizione
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
  | { type: 'SET_USER'; payload: User }  // Aggiunto nuovo action
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
    case 'SET_USER':  // Nuovo case per setUser
      console.log('Reducer SET_USER, payload:', action.payload);
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
  authState: AuthState;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;  // Aggiunto nuovo metodo
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
        // Transform to ensure the User interface is matched
        const userForState: User = {
          id: savedUserData.id || savedUserData.customer_id || 0,
          email: savedUserData.email || '',
          firstName: savedUserData.firstName || savedUserData.first_name || '',
          lastName: savedUserData.lastName || savedUserData.last_name || '',
          username: savedUserData.username || '',
          billing: savedUserData.billing,
          shipping: savedUserData.shipping
        };

        if (userForState.id > 0) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: userForState });
        } else {
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
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
      
      if (!loginResponse.token) {
        dispatch({ type: 'LOGIN_FAILURE' });
        throw new Error('Login fallito: token non ricevuto');
      }
      
      let userId = 0;
      try {
        if (loginResponse.user_id) {
          const customers = await wooCommerceService.getCustomerByWordPressUserId(loginResponse.user_id);
          if (customers && customers.length > 0) {
            userId = customers[0].id;
            console.log('ID cliente WooCommerce trovato tramite ID WordPress:', userId);
          }
        } else {
          const isEmail = usernameOrEmail.includes('@');
          let customers;
          
          if (isEmail) {
            customers = await wooCommerceService.getCustomerByEmail(usernameOrEmail);
          } else {
            customers = await wooCommerceService.getCustomerByUsername(usernameOrEmail);
          }
          
          if (customers && customers.length > 0) {
            userId = customers[0].id;
            console.log('ID cliente WooCommerce trovato:', userId);
          }
        }
      } catch (error) {
        console.error('Errore nel recupero ID cliente WooCommerce:', error);
      }
      
      const userData: User = {
        id: userId,
        email: loginResponse.user_email || usernameOrEmail,
        username: loginResponse.user_nicename || usernameOrEmail,
        firstName: loginResponse.user_display_name?.split(' ')[0] || '',
        lastName: loginResponse.user_display_name?.split(' ').slice(1).join(' ') || ''
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
      console.log('Login completato con successo');
    } catch (error) {
      console.error('Errore durante il login:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  // Nuovo metodo setUser
  const setUser = (user: User) => {
    console.log('Impostazione utente direttamente:', user);
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'SET_USER', payload: user });
  };

  const logout = () => {
    console.log('Eseguo il logout, rimuovo user e jwtToken');
    localStorage.removeItem('user');
    localStorage.removeItem('jwtToken');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ authState: state, login, logout, setUser }}>
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