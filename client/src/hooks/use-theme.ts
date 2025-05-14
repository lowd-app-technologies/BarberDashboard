import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Primeiro, tenta carregar o tema do localStorage
    const savedTheme = localStorage.getItem('barbershop-theme') as Theme;
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Se não houver tema salvo, verifica a preferência do sistema
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Padrão para tema escuro
    return 'dark';
  });

  // Função para alterar o tema
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove as classes antigas
    root.classList.remove('light', 'dark');
    
    // Adiciona a nova classe
    root.classList.add(theme);
    
    // Salva a preferência no localStorage
    localStorage.setItem('barbershop-theme', theme);
  }, [theme]);

  return { theme, setTheme, toggleTheme };
}