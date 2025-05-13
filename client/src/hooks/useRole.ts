import { useAuth } from './useAuth';

type Role = 'admin' | 'barber' | 'client' | null;

export const useRole = (): Role => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Get role from user metadata
  const userMetadata = user.user_metadata;
  return (userMetadata?.role as Role) || 'client';
};