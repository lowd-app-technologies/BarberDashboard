import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Session, User, Provider } from '@supabase/supabase-js';

// Enhanced auth context type with Google auth
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username: string, fullName: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Create the actual Auth Provider with full implementation
export const AuthProvider = (props: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }

      toast({
        title: "Login bem-sucedido",
        description: "Seja bem-vindo de volta!",
      });

      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Login with Google OAuth
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      
      if (error) {
        throw error;
      }

      // No need for toast or redirect here as OAuth redirects to the provider
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login com Google",
        description: error.message || "Ocorreu um erro com a autenticação do Google.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, username: string, fullName: string, role: string) => {
    try {
      setLoading(true);
      // First, create the auth user
      const { error: signUpError, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            role
          }
        }
      });
      
      if (signUpError) {
        throw signUpError;
      }

      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso!",
      });

      // For automatic sign in after registration
      if (data.user) {
        setLocation('/');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro ao criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setLocation('/login');
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Ocorreu um erro ao desconectar.",
        variant: "destructive",
      });
    }
  };

  // Build the context value with all functions
  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    login,
    loginWithGoogle,
    register,
    logout
  };

  // Use React.createElement to avoid JSX syntax issues
  return React.createElement(
    AuthContext.Provider, 
    { value: contextValue }, 
    props.children
  );
};

// Create context with the extended type
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: async () => {},
});

// Hook to use the auth context
export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};