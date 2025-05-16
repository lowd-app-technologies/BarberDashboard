import { firebaseAuth } from './firebaseConfig';
import { sendSignInLinkToEmail, ActionCodeSettings } from 'firebase/auth';

// Configuração do link de convite
const actionCodeSettings: ActionCodeSettings = {
  // URL que será aberta quando o usuário clicar no link do email
  // Esta URL deve conter o token do convite como parâmetro
  url: `${window.location.origin}/barber/register?token=`,
  // Isso permite que o usuário complete o processo em dispositivos diferentes
  handleCodeInApp: true,
};

/**
 * Envia um email de convite para um novo barbeiro
 * @param email Email do destinatário
 * @param token Token do convite
 */
export const sendBarberInviteEmail = async (email: string, token: string): Promise<boolean> => {
  try {
    // Configurar a URL com o token do convite
    const finalUrl = `${actionCodeSettings.url}${token}`;
    const customSettings = {
      ...actionCodeSettings,
      url: finalUrl
    };

    // Enviar o email usando o Firebase Authentication
    await sendSignInLinkToEmail(firebaseAuth, email, customSettings);
    
    // Armazenar o email localmente para simplificar o processo de registro
    // quando o usuário clicar no link
    localStorage.setItem('barberInviteEmail', email);
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
};