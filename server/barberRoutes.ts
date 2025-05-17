import { Request, Response } from "express";
import { storage } from "./storage";

export function registerBarberRoutes(app: any) {
  // Rota para atualizar foto de perfil do barbeiro
  app.post('/api/barber/profile-image', async (req: Request, res: Response) => {
    try {
      // Verificar se usuário está autenticado e é um barbeiro
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
      }
      
      if (req.session.userRole !== 'barber') {
        return res.status(403).json({ message: 'Acesso permitido apenas para barbeiros' });
      }
      
      // Verificar se há uma URL de imagem no corpo da requisição
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: 'URL da imagem não fornecida' });
      }
      
      // Buscar o barbeiro pelo ID do usuário
      const barber = await storage.getBarberByUserId(req.session.userId);
      
      if (!barber) {
        return res.status(404).json({ message: 'Perfil de barbeiro não encontrado' });
      }
      
      // Atualizar a imagem de perfil do barbeiro
      const updatedBarber = await storage.updateBarber(barber.id, {
        profileImage: imageUrl
      });
      
      // Registrar a ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'update',
        entity: 'barber',
        entityId: barber.id,
        details: 'Atualização da foto de perfil'
      });
      
      return res.json({ 
        success: true, 
        message: 'Foto de perfil atualizada com sucesso',
        barber: updatedBarber
      });
    } catch (error: any) {
      console.error('Erro ao atualizar foto de perfil:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para atualizar perfil completo do barbeiro (dados pessoais e profissionais)
  app.put('/api/barber/profile', async (req: Request, res: Response) => {
    try {
      // Verificar se usuário está autenticado e é um barbeiro
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
      }
      
      if (req.session.userRole !== 'barber') {
        return res.status(403).json({ message: 'Acesso permitido apenas para barbeiros' });
      }
      
      // Buscar o barbeiro pelo ID do usuário
      const barber = await storage.getBarberByUserId(req.session.userId);
      
      if (!barber) {
        return res.status(404).json({ message: 'Perfil de barbeiro não encontrado' });
      }
      
      const { 
        fullName, 
        username, 
        email, 
        phone,
        nif, 
        iban, 
        profileImage,
        paymentPeriod
      } = req.body;
      
      // Atualizar os dados do usuário
      if (fullName || username || email || phone) {
        const userData: any = {};
        if (fullName) userData.fullName = fullName;
        if (username) userData.username = username;
        if (email) userData.email = email;
        if (phone) userData.phone = phone;
        
        // Verificar se o novo username ou email já existem
        if (username && username !== barber.user.username) {
          const existingUser = await storage.getUserByUsername(username);
          if (existingUser && existingUser.id !== barber.user.id) {
            return res.status(400).json({ message: 'Este nome de usuário já está em uso' });
          }
        }
        
        if (email && email !== barber.user.email) {
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser && existingUser.id !== barber.user.id) {
            return res.status(400).json({ message: 'Este email já está em uso' });
          }
        }
        
        // Atualizar os dados de usuário
        await storage.updateUser(barber.userId, userData);
      }
      
      // Atualizar os dados específicos do barbeiro
      const barberData: any = {};
      if (nif) barberData.nif = nif;
      if (iban) barberData.iban = iban;
      if (profileImage) barberData.profileImage = profileImage;
      if (paymentPeriod) barberData.paymentPeriod = paymentPeriod;
      
      console.log("Atualizando dados do barbeiro:", barberData);
      
      // Só atualiza se houver dados para atualizar
      let updatedBarber = barber;
      if (Object.keys(barberData).length > 0) {
        updatedBarber = await storage.updateBarber(barber.id, barberData);
      }
      
      // Buscar os dados atualizados
      const refreshedBarber = await storage.getBarber(barber.id);
      
      if (!refreshedBarber) {
        return res.status(500).json({ message: 'Erro ao recarregar dados do perfil' });
      }
      
      // Remover a senha do usuário antes de enviar
      const { password, ...userWithoutPassword } = refreshedBarber.user;
      
      // Registrar a ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'update',
        entity: 'barber',
        entityId: barber.id,
        details: 'Atualização de perfil'
      });
      
      return res.json({
        ...refreshedBarber,
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil do barbeiro:', error);
      res.status(500).json({ message: error.message });
    }
  });
}