import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, numeric, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Defining enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'barber', 'client']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid']);
export const paymentPeriodEnum = pgEnum('payment_period', ['weekly', 'biweekly', 'monthly']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'completed', 'canceled']);
export const hairTypeEnum = pgEnum('hair_type', ['straight', 'wavy', 'curly', 'coily']);
export const beardTypeEnum = pgEnum('beard_type', ['none', 'stubble', 'short', 'medium', 'long', 'full']);
export const productCategoryEnum = pgEnum('product_category', ['shampoo', 'conditioner', 'styling', 'beard', 'skincare', 'equipment', 'other']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('client'),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  metadata: text("metadata"),
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
  calendarVisibility: text("calendar_visibility").default('own'), // 'own', 'all', ou IDs específicos em formato JSON
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
  clientId: integer("client_id").references(() => users.id),
  clientName: text("client_name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  validatedByAdmin: boolean("validated_by_admin").default(false),
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

// Client profiles table
export const clientProfiles = pgTable("client_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  birthdate: timestamp("birthdate"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  notes: text("notes"),
  referralSource: text("referral_source"),
  lastVisit: timestamp("last_visit"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client preferences table
export const clientPreferences = pgTable("client_preferences", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  preferredBarberId: integer("preferred_barber_id").references(() => barbers.id),
  preferredDayOfWeek: integer("preferred_day_of_week"), // 0-6 for Sunday-Saturday
  preferredTimeOfDay: text("preferred_time_of_day"), // morning, afternoon, evening
  hairType: hairTypeEnum("hair_type"),
  beardType: beardTypeEnum("beard_type"),
  preferredHairStyle: text("preferred_hair_style"),
  preferredBeardStyle: text("preferred_beard_style"),
  allergies: text("allergies"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Client notes table (for barbers to keep notes about clients)
export const clientNotes = pgTable("client_notes", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  barberId: integer("barber_id").notNull().references(() => barbers.id, { onDelete: 'cascade' }),
  note: text("note").notNull(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client favorite services
export const clientFavoriteServices = pgTable("client_favorite_services", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
  category: productCategoryEnum("category").notNull(),
  sku: text("sku").notNull().unique(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  active: boolean("active").notNull().default(true),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product commissions table
export const productCommissions = pgTable("product_commissions", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").notNull().references(() => barbers.id, { onDelete: 'cascade' }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product sales table
export const productSales = pgTable("product_sales", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").notNull().references(() => barbers.id, { onDelete: 'cascade' }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  clientId: integer("client_id").references(() => users.id),
  clientName: text("client_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  validatedByAdmin: boolean("validated_by_admin").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Barber invites table
export const barberInvites = pgTable("barber_invites", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  barberId: text("barber_id").notNull(), // Store as text since it's a custom ID provided by admin
  createdById: integer("created_by_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  isUsed: boolean("is_used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
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
  .omit({ id: true, createdAt: true, validatedByAdmin: true });

export const insertActionLogSchema = createInsertSchema(actionLogs)
  .omit({ id: true, createdAt: true });

export const insertClientProfileSchema = createInsertSchema(clientProfiles)
  .omit({ id: true, createdAt: true, lastVisit: true });

export const insertClientPreferencesSchema = createInsertSchema(clientPreferences)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertClientNoteSchema = createInsertSchema(clientNotes)
  .omit({ id: true, createdAt: true });

export const insertClientFavoriteServiceSchema = createInsertSchema(clientFavoriteServices)
  .omit({ id: true, createdAt: true });

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, createdAt: true });

export const insertProductCommissionSchema = createInsertSchema(productCommissions)
  .omit({ id: true, createdAt: true });

export const insertProductSaleSchema = createInsertSchema(productSales)
  .omit({ id: true, createdAt: true, validatedByAdmin: true });

export const insertBarberInviteSchema = createInsertSchema(barberInvites)
  .omit({ id: true, createdAt: true, isUsed: true, usedAt: true });

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

export type ClientProfile = typeof clientProfiles.$inferSelect;
export type InsertClientProfile = z.infer<typeof insertClientProfileSchema>;

export type ClientPreference = typeof clientPreferences.$inferSelect;
export type InsertClientPreference = z.infer<typeof insertClientPreferencesSchema>;

export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = z.infer<typeof insertClientNoteSchema>;

export type ClientFavoriteService = typeof clientFavoriteServices.$inferSelect;
export type InsertClientFavoriteService = z.infer<typeof insertClientFavoriteServiceSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductCommission = typeof productCommissions.$inferSelect;
export type InsertProductCommission = z.infer<typeof insertProductCommissionSchema>;

export type ProductSale = typeof productSales.$inferSelect;
export type InsertProductSale = z.infer<typeof insertProductSaleSchema>;

export type BarberInvite = typeof barberInvites.$inferSelect;
export type InsertBarberInvite = z.infer<typeof insertBarberInviteSchema>;

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

export type ClientWithProfile = User & {
  profile: ClientProfile;
};

export type ClientWithPreferences = ClientWithProfile & {
  preferences: ClientPreference;
};

export type ClientWithDetails = ClientWithPreferences & {
  notes: ClientNote[];
  favoriteServices: (ClientFavoriteService & { service: Service })[];
  appointments: AppointmentWithDetails[];
};

export type ProductWithCommission = Product & {
  commission?: ProductCommission;
};

export type ProductSaleWithDetails = ProductSale & {
  product: Product;
  barber: BarberWithUser;
};

// Tipo para as preferências do usuário
export interface UserPreferences {
  theme?: string;
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    appointmentReminders?: boolean;
    marketing?: boolean;
  };
}
