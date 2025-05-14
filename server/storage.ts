import { 
  users, barbers, services, commissions, appointments, payments, completedServices, actionLogs,
  clientProfiles, clientPreferences, clientNotes, clientFavoriteServices, barberInvites,
  products, productCommissions, productSales,
  type User, type InsertUser,
  type Barber, type InsertBarber,
  type Service, type InsertService,
  type Commission, type InsertCommission,
  type Appointment, type InsertAppointment,
  type Payment, type InsertPayment,
  type CompletedService, type InsertCompletedService,
  type ActionLog, type InsertActionLog,
  type ClientProfile, type InsertClientProfile,
  type ClientPreference, type InsertClientPreference,
  type ClientNote, type InsertClientNote,
  type ClientFavoriteService, type InsertClientFavoriteService,
  type Product, type InsertProduct,
  type ProductCommission, type InsertProductCommission,
  type ProductSale, type InsertProductSale,
  type BarberInvite, type InsertBarberInvite,
  type BarberWithUser,
  type AppointmentWithDetails,
  type PaymentWithBarber,
  type ClientWithProfile,
  type ClientWithPreferences,
  type ClientWithDetails,
  type ProductWithCommission,
  type ProductSaleWithDetails
} from "@shared/schema";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import postgres from 'postgres';

// Basic Storage Interface
// Interface para preferências do usuário
interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    appointmentReminders?: boolean;
    marketing?: boolean;
  };
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  updateUserPreferences(userId: number, preferences: UserPreferences): Promise<void>;

  // Barber methods
  getBarber(id: number): Promise<BarberWithUser | undefined>;
  getAllBarbers(): Promise<BarberWithUser[]>;
  getActiveBarbers(): Promise<BarberWithUser[]>;
  getTopBarbers(): Promise<BarberWithUser[]>;
  getBarberByUserId(userId: number): Promise<Barber | undefined>;
  createBarber(barber: InsertBarber): Promise<Barber>;
  updateBarber(id: number, barber: Partial<InsertBarber>): Promise<Barber | undefined>;
  deleteBarber(id: number): Promise<void>;

  // Service methods
  getService(id: number): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  getActiveServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<void>;

  // Commission methods
  getCommission(id: number): Promise<Commission | undefined>;
  getCommissionByBarberAndService(barberId: number, serviceId: number): Promise<Commission | undefined>;
  getAllCommissions(): Promise<Commission[]>;
  createCommission(commission: InsertCommission): Promise<Commission>;
  updateCommission(id: number, commission: Partial<InsertCommission>): Promise<Commission | undefined>;
  deleteCommission(id: number): Promise<void>;

  // Appointment methods
  getAppointment(id: number): Promise<AppointmentWithDetails | undefined>;
  getAllAppointments(): Promise<AppointmentWithDetails[]>;
  getUpcomingAppointments(): Promise<AppointmentWithDetails[]>;
  getAvailableTimeSlots(barberId: number, date: Date): Promise<string[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<void>;

  // Payment methods
  getPayment(id: number): Promise<PaymentWithBarber | undefined>;
  getPaymentsByBarber(barberId: number): Promise<PaymentWithBarber[]>;
  getAllPayments(): Promise<PaymentWithBarber[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<void>;

  // Completed Service methods
  getCompletedService(id: number): Promise<CompletedService | undefined>;
  getCompletedServicesByBarber(barberId: number): Promise<CompletedService[]>;
  getAllCompletedServices(): Promise<CompletedService[]>;
  createCompletedService(service: InsertCompletedService): Promise<CompletedService>;
  updateCompletedService(id: number, data: Partial<CompletedService>): Promise<CompletedService | undefined>;
  deleteCompletedService(id: number): Promise<void>;

  // Action Log methods
  createActionLog(log: InsertActionLog): Promise<ActionLog>;
  
  // Client Profile methods
  getClientProfile(userId: number): Promise<ClientProfile | undefined>;
  createClientProfile(profile: InsertClientProfile): Promise<ClientProfile>;
  updateClientProfile(userId: number, profile: Partial<InsertClientProfile>): Promise<ClientProfile | undefined>;
  
  // Client Preferences methods
  getClientPreferences(clientId: number): Promise<ClientPreference | undefined>;
  createClientPreferences(preferences: InsertClientPreference): Promise<ClientPreference>;
  updateClientPreferences(clientId: number, preferences: Partial<InsertClientPreference>): Promise<ClientPreference | undefined>;
  
  // Client Notes methods
  getClientNotes(clientId: number): Promise<ClientNote[]>;
  getClientNotesByBarber(clientId: number, barberId: number): Promise<ClientNote[]>;
  createClientNote(note: InsertClientNote): Promise<ClientNote>;
  deleteClientNote(id: number): Promise<void>;
  
  // Client Favorite Services methods
  getClientFavoriteServices(clientId: number): Promise<(ClientFavoriteService & { service: Service })[]>;
  addClientFavoriteService(favorite: InsertClientFavoriteService): Promise<ClientFavoriteService>;
  removeClientFavoriteService(id: number): Promise<void>;
  
  // Client Management methods
  getClientWithProfile(userId: number): Promise<ClientWithProfile | undefined>;
  getClientWithPreferences(userId: number): Promise<ClientWithPreferences | undefined>;
  getClientWithDetails(userId: number): Promise<ClientWithDetails | undefined>;
  getAllClientsWithProfiles(): Promise<ClientWithProfile[]>;
  getRecentClients(limit?: number): Promise<ClientWithProfile[]>;
  
  // Barber Invite methods
  createBarberInvite(invite: InsertBarberInvite): Promise<BarberInvite>;
  getBarberInviteByToken(token: string): Promise<BarberInvite | undefined>;
  markBarberInviteAsUsed(id: number): Promise<BarberInvite | undefined>;
  getBarberInvitesByCreator(createdById: number): Promise<BarberInvite[]>;
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  
  // Product Commission methods
  getProductCommission(id: number): Promise<ProductCommission | undefined>;
  getProductCommissionByBarberAndProduct(barberId: number, productId: number): Promise<ProductCommission | undefined>;
  getProductCommissionsByBarber(barberId: number): Promise<ProductCommission[]>;
  createProductCommission(commission: InsertProductCommission): Promise<ProductCommission>;
  updateProductCommission(id: number, commission: Partial<InsertProductCommission>): Promise<ProductCommission | undefined>;
  deleteProductCommission(id: number): Promise<void>;
  
  // Product Sales methods
  getProductSale(id: number): Promise<ProductSaleWithDetails | undefined>;
  getProductSalesByBarber(barberId: number): Promise<ProductSaleWithDetails[]>;
  getAllProductSales(): Promise<ProductSaleWithDetails[]>;
  createProductSale(sale: InsertProductSale): Promise<ProductSale>;
  updateProductSale(id: number, sale: Partial<InsertProductSale>): Promise<ProductSale | undefined>;
  validateProductSale(id: number): Promise<ProductSale | undefined>;
  deleteProductSale(id: number): Promise<void>;
  
  // Product with commissions
  getProductsWithCommissionsForBarber(barberId: number): Promise<ProductWithCommission[]>;
}

// Memory Storage for Development/Testing
export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private barbersData: Map<number, Barber>;
  private servicesData: Map<number, Service>;
  private commissionsData: Map<number, Commission>;
  private appointmentsData: Map<number, Appointment>;
  private paymentsData: Map<number, Payment>;
  private completedServicesData: Map<number, CompletedService>;
  private actionLogsData: Map<number, ActionLog>;
  private clientProfilesData: Map<number, ClientProfile>;
  private clientPreferencesData: Map<number, ClientPreference>;
  private clientNotesData: Map<number, ClientNote>;
  private clientFavoriteServicesData: Map<number, ClientFavoriteService>;
  private barberInvitesData: Map<number, BarberInvite>;
  private productsData: Map<number, Product>;
  private productCommissionsData: Map<number, ProductCommission>;
  private productSalesData: Map<number, ProductSale>;
  
  private userIdCounter: number;
  private barberIdCounter: number;
  private serviceIdCounter: number;
  private commissionIdCounter: number;
  private appointmentIdCounter: number;
  private paymentIdCounter: number;
  private completedServiceIdCounter: number;
  private actionLogIdCounter: number;
  private clientProfileIdCounter: number;
  private clientPreferenceIdCounter: number;
  private clientNoteIdCounter: number;
  private clientFavoriteServiceIdCounter: number;
  private barberInviteIdCounter: number;
  private productIdCounter: number;
  private productCommissionIdCounter: number;
  private productSaleIdCounter: number;

  constructor() {
    this.usersData = new Map();
    this.barbersData = new Map();
    this.servicesData = new Map();
    this.commissionsData = new Map();
    this.appointmentsData = new Map();
    this.paymentsData = new Map();
    this.completedServicesData = new Map();
    this.actionLogsData = new Map();
    this.clientProfilesData = new Map();
    this.clientPreferencesData = new Map();
    this.clientNotesData = new Map();
    this.clientFavoriteServicesData = new Map();
    this.barberInvitesData = new Map();
    this.productsData = new Map();
    this.productCommissionsData = new Map();
    this.productSalesData = new Map();
    
    this.userIdCounter = 1;
    this.barberIdCounter = 1;
    this.serviceIdCounter = 1;
    this.commissionIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.paymentIdCounter = 1;
    this.completedServiceIdCounter = 1;
    this.actionLogIdCounter = 1;
    this.clientProfileIdCounter = 1;
    this.clientPreferenceIdCounter = 1;
    this.clientNoteIdCounter = 1;
    this.clientFavoriteServiceIdCounter = 1;
    this.barberInviteIdCounter = 1;
    this.productIdCounter = 1;
    this.productCommissionIdCounter = 1;
    this.productSaleIdCounter = 1;
  }

  /* User Methods */
  async getUser(id: number): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;
    
    // Garantir que todos os usuários tenham o campo metadata
    return {
      ...user,
      metadata: user.metadata || null
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = Array.from(this.usersData.values()).find(
      (user) => user.username === username,
    );
    
    if (!user) return undefined;
    
    return {
      ...user,
      metadata: user.metadata || null
    };
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = Array.from(this.usersData.values()).find(
      (user) => user.email === email,
    );
    
    if (!user) return undefined;
    
    return {
      ...user,
      metadata: user.metadata || null
    };
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersData.values()).map(user => ({
      ...user,
      metadata: user.metadata || null
    }));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.usersData.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPreferences(userId: number, preferences: UserPreferences): Promise<void> {
    const user = this.usersData.get(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Em uma implementação real com banco de dados, teríamos uma tabela específica para preferências
    // Por simplicidade, utilizamos um campo metadata para armazenar as preferências
    
    // Se o usuário não tiver campo metadata, inicializamos um objeto vazio
    let metadata = {};
    
    // Se o usuário já tiver metadata, tentamos fazer o parse
    if (user.metadata) {
      try {
        metadata = JSON.parse(user.metadata);
      } catch (error) {
        console.error('Erro ao fazer parse do metadata do usuário:', error);
        metadata = {};
      }
    }
    
    // Atualizamos ou adicionamos as preferências
    const updatedMetadata = {
      ...metadata,
      preferences: {
        ...(metadata.preferences || {}),
        ...preferences
      }
    };
    
    // Atualizamos o usuário com o novo metadata
    const updatedUser = { 
      ...user,
      metadata: JSON.stringify(updatedMetadata)
    };
    
    this.usersData.set(userId, updatedUser);
  }
  
  async deleteUser(id: number): Promise<void> {
    this.usersData.delete(id);
  }

  /* Barber Methods */
  async getBarber(id: number): Promise<BarberWithUser | undefined> {
    const barber = this.barbersData.get(id);
    if (!barber) return undefined;
    
    const user = await this.getUser(barber.userId);
    if (!user) return undefined;
    
    return { ...barber, user };
  }
  
  async getAllBarbers(): Promise<BarberWithUser[]> {
    const barbers = Array.from(this.barbersData.values());
    const result: BarberWithUser[] = [];
    
    for (const barber of barbers) {
      const user = await this.getUser(barber.userId);
      if (user) {
        result.push({ ...barber, user });
      }
    }
    
    return result;
  }
  
  async getActiveBarbers(): Promise<BarberWithUser[]> {
    const barbers = Array.from(this.barbersData.values()).filter(b => b.active);
    const result: BarberWithUser[] = [];
    
    for (const barber of barbers) {
      const user = await this.getUser(barber.userId);
      if (user) {
        result.push({ ...barber, user });
      }
    }
    
    return result;
  }
  
  async getTopBarbers(): Promise<BarberWithUser[]> {
    // In memory implementation, just return all barbers
    return this.getAllBarbers();
  }
  
  async getBarberByUserId(userId: number): Promise<Barber | undefined> {
    // Encontrar um barbeiro pelo ID do usuário associado
    return Array.from(this.barbersData.values()).find(
      (barber) => barber.userId === userId
    );
  }
  
  async createBarber(barberData: InsertBarber): Promise<Barber> {
    const id = this.barberIdCounter++;
    const createdAt = new Date();
    const barber: Barber = { ...barberData, id, createdAt };
    this.barbersData.set(id, barber);
    return barber;
  }
  
  async updateBarber(id: number, barberData: Partial<InsertBarber>): Promise<Barber | undefined> {
    const barber = this.barbersData.get(id);
    if (!barber) return undefined;
    
    const updatedBarber = { ...barber, ...barberData };
    this.barbersData.set(id, updatedBarber);
    return updatedBarber;
  }
  
  async deleteBarber(id: number): Promise<void> {
    this.barbersData.delete(id);
  }

  /* Service Methods */
  async getService(id: number): Promise<Service | undefined> {
    return this.servicesData.get(id);
  }
  
  async getAllServices(): Promise<Service[]> {
    return Array.from(this.servicesData.values());
  }
  
  async getActiveServices(): Promise<Service[]> {
    return Array.from(this.servicesData.values()).filter(s => s.active);
  }
  
  async createService(serviceData: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const createdAt = new Date();
    const service: Service = { ...serviceData, id, createdAt };
    this.servicesData.set(id, service);
    return service;
  }
  
  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.servicesData.get(id);
    if (!service) return undefined;
    
    const updatedService = { ...service, ...serviceData };
    this.servicesData.set(id, updatedService);
    return updatedService;
  }
  
  async deleteService(id: number): Promise<void> {
    this.servicesData.delete(id);
  }

  /* Commission Methods */
  async getCommission(id: number): Promise<Commission | undefined> {
    return this.commissionsData.get(id);
  }
  
  async getCommissionByBarberAndService(barberId: number, serviceId: number): Promise<Commission | undefined> {
    return Array.from(this.commissionsData.values()).find(
      c => c.barberId === barberId && c.serviceId === serviceId
    );
  }
  
  async getAllCommissions(): Promise<Commission[]> {
    return Array.from(this.commissionsData.values());
  }
  
  async createCommission(commissionData: InsertCommission): Promise<Commission> {
    const id = this.commissionIdCounter++;
    const createdAt = new Date();
    const commission: Commission = { ...commissionData, id, createdAt };
    this.commissionsData.set(id, commission);
    return commission;
  }
  
  async updateCommission(id: number, commissionData: Partial<InsertCommission>): Promise<Commission | undefined> {
    const commission = this.commissionsData.get(id);
    if (!commission) return undefined;
    
    const updatedCommission = { ...commission, ...commissionData };
    this.commissionsData.set(id, updatedCommission);
    return updatedCommission;
  }
  
  async deleteCommission(id: number): Promise<void> {
    this.commissionsData.delete(id);
  }

  /* Appointment Methods */
  async getAppointment(id: number): Promise<AppointmentWithDetails | undefined> {
    const appointment = this.appointmentsData.get(id);
    if (!appointment) return undefined;
    
    const client = await this.getUser(appointment.clientId);
    if (!client) return undefined;
    
    const barber = await this.getBarber(appointment.barberId);
    if (!barber) return undefined;
    
    const service = await this.getService(appointment.serviceId);
    if (!service) return undefined;
    
    return {
      ...appointment,
      client,
      barber,
      service
    };
  }
  
  async getAllAppointments(): Promise<AppointmentWithDetails[]> {
    const appointments = Array.from(this.appointmentsData.values());
    const result: AppointmentWithDetails[] = [];
    
    for (const appointment of appointments) {
      const client = await this.getUser(appointment.clientId);
      const barber = await this.getBarber(appointment.barberId);
      const service = await this.getService(appointment.serviceId);
      
      if (client && barber && service) {
        result.push({
          ...appointment,
          client,
          barber,
          service
        });
      }
    }
    
    return result;
  }
  
  async getUpcomingAppointments(): Promise<AppointmentWithDetails[]> {
    const now = new Date();
    const appointments = Array.from(this.appointmentsData.values())
      .filter(a => a.date > now && a.status !== 'canceled');
    
    const result: AppointmentWithDetails[] = [];
    
    for (const appointment of appointments) {
      const client = await this.getUser(appointment.clientId);
      const barber = await this.getBarber(appointment.barberId);
      const service = await this.getService(appointment.serviceId);
      
      if (client && barber && service) {
        result.push({
          ...appointment,
          client,
          barber,
          service
        });
      }
    }
    
    return result;
  }
  
  async getAvailableTimeSlots(barberId: number, date: Date): Promise<string[]> {
    // Generate time slots from 9 AM to 6 PM
    const allSlots = Array.from({ length: 18 }, (_, i) => {
      const hour = Math.floor(i / 2) + 9;
      const minute = (i % 2) * 30;
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });
    
    // Get appointments for this barber on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointments = Array.from(this.appointmentsData.values())
      .filter(a => 
        a.barberId === barberId &&
        a.date >= startOfDay &&
        a.date <= endOfDay &&
        a.status !== 'canceled'
      );
    
    // Mark booked slots
    const bookedSlots = new Set(appointments.map(a => {
      const appointmentDate = new Date(a.date);
      const hour = appointmentDate.getHours().toString().padStart(2, '0');
      const minute = appointmentDate.getMinutes().toString().padStart(2, '0');
      return `${hour}:${minute}`;
    }));
    
    // Return available slots
    return allSlots.filter(slot => !bookedSlots.has(slot));
  }
  
  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const createdAt = new Date();
    const appointment: Appointment = { 
      ...appointmentData, 
      id, 
      createdAt,
      date: new Date(appointmentData.date)
    };
    this.appointmentsData.set(id, appointment);
    return appointment;
  }
  
  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointmentsData.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { 
      ...appointment, 
      ...appointmentData,
      date: appointmentData.date ? new Date(appointmentData.date) : appointment.date
    };
    this.appointmentsData.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async deleteAppointment(id: number): Promise<void> {
    this.appointmentsData.delete(id);
  }
  
  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const appointment = this.appointmentsData.get(id);
    if (!appointment) return undefined;
    
    // Validate status
    if (!["pending", "confirmed", "completed", "canceled"].includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    const updatedAppointment = { 
      ...appointment, 
      status: status as "pending" | "confirmed" | "completed" | "canceled"
    };
    this.appointmentsData.set(id, updatedAppointment);
    return updatedAppointment;
  }

  /* Payment Methods */
  async getPayment(id: number): Promise<PaymentWithBarber | undefined> {
    const payment = this.paymentsData.get(id);
    if (!payment) return undefined;
    
    const barber = await this.getBarber(payment.barberId);
    if (!barber) return undefined;
    
    return { ...payment, barber };
  }
  
  async getPaymentsByBarber(barberId: number): Promise<PaymentWithBarber[]> {
    const payments = Array.from(this.paymentsData.values())
      .filter(p => p.barberId === barberId);
    
    const barber = await this.getBarber(barberId);
    if (!barber) return [];
    
    return payments.map(payment => ({ ...payment, barber }));
  }
  
  async getAllPayments(): Promise<PaymentWithBarber[]> {
    const payments = Array.from(this.paymentsData.values());
    const result: PaymentWithBarber[] = [];
    
    for (const payment of payments) {
      const barber = await this.getBarber(payment.barberId);
      if (barber) {
        result.push({ ...payment, barber });
      }
    }
    
    return result;
  }
  
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const createdAt = new Date();
    const payment: Payment = { 
      ...paymentData, 
      id, 
      createdAt,
      periodStart: new Date(paymentData.periodStart),
      periodEnd: new Date(paymentData.periodEnd),
      paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : null
    };
    this.paymentsData.set(id, payment);
    return payment;
  }
  
  async updatePayment(id: number, paymentData: Partial<InsertPayment>): Promise<Payment | undefined> {
    const payment = this.paymentsData.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { 
      ...payment, 
      ...paymentData,
      periodStart: paymentData.periodStart ? new Date(paymentData.periodStart) : payment.periodStart,
      periodEnd: paymentData.periodEnd ? new Date(paymentData.periodEnd) : payment.periodEnd,
      paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : payment.paymentDate
    };
    this.paymentsData.set(id, updatedPayment);
    return updatedPayment;
  }
  
  async deletePayment(id: number): Promise<void> {
    this.paymentsData.delete(id);
  }

  /* Completed Service Methods */
  async getCompletedService(id: number): Promise<CompletedService | undefined> {
    return this.completedServicesData.get(id);
  }
  
  async getCompletedServicesByBarber(barberId: number): Promise<CompletedService[]> {
    return Array.from(this.completedServicesData.values())
      .filter(cs => cs.barberId === barberId);
  }
  
  async getCompletedServicesForDateRange(barberId: number, startDate: Date, endDate: Date): Promise<CompletedService[]> {
    return Array.from(this.completedServicesData.values())
      .filter(cs => cs.barberId === barberId &&
                    cs.date >= startDate &&
                    cs.date <= endDate);
  }
  
  async getAllCompletedServices(): Promise<any[]> {
    const services = Array.from(this.completedServicesData.values());
    const result = [];
    
    for (const service of services) {
      const barber = await this.getBarber(service.barberId);
      const serviceData = await this.getService(service.serviceId);
      const client = await this.getUser(service.clientId);
      
      if (barber && serviceData && client) {
        result.push({
          ...service,
          barber,
          service: serviceData,
          client
        });
      }
    }
    
    return result;
  }
  
  async createCompletedService(serviceData: InsertCompletedService): Promise<CompletedService> {
    const id = this.completedServiceIdCounter++;
    const createdAt = new Date();
    const service: CompletedService = { 
      ...serviceData, 
      id, 
      createdAt,
      date: new Date(serviceData.date),
      validatedByAdmin: serviceData.validatedByAdmin || false,
      clientId: serviceData.clientId || null,
      appointmentId: serviceData.appointmentId || null
    };
    this.completedServicesData.set(id, service);
    return service;
  }
  
  async updateCompletedService(id: number, data: Partial<CompletedService>): Promise<CompletedService | undefined> {
    const service = this.completedServicesData.get(id);
    if (!service) return undefined;
    
    const updatedService = { ...service, ...data };
    this.completedServicesData.set(id, updatedService);
    return updatedService;
  }
  
  async deleteCompletedService(id: number): Promise<void> {
    this.completedServicesData.delete(id);
  }

  /* Action Log Methods */
  async createActionLog(logData: InsertActionLog): Promise<ActionLog> {
    const id = this.actionLogIdCounter++;
    const createdAt = new Date();
    const log: ActionLog = { ...logData, id, createdAt };
    this.actionLogsData.set(id, log);
    return log;
  }

  /* Client Profile Methods */
  async getClientProfile(userId: number): Promise<ClientProfile | undefined> {
    for (const profile of this.clientProfilesData.values()) {
      if (profile.userId === userId) {
        return profile;
      }
    }
    return undefined;
  }

  async createClientProfile(profileData: InsertClientProfile): Promise<ClientProfile> {
    const id = this.clientProfileIdCounter++;
    const createdAt = new Date();
    // Ensure all required fields have default values
    const profile: ClientProfile = {
      ...profileData,
      id,
      createdAt,
      birthdate: profileData.birthdate || null,
      address: profileData.address || null,
      city: profileData.city || null,
      postalCode: profileData.postalCode || null,
      referralSource: profileData.referralSource || null,
      notes: profileData.notes || null, 
      lastVisit: profileData.lastVisit || null
    };
    this.clientProfilesData.set(id, profile);
    return profile;
  }

  async updateClientProfile(userId: number, profileData: Partial<InsertClientProfile>): Promise<ClientProfile | undefined> {
    for (const [id, profile] of this.clientProfilesData.entries()) {
      if (profile.userId === userId) {
        const updatedProfile = { ...profile, ...profileData };
        this.clientProfilesData.set(id, updatedProfile);
        return updatedProfile;
      }
    }
    return undefined;
  }

  /* Client Preferences Methods */
  async getClientPreferences(clientId: number): Promise<ClientPreference | undefined> {
    for (const preference of this.clientPreferencesData.values()) {
      if (preference.clientId === clientId) {
        return preference;
      }
    }
    return undefined;
  }

  async createClientPreferences(preferencesData: InsertClientPreference): Promise<ClientPreference> {
    const id = this.clientPreferenceIdCounter++;
    const createdAt = new Date();
    const updatedAt = createdAt;
    // Ensure all required fields have default values
    const preferences: ClientPreference = {
      ...preferencesData,
      id,
      createdAt,
      updatedAt,
      preferredBarberId: preferencesData.preferredBarberId || null,
      preferredDayOfWeek: preferencesData.preferredDayOfWeek || null,
      preferredTimeOfDay: preferencesData.preferredTimeOfDay || null,
      hairType: preferencesData.hairType || null,
      beardType: preferencesData.beardType || null,
      preferredHairStyle: preferencesData.preferredHairStyle || null,
      preferredBeardStyle: preferencesData.preferredBeardStyle || null,
      allergies: preferencesData.allergies || null
    };
    this.clientPreferencesData.set(id, preferences);
    return preferences;
  }

  async updateClientPreferences(clientId: number, preferencesData: Partial<InsertClientPreference>): Promise<ClientPreference | undefined> {
    for (const [id, preferences] of this.clientPreferencesData.entries()) {
      if (preferences.clientId === clientId) {
        const updatedAt = new Date();
        const updatedPreferences = { ...preferences, ...preferencesData, updatedAt };
        this.clientPreferencesData.set(id, updatedPreferences);
        return updatedPreferences;
      }
    }
    return undefined;
  }

  /* Client Notes Methods */
  async getClientNotes(clientId: number): Promise<ClientNote[]> {
    const notes: ClientNote[] = [];
    for (const note of this.clientNotesData.values()) {
      if (note.clientId === clientId) {
        notes.push(note);
      }
    }
    return notes;
  }

  async getClientNotesByBarber(clientId: number, barberId: number): Promise<ClientNote[]> {
    const notes: ClientNote[] = [];
    for (const note of this.clientNotesData.values()) {
      if (note.clientId === clientId && note.barberId === barberId) {
        notes.push(note);
      }
    }
    return notes;
  }

  async createClientNote(noteData: InsertClientNote): Promise<ClientNote> {
    const id = this.clientNoteIdCounter++;
    const createdAt = new Date();
    const note: ClientNote = { ...noteData, id, createdAt };
    this.clientNotesData.set(id, note);
    return note;
  }

  async deleteClientNote(id: number): Promise<void> {
    this.clientNotesData.delete(id);
  }

  /* Client Favorite Services Methods */
  async getClientFavoriteServices(clientId: number): Promise<(ClientFavoriteService & { service: Service })[]> {
    const favorites: (ClientFavoriteService & { service: Service })[] = [];
    for (const favorite of this.clientFavoriteServicesData.values()) {
      if (favorite.clientId === clientId) {
        const service = this.servicesData.get(favorite.serviceId);
        if (service) {
          favorites.push({ ...favorite, service });
        }
      }
    }
    return favorites;
  }

  async addClientFavoriteService(favoriteData: InsertClientFavoriteService): Promise<ClientFavoriteService> {
    const id = this.clientFavoriteServiceIdCounter++;
    const createdAt = new Date();
    const favorite: ClientFavoriteService = { ...favoriteData, id, createdAt };
    this.clientFavoriteServicesData.set(id, favorite);
    return favorite;
  }

  async removeClientFavoriteService(id: number): Promise<void> {
    this.clientFavoriteServicesData.delete(id);
  }

  /* Client Management Methods */
  async getClientWithProfile(userId: number): Promise<ClientWithProfile | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const profile = await this.getClientProfile(userId);
    if (!profile) return undefined;
    
    return { ...user, profile };
  }

  async getClientWithPreferences(userId: number): Promise<ClientWithPreferences | undefined> {
    const clientWithProfile = await this.getClientWithProfile(userId);
    if (!clientWithProfile) return undefined;
    
    const preferences = await this.getClientPreferences(userId);
    if (!preferences) return undefined;
    
    return { ...clientWithProfile, preferences };
  }

  async getClientWithDetails(userId: number): Promise<ClientWithDetails | undefined> {
    const clientWithPreferences = await this.getClientWithPreferences(userId);
    if (!clientWithPreferences) return undefined;
    
    // Get the client's notes
    const notes = await this.getClientNotes(userId);
    
    // Get the client's favorite services
    const favoriteServices = await this.getClientFavoriteServices(userId);
    
    // Get the client's appointments
    const appointments: AppointmentWithDetails[] = [];
    for (const appointment of this.appointmentsData.values()) {
      if (appointment.clientId === userId) {
        const client = await this.getUser(appointment.clientId);
        const barberId = appointment.barberId;
        const barber = await this.getBarber(barberId);
        const service = await this.getService(appointment.serviceId);
        
        if (client && barber && service) {
          appointments.push({
            ...appointment,
            client,
            barber,
            service
          });
        }
      }
    }
    
    return {
      ...clientWithPreferences,
      notes,
      favoriteServices,
      appointments
    };
  }

  async getAllClientsWithProfiles(): Promise<ClientWithProfile[]> {
    const clients: ClientWithProfile[] = [];
    for (const user of this.usersData.values()) {
      if (user.role === 'client') {
        const profile = await this.getClientProfile(user.id);
        if (profile) {
          clients.push({ ...user, profile });
        }
      }
    }
    return clients;
  }

  async getRecentClients(limit: number = 10): Promise<ClientWithProfile[]> {
    const clients = await this.getAllClientsWithProfiles();
    
    // Sort by last visit date if available, otherwise by createdAt
    clients.sort((a, b) => {
      const dateA = a.profile.lastVisit || a.createdAt;
      const dateB = b.profile.lastVisit || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });
    
    return clients.slice(0, limit);
  }

  /* Barber Invite Methods */
  async createBarberInvite(inviteData: InsertBarberInvite): Promise<BarberInvite> {
    const id = this.barberInviteIdCounter++;
    const createdAt = new Date();
    
    const invite: BarberInvite = {
      id,
      createdAt,
      token: inviteData.token,
      barberId: inviteData.barberId,
      createdById: inviteData.createdById,
      isUsed: false, // Initially not used
      expiresAt: inviteData.expiresAt,
      usedAt: null
    };
    
    this.barberInvitesData.set(id, invite);
    return invite;
  }
  
  async getBarberInviteByToken(token: string): Promise<BarberInvite | undefined> {
    for (const invite of this.barberInvitesData.values()) {
      if (invite.token === token) {
        return invite;
      }
    }
    return undefined;
  }
  
  async markBarberInviteAsUsed(id: number): Promise<BarberInvite | undefined> {
    const invite = this.barberInvitesData.get(id);
    if (!invite) {
      return undefined;
    }
    
    const updatedInvite: BarberInvite = {
      ...invite,
      isUsed: true,
      usedAt: new Date()
    };
    
    this.barberInvitesData.set(id, updatedInvite);
    return updatedInvite;
  }
  
  async getBarberInvitesByCreator(createdById: number): Promise<BarberInvite[]> {
    const invites: BarberInvite[] = [];
    
    for (const invite of this.barberInvitesData.values()) {
      if (invite.createdById === createdById) {
        invites.push(invite);
      }
    }
    
    // Sort by creation date, most recent first
    return invites.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /* Product Methods */
  async getProduct(id: number): Promise<Product | undefined> {
    return this.productsData.get(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.productsData.values());
  }

  async getActiveProducts(): Promise<Product[]> {
    return Array.from(this.productsData.values())
      .filter(product => product.active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const newProduct: Product = {
      id,
      createdAt: new Date(),
      ...product,
    };
    
    this.productsData.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.productsData.get(id);
    
    if (!existingProduct) {
      return undefined;
    }
    
    const updatedProduct: Product = {
      ...existingProduct,
      ...product,
    };
    
    this.productsData.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    this.productsData.delete(id);
  }

  /* Product Commission Methods */
  async getProductCommission(id: number): Promise<ProductCommission | undefined> {
    return this.productCommissionsData.get(id);
  }

  async getProductCommissionByBarberAndProduct(barberId: number, productId: number): Promise<ProductCommission | undefined> {
    return Array.from(this.productCommissionsData.values()).find(
      commission => commission.barberId === barberId && commission.productId === productId
    );
  }

  async getProductCommissionsByBarber(barberId: number): Promise<ProductCommission[]> {
    return Array.from(this.productCommissionsData.values())
      .filter(commission => commission.barberId === barberId);
  }

  async createProductCommission(commission: InsertProductCommission): Promise<ProductCommission> {
    const id = this.productCommissionIdCounter++;
    const newCommission: ProductCommission = {
      id,
      createdAt: new Date(),
      ...commission,
    };
    
    this.productCommissionsData.set(id, newCommission);
    return newCommission;
  }

  async updateProductCommission(id: number, commission: Partial<InsertProductCommission>): Promise<ProductCommission | undefined> {
    const existingCommission = this.productCommissionsData.get(id);
    
    if (!existingCommission) {
      return undefined;
    }
    
    const updatedCommission: ProductCommission = {
      ...existingCommission,
      ...commission,
    };
    
    this.productCommissionsData.set(id, updatedCommission);
    return updatedCommission;
  }

  async deleteProductCommission(id: number): Promise<void> {
    this.productCommissionsData.delete(id);
  }

  /* Product Sales Methods */
  async getProductSale(id: number): Promise<ProductSaleWithDetails | undefined> {
    const sale = this.productSalesData.get(id);
    
    if (!sale) {
      return undefined;
    }
    
    const product = await this.getProduct(sale.productId);
    const barber = await this.getBarber(sale.barberId);
    
    if (!product || !barber) {
      return undefined;
    }
    
    return {
      ...sale,
      product,
      barber
    };
  }

  async getProductSalesByBarber(barberId: number): Promise<ProductSaleWithDetails[]> {
    const sales: ProductSaleWithDetails[] = [];
    
    for (const sale of this.productSalesData.values()) {
      if (sale.barberId === barberId) {
        const product = await this.getProduct(sale.productId);
        const barber = await this.getBarber(sale.barberId);
        
        if (product && barber) {
          sales.push({
            ...sale,
            product,
            barber
          });
        }
      }
    }
    
    // Sort by date, most recent first
    return sales.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async getProductSalesForBarberInDateRange(barberId: number, startDate: Date, endDate: Date): Promise<ProductSale[]> {
    // Filtrar vendas pelo intervalo de data
    return Array.from(this.productSalesData.values())
      .filter(sale => sale.barberId === barberId &&
                     sale.date >= startDate &&
                     sale.date <= endDate);
  }

  async getAllProductSales(): Promise<ProductSaleWithDetails[]> {
    const sales: ProductSaleWithDetails[] = [];
    
    for (const sale of this.productSalesData.values()) {
      const product = await this.getProduct(sale.productId);
      const barber = await this.getBarber(sale.barberId);
      
      if (product && barber) {
        sales.push({
          ...sale,
          product,
          barber
        });
      }
    }
    
    // Sort by date, most recent first
    return sales.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createProductSale(sale: InsertProductSale): Promise<ProductSale> {
    const id = this.productSaleIdCounter++;
    const newSale: ProductSale = {
      id,
      createdAt: new Date(),
      validatedByAdmin: false,
      ...sale,
    };
    
    this.productSalesData.set(id, newSale);
    return newSale;
  }

  async updateProductSale(id: number, sale: Partial<InsertProductSale>): Promise<ProductSale | undefined> {
    const existingSale = this.productSalesData.get(id);
    
    if (!existingSale) {
      return undefined;
    }
    
    const updatedSale: ProductSale = {
      ...existingSale,
      ...sale,
    };
    
    this.productSalesData.set(id, updatedSale);
    return updatedSale;
  }

  async validateProductSale(id: number): Promise<ProductSale | undefined> {
    const existingSale = this.productSalesData.get(id);
    
    if (!existingSale) {
      return undefined;
    }
    
    const validatedSale: ProductSale = {
      ...existingSale,
      validatedByAdmin: true,
    };
    
    this.productSalesData.set(id, validatedSale);
    return validatedSale;
  }

  async deleteProductSale(id: number): Promise<void> {
    this.productSalesData.delete(id);
  }

  /* Products with Commissions */
  async getProductsWithCommissionsForBarber(barberId: number): Promise<ProductWithCommission[]> {
    const activeProducts = await this.getActiveProducts();
    const commissions = await this.getProductCommissionsByBarber(barberId);
    
    return activeProducts.map(product => {
      const commission = commissions.find(c => c.productId === product.id);
      return {
        ...product,
        commission
      };
    });
  }

  // Método para buscar serviços completados por um barbeiro em um intervalo de datas
  async getCompletedServicesForDateRange(barberId: number, startDate: Date, endDate: Date): Promise<any[]> {
    const services = [];
    
    for (const service of Array.from(this.completedServices.values())) {
      if (
        service.barberId === barberId &&
        service.date >= startDate &&
        service.date <= endDate
      ) {
        services.push(service);
      }
    }
    
    return services;
  }
  
  // Método para buscar clientes para um barbeiro específico
  async getClientsForBarber(barberId: number): Promise<any[]> {
    // Buscar todos os serviços do barbeiro
    const services = Array.from(this.completedServices.values())
      .filter(service => service.barberId === barberId);
    
    // Extrair todos os IDs de clientes únicos
    const clientIds = new Set<number>();
    const clientNames = new Map<string, any>();
    
    for (const service of services) {
      if (service.clientId) {
        clientIds.add(service.clientId);
      } else if (service.clientName) {
        // Para clientes sem ID, usar o nome como chave
        if (!clientNames.has(service.clientName)) {
          clientNames.set(service.clientName, {
            fullName: service.clientName,
            lastVisit: service.date
          });
        } else {
          // Atualizar a data da última visita se for mais recente
          const client = clientNames.get(service.clientName);
          if (service.date > client.lastVisit) {
            client.lastVisit = service.date;
            clientNames.set(service.clientName, client);
          }
        }
      }
    }
    
    // Buscar informações completas de cada cliente com ID
    const clientsWithIds = [];
    for (const clientId of clientIds) {
      const user = await this.getUserById(clientId);
      if (user) {
        // Buscar o cliente para obter detalhes como lastVisit, etc.
        const client = await this.getClientByUserId(clientId);
        
        // Determinar a última visita deste cliente com este barbeiro
        const lastVisit = this.getLastVisitDate(clientId, barberId);
        
        clientsWithIds.push({
          id: clientId,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          lastVisit: lastVisit || (client ? client.lastVisit : null),
          isFavorite: await this.isClientFavorite(clientId, barberId)
        });
      }
    }
    
    // Adicionar clientes sem ID (apenas com nome)
    const clientsWithoutIds = Array.from(clientNames.values()).map((client, index) => ({
      id: -1 * (index + 1), // IDs negativos para diferenciar
      fullName: client.fullName,
      phone: null,
      email: null,
      lastVisit: client.lastVisit,
      isFavorite: false
    }));
    
    // Combinar e ordenar por data da última visita (mais recentes primeiro)
    return [...clientsWithIds, ...clientsWithoutIds]
      .sort((a, b) => {
        // Null check
        if (!a.lastVisit && !b.lastVisit) return 0;
        if (!a.lastVisit) return 1;
        if (!b.lastVisit) return -1;
        // Ordenar por data descendente
        return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      });
  }
  
  // Método para verificar se um cliente é favorito de um barbeiro
  async isClientFavorite(clientId: number, barberId: number): Promise<boolean> {
    // Buscar nas relações cliente-barbeiro
    const relation = Array.from(this.clientBarberNotes.values())
      .find(note => note.clientId === clientId && note.barberId === barberId);
    
    return !!relation; // Se existe relação, é favorito
  }
  
  // Método para obter a data da última visita de um cliente com um barbeiro específico
  getLastVisitDate(clientId: number, barberId: number): Date | null {
    const services = Array.from(this.completedServices.values())
      .filter(service => 
        service.clientId === clientId && 
        service.barberId === barberId
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return services.length > 0 ? services[0].date : null;
  }
  
  // Método para buscar clientes favoritos de um barbeiro
  async getFavoriteClientsForBarber(barberId: number): Promise<any[]> {
    // Buscar todas as relações deste barbeiro
    const relations = Array.from(this.clientBarberNotes.values())
      .filter(note => note.barberId === barberId);
    
    // Buscar informações completas de cada cliente
    const favoriteClients = [];
    for (const relation of relations) {
      const user = await this.getUserById(relation.clientId);
      if (user) {
        // Determinar a última visita
        const lastVisit = this.getLastVisitDate(relation.clientId, barberId);
        
        favoriteClients.push({
          id: relation.clientId,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          lastVisit,
          note: relation.note
        });
      }
    }
    
    // Ordenar por data da última visita (mais recentes primeiro)
    return favoriteClients.sort((a, b) => {
      if (!a.lastVisit && !b.lastVisit) return 0;
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    });
  }
  
  // Método para buscar pagamentos de um barbeiro
  async getPaymentsForBarber(barberId: number): Promise<any[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.barberId === barberId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  // Método para buscar serviços validados de um barbeiro que ainda não foram pagos
  async getValidatedServicesForBarber(barberId: number): Promise<any[]> {
    // Buscar todos os pagamentos deste barbeiro
    const payments = await this.getPaymentsForBarber(barberId);
    
    // Determinar a data do último pagamento
    let lastPaymentDate = new Date(0); // 1970-01-01
    if (payments.length > 0) {
      lastPaymentDate = payments[0].periodEnd;
    }
    
    // Buscar todos os serviços validados após a data do último pagamento
    return Array.from(this.completedServices.values())
      .filter(service => 
        service.barberId === barberId && 
        service.validatedByAdmin === true &&
        new Date(service.date) > lastPaymentDate
      )
      .map(service => {
        // Buscar nome do serviço
        const serviceDetails = this.services.get(service.serviceId);
        return {
          ...service,
          service: serviceDetails || { name: "Serviço Desconhecido" }
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Método para buscar serviços pendentes de validação de um barbeiro
  async getPendingServicesForBarber(barberId: number): Promise<any[]> {
    return Array.from(this.completedServices.values())
      .filter(service => 
        service.barberId === barberId && 
        (service.validatedByAdmin === false || service.validatedByAdmin === null)
      )
      .map(service => {
        // Buscar nome do serviço
        const serviceDetails = this.services.get(service.serviceId);
        return {
          ...service,
          service: serviceDetails || { name: "Serviço Desconhecido" }
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

// Set up Supabase PostgreSQL connection if URL is available
let db;
let dbConnectionFailed = false;

if (process.env.DATABASE_URL) {
  try {
    console.log('Using PostgreSQL with Drizzle ORM');
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    db = drizzle(client);
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database:', error);
    dbConnectionFailed = true;
  }
}

// DrizzleStorage implementation for PostgreSQL
export class DrizzleStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  
  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async updateUserPreferences(userId: number, preferences: UserPreferences): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Parse existing metadata or create new object
    let metadata = {};
    if (user.metadata) {
      try {
        metadata = JSON.parse(user.metadata);
      } catch (error) {
        console.error('Erro ao fazer parse do metadata do usuário:', error);
        metadata = {};
      }
    }
    
    // Update or add preferences
    const updatedMetadata = {
      ...metadata,
      preferences: {
        ...(metadata.preferences || {}),
        ...preferences
      }
    };
    
    // Update the user with the new metadata
    await this.db.update(users)
      .set({ metadata: JSON.stringify(updatedMetadata) })
      .where(eq(users.id, userId));
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const result = await this.db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async getAllProducts(): Promise<Product[]> {
    return await this.db.select().from(products);
  }

  async getActiveProducts(): Promise<Product[]> {
    return await this.db.select().from(products).where(eq(products.active, true));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await this.db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await this.db.update(products).set(product).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }
  
  // Implement remaining methods as needed...
  
  /* As seguintes implementações são necessárias para a interface, mas serão implementadas conforme necessário */
  // Barber methods
  async getBarber(id: number): Promise<BarberWithUser | undefined> {
    try {
      const barberResult = await this.db.select().from(barbers).where(eq(barbers.id, id));
      if (!barberResult.length) return undefined;
      
      const barber = barberResult[0];
      const userResult = await this.db.select().from(users).where(eq(users.id, barber.userId));
      if (!userResult.length) return undefined;
      
      return {
        ...barber,
        user: userResult[0]
      };
    } catch (error) {
      console.error("Error in getBarber:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().getBarber(id);
    }
  }
  
  async getAllBarbers(): Promise<BarberWithUser[]> {
    try {
      const barberResults = await this.db.select().from(barbers);
      const result: BarberWithUser[] = [];
      
      for (const barber of barberResults) {
        const userResult = await this.db.select().from(users).where(eq(users.id, barber.userId));
        if (userResult.length) {
          result.push({
            ...barber,
            user: userResult[0]
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error in getAllBarbers:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().getAllBarbers();
    }
  }
  
  async getActiveBarbers(): Promise<BarberWithUser[]> {
    try {
      const barberResults = await this.db.select().from(barbers).where(eq(barbers.active, true));
      const result: BarberWithUser[] = [];
      
      for (const barber of barberResults) {
        const userResult = await this.db.select().from(users).where(eq(users.id, barber.userId));
        if (userResult.length) {
          result.push({
            ...barber,
            user: userResult[0]
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error in getActiveBarbers:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().getActiveBarbers();
    }
  }
  
  async getTopBarbers(): Promise<BarberWithUser[]> {
    // Por enquanto, retorne apenas os barbeiros ativos
    return this.getActiveBarbers();
  }
  
  async getBarberByUserId(userId: number): Promise<Barber | undefined> {
    try {
      const result = await this.db.select().from(barbers).where(eq(barbers.userId, userId));
      return result[0];
    } catch (error) {
      console.error("Error in getBarberByUserId:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().getBarberByUserId(userId);
    }
  }
  
  async createBarber(barber: InsertBarber): Promise<Barber> {
    try {
      const result = await this.db.insert(barbers).values(barber).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createBarber:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().createBarber(barber);
    }
  }
  
  async updateBarber(id: number, barber: Partial<InsertBarber>): Promise<Barber | undefined> {
    try {
      const result = await this.db.update(barbers).set(barber).where(eq(barbers.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateBarber:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().updateBarber(id, barber);
    }
  }
  
  async deleteBarber(id: number): Promise<void> {
    try {
      await this.db.delete(barbers).where(eq(barbers.id, id));
    } catch (error) {
      console.error("Error in deleteBarber:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().deleteBarber(id);
    }
  }
  
  // Service methods
  async getService(id: number): Promise<Service | undefined> {
    try {
      const result = await this.db.select().from(services).where(eq(services.id, id));
      return result[0];
    } catch (error) {
      console.error("Error in getService:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().getService(id);
    }
  }
  
  async getAllServices(): Promise<Service[]> {
    try {
      return await this.db.select().from(services);
    } catch (error) {
      console.error("Error in getAllServices:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().getAllServices();
    }
  }
  
  async getActiveServices(): Promise<Service[]> {
    try {
      return await this.db.select().from(services).where(eq(services.active, true));
    } catch (error) {
      console.error("Error in getActiveServices:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().getActiveServices();
    }
  }
  async createService(service: InsertService): Promise<Service> {
    try {
      const result = await this.db.insert(services).values(service).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createService:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().createService(service);
    }
  }
  
  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    try {
      const result = await this.db.update(services).set(service).where(eq(services.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateService:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().updateService(id, service);
    }
  }
  
  async deleteService(id: number): Promise<void> {
    try {
      await this.db.delete(services).where(eq(services.id, id));
    } catch (error) {
      console.error("Error in deleteService:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().deleteService(id);
    }
  }
  async getCommission(id: number): Promise<Commission | undefined> {
    try {
      const result = await this.db.select().from(commissions).where(eq(commissions.id, id));
      return result[0];
    } catch (error) {
      console.error("Error in getCommission:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().getCommission(id);
    }
  }
  
  async getCommissionByBarberAndService(barberId: number, serviceId: number): Promise<Commission | undefined> {
    try {
      const result = await this.db.select().from(commissions)
        .where(and(
          eq(commissions.barberId, barberId),
          eq(commissions.serviceId, serviceId)
        ));
      return result[0];
    } catch (error) {
      console.error("Error in getCommissionByBarberAndService:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().getCommissionByBarberAndService(barberId, serviceId);
    }
  }
  
  async getAllCommissions(): Promise<Commission[]> {
    try {
      return await this.db.select().from(commissions);
    } catch (error) {
      console.error("Error in getAllCommissions:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().getAllCommissions();
    }
  }
  
  async createCommission(commission: InsertCommission): Promise<Commission> {
    try {
      const result = await this.db.insert(commissions).values(commission).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createCommission:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().createCommission(commission);
    }
  }
  
  async updateCommission(id: number, commission: Partial<InsertCommission>): Promise<Commission | undefined> {
    try {
      const result = await this.db.update(commissions).set(commission).where(eq(commissions.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateCommission:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().updateCommission(id, commission);
    }
  }
  
  async deleteCommission(id: number): Promise<void> {
    try {
      await this.db.delete(commissions).where(eq(commissions.id, id));
    } catch (error) {
      console.error("Error in deleteCommission:", error);
      // Fall back to in-memory implementation during development
      return new MemStorage().deleteCommission(id);
    }
  }
  async getAppointment(id: number): Promise<AppointmentWithDetails | undefined> { throw new Error("Not implemented"); }
  async getAllAppointments(): Promise<AppointmentWithDetails[]> { throw new Error("Not implemented"); }
  async getUpcomingAppointments(): Promise<AppointmentWithDetails[]> { throw new Error("Not implemented"); }
  async getAvailableTimeSlots(barberId: number, date: Date): Promise<string[]> { throw new Error("Not implemented"); }
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> { throw new Error("Not implemented"); }
  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> { throw new Error("Not implemented"); }
  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> { throw new Error("Not implemented"); }
  async deleteAppointment(id: number): Promise<void> { throw new Error("Not implemented"); }
  async getPayment(id: number): Promise<PaymentWithBarber | undefined> { throw new Error("Not implemented"); }
  async getPaymentsByBarber(barberId: number): Promise<PaymentWithBarber[]> { throw new Error("Not implemented"); }
  async getAllPayments(): Promise<PaymentWithBarber[]> { throw new Error("Not implemented"); }
  async createPayment(payment: InsertPayment): Promise<Payment> { throw new Error("Not implemented"); }
  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined> { throw new Error("Not implemented"); }
  async deletePayment(id: number): Promise<void> { throw new Error("Not implemented"); }
  async getCompletedService(id: number): Promise<CompletedService | undefined> { throw new Error("Not implemented"); }
  async getCompletedServicesByBarber(barberId: number): Promise<CompletedService[]> { throw new Error("Not implemented"); }
  async getAllCompletedServices(): Promise<CompletedService[]> { throw new Error("Not implemented"); }
  async createCompletedService(service: InsertCompletedService): Promise<CompletedService> { throw new Error("Not implemented"); }
  async updateCompletedService(id: number, data: Partial<CompletedService>): Promise<CompletedService | undefined> { throw new Error("Not implemented"); }
  async deleteCompletedService(id: number): Promise<void> { throw new Error("Not implemented"); }
  async createActionLog(log: InsertActionLog): Promise<ActionLog> { throw new Error("Not implemented"); }
  async getClientProfile(userId: number): Promise<ClientProfile | undefined> { throw new Error("Not implemented"); }
  async createClientProfile(profile: InsertClientProfile): Promise<ClientProfile> { throw new Error("Not implemented"); }
  async updateClientProfile(userId: number, profile: Partial<InsertClientProfile>): Promise<ClientProfile | undefined> { throw new Error("Not implemented"); }
  async getClientPreferences(clientId: number): Promise<ClientPreference | undefined> { throw new Error("Not implemented"); }
  async createClientPreferences(preferences: InsertClientPreference): Promise<ClientPreference> { throw new Error("Not implemented"); }
  async updateClientPreferences(clientId: number, preferences: Partial<InsertClientPreference>): Promise<ClientPreference | undefined> { throw new Error("Not implemented"); }
  async getClientNotes(clientId: number): Promise<ClientNote[]> { throw new Error("Not implemented"); }
  async getClientNotesByBarber(clientId: number, barberId: number): Promise<ClientNote[]> { throw new Error("Not implemented"); }
  async createClientNote(note: InsertClientNote): Promise<ClientNote> { throw new Error("Not implemented"); }
  async deleteClientNote(id: number): Promise<void> { throw new Error("Not implemented"); }
  async getClientFavoriteServices(clientId: number): Promise<(ClientFavoriteService & { service: Service })[]> { throw new Error("Not implemented"); }
  async addClientFavoriteService(favorite: InsertClientFavoriteService): Promise<ClientFavoriteService> { throw new Error("Not implemented"); }
  async removeClientFavoriteService(id: number): Promise<void> { throw new Error("Not implemented"); }
  async getClientWithProfile(userId: number): Promise<ClientWithProfile | undefined> { throw new Error("Not implemented"); }
  async getClientWithPreferences(userId: number): Promise<ClientWithPreferences | undefined> { throw new Error("Not implemented"); }
  async getClientWithDetails(userId: number): Promise<ClientWithDetails | undefined> { throw new Error("Not implemented"); }
  async getAllClientsWithProfiles(): Promise<ClientWithProfile[]> { throw new Error("Not implemented"); }
  async getRecentClients(limit?: number): Promise<ClientWithProfile[]> { throw new Error("Not implemented"); }
  async createBarberInvite(invite: InsertBarberInvite): Promise<BarberInvite> { throw new Error("Not implemented"); }
  async getBarberInviteByToken(token: string): Promise<BarberInvite | undefined> { throw new Error("Not implemented"); }
  async markBarberInviteAsUsed(id: number): Promise<BarberInvite | undefined> { throw new Error("Not implemented"); }
  async getBarberInvitesByCreator(createdById: number): Promise<BarberInvite[]> { throw new Error("Not implemented"); }
  async getProductCommission(id: number): Promise<ProductCommission | undefined> { throw new Error("Not implemented"); }
  async getProductCommissionByBarberAndProduct(barberId: number, productId: number): Promise<ProductCommission | undefined> { throw new Error("Not implemented"); }
  async getProductCommissionsByBarber(barberId: number): Promise<ProductCommission[]> { throw new Error("Not implemented"); }
  async createProductCommission(commission: InsertProductCommission): Promise<ProductCommission> { throw new Error("Not implemented"); }
  async updateProductCommission(id: number, commission: Partial<InsertProductCommission>): Promise<ProductCommission | undefined> { throw new Error("Not implemented"); }
  async deleteProductCommission(id: number): Promise<void> { throw new Error("Not implemented"); }
  async getProductSale(id: number): Promise<ProductSaleWithDetails | undefined> { throw new Error("Not implemented"); }
  async getProductSalesByBarber(barberId: number): Promise<ProductSaleWithDetails[]> { throw new Error("Not implemented"); }
  async getAllProductSales(): Promise<ProductSaleWithDetails[]> { throw new Error("Not implemented"); }
  async createProductSale(sale: InsertProductSale): Promise<ProductSale> { throw new Error("Not implemented"); }
  async updateProductSale(id: number, sale: Partial<InsertProductSale>): Promise<ProductSale | undefined> { throw new Error("Not implemented"); }
  async validateProductSale(id: number): Promise<ProductSale | undefined> { throw new Error("Not implemented"); }
  async deleteProductSale(id: number): Promise<void> { throw new Error("Not implemented"); }
  async getProductsWithCommissionsForBarber(barberId: number): Promise<ProductWithCommission[]> { throw new Error("Not implemented"); }
}

// Export the appropriate storage implementation
export const storage = (process.env.DATABASE_URL && !dbConnectionFailed && db) 
  ? new DrizzleStorage(db) 
  : new MemStorage();
