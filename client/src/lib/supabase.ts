import { createClient } from '@supabase/supabase-js';

// We're using client-side environment variables from Vite
// Define window.env for runtime injection if needed
declare global {
  interface Window {
    env: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
}

// Access environment variables safely for client-side
const getSupabaseUrl = () => {
  // Check for Vite env vars
  if (import.meta.env.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  
  // Check for window.env (useful if variables are injected at runtime)
  if (typeof window !== 'undefined' && window.env && window.env.SUPABASE_URL) {
    return window.env.SUPABASE_URL;
  }
  
  // Access directly from env (in case we're in a different context)
  if (import.meta.env.SUPABASE_URL) {
    return import.meta.env.SUPABASE_URL;
  }
  
  return '';
};

const getSupabaseKey = () => {
  // Check for Vite env vars
  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
  
  // Check for window.env
  if (typeof window !== 'undefined' && window.env && window.env.SUPABASE_ANON_KEY) {
    return window.env.SUPABASE_ANON_KEY;
  }
  
  // Access directly from env
  if (import.meta.env.SUPABASE_ANON_KEY) {
    return import.meta.env.SUPABASE_ANON_KEY;
  }
  
  return '';
};

// Initialize Supabase client
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

console.log('Supabase URL status:', supabaseUrl ? 'Available' : 'Missing');
console.log('Supabase Key status:', supabaseKey ? 'Available' : 'Missing');

// Ensure the URL is valid
function isValidURL(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    console.error("Invalid URL format:", url);
    return false;
  }
}

// Create client with validation
const validUrl = isValidURL(supabaseUrl) ? supabaseUrl : 'https://vnrlvcmuvydjfjxhjpnz.supabase.co';
const validKey = supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZucmx2Y211dnlkamZqeGhqcG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYwMzk4OTAsImV4cCI6MjAzMTYxNTg5MH0.cPj7u6_eVdO4i0JqxhU0zwjuM6gZOzG36lCrY4zYCJE';

export const supabase = createClient(validUrl, validKey);
