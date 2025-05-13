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
  async signInWithEmailAndPassword(email: string, password: string): Promise<{ user: User }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Authentication failed");
      }
      
      const data = await response.json();
      
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
      
      return { user };
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  }
  
  // Sign in with popup for Google authentication
  async signInWithPopup(provider: any): Promise<{ user: User }> {
    try {
      // For now we're just using mock data for Google sign-in
      // In a real implementation, we would use the actual Google auth flow
      const mockGoogleData = {
        email: "user@example.com",
        name: "Example User",
        provider: "google"
      };
      
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockGoogleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Social login failed");
      }
      
      const data = await response.json();
      
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
  async register(email: string, password: string, username: string, fullName: string, role: string): Promise<{ user: User }> {
    try {
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
        throw new Error(errorData.message || "Registration failed");
      }
      
      const data = await response.json();
      
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
      
      return { user };
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
    }
  }
  
  // Sign out
  async signOut(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Clear current user
      this.currentUser = null;
    } catch (error: any) {
      console.error("Logout error:", error);
      throw error;
    }
  }
}

// Create auth instance
export const auth = new CustomAuth();

// Export Google provider for compatibility
export const googleProvider = new GoogleAuthProvider();

// No need for a Firebase app anymore
export default { auth };