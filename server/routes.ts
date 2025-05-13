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
      res.json(barbers);
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

  const httpServer = createServer(app);

  return httpServer;
}