import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, numeric, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Defining enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'barber', 'client']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid']);
export const paymentPeriodEnum = pgEnum('payment_period', ['weekly', 'biweekly', 'monthly']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'completed', 'canceled']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('client'),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Barbers table
export const barbers = pgTable("barbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  nif: text("nif").notNull(), // Tax Identification Number
  iban: text("iban").notNull(),
  paymentPeriod: paymentPeriodEnum("payment_period").notNull().default('monthly'),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in minutes
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Commissions table
export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").notNull().references(() => barbers.id, { onDelete: 'cascade' }),
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: 'cascade' }),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  barberId: integer("barber_id").notNull().references(() => barbers.id, { onDelete: 'cascade' }),
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  status: appointmentStatusEnum("status").notNull().default('pending'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").notNull().references(() => barbers.id, { onDelete: 'cascade' }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  paymentDate: timestamp("payment_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Completed services table
export const completedServices = pgTable("completed_services", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").notNull().references(() => barbers.id, { onDelete: 'cascade' }),
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: 'cascade' }),
  clientName: text("client_name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Action logs table
export const actionLogs = pgTable("action_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertBarberSchema = createInsertSchema(barbers)
  .omit({ id: true, createdAt: true });

export const insertServiceSchema = createInsertSchema(services)
  .omit({ id: true, createdAt: true });

export const insertCommissionSchema = createInsertSchema(commissions)
  .omit({ id: true, createdAt: true });

export const insertAppointmentSchema = createInsertSchema(appointments)
  .omit({ id: true, createdAt: true });

export const insertPaymentSchema = createInsertSchema(payments)
  .omit({ id: true, createdAt: true });

export const insertCompletedServiceSchema = createInsertSchema(completedServices)
  .omit({ id: true, createdAt: true });

export const insertActionLogSchema = createInsertSchema(actionLogs)
  .omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Barber = typeof barbers.$inferSelect;
export type InsertBarber = z.infer<typeof insertBarberSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type CompletedService = typeof completedServices.$inferSelect;
export type InsertCompletedService = z.infer<typeof insertCompletedServiceSchema>;

export type ActionLog = typeof actionLogs.$inferSelect;
export type InsertActionLog = z.infer<typeof insertActionLogSchema>;

// Join schemas for API responses
export type BarberWithUser = Barber & {
  user: User;
};

export type AppointmentWithDetails = Appointment & {
  client: User;
  barber: BarberWithUser;
  service: Service;
};

export type CompletedServiceWithDetails = CompletedService & {
  barber: BarberWithUser;
  service: Service;
};

export type PaymentWithBarber = Payment & {
  barber: BarberWithUser;
};

export type CommissionWithDetails = Commission & {
  barber: BarberWithUser;
  service: Service;
};
