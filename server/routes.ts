import type { Express, Request as ExpressRequest, Response } from "express";
import type { Session } from "express-session";

// Extend the Express Request type to include session
interface Request extends ExpressRequest {
  session: Session & {
    userId?: number;
    userRole?: string;
  };
}
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertServiceSchema,
  insertBarberSchema,
  insertCommissionSchema,
  insertAppointmentSchema,
  insertPaymentSchema,
  InsertUser,
  InsertBarber,
  insertCompletedServiceSchema,
  insertActionLogSchema,
  insertBarberInviteSchema,
} from "@shared/schema";
import { createClient } from "@supabase/supabase-js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key is missing. Please set environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para gerar hash de senha
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Função para verificar senha
const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Função para gerar um token aleatório
function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Rotas de autenticação
  // Rota de login para área administrativa (barbeiros e administradores)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }
      
      // Buscar usuário pelo email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Verificar senha
      const isPasswordValid = await comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Verificar se o usuário é admin ou barber
      if (user.role === 'client') {
        return res.status(403).json({ 
          message: "Esta área é exclusiva para administradores e barbeiros. Por favor, utilize a área de clientes para acessar sua conta."
        });
      }
      
      // Configurar sessão do usuário
      if (req.session) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
      }
      
      // Retornar dados do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('Erro no login:', error);
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
  });
  
  // Rota de login para área de clientes
  app.post('/api/auth/client/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }
      
      // Buscar usuário pelo email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Verificar senha
      const isPasswordValid = await comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Verificar se o usuário é cliente
      if (user.role !== 'client') {
        return res.status(403).json({ 
          message: "Esta área é exclusiva para clientes. Por favor, utilize a área administrativa para acessar sua conta."
        });
      }
      
      // Configurar sessão do usuário
      if (req.session) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
      }
      
      // Retornar dados do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('Erro no login de cliente:', error);
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
  });
  
  // Rota de registro para área administrativa (barbeiros e administradores)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, username, fullName, role, phone } = req.body;
      
      if (!email || !password || !username || !fullName || !role) {
        return res.status(400).json({ message: 'Dados incompletos' });
      }
      
      // Validar o papel do usuário
      if (!['admin', 'barber'].includes(role)) {
        return res.status(400).json({ message: 'Papel de usuário inválido para esta área' });
      }
      
      // Verificar se o email já está em uso
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'Este email já está em uso' });
      }
      
      // Verificar se o username já está em uso
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Este nome de usuário já está em uso' });
      }
      
      // Hash da senha
      const hashedPassword = await hashPassword(password);
      
      // Criar usuário
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username,
        fullName,
        role: role as 'admin' | 'barber',
        phone: phone || null
      });
      
      // Configurar sessão do usuário
      if (req.session) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
      }
      
      // Retornar dados do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
  });
  
  // Rota de registro para área de clientes
  app.post('/api/auth/client/register', async (req: Request, res: Response) => {
    try {
      const { email, password, username, fullName, phone } = req.body;
      
      if (!email || !password || !username || !fullName) {
        return res.status(400).json({ message: 'Dados incompletos' });
      }
            
      // Verificar se o email já está em uso
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'Este email já está em uso' });
      }
      
      // Verificar se o username já está em uso
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Este nome de usuário já está em uso' });
      }
      
      // Hash da senha
      const hashedPassword = await hashPassword(password);
      
      // Criar usuário com papel fixo de cliente
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username,
        fullName,
        role: 'client',
        phone: phone || null
      });
      
      // Criar perfil de cliente automaticamente
      await storage.createClientProfile({
        userId: user.id,
        address: null,
        notes: null,
        birthdate: null,
        city: null,
        postalCode: null,
        referralSource: null
      });
      
      // Configurar sessão do usuário
      if (req.session) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
      }
      
      // Retornar dados do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('Erro ao registrar cliente:', error);
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
  });
  
  // Rota de login social para área administrativa
  app.post('/api/auth/social-login', async (req: Request, res: Response) => {
    try {
      const { email, name, provider } = req.body;
      
      if (!email || !name || !provider) {
        return res.status(400).json({ message: 'Dados incompletos' });
      }
      
      // Verificar se o usuário já existe
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ 
          message: "Conta não encontrada. Para usar o login social na área administrativa, primeiro registre-se normalmente."
        });
      }
      
      // Verificar se o usuário tem permissão para essa área
      if (user.role === 'client') {
        return res.status(403).json({ 
          message: "Esta área é exclusiva para administradores e barbeiros. Por favor, utilize a área de clientes para acessar sua conta."
        });
      }
      
      // Configurar sessão do usuário
      if (req.session) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
      }
      
      // Retornar dados do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('Erro no login social:', error);
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
  });
  
  // Rota de login social para área de clientes
  app.post('/api/auth/client/social-login', async (req: Request, res: Response) => {
    try {
      const { email, name, provider } = req.body;
      
      if (!email || !name || !provider) {
        return res.status(400).json({ message: 'Dados incompletos' });
      }
      
      // Verificar se o usuário já existe
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Criar um username único baseado no nome
        const baseUsername = name.toLowerCase().replace(/\s+/g, '.');
        let username = baseUsername;
        let counter = 1;
        
        // Verificar se o username já existe
        while (await storage.getUserByUsername(username)) {
          username = `${baseUsername}${counter}`;
          counter++;
        }
        
        // Criar um novo usuário
        user = await storage.createUser({
          email,
          password: await hashPassword(crypto.randomBytes(16).toString('hex')), // Senha aleatória
          username,
          fullName: name,
          role: 'client', // Usuários de login social são clientes por padrão
          phone: null
        });
        
        // Criar perfil de cliente automaticamente
        await storage.createClientProfile({
          userId: user.id,
          address: null,
          notes: null,
          birthdate: null,
          city: null,
          postalCode: null,
          referralSource: null
        });
      } else if (user.role !== 'client') {
        // Se o usuário existe mas não é cliente
        return res.status(403).json({ 
          message: "Esta área é exclusiva para clientes. Por favor, utilize a área administrativa para acessar sua conta."
        });
      }
      
      // Configurar sessão do usuário
      if (req.session) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
      }
      
      // Retornar dados do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('Erro no login social de cliente:', error);
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
  });
  
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    // Destruir a sessão
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Erro ao fazer logout', error: err.message });
        }
        
        res.clearCookie('connect.sid'); // Limpar o cookie da sessão
        res.status(200).json({ message: 'Logout realizado com sucesso' });
      });
    } else {
      res.status(200).json({ message: 'Nenhuma sessão para encerrar' });
    }
  });

  // Rotas de usuários
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rotas de barbeiros
  app.get("/api/barbers", async (req, res) => {
    try {
      const barbers = await storage.getActiveBarbers();
      res.json(barbers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/barbers/top", async (req, res) => {
    try {
      const barbers = await storage.getTopBarbers();
      
      // Adicionar informações de ganhos para cada barbeiro
      // No mundo real, esses dados viriam do banco com base em pagamentos/serviços
      const barbersWithEarnings = barbers.map(barber => {
        // Adicionar um valor simulado de ganhos para demonstração
        return {
          ...barber,
          earnings: Math.floor(Math.random() * 1000) + 500 // Valor entre 500 e 1500
        };
      });
      
      res.json(barbersWithEarnings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter um barbeiro específico por ID
  app.get("/api/barbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de barbeiro inválido" });
      }
      
      const barber = await storage.getBarber(id);
      if (!barber) {
        return res.status(404).json({ message: "Barbeiro não encontrado" });
      }
      
      // Remover a senha do usuário antes de enviar
      const { password, ...userWithoutPassword } = barber.user;
      const barberWithoutPassword = {
        ...barber,
        user: userWithoutPassword,
      };
      
      res.json(barberWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Atualizar um barbeiro existente
  app.patch("/api/barbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de barbeiro inválido" });
      }
      
      // Verificar se o barbeiro existe
      const existingBarber = await storage.getBarber(id);
      if (!existingBarber) {
        return res.status(404).json({ message: "Barbeiro não encontrado" });
      }
      
      const { 
        fullName, 
        username, 
        email, 
        nif, 
        iban, 
        paymentPeriod, 
        active 
      } = req.body;
      
      // Atualizar os dados do usuário associado
      if (fullName || username || email) {
        const userData: Partial<InsertUser> = {};
        if (fullName) userData.fullName = fullName;
        if (username) userData.username = username;
        if (email) userData.email = email;
        
        // Verificar se o username já está em uso por outro usuário
        if (username && username !== existingBarber.user.username) {
          const existingUserWithUsername = await storage.getUserByUsername(username);
          if (existingUserWithUsername && existingUserWithUsername.id !== existingBarber.user.id) {
            return res.status(400).json({ message: "Este nome de usuário já está em uso" });
          }
        }
        
        // Verificar se o email já está em uso por outro usuário
        if (email && email !== existingBarber.user.email) {
          const existingUserWithEmail = await storage.getUserByEmail(email);
          if (existingUserWithEmail && existingUserWithEmail.id !== existingBarber.user.id) {
            return res.status(400).json({ message: "Este email já está em uso" });
          }
        }
        
        await storage.updateUser(existingBarber.user.id, userData);
      }
      
      // Atualizar os dados do barbeiro
      const barberData: Partial<InsertBarber> = {};
      if (nif) barberData.nif = nif;
      if (iban) barberData.iban = iban;
      if (paymentPeriod) barberData.paymentPeriod = paymentPeriod as any;
      if (active !== undefined) barberData.active = active;
      
      const updatedBarber = await storage.updateBarber(id, barberData);
      
      // Buscar o barbeiro atualizado com os dados do usuário
      const barberWithUser = await storage.getBarber(id);
      
      // Remover a senha do usuário antes de enviar
      const { password, ...userWithoutPassword } = barberWithUser!.user;
      const response = {
        ...barberWithUser,
        user: userWithoutPassword,
      };
      
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rotas de serviços
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getActiveServices();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rotas para serviços concluídos
  app.get("/api/completed-services", async (req, res) => {
    try {
      const completedServices = await storage.getAllCompletedServices();
      res.json(completedServices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/completed-services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de serviço inválido" });
      }
      
      const service = await storage.getCompletedService(id);
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/completed-services", async (req, res) => {
    try {
      const serviceData = req.body;
      const completedService = await storage.createCompletedService({
        ...serviceData,
        validatedByAdmin: false
      });
      res.status(201).json(completedService);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.patch("/api/completed-services/:id/validate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de serviço inválido" });
      }
      
      const service = await storage.getCompletedService(id);
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      
      // Atualizar o serviço como validado
      const updatedService = await storage.updateCompletedService(id, {
        validatedByAdmin: true
      });
      
      res.json(updatedService);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/completed-services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de serviço inválido" });
      }
      
      await storage.deleteCompletedService(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rotas de agendamentos
  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getUpcomingAppointments();
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const appointmentData = req.body;
      
      try {
        // Validate input data using zod
        const validatedData = insertAppointmentSchema.parse(appointmentData);
        const appointment = await storage.createAppointment(validatedData);
        res.status(201).json(appointment);
      } catch (validationError: any) {
        res.status(400).json({ message: "Dados inválidos", error: validationError.errors });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.getAppointment(parseInt(req.params.id));
      if (appointment) {
        res.json(appointment);
      } else {
        res.status(404).json({ message: "Agendamento não encontrado" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.updateAppointment(id, req.body);
      if (appointment) {
        res.json(appointment);
      } else {
        res.status(404).json({ message: "Agendamento não encontrado" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/appointments/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const appointment = await storage.updateAppointmentStatus(id, status);
      if (appointment) {
        res.json(appointment);
      } else {
        res.status(404).json({ message: "Agendamento não encontrado" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/barbers/:barberId/available-slots", async (req, res) => {
    try {
      const barberId = parseInt(req.params.barberId);
      const dateParam = req.query.date as string;
      
      if (!dateParam) {
        return res.status(400).json({ message: "Data é obrigatória" });
      }
      
      const date = new Date(dateParam);
      const availableSlots = await storage.getAvailableTimeSlots(barberId, date);
      res.json(availableSlots);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para gerar um convite para um novo barbeiro
  app.post('/api/invites/generate', async (req: Request, res: Response) => {
    try {
      // Verificar autenticação e permissão (somente administradores)
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem gerar convites.' });
      }
      
      const { email, name } = req.body;
      if (!email || !name) {
        return res.status(400).json({ message: 'Email e nome do barbeiro são obrigatórios' });
      }
      
      // Verificar se o email já está em uso
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Este email já está registrado no sistema' });
      }
      
      // Criar um ID único baseado no email e timestamp
      const barberId = `${email.split('@')[0]}-${Date.now()}`;
      
      // Gerar token
      const token = generateToken();
      
      // Definir data de expiração (48 horas a partir de agora)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);
      
      // Criar convite no banco de dados
      const invite = await storage.createBarberInvite({
        token,
        barberId,
        createdById: req.session.userId,
        expiresAt
      });
      
      // Em uma implementação real, aqui enviaríamos um email para o barbeiro
      // com o link de convite usando um serviço de email como SendGrid ou Nodemailer
      
      // Registrar no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: "create",
        entity: "barber_invite",
        entityId: invite.id,
        details: `Convite enviado para ${name} (${email})`
      });
      
      // Retornar token e ID do barbeiro
      return res.status(200).json({ token, barberId });
      
    } catch (error: any) {
      console.error('Erro ao gerar convite:', error);
      return res.status(500).json({ message: error.message });
    }
  });

  // Rota para validar um token de convite
  app.get('/api/invites/validate/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: 'Token é obrigatório' });
      }
      
      // Buscar convite pelo token
      const invite = await storage.getBarberInviteByToken(token);
      
      if (!invite) {
        return res.status(404).json({ message: 'Convite não encontrado' });
      }
      
      // Verificar se o convite já foi usado
      if (invite.isUsed) {
        return res.status(400).json({ message: 'Este convite já foi usado' });
      }
      
      // Verificar se o convite expirou
      if (new Date() > invite.expiresAt) {
        return res.status(400).json({ message: 'Este convite expirou' });
      }
      
      // Tentar extrair o email do barberId (está no formato email-timestamp)
      let email = null;
      if (invite.barberId) {
        const parts = invite.barberId.split('-');
        if (parts.length > 1) {
          // Tentar reconstruir o email se foi criado com o formato padrão (usuario-timestamp)
          const emailUser = parts[0];
          // Como não guardamos o domínio do email, não podemos reconstruir o email completo
          // email = `${emailUser}@example.com`; // Isso seria apenas uma estimativa
        }
      }
      
      // Retornar informações do convite (sem o token completo por segurança)
      return res.status(200).json({
        barberId: invite.barberId,
        valid: true,
        expiresAt: invite.expiresAt,
        email: email // Inclui o email se estiver disponível
      });
      
    } catch (error: any) {
      console.error('Erro ao validar convite:', error);
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Rotas para serviços completados (atendimentos realizados)
  app.get('/api/completed-services', async (req: Request, res: Response) => {
    try {
      // Aqui você pode implementar filtros com base nos parâmetros de consulta
      // Por exemplo: período, barbeiro específico, etc.
      const completedServices = await storage.getAllCompletedServices();
      res.json(completedServices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/completed-services/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de serviço inválido" });
      }
      
      const service = await storage.getCompletedService(id);
      if (!service) {
        return res.status(404).json({ message: "Serviço completado não encontrado" });
      }
      
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/completed-services', async (req: Request, res: Response) => {
    try {
      const { barberId, serviceId, clientName, price, date, appointmentId, notes } = req.body;
      
      // Validar dados
      if (!barberId || !serviceId || !clientName || price === undefined || !date) {
        return res.status(400).json({ message: "Dados incompletos para o registro do serviço" });
      }
      
      // Verificar se o barbeiro existe
      const barber = await storage.getBarber(barberId);
      if (!barber) {
        return res.status(404).json({ message: "Barbeiro não encontrado" });
      }
      
      // Verificar se o serviço existe
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      
      // Criar o registro do serviço completado
      const completedService = await storage.createCompletedService({
        barberId,
        serviceId,
        clientName,
        price,
        date: new Date(date),
        appointmentId: appointmentId || undefined,
        // Outros campos conforme necessário
      });
      
      // Atualizar dados do cliente se fornecido um ID de cliente
      if (req.body.clientId) {
        // Aqui poderia atualizar last_visit do cliente, por exemplo
        // Ou adicionar o serviço aos favoritos do cliente
      }
      
      // Se baseado em um agendamento, atualizar o status do agendamento
      if (appointmentId) {
        await storage.updateAppointmentStatus(appointmentId, "completed");
      }
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId || barberId, // Use o ID de sessão se disponível
        action: "create",
        entity: "completed_service",
        entityId: completedService.id,
        details: `Serviço ${service.name} registrado para o cliente ${clientName}`
      });
      
      res.status(201).json(completedService);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para usar um convite e criar um barbeiro
  app.post('/api/invites/use', async (req: Request, res: Response) => {
    try {
      const { token, username, fullName, email, password } = req.body;
      
      if (!token || !username || !fullName || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      }
      
      // Buscar convite pelo token
      const invite = await storage.getBarberInviteByToken(token);
      
      if (!invite) {
        return res.status(404).json({ message: 'Convite não encontrado' });
      }
      
      // Verificar se o convite já foi usado
      if (invite.isUsed) {
        return res.status(400).json({ message: 'Este convite já foi usado' });
      }
      
      // Verificar se o convite expirou
      if (new Date() > invite.expiresAt) {
        return res.status(400).json({ message: 'Este convite expirou' });
      }
      
      // Verificar se o email já está em uso
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'Este email já está em uso' });
      }
      
      // Verificar se o username já está em uso
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Este nome de usuário já está em uso' });
      }
      
      // Hash da senha
      const hashedPassword = await hashPassword(password);
      
      // Criar usuário com papel de barbeiro
      const user = await storage.createUser({
        username,
        fullName,
        email,
        password: hashedPassword,
        role: 'barber'
      });
      
      // Criar perfil de barbeiro
      const barber = await storage.createBarber({
        userId: user.id,
        nif: "Pendente", // Valores padrão que serão atualizados depois
        iban: "Pendente",
        paymentPeriod: 'monthly',
        active: true
      });
      
      // Marcar convite como usado
      await storage.markBarberInviteAsUsed(invite.id);
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: user.id,
        action: 'registration',
        entity: 'barber',
        entityId: barber.id,
        details: `Barbeiro registrado através de convite.`
      });
      
      return res.status(200).json({ 
        message: 'Barbeiro registrado com sucesso',
        barberId: barber.id
      });
      
    } catch (error: any) {
      console.error('Erro ao usar convite:', error);
      return res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}