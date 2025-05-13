import { useAuth } from './useAuth';

type Role = 'admin' | 'barber' | 'client' | null;

export const useRole = (): Role => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Obter a função do usuário diretamente da propriedade role
  // Adicionamos essa propriedade ao usuário estendido em useAuth.ts
  return user.role || 'client';
};