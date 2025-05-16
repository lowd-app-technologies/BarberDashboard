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
}