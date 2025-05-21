// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import session from "express-session";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Declare session properties
declare module "express-session" {
  interface SessionData {
    userId: number;
    userRole: string;
  }
}

const app = express();
app.use(express.json({ limit: '10mb' })); // Aumentado para suportar imagens base64
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'barbershop-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Função para inicializar dados de teste
async function setupTestData() {
  try {
    // Verificar se já existem usuários
    const existingUsers = await storage.getAllUsers();
    if (existingUsers.length > 0) {
      log("Dados de teste já existem. Pulando inicialização.");
      return;
    }

    log("Inicializando dados de teste...");
    
    // Hash a senha padrão para os usuários de teste
    const hashedPassword = await bcrypt.hash("senha123", 10);
    
    // Criar usuário admin
    const admin = await storage.createUser({
      username: "admin",
      email: "admin@barberpro.com",
      password: hashedPassword,
      fullName: "Administrador",
      role: "admin",
      phone: "+351123456789"
    });
    
    // Criar usuário cliente
    const client = await storage.createUser({
      username: "cliente",
      email: "cliente@exemplo.com",
      password: hashedPassword,
      fullName: "Cliente Teste",
      role: "client",
      phone: "+351987654321"
    });
    
    // Criar usuário barbeiro
    const barberUser = await storage.createUser({
      username: "barbeiro",
      email: "barbeiro@barberpro.com",
      password: hashedPassword,
      fullName: "João Silva",
      role: "barber",
      phone: "+351456789123"
    });
    
    // Criar registro de barbeiro
    const barber = await storage.createBarber({
      userId: barberUser.id,
      nif: "123456789",
      iban: "PT50000201231234567890154",
      paymentPeriod: "monthly",
      active: true
    });
    
    // Criar serviços
    const service1 = await storage.createService({
      name: "Corte de Cabelo",
      description: "Corte masculino básico",
      price: "15.00",
      duration: 30,
      active: true
    });
    
    const service2 = await storage.createService({
      name: "Barba",
      description: "Aparo e modelagem de barba",
      price: "10.00",
      duration: 20,
      active: true
    });
    
    const service3 = await storage.createService({
      name: "Corte e Barba",
      description: "Corte masculino completo com barba",
      price: "22.00",
      duration: 45,
      active: true
    });
    
    // Registrar comissões
    await storage.createCommission({
      barberId: barber.id,
      serviceId: service1.id,
      percentage: "70.00"
    });
    
    await storage.createCommission({
      barberId: barber.id,
      serviceId: service2.id,
      percentage: "70.00"
    });
    
    await storage.createCommission({
      barberId: barber.id,
      serviceId: service3.id,
      percentage: "70.00"
    });

    // Criar alguns serviços concluídos de exemplo
    const date = new Date();
    
    // Serviço completado 1 - Não validado
    await storage.createCompletedService({
      barberId: barber.id,
      serviceId: service1.id,
      clientId: client.id,
      clientName: client.fullName,
      price: service1.price,
      date: new Date(date.setDate(date.getDate() - 5)),
      appointmentId: null,
      validatedByAdmin: false
    });
    
    // Serviço completado 2 - Não validado
    await storage.createCompletedService({
      barberId: barber.id,
      serviceId: service2.id,
      clientId: client.id,
      clientName: client.fullName,
      price: service2.price,
      date: new Date(date.setDate(date.getDate() - 2)),
      appointmentId: null,
      validatedByAdmin: false
    });
    
    // Serviço completado 3 - Já validado
    await storage.createCompletedService({
      barberId: barber.id,
      serviceId: service3.id,
      clientId: client.id,
      clientName: client.fullName,
      price: service3.price,
      date: new Date(date.setDate(date.getDate() - 10)),
      appointmentId: null,
      validatedByAdmin: true
    });
    
    log("Dados de teste criados com sucesso!");
  } catch (error) {
    console.error("Erro ao criar dados de teste:", error);
  }
}

(async () => {
  const server = await registerRoutes(app);
  
  // Setup test data before server starts
  await setupTestData();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on port 3000 for development
  // this serves both the API and the client.
  const port = 3000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
