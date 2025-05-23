import type { Express, Request as ExpressRequest, Response } from "express";
import type { Session } from "express-session";
import { eq } from "drizzle-orm";

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
  insertProductSchema,
  insertProductCommissionSchema,
  insertProductSaleSchema,
} from "@shared/schema";
import { createClient } from "@supabase/supabase-js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Initialize Supabase client (optional)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully');
  } else {
    console.warn('Supabase URL or key is missing. Some features may not work properly.');
    // Create a mock client or set to null based on your needs
    supabase = null;
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  supabase = null;
}

// Função para gerar hash de senha
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Função para verificar senha
const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Função para verificar se um userId pertence a um barberId específico
const isBarberId = async (userId: number, barberId: number): Promise<boolean> => {
  const barber = await storage.getBarber(barberId);
  return barber !== undefined && barber.userId === userId;
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

import { registerBarberRoutes } from "./barberRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Registrar as rotas específicas dos barbeiros
  registerBarberRoutes(app);
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
  
  // Rota para obter o usuário atual (verificar sessão)
  app.get('/api/auth/current-user', async (req: Request, res: Response) => {
    try {
      // Verificar se há um usuário na sessão
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      
      // Buscar dados do usuário
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      // Retornar dados do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      // Se o usuário for um barbeiro, buscar informações adicionais
      let barberData = null;
      if (user.role === 'barber') {
        try {
          barberData = await storage.getBarberByUserId(user.id);
        } catch (err) {
          console.error('Erro ao buscar dados do barbeiro:', err);
          // Não falhar toda a requisição se só os dados do barbeiro não puderem ser carregados
        }
      }
      
      // Incluir dados do barbeiro na resposta
      res.json({ 
        user: {
          ...userWithoutPassword,
          barber: barberData 
        }
      });
    } catch (error: any) {
      console.error('Erro ao verificar usuário atual:', error);
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
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
  app.patch("/api/barbers/:id", async (req: Request, res: Response) => {
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
        active,
        calendarVisibility 
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
      const barberData: Partial<InsertBarber> & { calendarVisibility?: string } = {};
      if (nif) barberData.nif = nif;
      if (iban) barberData.iban = iban;
      if (paymentPeriod) barberData.paymentPeriod = paymentPeriod as any;
      if (active !== undefined) barberData.active = active;
      if (calendarVisibility !== undefined) barberData.calendarVisibility = calendarVisibility;
      
      const updatedBarber = await storage.updateBarber(id, barberData);
      
      if (!updatedBarber) {
        return res.status(404).json({ message: "Não foi possível atualizar o barbeiro" });
      }
      
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

  app.post("/api/services", async (req: Request, res: Response) => {
    try {
      // Verificar autenticação e permissão (somente administradores)
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem adicionar serviços.' });
      }
      
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'create',
        entity: 'service',
        entityId: service.id,
        details: `Serviço criado: ${service.name}`
      });
      
      res.status(201).json(service);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/services/:id", async (req: Request, res: Response) => {
    try {
      // Verificar autenticação e permissão (somente administradores)
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem editar serviços.' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID de serviço inválido' });
      }
      
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: 'Serviço não encontrado' });
      }
      
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const updatedService = await storage.updateService(id, serviceData);
      
      if (!updatedService) {
        return res.status(404).json({ message: "Não foi possível atualizar o serviço" });
      }
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'update',
        entity: 'service',
        entityId: id,
        details: `Serviço atualizado: ${updatedService.name}`
      });
      
      res.json(updatedService);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/services/:id", async (req: Request, res: Response) => {
    try {
      // Verificar autenticação e permissão (somente administradores)
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem remover serviços.' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID de serviço inválido' });
      }
      
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: 'Serviço não encontrado' });
      }
      
      // Em vez de excluir, apenas desativar o serviço
      await storage.updateService(id, { active: false });
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'delete',
        entity: 'service',
        entityId: id,
        details: `Serviço desativado: ${service.name}`
      });
      
      res.json({ success: true, message: 'Serviço desativado com sucesso' });
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
        // Extrair dados adicionais de convidado, se existirem
        const { guestData, ...appointmentOnly } = appointmentData;
        
        // Adicionar log para verificar o formato da data recebida
        console.log("Dados do agendamento recebidos:", JSON.stringify(appointmentOnly));
        
        // Se a data estiver em formato de string, convertê-la para objeto Date
        if (appointmentOnly.date && typeof appointmentOnly.date === 'string') {
          try {
            appointmentOnly.date = new Date(appointmentOnly.date);
            console.log("Data convertida:", appointmentOnly.date);
          } catch (error) {
            console.error("Erro ao converter data:", error);
          }
        }
        
        // Validate appointment data using zod
        const validatedData = insertAppointmentSchema.parse(appointmentOnly);
        
        // Criar o agendamento com os dados validados
        const appointment = await storage.createAppointment(validatedData);
        
        // Se houver dados de convidado, registrar esses dados em log
        if (guestData) {
          console.log("Dados do convidado:", guestData);
          // Em um sistema completo, aqui criaria ou atualizaria os dados do cliente
          // e vincularia ao agendamento
        }
        
        res.status(201).json(appointment);
      } catch (validationError: any) {
        console.error("Erro de validação:", validationError);
        res.status(400).json({ 
          message: "Dados inválidos", 
          error: Array.isArray(validationError.errors) 
            ? validationError.errors 
            : [{ message: validationError.message || "Erro de validação" }] 
        });
      }
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
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
  
  // Rotas de serviços completados (atendimentos realizados)
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
  
  app.get('/api/completed-services/barber/:barberId', async (req: Request, res: Response) => {
    try {
      const barberId = parseInt(req.params.barberId);
      if (isNaN(barberId)) {
        return res.status(400).json({ success: false, message: "ID do barbeiro inválido" });
      }
      
      const services = await storage.getCompletedServicesByBarber(barberId);
      res.json(services);
    } catch (error: any) {
      console.error('Erro ao buscar serviços do barbeiro:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Erro ao buscar serviços do barbeiro' 
      });
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
      // Verificar autenticação
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      // Obter informações do usuário
      const currentUser = await storage.getUserById(req.session.userId);
      
      const { barberId, serviceId, clientId, clientName, price, date, appointmentId, notes } = req.body;
      
      // Validar dados
      if (!barberId || !serviceId || price === undefined || !date) {
        return res.status(400).json({ message: "Dados incompletos para o registro do serviço" });
      }
      
      // Verificação adicional para garantir que o usuário tem permissão
      // Permitir se o usuário for admin ou se for o próprio barbeiro
      const isAdmin = currentUser?.role === 'admin';
      const isBarber = currentUser?.role === 'barber';
      
      // Para barbeiros, verificar se está adicionando serviço para si mesmo
      if (!isAdmin && isBarber) {
        // Buscar informações do barbeiro pelo userId
        const userBarber = await storage.getBarberByUserId(req.session.userId);
        
        if (!userBarber || userBarber.id !== barberId) {
          console.log('Tentativa de adicionar serviço para outro barbeiro:', 
                      { sessionUserId: req.session.userId, barberId });
          return res.status(403).json({ 
            message: "Como barbeiro, você só pode registrar serviços para si mesmo" 
          });
        }
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
      
      // Preparar os dados do serviço completado
      let clientIdToUse = clientId;
      
      // Se temos nome do cliente mas não ID, podemos tentar encontrar ou criar um cliente
      if (clientName && !clientIdToUse) {
        try {
          // Tenta encontrar um cliente pelo nome
          const allUsers = await storage.getAllUsers();
          const existingClient = allUsers.find(u => 
            u.role === 'client' && 
            (u.fullName.toLowerCase() === clientName.toLowerCase() || 
             u.username.toLowerCase() === clientName.toLowerCase())
          );
          
          if (existingClient) {
            clientIdToUse = existingClient.id;
            console.log(`Cliente encontrado com ID ${clientIdToUse}`);
          } else {
            // Criar um novo cliente usando o nome fornecido
            // Isso seria uma funcionalidade completa em um sistema real
            console.log(`Cliente não encontrado, seria necessário criar um novo`);
            // Por enquanto, deixamos clientIdToUse como null
          }
        } catch (error) {
          console.error("Erro ao buscar/criar cliente:", error);
        }
      }
      
      // Calcular comissão com base nas configurações do barbeiro
      // Calcular comissão (mas não salvar diretamente na tabela de serviços)
      // A comissão pode ser calculada quando necessário a partir do preço
      const commissionValue = (parseFloat(price) * 0.5).toFixed(2);
      console.log("Comissão calculada:", commissionValue);
      
      // Criar o registro do serviço completado
      // Garantir que a data seja válida
      const dateToUse = date instanceof Date ? date : new Date(date);
      
      console.log("Data para registro:", dateToUse);
      
      const completedService = await storage.createCompletedService({
        barberId,
        serviceId,
        clientId: clientIdToUse,
        clientName,
        price,
        date: dateToUse,
        appointmentId: appointmentId || null,
        validatedByAdmin: null
      });
      
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
        active: true,
        calendarVisibility: 'own' // Por padrão, barbeiros só veem seu próprio calendário
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

  // ===== Rotas de Produtos =====
  
  // Obter todos os produtos
  app.get('/api/products', async (req: Request, res: Response) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter produtos ativos
  app.get('/api/products/active', async (req: Request, res: Response) => {
    try {
      const products = await storage.getActiveProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter produto por ID
  app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Criar novo produto (apenas admin)
  app.post('/api/products', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'create',
        entity: 'product',
        entityId: product.id,
        details: `Criação de produto: ${product.name}`
      });
      
      res.status(201).json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Atualizar produto (apenas admin)
  app.put('/api/products/:id', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      
      const product = await storage.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'update',
        entity: 'product',
        entityId: product.id,
        details: `Atualização de produto: ${product.name}`
      });
      
      res.json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Excluir produto (apenas admin)
  app.delete('/api/products/:id', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      
      await storage.deleteProduct(id);
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'delete',
        entity: 'product',
        entityId: id,
        details: `Exclusão de produto: ${product.name}`
      });
      
      res.status(200).json({ message: 'Produto excluído com sucesso' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Rotas de Comissões de Produtos =====
  
  // Obter todas as comissões de produtos para um barbeiro
  app.get('/api/product-commissions/barber/:barberId', async (req: Request, res: Response) => {
    try {
      const barberId = parseInt(req.params.barberId);
      const commissions = await storage.getProductCommissionsByBarber(barberId);
      res.json(commissions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter comissão específica de produto para um barbeiro
  app.get('/api/product-commissions/barber/:barberId/product/:productId', async (req: Request, res: Response) => {
    try {
      const barberId = parseInt(req.params.barberId);
      const productId = parseInt(req.params.productId);
      
      const commission = await storage.getProductCommissionByBarberAndProduct(barberId, productId);
      
      if (!commission) {
        return res.status(404).json({ message: 'Comissão não encontrada' });
      }
      
      res.json(commission);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Criar comissão de produto (apenas admin)
  app.post('/api/product-commissions', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const commissionData = insertProductCommissionSchema.parse(req.body);
      
      // Verificar se já existe comissão para este barbeiro e produto
      const existingCommission = await storage.getProductCommissionByBarberAndProduct(
        commissionData.barberId,
        commissionData.productId
      );
      
      if (existingCommission) {
        return res.status(400).json({ 
          message: 'Já existe uma comissão para este barbeiro e produto',
          existingCommission
        });
      }
      
      const commission = await storage.createProductCommission(commissionData);
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'create',
        entity: 'product_commission',
        entityId: commission.id,
        details: `Criação de comissão de produto para barbeiro ID ${commission.barberId}`
      });
      
      res.status(201).json(commission);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Atualizar comissão de produto (apenas admin)
  app.put('/api/product-commissions/:id', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      const commissionData = insertProductCommissionSchema.partial().parse(req.body);
      
      const commission = await storage.updateProductCommission(id, commissionData);
      
      if (!commission) {
        return res.status(404).json({ message: 'Comissão não encontrada' });
      }
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'update',
        entity: 'product_commission',
        entityId: commission.id,
        details: `Atualização de comissão de produto para barbeiro ID ${commission.barberId}`
      });
      
      res.json(commission);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Excluir comissão de produto (apenas admin)
  app.delete('/api/product-commissions/:id', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      const commission = await storage.getProductCommission(id);
      
      if (!commission) {
        return res.status(404).json({ message: 'Comissão não encontrada' });
      }
      
      await storage.deleteProductCommission(id);
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'delete',
        entity: 'product_commission',
        entityId: id,
        details: `Exclusão de comissão de produto para barbeiro ID ${commission.barberId}`
      });
      
      res.status(200).json({ message: 'Comissão excluída com sucesso' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Rotas de Vendas de Produtos =====
  
  // Obter todas as vendas de produtos
  app.get('/api/product-sales', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const sales = await storage.getAllProductSales();
      res.json(sales);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter vendas de produtos por barbeiro
  app.get('/api/product-sales/barber/:barberId', async (req: Request, res: Response) => {
    try {
      const barberId = parseInt(req.params.barberId);
      
      // Verificar permissões (apenas admin ou o próprio barbeiro)
      if (!req.session.userId || 
          (req.session.userRole !== 'admin' && 
           !(req.session.userRole === 'barber' && await isBarberId(req.session.userId, barberId)))) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const sales = await storage.getProductSalesByBarber(barberId);
      res.json(sales);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter venda de produto por ID
  app.get('/api/product-sales/:id', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      const sale = await storage.getProductSale(id);
      
      if (!sale) {
        return res.status(404).json({ message: 'Venda não encontrada' });
      }
      
      // Verificar permissões (apenas admin ou o barbeiro que fez a venda)
      if (req.session.userRole !== 'admin' && 
          !(req.session.userRole === 'barber' && await isBarberId(req.session.userId, sale.barberId))) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      res.json(sale);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Registrar venda de produto (barbeiros)
  app.post('/api/product-sales', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || !['admin', 'barber'].includes(req.session.userRole || '')) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const saleData = insertProductSaleSchema.parse(req.body);
      
      // Se for barbeiro, verificar se está registrando venda para si mesmo
      if (req.session.userRole === 'barber' && !await isBarberId(req.session.userId, saleData.barberId)) {
        return res.status(403).json({ message: 'Barbeiros só podem registrar vendas para si mesmos' });
      }
      
      const sale = await storage.createProductSale(saleData);
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'create',
        entity: 'product_sale',
        entityId: sale.id,
        details: `Venda de produto registrada por barbeiro ID ${sale.barberId}`
      });
      
      res.status(201).json(sale);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Validar venda de produto (apenas admin)
  app.post('/api/product-sales/:id/validate', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      const sale = await storage.validateProductSale(id);
      
      if (!sale) {
        return res.status(404).json({ message: 'Venda não encontrada' });
      }
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'validate',
        entity: 'product_sale',
        entityId: sale.id,
        details: `Venda de produto validada para barbeiro ID ${sale.barberId}`
      });
      
      res.json(sale);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Excluir venda de produto (apenas admin)
  app.delete('/api/product-sales/:id', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      const sale = await storage.getProductSale(id);
      
      if (!sale) {
        return res.status(404).json({ message: 'Venda não encontrada' });
      }
      
      await storage.deleteProductSale(id);
      
      // Registrar ação no log
      await storage.createActionLog({
        userId: req.session.userId,
        action: 'delete',
        entity: 'product_sale',
        entityId: id,
        details: `Exclusão de venda de produto para barbeiro ID ${sale.barberId}`
      });
      
      res.status(200).json({ message: 'Venda de produto excluída com sucesso' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Obter produtos com comissões para barbeiro
  app.get('/api/barber/:barberId/products-with-commissions', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const barberId = parseInt(req.params.barberId);
      
      // Verificar permissões (apenas admin ou o próprio barbeiro)
      if (req.session.userRole !== 'admin' && 
          !(req.session.userRole === 'barber' && await isBarberId(req.session.userId, barberId))) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const productsWithCommissions = await storage.getProductsWithCommissionsForBarber(barberId);
      res.json(productsWithCommissions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Clientes para barbeiros
  app.get('/api/barber/clients', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
      }

      // Obter o barber ID do usuário atual
      const barber = await storage.getBarberByUserId(req.session.userId);
      if (!barber) {
        return res.status(404).json({ message: 'Barbeiro não encontrado' });
      }

      // Buscar todos os clientes atendidos pelo barbeiro
      const clients = await storage.getClientsForBarber(barber.id);
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Clientes favoritos para barbeiros
  app.get('/api/barber/clients/favorites', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
      }

      // Obter o barber ID do usuário atual
      const barber = await storage.getBarberByUserId(req.session.userId);
      if (!barber) {
        return res.status(404).json({ message: 'Barbeiro não encontrado' });
      }

      // Buscar clientes favoritos do barbeiro
      const favorites = await storage.getFavoriteClientsForBarber(barber.id);
      res.json(favorites);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Pagamentos para barbeiros
  app.get('/api/barber/payments', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
      }

      // Obter o barber ID do usuário atual
      const barber = await storage.getBarberByUserId(req.session.userId);
      if (!barber) {
        return res.status(404).json({ message: 'Barbeiro não encontrado' });
      }

      // Buscar todos os pagamentos do barbeiro
      const payments = await storage.getPaymentsForBarber(barber.id);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Serviços validados para barbeiro (para cálculo de pagamento)
  app.get('/api/barber/services/validated', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
      }

      // Obter o barber ID do usuário atual
      const barber = await storage.getBarberByUserId(req.session.userId);
      if (!barber) {
        return res.status(404).json({ message: 'Barbeiro não encontrado' });
      }

      // Buscar todos os serviços validados do barbeiro
      const services = await storage.getValidatedServicesForBarber(barber.id);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Serviços pendentes para barbeiro
  app.get('/api/barber/services/pending', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
      }

      // Obter o barber ID do usuário atual
      const barber = await storage.getBarberByUserId(req.session.userId);
      if (!barber) {
        return res.status(404).json({ message: 'Barbeiro não encontrado' });
      }

      // Buscar todos os serviços pendentes do barbeiro
      const services = await storage.getPendingServicesForBarber(barber.id);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Relatórios para barbeiros
  app.get('/api/barber/reports/services', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
      }

      const timeRange = req.query.timeRange as string || 'month';
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

      // Obter o barber ID do usuário atual
      const barber = await storage.getBarberByUserId(req.session.userId);
      if (!barber) {
        return res.status(404).json({ message: 'Barbeiro não encontrado' });
      }

      // Buscar todos os serviços completados pelo barbeiro no período
      let startDate: Date;
      let endDate: Date;

      if (timeRange === 'year') {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
      } else if (timeRange === 'month') {
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59);
      } else {
        // Por padrão, considere o mês atual
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59);
      }

      // Buscar dados reais do banco
      let services = [];
      let appointments = [];
      let clients = [];
      let payments = [];
      let productSales = [];

      try {
        services = await storage.getAllCompletedServices();
      } catch (error) {
        console.error("Error fetching completed services:", error);
      }

      try {
        appointments = await storage.getAllAppointments();
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }

      try {
        clients = await storage.getAllUsers();
        clients = clients.filter(u => u.role === 'client');
      } catch (error) {
        console.error("Error fetching clients:", error);
      }

      try {
        // Buscar pagamentos do banco de dados
        payments = await storage.getAllPayments();
        // Se a função não estiver implementada, usamos array vazio
        if (!payments) {
          payments = [];
          console.log("getAllPayments não implementado, usando array vazio");
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
        payments = []; // Em caso de erro, usar array vazio
      }

      try {
        // Verificar o papel do usuário para decidir quais vendas exibir
        if (req.session.userRole === 'admin') {
          // Administradores veem todas as vendas 
          productSales = await storage.getAllProductSales();
        } else if (req.session.userRole === 'barber') {
          // Barbeiros veem apenas suas próprias vendas
          const barber = await storage.getBarberByUserId(req.session.userId);
          if (barber) {
            productSales = await storage.getProductSalesByBarber(barber.id);
          }
        } else {
          // Se não for admin nem barbeiro, não mostra vendas
          productSales = [];
        }
      } catch (error) {
        console.error("Error fetching product sales:", error);
        productSales = []; // Em caso de erro, retorna lista vazia em vez de dados falsos
      }

      // Filtrar por período
      const recentServices = Array.isArray(services) ? services.filter(s => new Date(s.date) >= startDate) : [];
      const recentAppointments = Array.isArray(appointments) ? appointments.filter(a => new Date(a.date) >= startDate) : [];
      const recentClients = clients.filter(c => c && c.createdAt && new Date(c.createdAt) >= startDate);
      const pendingPayments = Array.isArray(payments) ? payments.filter(p => p.status === 'pending') : [];
      const recentProductSales = Array.isArray(productSales) ? productSales.filter(p => new Date(p.date) >= startDate) : [];
      
      // Calcular receita (serviços + produtos)
      const serviceRevenue = recentServices.reduce((acc, service) => {
        const price = typeof service.price === 'string' 
          ? parseFloat(service.price) 
          : service.price;
        return acc + price;
      }, 0);
      
      const productRevenue = recentProductSales.reduce((acc, sale) => {
        const unitPrice = typeof sale.unitPrice === 'string' 
          ? parseFloat(sale.unitPrice) 
          : sale.unitPrice;
        return acc + (unitPrice * sale.quantity);
      }, 0);
      
      const totalRevenue = serviceRevenue + productRevenue;
      
      // Calcular tendências com base em dados reais
      // Inicializar com valores padrão zero
      let salesTrend = 0;
      let appointmentsTrend = 0;
      let pendingPaymentsTrend = 0;
      let newClientsTrend = 0;
      
      // Em uma implementação real, compararíamos com dados do período anterior
      // Por enquanto, usamos dados atuais para calcular tendências de forma simplificada
      
      // Cálculo de tendência para vendas (% sobre o total de vendas)
      salesTrend = totalRevenue > 0 ? (productRevenue / totalRevenue) * 100 : 0;
      
      // Cálculo de tendência para agendamentos (valor fixo baseado em dados existentes)
      appointmentsTrend = recentAppointments.length > 0 ? recentAppointments.length : 0;
      
      // Cálculo de tendência para pagamentos pendentes (valor baseado em dados existentes)
      const pendingPaymentsValue = pendingPayments.reduce((acc, p) => {
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
        return acc + amount;
      }, 0);
      pendingPaymentsTrend = pendingPaymentsValue > 0 ? (pendingPaymentsValue / totalRevenue) * 100 : 0;
      
      // Cálculo de tendência para novos clientes (crescimento percentual)
      newClientsTrend = recentClients.length > 0 ? recentClients.length : 0;
      
      // Dados para o gráfico de vendas
      // Gerar dados dos últimos 7 dias
      const salesChartData = [];
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Serviços deste dia
        const dayServices = services && Array.isArray(services) ? services.filter(s => {
          const serviceDate = new Date(s.date);
          return serviceDate >= date && serviceDate < nextDay;
        }) : [];
        
        // Produtos vendidos neste dia
        const dayProductSales = productSales && Array.isArray(productSales) ? productSales.filter(p => {
          const saleDate = new Date(p.date);
          return saleDate >= date && saleDate < nextDay;
        }) : [];
        
        // Calcular receita do dia
        const dayServiceRevenue = dayServices.reduce((acc, service) => {
          const price = typeof service.price === 'string' 
            ? parseFloat(service.price) 
            : service.price;
          return acc + price;
        }, 0);
        
        const dayProductRevenue = dayProductSales.reduce((acc, sale) => {
          const unitPrice = typeof sale.unitPrice === 'string' 
            ? parseFloat(sale.unitPrice) 
            : sale.unitPrice;
          return acc + (unitPrice * sale.quantity);
        }, 0);
        
        const dayTotalRevenue = dayServiceRevenue + dayProductRevenue;
        
        salesChartData.push({
          name: dayNames[date.getDay()],
          sales: dayTotalRevenue
        });
      }
      
      // Formatar vendas recentes para exibição
      const formattedSales = productSales.map(sale => {
        // Extrair informações relevantes
        return {
          id: sale.id,
          date: new Date(sale.date).toISOString().split('T')[0],
          barber: sale.barber?.user?.fullName || 'Barbeiro não encontrado',
          client: sale.clientName,
          product: sale.product?.name || 'Produto não encontrado',
          quantity: sale.quantity,
          price: typeof sale.unitPrice === 'string' 
            ? parseFloat(sale.unitPrice) 
            : parseFloat(String(sale.unitPrice)),
          total: (typeof sale.unitPrice === 'string' 
            ? parseFloat(sale.unitPrice) 
            : parseFloat(String(sale.unitPrice))) * sale.quantity
        };
      });
      
      // Ordenar vendas por data (mais recente primeiro)
      formattedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Limitar a 10 vendas mais recentes para o dashboard
      const recentSalesToShow = formattedSales.slice(0, 10);
      
      // Retornar dados do dashboard
      res.json({
        stats: {
          sales: Math.round(totalRevenue * 100) / 100, // Arredondar para 2 casas decimais
          appointments: recentAppointments.length,
          pendingPayments: pendingPayments.reduce((acc, p) => {
            const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
            return acc + amount;
          }, 0),
          newClients: recentClients.length,
          salesTrend,
          appointmentsTrend,
          pendingPaymentsTrend,
          newClientsTrend
        },
        salesChart: salesChartData,
        recentSales: recentSalesToShow
      });
    } catch (error: any) {
      console.error('Erro ao buscar dados do dashboard:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para obter serviços populares
  app.get('/api/services/popular', async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário está autenticado
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      
      if (!userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      // Buscar serviços e dados de serviços concluídos
      const allServices = await storage.getActiveServices();
      let completedServices = [];
      let barberId = null;
      
      // Filtrar por barbeiro se o usuário for um barbeiro
      if (userRole === 'barber') {
        const barber = await storage.getBarberByUserId(userId);
        if (barber) {
          barberId = barber.id;
          completedServices = await storage.getCompletedServicesByBarber(barber.id);
        }
      } else {
        // Para administradores, buscar todos os serviços concluídos
        completedServices = await storage.getAllCompletedServices();
      }
      
      // Contar ocorrências de cada serviço nos serviços concluídos
      const serviceCounts = new Map();
      
      if (Array.isArray(completedServices) && completedServices.length > 0) {
        // Contar serviços realizados
        completedServices.forEach(cs => {
          const serviceId = cs.serviceId;
          serviceCounts.set(serviceId, (serviceCounts.get(serviceId) || 0) + 1);
        });
        
        // Ordenar serviços por popularidade (quantidade de vezes realizados)
        const servicesWithPopularity = allServices.map(service => {
          const count = serviceCounts.get(service.id) || 0;
          return {
            ...service,
            popularity: count,
            // Adicionar informações extras para a UI
            bookings: count,
            growth: count > 0 ? Math.floor(Math.random() * 20) : 0 // Garantir que growth seja número válido
          };
        });
        
        // Ordenar por popularidade e retornar os top 5
        const popularServices = servicesWithPopularity
          .filter(service => service.popularity > 0) // Filtrar apenas serviços que foram realizados
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 5);
          
        if (popularServices.length > 0) {
          return res.json(popularServices);
        }
      }
      
      // Caso não haja dados suficientes, retornar dados básicos sem valores simulados
      // Retornamos apenas os serviços ordenados por ID, sem adicionar métricas simuladas
      if (userRole === 'barber' && barberId) {
        // Para barbeiros, mostrar apenas alguns serviços
        const barberServices = allServices.slice(0, 3).map(service => ({
          ...service,
          popularity: 0,
          bookings: 0,
          growth: 0
        }));
        
        res.json(barberServices);
      } else {
        // Para administradores, mostrar todos os serviços
        const servicesWithBasicData = allServices.map(service => ({
          ...service,
          popularity: 0,
          bookings: 0,
          growth: 0
        }));
        
        res.json(servicesWithBasicData.slice(0, 5));
      }
    } catch (error: any) {
      console.error('Erro ao buscar serviços populares:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para obter top barbeiros
  app.get('/api/barbers/top', async (req: Request, res: Response) => {
    try {
      // Verificar autenticação
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const barbers = await storage.getActiveBarbers();
      
      // Buscar dados reais do banco
      try {
        const services = await storage.getAllCompletedServices();
        // Buscar vendas de produtos reais da última semana
        const productSales = await storage.getWeeklyProductSales();
        
        // Calcular ganhos para cada barbeiro
        const barbersWithEarnings = barbers.map(barber => {
          let earnings = 0;
          
          // Somar serviços realizados por este barbeiro
          if (Array.isArray(services)) {
            const barberServices = services.filter(s => s.barberId === barber.id);
            earnings += barberServices.reduce((sum, service) => {
              const price = typeof service.price === 'string' 
                ? parseFloat(service.price) 
                : (service.price || 0);
              return sum + price;
            }, 0);
          }
          
          // Adicionar vendas de produtos deste barbeiro
          if (Array.isArray(productSales)) {
            const barberProductSales = productSales.filter(s => s.barberId === barber.id);
            earnings += barberProductSales.reduce((sum, sale) => {
              const unitPrice = typeof sale.unitPrice === 'string' 
                ? parseFloat(sale.unitPrice) 
                : parseFloat(String(sale.unitPrice));
              return sum + (unitPrice * sale.quantity);
            }, 0);
          }
          
          // Se não houver ganhos registrados, considerar os valores das tabelas
          if (earnings === 0) {
            // Não usar valores aproximados para evitar mostrar dados que não existem
            console.log(`Barbeiro ID ${barber.id} sem ganhos registrados`);
            // Mantemos como zero para refletir dados reais
            earnings = 0;
          }
          
          return {
            ...barber,
            earnings,
            percentage: 0 // Será calculado no frontend
          };
        });
        
        // Ordenar por ganhos e retornar os top 3
        const topBarbers = barbersWithEarnings
          .sort((a, b) => b.earnings - a.earnings)
          .slice(0, 3);
        
        res.json(topBarbers);
      } catch (error) {
        console.error("Erro ao calcular dados de top barbeiros:", error);
        // Fallback com dados básicos, sem valores fictícios
        res.json(barbers.map(barber => ({
          ...barber,
          earnings: 0,
          percentage: 0
        })).slice(0, 3));
      }
    } catch (error: any) {
      console.error('Erro ao buscar top barbeiros:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new client (for admins and barbers)
  app.post('/api/clients', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        console.log('Acesso não autorizado - sessão inválida');
        return res.status(401).json({ 
          success: false,
          message: 'Não autorizado' 
        });
      }

      const { fullName, email, phone, notes, barberId } = req.body;
      console.log('Dados recebidos para criação de cliente:', { fullName, email, phone, notes, barberId });

      // Validate required fields
      if (!fullName || !email || !phone) {
        console.log('Campos obrigatórios não fornecidos');
        return res.status(400).json({ 
          success: false,
          message: 'Nome, email e telefone são obrigatórios' 
        });
      }
      
      // Verificar se já existe um usuário com este telefone
      const existingUserByPhone = await storage.getUserByPhone(phone);
      if (existingUserByPhone) {
        console.log('Telefone já cadastrado:', phone);
        return res.status(422).json({
          success: false,
          code: 'PHONE_ALREADY_EXISTS',
          message: 'Já existe um cliente com este número de telefone',
          details: {
            field: 'phone',
            value: phone,
            existingUser: {
              id: existingUserByPhone.id,
              name: existingUserByPhone.fullName
            },
            suggestion: 'Verifique se o cliente já está cadastrado ou utilize outro número de telefone'
          }
        });
      }

      // For barbers, use their own ID
      let creatorBarberId: number | undefined;
      
      if (req.session.userRole === 'barber') {
        const barber = await storage.getBarberByUserId(req.session.userId);
        if (barber) {
          creatorBarberId = barber.id;
          console.log('Barbeiro encontrado:', { creatorBarberId });
        }
      } else if (barberId) {
        creatorBarberId = barberId;
      }

      if (!creatorBarberId && req.session.userRole !== 'admin') {
        console.log('Barbeiro não encontrado e usuário não é admin');
        return res.status(400).json({ 
          success: false, 
          message: 'Barbeiro não encontrado' 
        });
      }

      // Check if user already exists with this email
      const existingUser = await storage.getUserByEmail(email);
      let userId: number;

      if (existingUser) {
        // Update existing user
        console.log('Atualizando usuário existente:', existingUser.id);
        userId = existingUser.id;
        await storage.updateUser(userId, { 
          fullName, 
          phone: phone || existingUser.phone 
        });
      } else {
        // Create new user with random password (can be reset later)
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(randomPassword);
        
        console.log('Criando novo usuário com senha aleatória');
        const newUser = await storage.createUser({
          username: email.split('@')[0],
          email,
          password: hashedPassword,
          fullName,
          phone,
          role: 'client',
        });
        userId = newUser.id;
        console.log('Novo usuário criado com ID:', userId);
      }

      // Create client profile if it doesn't exist
      const clientProfile = await storage.getClientProfile(userId);
      if (!clientProfile) {
        console.log('Criando perfil do cliente para o usuário:', userId);
        try {
          await storage.createClientProfile({
            userId,
            // Add any additional profile fields here
          });
          console.log('Perfil do cliente criado com sucesso');
        } catch (profileError) {
          console.error('Erro ao criar perfil do cliente:', profileError);
          throw new Error('Falha ao criar perfil do cliente');
        }
      } else {
        console.log('Perfil do cliente já existe:', clientProfile.id);
      }

      // Add note if provided
      if (notes && creatorBarberId) {
        console.log('Adicionando nota para o cliente:', { clientId: userId, barberId: creatorBarberId });
        try {
          await storage.createClientNote({
            clientId: userId,
            barberId: creatorBarberId,
            note: notes,
          });
          console.log('Nota adicionada com sucesso');
        } catch (noteError) {
          console.error('Erro ao adicionar nota:', noteError);
          // Não interrompemos o fluxo se falhar ao adicionar a nota
        }
      }

      // Log the action
      try {
        await storage.createActionLog({
          userId: req.session.userId,
          action: 'create_client',
          entity: 'user',
          entityId: userId,
          details: `Cliente criado por ${req.session.userRole}`,
        });
        console.log('Log de ação criado com sucesso');
      } catch (logError) {
        console.error('Erro ao criar log de ação:', logError);
        // Não interrompemos o fluxo se falhar ao criar o log
      }

      res.status(201).json({ 
        success: true, 
        userId,
        message: existingUser ? 'Cliente atualizado com sucesso' : 'Cliente criado com sucesso'
      });
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro ao criar cliente',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}