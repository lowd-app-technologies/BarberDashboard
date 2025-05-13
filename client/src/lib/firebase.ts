// This file now provides a custom auth wrapper to simulate Firebase Auth API
// This allows the rest of the app to maintain similar interfaces while we use our own auth system

import { GoogleAuthProvider } from "firebase/auth";

// Define user types similar to Firebase
export type UserRole = 'admin' | 'barber' | 'client';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: UserRole;
  username?: string;
  fullName?: string;
  getIdTokenResult: () => Promise<{ claims: { role: UserRole } }>;
}

// Custom auth class that mimics Firebase Auth
class CustomAuth {
  private _currentUser: User | null = null;
  
  // Initialize with saved user from session storage
  constructor() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      try {
        this._currentUser = JSON.parse(savedUser);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        sessionStorage.removeItem('currentUser');
      }
    }
  }
  
  // Get current user
  get currentUser(): User | null {
    return this._currentUser;
  }
  
  // Set current user and save to session storage
  set currentUser(user: User | null) {
    this._currentUser = user;
    if (user) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('currentUser');
    }
  }
  
  // Sign in with email and password
  async signInWithEmailAndPassword(email: string, password: string, isClientArea: boolean = false): Promise<{ user: User }> {
    try {
      // Determine which endpoint to use based on the area (client or admin/barber)
      const endpoint = isClientArea ? '/api/auth/client/login' : '/api/auth/login';
      
      console.log(`Attempting to login with email: ${email} to endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || "Authentication failed");
        } catch (jsonError) {
          // Se não for possível tratar como JSON, retornamos uma mensagem genérica
          throw new Error("Falha na autenticação. Por favor, tente novamente.");
        }
      }
      
      let data;
      try {
        data = await response.json();
        console.log("Login response data:", data);
      } catch (jsonError) {
        throw new Error("Erro ao processar resposta do servidor. Por favor, tente novamente.");
      }
      
      if (!data || !data.user) {
        throw new Error("Resposta do servidor inválida. Por favor, tente novamente.");
      }
      
      // Create a user object similar to Firebase User
      const user: User = {
        uid: data.user.id.toString(),
        email: data.user.email,
        displayName: data.user.fullName,
        role: data.user.role as UserRole,
        username: data.user.username,
        fullName: data.user.fullName,
        getIdTokenResult: async () => ({ claims: { role: data.user.role } }),
      };
      
      console.log("Created user object:", user);
      
      // Update current user
      this.currentUser = user;
      
      // Validate the user role if they're logging into a specific area
      if (isClientArea && user.role !== 'client') {
        throw new Error("Esta área é exclusiva para clientes. Por favor, utilize a área administrativa para acessar sua conta.");
      } else if (!isClientArea && user.role === 'client') {
        throw new Error("Esta área é exclusiva para administradores e barbeiros. Por favor, utilize a área de clientes para acessar sua conta.");
      }
      
      return { user };
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  }
  
  // Sign in with popup for Google authentication
  async signInWithPopup(provider: any, isClientArea: boolean = false): Promise<{ user: User }> {
    try {
      // Para uma implementação completa com Google OAuth, precisaríamos integrar com a API real
      // Por enquanto, estamos simulando um login bem-sucedido com dados de teste
      // que serão aceitos pelo servidor
      
      // Nota: Em uma implementação real, os dados viriam do provedor OAuth
      const googleUserData = {
        email: "cliente@exemplo.com",
        name: "Cliente Exemplo",
        provider: "google"
      };
      
      // Determine which endpoint to use based on the area (client or admin/barber)
      const endpoint = isClientArea ? '/api/auth/client/social-login' : '/api/auth/social-login';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleUserData),
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          
          // Se o erro for que a conta não existe e estamos na área administrativa,
          // vamos dar uma mensagem mais clara
          if (!isClientArea && response.status === 404) {
            throw new Error("Você precisa se registrar primeiro como administrador para usar o login com Google na área administrativa.");
          }
          
          throw new Error(errorData.message || "Social login failed");
        } catch (jsonError) {
          // Se não for possível tratar como JSON, retornamos uma mensagem genérica
          throw new Error("Falha na autenticação com Google. Por favor, tente novamente.");
        }
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error("Erro ao processar resposta do servidor. Por favor, tente novamente.");
      }
      
      if (!data || !data.user) {
        throw new Error("Resposta do servidor inválida. Por favor, tente novamente.");
      }
      
      // Create a user object similar to Firebase User
      const user: User = {
        uid: data.user.id.toString(),
        email: data.user.email,
        displayName: data.user.fullName,
        role: data.user.role as UserRole,
        username: data.user.username,
        fullName: data.user.fullName,
        getIdTokenResult: async () => ({ claims: { role: data.user.role } }),
      };
      
      // Update current user
      this.currentUser = user;
      
      // Validate the user role if they're logging into a specific area
      if (isClientArea && user.role !== 'client') {
        throw new Error("Esta área é exclusiva para clientes. Por favor, utilize a área administrativa para acessar sua conta.");
      } else if (!isClientArea && user.role === 'client') {
        throw new Error("Esta área é exclusiva para administradores e barbeiros. Por favor, utilize a área de clientes para acessar sua conta.");
      }
      
      return { user };
    } catch (error: any) {
      console.error("Google login error:", error);
      throw error;
    }
  }
  
  // Create user with email and password
  async createUserWithEmailAndPassword(email: string, password: string): Promise<{ user: User }> {
    throw new Error("Direct account creation not supported. Use the register method instead.");
  }
  
  // Register new user with all required fields
  async register(email: string, password: string, username: string, fullName: string, role: string, isClientArea: boolean = false): Promise<{ user: User }> {
    try {
      // Determine which endpoint to use based on the area (client or admin/barber)
      const endpoint = isClientArea ? '/api/auth/client/register' : '/api/auth/register';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username,
          fullName,
          role,
          phone: '' // Add phone field for client registration
        }),
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || "Registration failed");
        } catch (jsonError) {
          // Se não for possível tratar como JSON, retornamos uma mensagem genérica
          throw new Error("Falha no registro. Por favor, tente novamente.");
        }
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error("Erro ao processar resposta do servidor. Por favor, tente novamente.");
      }
      
      if (!data || !data.user) {
        throw new Error("Resposta do servidor inválida. Por favor, tente novamente.");
      }
      
      // Create a user object similar to Firebase User
      const user: User = {
        uid: data.user.id.toString(),
        email: data.user.email,
        displayName: data.user.fullName,
        role: data.user.role as UserRole,
        username: data.user.username,
        fullName: data.user.fullName,
        getIdTokenResult: async () => ({ claims: { role: data.user.role } }),
      };
      
      // Update current user
      this.currentUser = user;
      
      // Validate the user role if they're registering in a specific area
      if (isClientArea && user.role !== 'client') {
        throw new Error("Esta área é exclusiva para clientes. Por favor, utilize a área administrativa para acessar sua conta.");
      } else if (!isClientArea && user.role === 'client') {
        throw new Error("Esta área é exclusiva para administradores e barbeiros. Por favor, utilize a área de clientes para acessar sua conta.");
      }
      
      return { user };
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
    }
  }
  
  // Sign out
  async signOut(): Promise<void> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Mesmo que o logout falhe no servidor, limparemos o usuário local
      // para garantir que o cliente sempre possa sair
      this.currentUser = null;
      
      // Verificamos se houve erro no servidor apenas para logar
      if (!response.ok) {
        console.warn("Logout não foi completado no servidor, mas o usuário foi desconectado localmente");
      }
    } catch (error: any) {
      // Mesmo com erro, limparemos o usuário local
      this.currentUser = null;
      console.error("Logout error:", error);
    }
  }
}

// Create auth instance
export const auth = new CustomAuth();

// Export Google provider for compatibility
export const googleProvider = new GoogleAuthProvider();

// No need for a Firebase app anymore
export default { auth };