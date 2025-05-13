import type { Express } from "express";
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
} from "@shared/schema";
import { createClient } from "@supabase/supabase-js";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key is missing. Please set environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // AUTH ROUTES
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const { email, password, username, fullName, role, phone } = data;
      
      // Create user in Supabase Auth
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            role
          }
        }
      });
      
      if (error) throw error;
      
      // Create user in our database
      const user = await storage.createUser({
        username,
        email,
        password: "", // We don't store the actual password
        fullName,
        role,
        phone: phone || null
      });
      
      res.status(201).json({ user, message: "User registered successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      const user = await storage.getUserByEmail(email);
      if (!user) throw new Error("User not found");
      
      res.status(200).json({ user, session: data.session });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  });

  // USER ROUTES
  app.get("/api/users/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const token = authHeader.split(' ')[1];
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByEmail(data.user.email!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SERVICE ROUTES
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/services/active", async (req, res) => {
    try {
      const services = await storage.getActiveServices();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getService(id);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const data = insertServiceSchema.parse(req.body);
      const service = await storage.createService(data);
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.userId || 1, // Default to admin if not provided
        action: "create",
        entity: "service",
        entityId: service.id,
        details: JSON.stringify(service)
      });
      
      res.status(201).json(service);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertServiceSchema.partial().parse(req.body);
      
      const updatedService = await storage.updateService(id, data);
      
      if (!updatedService) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.userId || 1,
        action: "update",
        entity: "service",
        entityId: id,
        details: JSON.stringify(data)
      });
      
      res.json(updatedService);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteService(id);
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.userId || 1,
        action: "delete",
        entity: "service",
        entityId: id
      });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // BARBER ROUTES
  app.get("/api/barbers", async (req, res) => {
    try {
      const barbers = await storage.getAllBarbers();
      res.json(barbers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/barbers/active", async (req, res) => {
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

  app.get("/api/barbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const barber = await storage.getBarber(id);
      
      if (!barber) {
        return res.status(404).json({ message: "Barber not found" });
      }
      
      res.json(barber);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/barbers", async (req, res) => {
    try {
      const userData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password || "default", // Only used for new users
        fullName: req.body.fullName,
        phone: req.body.phone,
        role: "barber"
      };
      
      const user = await storage.createUser(userData);
      
      const barberData = {
        userId: user.id,
        nif: req.body.nif,
        iban: req.body.iban,
        paymentPeriod: req.body.paymentPeriod || "monthly",
        active: req.body.active !== undefined ? req.body.active : true
      };
      
      const barber = await storage.createBarber(barberData);
      
      // Create in Supabase Auth if password provided
      if (req.body.password) {
        await supabase.auth.signUp({
          email: userData.email,
          password: req.body.password,
          options: {
            data: {
              username: userData.username,
              full_name: userData.fullName,
              role: "barber"
            }
          }
        });
      }
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.adminId || 1,
        action: "create",
        entity: "barber",
        entityId: barber.id,
        details: JSON.stringify({ ...barberData, userId: user.id })
      });
      
      const barberWithUser = await storage.getBarber(barber.id);
      res.status(201).json(barberWithUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/barbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const barber = await storage.getBarber(id);
      
      if (!barber) {
        return res.status(404).json({ message: "Barber not found" });
      }
      
      // Update user data if provided
      if (req.body.username || req.body.email || req.body.fullName || req.body.phone) {
        const userData = {
          username: req.body.username,
          email: req.body.email,
          fullName: req.body.fullName,
          phone: req.body.phone
        };
        
        await storage.updateUser(barber.userId, userData);
      }
      
      // Update barber data
      const barberData = {
        nif: req.body.nif,
        iban: req.body.iban,
        paymentPeriod: req.body.paymentPeriod,
        active: req.body.active
      };
      
      await storage.updateBarber(id, barberData);
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.adminId || 1,
        action: "update",
        entity: "barber",
        entityId: id,
        details: JSON.stringify({ ...barberData, user: { 
          username: req.body.username,
          email: req.body.email,
          fullName: req.body.fullName
        }})
      });
      
      const updatedBarber = await storage.getBarber(id);
      res.json(updatedBarber);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/barbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const barber = await storage.getBarber(id);
      
      if (!barber) {
        return res.status(404).json({ message: "Barber not found" });
      }
      
      // Delete barber and its user
      await storage.deleteBarber(id);
      await storage.deleteUser(barber.userId);
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.adminId || 1,
        action: "delete",
        entity: "barber",
        entityId: id
      });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // COMMISSION ROUTES
  app.get("/api/commissions", async (req, res) => {
    try {
      const commissions = await storage.getAllCommissions();
      res.json(commissions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/commissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const commission = await storage.getCommission(id);
      
      if (!commission) {
        return res.status(404).json({ message: "Commission not found" });
      }
      
      res.json(commission);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/commissions", async (req, res) => {
    try {
      const data = insertCommissionSchema.parse(req.body);
      
      // Check if commission already exists
      const existingCommission = await storage.getCommissionByBarberAndService(
        data.barberId,
        data.serviceId
      );
      
      if (existingCommission) {
        return res.status(400).json({ 
          message: "A commission already exists for this barber and service" 
        });
      }
      
      const commission = await storage.createCommission(data);
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.adminId || 1,
        action: "create",
        entity: "commission",
        entityId: commission.id,
        details: JSON.stringify(commission)
      });
      
      res.status(201).json(commission);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/commissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertCommissionSchema.partial().parse(req.body);
      
      const updatedCommission = await storage.updateCommission(id, data);
      
      if (!updatedCommission) {
        return res.status(404).json({ message: "Commission not found" });
      }
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.adminId || 1,
        action: "update",
        entity: "commission",
        entityId: id,
        details: JSON.stringify(data)
      });
      
      res.json(updatedCommission);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/commissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCommission(id);
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.adminId || 1,
        action: "delete",
        entity: "commission",
        entityId: id
      });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // APPOINTMENT ROUTES
  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/appointments/upcoming", async (req, res) => {
    try {
      const appointments = await storage.getUpcomingAppointments();
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/appointments/available-slots", async (req, res) => {
    try {
      const { barberId, date } = req.query;
      
      if (!barberId || !date) {
        return res.status(400).json({ message: "barberId and date are required" });
      }
      
      const slots = await storage.getAvailableTimeSlots(
        parseInt(barberId as string),
        new Date(date as string)
      );
      
      res.json(slots);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      // Find or create client user
      let clientId;
      const existingUser = await storage.getUserByEmail(req.body.clientEmail);
      
      if (existingUser) {
        clientId = existingUser.id;
      } else {
        // Create new client user
        const newUser = await storage.createUser({
          username: req.body.clientEmail.split('@')[0],
          email: req.body.clientEmail,
          password: "", // We don't set password for clients created via booking
          fullName: req.body.clientName,
          phone: req.body.clientPhone,
          role: "client"
        });
        clientId = newUser.id;
      }
      
      const appointmentData = {
        clientId,
        barberId: parseInt(req.body.barberId),
        serviceId: parseInt(req.body.serviceId),
        date: new Date(req.body.date),
        status: "pending",
        notes: req.body.notes || null
      };
      
      const appointment = await storage.createAppointment(appointmentData);
      
      // Log the action
      await storage.createActionLog({
        userId: clientId,
        action: "create",
        entity: "appointment",
        entityId: appointment.id,
        details: JSON.stringify(appointmentData)
      });
      
      res.status(201).json(appointment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/appointments/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "confirmed", "completed", "canceled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedAppointment = await storage.updateAppointmentStatus(id, status);
      
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // If status is completed, create a completed service entry
      if (status === "completed") {
        const appointment = await storage.getAppointment(id);
        
        if (appointment) {
          await storage.createCompletedService({
            barberId: appointment.barberId,
            serviceId: appointment.serviceId,
            clientName: appointment.client.fullName,
            price: appointment.service.price,
            date: appointment.date,
            appointmentId: appointment.id
          });
        }
      }
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.userId || 1,
        action: "update",
        entity: "appointment",
        entityId: id,
        details: JSON.stringify({ status })
      });
      
      res.json(updatedAppointment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // PAYMENT ROUTES
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getPayment(id);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const data = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(data);
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.adminId || 1,
        action: "create",
        entity: "payment",
        entityId: payment.id,
        details: JSON.stringify(payment)
      });
      
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/payments/:id/pay", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedPayment = await storage.markPaymentAsPaid(id);
      
      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.adminId || 1,
        action: "update",
        entity: "payment",
        entityId: id,
        details: "Payment marked as paid"
      });
      
      res.json(updatedPayment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // COMPLETED SERVICES ROUTES
  app.post("/api/barber/completed-services", async (req, res) => {
    try {
      const data = insertCompletedServiceSchema.parse(req.body);
      const completedService = await storage.createCompletedService(data);
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.barberId || data.barberId,
        action: "create",
        entity: "completed_service",
        entityId: completedService.id,
        details: JSON.stringify(completedService)
      });
      
      res.status(201).json(completedService);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // BARBER DASHBOARD ROUTES
  app.get("/api/barber/dashboard", async (req, res) => {
    try {
      const barberId = parseInt(req.query.barberId as string || "1");
      
      // Get monthly earnings
      const monthlyEarnings = await storage.getBarberMonthlyEarnings(barberId);
      
      // Get services count
      const servicesCount = await storage.getBarberServicesCount(barberId);
      
      // Get next payment date
      const nextPayment = await storage.getBarberNextPayment(barberId);
      
      // Calculate previous month growth
      const previousMonthEarnings = await storage.getBarberPreviousMonthEarnings(barberId);
      const previousMonthGrowth = previousMonthEarnings > 0 
        ? ((monthlyEarnings - previousMonthEarnings) / previousMonthEarnings) * 100 
        : 0;
      
      // Get sales chart data
      const salesChart = await storage.getBarberSalesChartData(barberId);
      
      res.json({
        barber: {
          monthlyEarnings,
          servicesCount,
          nextPaymentDate: nextPayment?.periodEnd || null,
          previousMonthGrowth: Math.round(previousMonthGrowth)
        },
        salesChart
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/barber/appointments", async (req, res) => {
    try {
      const barberId = parseInt(req.query.barberId as string || "1");
      const appointments = await storage.getBarberAppointments(barberId);
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/barber/appointments/today", async (req, res) => {
    try {
      const barberId = parseInt(req.query.barberId as string || "1");
      const appointments = await storage.getBarberTodayAppointments(barberId);
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/barber/appointments/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["completed", "canceled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedAppointment = await storage.updateAppointmentStatus(id, status);
      
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // If status is completed, create a completed service entry
      if (status === "completed") {
        const appointment = await storage.getAppointment(id);
        
        if (appointment) {
          await storage.createCompletedService({
            barberId: appointment.barberId,
            serviceId: appointment.serviceId,
            clientName: appointment.client.fullName,
            price: appointment.service.price,
            date: appointment.date,
            appointmentId: appointment.id
          });
        }
      }
      
      // Log the action
      await storage.createActionLog({
        userId: req.body.barberId || updatedAppointment.barberId,
        action: "update",
        entity: "appointment",
        entityId: id,
        details: JSON.stringify({ status })
      });
      
      res.json(updatedAppointment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/barber/services/recent", async (req, res) => {
    try {
      const barberId = parseInt(req.query.barberId as string || "1");
      const services = await storage.getBarberRecentServices(barberId);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/barber/services/history", async (req, res) => {
    try {
      const barberId = parseInt(req.query.barberId as string || "1");
      const period = req.query.period as string || "month";
      const services = await storage.getBarberServicesHistory(barberId, period);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/barber/payments/history", async (req, res) => {
    try {
      const barberId = parseInt(req.query.barberId as string || "1");
      const period = req.query.period as string || "month";
      const payments = await storage.getBarberPaymentsHistory(barberId, period);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/barber/earnings", async (req, res) => {
    try {
      const barberId = parseInt(req.query.barberId as string || "1");
      const period = req.query.period as string || "month";
      
      // Get period earnings
      const earnings = await storage.getBarberEarningsByPeriod(barberId, period);
      
      // Get previous period earnings
      const previousEarnings = await storage.getBarberPreviousPeriodEarnings(barberId, period);
      
      // Calculate change percentage
      const change = previousEarnings > 0 
        ? ((earnings - previousEarnings) / previousEarnings) * 100
        : 0;
      
      // Get chart data
      const chartData = await storage.getBarberEarningsChartData(barberId, period);
      
      res.json({
        total: earnings,
        previous: previousEarnings,
        change: Math.round(change),
        chartData
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ADMIN DASHBOARD ROUTES
  app.get("/api/dashboard", async (req, res) => {
    try {
      const period = req.query.period as string || "week";
      
      // Get stats
      const todaySales = await storage.getTodaySales();
      const appointmentsCount = await storage.getAppointmentsCountByPeriod(period);
      const pendingPayments = await storage.getPendingPaymentsTotal();
      const newClients = await storage.getNewClientsCountByPeriod(period);
      
      // Get trends
      const previousPeriodSales = await storage.getPreviousPeriodSales(period);
      const currentPeriodSales = await storage.getCurrentPeriodSales(period);
      const salesTrend = previousPeriodSales > 0 
        ? ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100
        : 0;
      
      const previousPeriodAppointments = await storage.getPreviousPeriodAppointmentsCount(period);
      const appointmentsTrend = previousPeriodAppointments > 0 
        ? ((appointmentsCount - previousPeriodAppointments) / previousPeriodAppointments) * 100
        : 0;
      
      const previousPendingPayments = await storage.getPreviousPendingPaymentsTotal();
      const pendingPaymentsTrend = previousPendingPayments > 0 
        ? ((pendingPayments - previousPendingPayments) / previousPendingPayments) * 100
        : 0;
      
      const previousNewClients = await storage.getPreviousPeriodNewClientsCount(period);
      const newClientsTrend = previousNewClients > 0 
        ? ((newClients - previousNewClients) / previousNewClients) * 100
        : 0;
      
      // Get sales chart data
      const salesChart = await storage.getSalesChartData(period);
      
      res.json({
        stats: {
          sales: todaySales,
          appointments: appointmentsCount,
          pendingPayments,
          newClients,
          salesTrend: Math.round(salesTrend),
          appointmentsTrend: Math.round(appointmentsTrend),
          pendingPaymentsTrend: Math.round(pendingPaymentsTrend),
          newClientsTrend: Math.round(newClientsTrend)
        },
        salesChart
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/services/popular", async (req, res) => {
    try {
      const popularServices = await storage.getPopularServices();
      res.json(popularServices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
