import React from 'react';
import { createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

// Define auth context type
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, fullName: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Create dummy implementations
const dummyLogin = async () => {};
const dummyRegister = async () => {};
const dummyLogout = async () => {};

// Create context with default values
const defaultContext: AuthContextType = {
  user: null,
  session: null,
  loading: false,
  login: dummyLogin,
  register: dummyRegister,
  logout: dummyLogout,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

// Provider component using React.createElement to avoid JSX syntax issues
export const AuthProvider = (props: { children: React.ReactNode }) => {
  return React.createElement(
    AuthContext.Provider, 
    { value: defaultContext }, 
    props.children
  );
};

// Hook to use the auth context
export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};