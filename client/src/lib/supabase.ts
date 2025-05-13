import { createClient } from '@supabase/supabase-js';

// We're using server-side environment variables 
// that will be passed to the client during the build process
declare global {
  interface Window {
    env: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
}

// Try different ways to access environment variables
const getSupabaseUrl = () => {
  // First check for Vite env vars
  if (import.meta.env.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  
  // Then check for window.env (useful if variables are injected at runtime)
  if (typeof window !== 'undefined' && window.env && window.env.SUPABASE_URL) {
    return window.env.SUPABASE_URL;
  }
  
  // Fallback to process.env (for server-side)
  return process.env.SUPABASE_URL || '';
};

const getSupabaseKey = () => {
  // First check for Vite env vars
  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
  
  // Then check for window.env
  if (typeof window !== 'undefined' && window.env && window.env.SUPABASE_ANON_KEY) {
    return window.env.SUPABASE_ANON_KEY;
  }
  
  // Fallback to process.env
  return process.env.SUPABASE_ANON_KEY || '';
};

// Initialize Supabase client
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

console.log('Supabase URL status:', supabaseUrl ? 'Available' : 'Missing');
console.log('Supabase Key status:', supabaseKey ? 'Available' : 'Missing');

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
