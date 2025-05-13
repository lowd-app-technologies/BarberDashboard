import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';

// Define user role types
type UserRole = 'admin' | 'barber' | 'client';

// Extended user information including role
type ExtendedUser = User & {
  role?: UserRole;
  username?: string;
  fullName?: string;
};

// Enhanced auth context type with Google auth
type AuthContextType = {
  user: ExtendedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username: string, fullName: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Create the actual Auth Provider with full implementation
export const AuthProvider = (props: { children: React.ReactNode }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Verificamos se há um usuário salvo no sessionStorage
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Restauramos o usuário da sessão
        setUser(parsedUser as ExtendedUser);
      } catch (error) {
        console.error("Erro ao restaurar usuário da sessão:", error);
        sessionStorage.removeItem('currentUser');
      }
    }
    
    setLoading(false);
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Chamar a nossa API em vez do Firebase
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha na autenticação");
      }
      
      const data = await response.json();
      
      // Criar um objeto de usuário semelhante ao Firebase User
      const extendedUser: ExtendedUser = {
        ...data.user,
        uid: data.user.id.toString(),
        email: data.user.email,
        displayName: data.user.fullName,
        getIdTokenResult: async () => ({ claims: { role: data.user.role } }),
        role: data.user.role,
        username: data.user.username,
        fullName: data.user.fullName,
      } as unknown as ExtendedUser;
      
      // Atualizar o estado do usuário
      setUser(extendedUser);
      
      // Salvar na sessão
      sessionStorage.setItem('currentUser', JSON.stringify(extendedUser));
      
      toast({
        title: "Login bem-sucedido",
        description: "Seja bem-vindo de volta!",
      });

      setLocation('/dashboard');
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
      
      // Simulando um login com Google
      // Em um ambiente real, usaríamos o Firebase para obter os dados do Google
      const mockGoogleData = {
        email: "teste@gmail.com",
        name: "Usuário de Teste",
        provider: "google"
      };
      
      // Chamar nossa API de login social
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockGoogleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha no login social");
      }
      
      const data = await response.json();
      
      // Criar um objeto de usuário semelhante ao Firebase User
      const extendedUser: ExtendedUser = {
        ...data.user,
        uid: data.user.id.toString(),
        email: data.user.email,
        displayName: data.user.fullName,
        getIdTokenResult: async () => ({ claims: { role: data.user.role } }),
        role: data.user.role,
        username: data.user.username,
        fullName: data.user.fullName,
      } as unknown as ExtendedUser;
      
      // Atualizar o estado do usuário
      setUser(extendedUser);
      
      // Salvar na sessão
      sessionStorage.setItem('currentUser', JSON.stringify(extendedUser));
      
      toast({
        title: "Login bem-sucedido",
        description: "Seja bem-vindo!",
      });
      
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login com Google",
        description: error.message || "Ocorreu um erro com a autenticação do Google.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, username: string, fullName: string, role: string) => {
    try {
      setLoading(true);
      
      // Registrar usuário através da nossa API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username,
          fullName,
          role
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha no registro");
      }
      
      const data = await response.json();
      
      // Criar um objeto de usuário semelhante ao Firebase User
      const extendedUser: ExtendedUser = {
        ...data.user,
        uid: data.user.id.toString(),
        email: data.user.email,
        displayName: data.user.fullName,
        getIdTokenResult: async () => ({ claims: { role: data.user.role } }),
        role: data.user.role,
        username: data.user.username,
        fullName: data.user.fullName,
      } as unknown as ExtendedUser;
      
      // Atualizar o estado do usuário
      setUser(extendedUser);
      
      // Salvar na sessão
      sessionStorage.setItem('currentUser', JSON.stringify(extendedUser));
      
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso!",
      });

      setLocation('/dashboard');
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
      // Chamar a API de logout
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Limpar os dados da sessão
      sessionStorage.removeItem('currentUser');
      
      // Limpar o estado do usuário
      setUser(null);
      
      // Redirecionar para a página de login
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