import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { 
  User, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

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
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Convert Firebase User to ExtendedUser
        const extendedUser = currentUser as ExtendedUser;
        
        // Get custom claims (like role) if they exist
        currentUser.getIdTokenResult().then((idTokenResult) => {
          if (idTokenResult.claims.role) {
            extendedUser.role = idTokenResult.claims.role as UserRole;
          }
          setUser(extendedUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      
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
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      toast({
        title: "Login bem-sucedido",
        description: "Seja bem-vindo!",
      });
      
      setLocation('/');
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
      // Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user profile with additional information
      await updateProfile(userCredential.user, {
        displayName: fullName
      });
      
      // Store additional user data in database
      // Here we would typically store the user in our database with role info
      // For now, we'll just extend the user object
      const extendedUser = userCredential.user as ExtendedUser;
      extendedUser.username = username;
      extendedUser.fullName = fullName;
      extendedUser.role = role as UserRole;
      
      // After setting up user in DB, we'd typically set custom claims via cloud functions
      // For now, we'll just set the user state
      setUser(extendedUser);

      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso!",
      });

      setLocation('/');
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
      await signOut(auth);
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