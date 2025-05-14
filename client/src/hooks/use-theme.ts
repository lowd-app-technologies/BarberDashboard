import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const { toast } = useToast();
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
  
  const [isSaving, setIsSaving] = useState(false);

  // Função para alterar o tema
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Salvar o tema no servidor (apenas para usuários autenticados)
  const saveThemeToServer = async (newTheme: Theme) => {
    try {
      setIsSaving(true);
      await apiRequest('PUT', '/api/user/preferences', {
        theme: newTheme,
      });
    } catch (error) {
      console.error('Erro ao salvar tema no servidor:', error);
      // Não exibimos o erro para o usuário, pois a funcionalidade ainda funciona localmente
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove as classes antigas
    root.classList.remove('light', 'dark');
    
    // Adiciona a nova classe
    root.classList.add(theme);
    
    // Salva a preferência no localStorage
    localStorage.setItem('barbershop-theme', theme);
    
    // Tenta salvar no servidor se o usuário estiver logado
    // Não precisamos verificar explicitamente o login, pois a API retornará 401 se não estiver logado
    saveThemeToServer(theme);
  }, [theme]);

  return { theme, setTheme, toggleTheme, isSaving };
}