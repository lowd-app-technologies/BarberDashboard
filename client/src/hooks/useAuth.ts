import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { auth, googleProvider, User, UserRole } from '@/lib/firebase';

// Auth context type with our required functions
type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, isClientArea?: boolean) => Promise<void>;
  loginWithGoogle: (isClientArea?: boolean) => Promise<void>;
  register: (email: string, password: string, username: string, fullName: string, role: string, isClientArea?: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

// Create the Auth Provider implementation
export const AuthProvider = (props: { children: React.ReactNode }) => {
  // Inicializar usuario do sessionStorage quando disponível
  const initializeUserFromSession = (): User | null => {
    // Verificar se temos um user no sessionStorage
    const savedUser = sessionStorage.getItem('currentUser');
    const isAuthenticated = sessionStorage.getItem('auth') === 'true';
    
    if (savedUser && isAuthenticated) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Também atualizar o auth.currentUser para manter consistência
        auth.currentUser = parsedUser;
        return parsedUser;
      } catch (e) {
        // Se houver erro no parsing, remover os dados inválidos
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('auth');
        return null;
      }
    }
    
    return auth.currentUser;
  };
  
  const [user, setUser] = useState<User | null>(initializeUserFromSession());
  const [loading, setLoading] = useState(true); // Iniciar como true para verificar a sessão
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Verificar a sessão atual no servidor quando o componente for montado
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Se já temos um usuário no localStorage, verificamos se a sessão ainda é válida no servidor
        if (auth.currentUser) {
          const response = await fetch('/api/auth/current-user', {
            method: 'GET',
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.user) {
              // Atualizar o usuário com os dados mais recentes do servidor
              // Note: O servidor agora retorna dados da barbearia para usuários barbeiros
              const updatedUser = {
                ...auth.currentUser,
                ...data.user,
                uid: data.user.id.toString()
              };
              
              // Atualizar o usuário no auth object
              auth.currentUser = updatedUser;
              
              // Atualizar também no sessionStorage para manter consistência
              sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
              sessionStorage.setItem('auth', 'true');
              
              // Atualizar o estado do componente
              setUser(updatedUser);
            } else {
              // Se o servidor não reconhece o usuário, limpar o estado local
              auth.currentUser = null;
              sessionStorage.removeItem('currentUser');
              sessionStorage.removeItem('auth');
              setUser(null);
            }
          } else if (response.status === 401) {
            // Sessão expirada ou inválida
            auth.currentUser = null;
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('auth');
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };
    
    verifySession();
  }, []);

  // Função para determinar o redirecionamento com base no papel do usuário (admin/barber)
  const redirectUserBasedOnRole = (user: User) => {
    console.log("Redirecionando usuário com papel:", user.role);
    if (user.role === 'admin') {
      setLocation('/admin');
    } else if (user.role === 'barber') {
      setLocation('/barber');
    } else {
      // Fallback para a raiz (embora não deva ocorrer)
      setLocation('/');
    }
  };

  // Login with email and password
  const login = async (email: string, password: string, isClientArea: boolean = false) => {
    try {
      setLoading(true);
      
      // Use our custom auth wrapper
      const { user } = await auth.signInWithEmailAndPassword(email, password, isClientArea);
      
      // Salvar dados no sessionStorage
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('auth', 'true');
      
      // Update user state
      setUser(user);
      
      toast({
        title: "Login bem-sucedido",
        description: "Seja bem-vindo de volta!",
      });

      console.log("Login bem-sucedido, redirecionando usuário:", user);

      // Redirecionar para a área correta com base no tipo de login
      if (isClientArea) {
        setLocation('/booking');
      } else {
        // Usar setTimeout para garantir que o redirecionamento aconteça depois do ciclo de renderização
        setTimeout(() => {
          redirectUserBasedOnRole(user);
        }, 100);
      }
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
  const loginWithGoogle = async (isClientArea: boolean = false) => {
    try {
      setLoading(true);
      
      // Use our custom auth wrapper with Google provider
      const { user } = await auth.signInWithPopup(googleProvider, isClientArea);
      
      // Salvar dados no sessionStorage
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('auth', 'true');
      
      // Update user state
      setUser(user);
      
      toast({
        title: "Login bem-sucedido",
        description: "Seja bem-vindo!",
      });
      
      console.log("Login com Google bem-sucedido, redirecionando usuário:", user);
      
      // Redirecionar para a área correta com base no tipo de login
      if (isClientArea) {
        setLocation('/booking');
      } else {
        // Usar setTimeout para garantir que o redirecionamento aconteça depois do ciclo de renderização
        setTimeout(() => {
          redirectUserBasedOnRole(user);
        }, 100);
      }
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
  const register = async (email: string, password: string, username: string, fullName: string, role: string, isClientArea: boolean = false) => {
    try {
      setLoading(true);
      
      // Use our custom auth wrapper for registration
      const { user } = await auth.register(email, password, username, fullName, role, isClientArea);
      
      // Salvar dados no sessionStorage
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('auth', 'true');
      
      // Update user state
      setUser(user);
      
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso!",
      });

      // Redirecionar para a área correta com base no tipo de registro
      if (isClientArea) {
        setLocation('/booking');
      } else {
        redirectUserBasedOnRole(user);
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
      // Use our custom auth wrapper for logout
      await auth.signOut();
      
      // Limpar dados de autenticação do sessionStorage
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('auth');
      
      // Update user state
      setUser(null);
      
      // Redirect to login page
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

// Create context with the type
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: async (_email: string, _password: string, _isClientArea?: boolean) => {},
  loginWithGoogle: async (_isClientArea?: boolean) => {},
  register: async (_email: string, _password: string, _username: string, _fullName: string, _role: string, _isClientArea?: boolean) => {},
  logout: async () => {},
});

// Hook to use the auth context
export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};