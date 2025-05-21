import { Request, Response } from "express";
import { storage } from "./storage";
import { Express } from "express";

// Array para armazenar clientes adicionados durante a sessão (para fins de teste)
let additionalClients: any[] = [];

export function registerBarberRoutes(app: Express) {
  // Rota para verificar o status da autenticação do usuário
  app.get('/api/auth/check', (req: Request, res: Response) => {
    console.log('Verificando status da autenticação...');
    console.log('Session:', req.session);
    
    if (req.session && req.session.userId) {
      return res.status(200).json({ 
        authenticated: true, 
        userId: req.session.userId,
        userRole: req.session.userRole 
      });
    } else {
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Usuário não autenticado' 
      });
    }
  });
  
  // Rota de teste que retorna dados simulados de clientes
  // Rota para adicionar um cliente ao array de teste (para fins de desenvolvimento)
  app.post('/api/test-add-client', async (req: Request, res: Response) => {
    try {
      const { fullName, email, phone, notes } = req.body;
      
      if (!fullName || !email || !phone) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nome, email e telefone são obrigatórios' 
        });
      }
      
      // Verificar se já existe um cliente com este telefone (nos dados simulados e adicionados)
      const phoneExists = [...additionalClients, 
        { phone: '911111111' }, 
        { phone: '922222222' }, 
        { phone: '933333333' }
      ].some(client => client.phone === phone);
      
      if (phoneExists) {
        return res.status(422).json({
          success: false,
          code: 'PHONE_ALREADY_EXISTS',
          message: 'Já existe um cliente com este número de telefone',
          details: {
            field: 'phone',
            value: phone,
            suggestion: 'Verifique se o cliente já está cadastrado ou utilize outro número de telefone'
          }
        });
      }
      
      // Verificar também na base de dados real (se possível)
      try {
        const existingUserByPhone = await storage.getUserByPhone(phone);
        if (existingUserByPhone) {
          return res.status(400).json({
            success: false,
            message: 'Já existe um cliente com este número de telefone na base de dados'
          });
        }
      } catch (error) {
        console.log('Erro ao verificar telefone na base de dados (ignorando):', error);
        // Continuamos mesmo se houver erro na verificação da base de dados
      }
      
      const newClient = {
        id: 1000 + additionalClients.length,
        username: email.split('@')[0],
        email,
        role: 'client',
        fullName,
        phone,
        createdAt: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        note: notes || 'Novo cliente',
        isFavorite: false
      };
      
      additionalClients.push(newClient);
      console.log('Cliente adicionado ao array de teste:', newClient);
      
      return res.status(201).json({ 
        success: true, 
        message: 'Cliente adicionado com sucesso ao array de teste',
        client: newClient
      });
    } catch (error: any) {
      console.error('Erro ao adicionar cliente ao array de teste:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Erro ao adicionar cliente'
      });
    }
  });
  
  app.get('/api/barber/test-clients', async (req: Request, res: Response) => {
    console.log('Rota /api/barber/test-clients chamada');
    console.log('Headers:', req.headers);
    console.log('Session:', req.session);
    
    try {
      // Sempre retornar dados simulados para fins de teste, independente da autenticação
      // Isso nos ajudará a verificar se a rota está sendo acessada corretamente
      console.log('Retornando dados simulados para teste');
      
      /* Comentado temporariamente para teste
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
      }
      */
      
      // Retornar dados simulados de clientes
      const mockClients = [
        {
          id: 1,
          username: 'cliente1',
          email: 'cliente1@example.com',
          role: 'client',
          fullName: 'Cliente Um',
          phone: '911111111',
          createdAt: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          note: 'Cliente regular',
          isFavorite: false
        },
        {
          id: 2,
          username: 'cliente2',
          email: 'cliente2@example.com',
          role: 'client',
          fullName: 'Cliente Dois',
          phone: '922222222',
          createdAt: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          note: 'Cliente VIP',
          isFavorite: true
        },
        {
          id: 3,
          username: 'cliente3',
          email: 'cliente3@example.com',
          role: 'client',
          fullName: 'Cliente Três',
          phone: '933333333',
          createdAt: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          note: 'Cliente novo',
          isFavorite: false
        },
        ...additionalClients // Incluir clientes adicionados durante a sessão
      ];
      
      console.log(`Retornando ${mockClients.length} clientes (${additionalClients.length} adicionados durante a sessão)`);
      return res.json(mockClients);
    } catch (error: any) {
      console.error('Erro na rota de teste de clientes:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota de teste para verificar se o barbeiro está autenticado
  app.get('/api/barber/test', async (req: Request, res: Response) => {
    console.log('Rota /api/barber/test chamada');
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
      }
      
      return res.json({ 
        message: 'Autenticado com sucesso', 
        userId: req.session.userId,
        userRole: req.session.userRole
      });
    } catch (error: any) {
      console.error('Erro na rota de teste:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para obter todos os clientes de um barbeiro
  app.get('/api/barber/clients', async (req: Request, res: Response) => {
    console.log('Rota /api/barber/clients chamada');
    try {
      // Verificar se usuário está autenticado e é um barbeiro
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
      }
      
      if (req.session.userRole !== 'barber') {
        return res.status(403).json({ message: 'Acesso permitido apenas para barbeiros' });
      }
      
      console.log('Usuário autenticado:', req.session.userId, req.session.userRole);
      
      // Abordagem simplificada para buscar clientes
      try {
        // 1. Buscar o barbeiro pelo ID do usuário
        const barber = await storage.getBarberByUserId(req.session.userId);
        
        if (!barber) {
          return res.status(404).json({ message: 'Perfil de barbeiro não encontrado' });
        }
        
        console.log('Barbeiro encontrado:', barber);
        
        // 2. Buscar diretamente os clientes que têm serviços completados com este barbeiro
        // Usar uma abordagem mais simples para buscar os clientes
        console.log('Buscando clientes para o barbeiro ID:', barber.id);
        
        // Buscar serviços completados para este barbeiro
        const completedServices = await storage.getAllCompletedServices();
        console.log('Total de serviços completados encontrados:', completedServices.length);
        
        // Filtrar serviços do barbeiro atual
        console.log('ID do barbeiro (tipo):', barber.id, typeof barber.id);
        
        // Imprimir todos os serviços para depuração
        completedServices.forEach(service => {
          console.log(`Serviço ID: ${service.id}, barberId: ${service.barberId} (${typeof service.barberId}), clientId: ${service.clientId}`);
        });
        
        const barberServices = completedServices.filter(service => {
          // Converter para número para garantir comparação correta
          const serviceBarberIdNum = Number(service.barberId);
          const barberIdNum = Number(barber.id);
          
          console.log(`Comparando: ${serviceBarberIdNum} === ${barberIdNum}`);
          
          const match = serviceBarberIdNum === barberIdNum;
          if (match) {
            console.log('Serviço encontrado para o barbeiro:', service);
          }
          return match;
        });
        
        console.log('Serviços do barbeiro:', barberServices.length);
        
        // Obter IDs únicos de clientes
        const clientIdsSet = new Set<number>();
        barberServices.forEach(service => {
          if (service.clientId) {
            clientIdsSet.add(service.clientId);
          }
        });
        const clientIds = Array.from(clientIdsSet);
        console.log('IDs de clientes encontrados:', clientIds);
        
        // Buscar detalhes dos clientes
        const clientsData = [];
        for (const clientId of clientIds) {
          try {
            const client = await storage.getUser(clientId);
            if (client) {
              // Remover senha
              const { password, ...clientData } = client;
              
              // Buscar notas
              let note = '';
              try {
                const notes = await storage.getClientNotesByBarber(clientId, barber.id);
                if (notes && notes.length > 0) {
                  note = notes[0].note;
                }
              } catch (noteError) {
                console.error('Erro ao buscar notas:', noteError);
              }
              
              // Encontrar última visita
              const clientServices = barberServices.filter(service => service.clientId === clientId);
              const lastVisit = clientServices.length > 0 ? 
                clientServices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : 
                null;
              
              clientsData.push({
                ...clientData,
                note,
                lastVisit,
                isFavorite: false
              });
            }
          } catch (clientError) {
            console.error(`Erro ao buscar cliente ${clientId}:`, clientError);
          }
        }
        
        console.log(`Encontrados ${clientsData.length} clientes para o barbeiro ${barber.id}`);
        
        // Clientes já estão formatados corretamente
        const clients = clientsData;
        
        return res.json(clients);
      } catch (dbError) {
        console.error('Erro na consulta ao banco de dados:', dbError);
        return res.status(500).json({ message: 'Erro ao buscar clientes no banco de dados' });
      }
    } catch (error: any) {
      console.error('Erro ao buscar clientes do barbeiro:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para obter clientes favoritos de um barbeiro
  app.get('/api/barber/clients/favorites', async (req: Request, res: Response) => {
    console.log('Rota /api/barber/clients/favorites chamada');
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
      
      // Buscar todos os clientes que já foram atendidos pelo barbeiro
      const completedServices = await storage.getCompletedServicesByBarber(barber.id);
      
      // Criar um Map para armazenar clientes únicos
      const clientsMap = new Map();
      
      // Adicionar clientes dos serviços completados
      for (const service of completedServices) {
        if (service.clientId) {
          const client = await storage.getUser(service.clientId);
          if (client) {
            // Remover a senha antes de adicionar ao mapa
            const { password, ...clientWithoutPassword } = client;
            
            // Verificar se já existe no mapa
            if (!clientsMap.has(client.id)) {
              // Buscar notas do cliente para este barbeiro
              const notes = await storage.getClientNotesByBarber(client.id, barber.id);
              const note = notes.length > 0 ? notes[0].note : '';
              
              // Adicionar ao mapa com informações adicionais
              clientsMap.set(client.id, {
                ...clientWithoutPassword,
                note,
                lastVisit: service.date,
                isFavorite: true // Para esta rota, consideramos todos como favoritos por enquanto
              });
            } else {
              // Atualizar a data da última visita se for mais recente
              const existingClient = clientsMap.get(client.id);
              if (new Date(service.date) > new Date(existingClient.lastVisit)) {
                existingClient.lastVisit = service.date;
                clientsMap.set(client.id, existingClient);
              }
            }
          }
        }
      }
      
      // Converter o mapa em array - para esta rota, retornamos apenas 3 clientes como favoritos
      const clients = Array.from(clientsMap.values()).slice(0, 3);
      
      return res.json(clients);
    } catch (error: any) {
      console.error('Erro ao buscar clientes favoritos do barbeiro:', error);
      res.status(500).json({ message: error.message });
    }
  });
  // Rota para barbeiro registrar um serviço completado 
  app.post('/api/barber/services', async (req: Request, res: Response) => {
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
      
      // Extrair dados do corpo da requisição
      const { 
        serviceId, 
        clientId, 
        clientName, 
        price, 
        date, 
        notes 
      } = req.body;
      
      // Validações
      if (!serviceId || !clientName || !price || !date) {
        return res.status(400).json({ 
          message: 'Dados incompletos. Necessário: serviceId, clientName, price e date' 
        });
      }
      
      // Verificar se o serviço existe
      const service = await storage.getService(parseInt(serviceId));
      if (!service) {
        return res.status(404).json({ message: 'Serviço não encontrado' });
      }
      
      // Converter data para objeto Date
      const serviceDate = new Date(date);
      
      console.log('Dados do serviço a ser registrado:', {
        barberId: barber.id,
        serviceId: parseInt(serviceId),
        clientId: clientId ? parseInt(clientId) : null,
        clientName,
        price,
        date: serviceDate,
        notes
      });
      
      // Criar o registro de serviço
      const completedService = await storage.createCompletedService({
        barberId: barber.id,
        serviceId: parseInt(serviceId),
        clientId: clientId ? parseInt(clientId) : null,
        clientName,
        price,
        date: serviceDate,
        appointmentId: null
      });
      
      // Registrar a ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'create',
        entity: 'completed_service',
        entityId: completedService.id,
        details: `Serviço ${service.name} registrado para o cliente ${clientName}`
      });
      
      console.log("Serviço registrado com sucesso:", completedService);
      
      // Retornar o serviço criado
      return res.status(201).json(completedService);
    } catch (error: any) {
      console.error('Erro ao registrar serviço:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para obter serviços do barbeiro
  app.get('/api/barber/services', async (req: Request, res: Response) => {
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
      
      // Buscar serviços realizados pelo barbeiro
      const services = await storage.getCompletedServicesByBarber(barber.id);
      
      return res.json(services);
    } catch (error: any) {
      console.error('Erro ao buscar serviços do barbeiro:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
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
      
      // Buscar o barbeiro pelo ID do usuário, incluindo os dados do usuário associado
      const barber = await storage.getBarberByUserId(req.session.userId);
      
      if (!barber) {
        return res.status(404).json({ message: 'Perfil de barbeiro não encontrado' });
      }
      
      // Buscar os dados completos do usuário associado ao barbeiro
      const barberUser = await storage.getUser(barber.userId);
      
      if (!barberUser) {
        return res.status(404).json({ message: 'Dados de usuário do barbeiro não encontrados' });
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
        if (username && username !== barberUser.username) {
          const existingUser = await storage.getUserByUsername(username);
          if (existingUser && existingUser.id !== barberUser.id) {
            return res.status(400).json({ message: 'Este nome de usuário já está em uso' });
          }
        }
        
        if (email && email !== barberUser.email) {
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser && existingUser.id !== barberUser.id) {
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
        const updated = await storage.updateBarber(barber.id, barberData);
        if (updated) {
          updatedBarber = updated;
        }
      }
      
      // Buscar os dados atualizados
      const refreshedBarber = await storage.getBarberWithUser(barber.id);
      
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