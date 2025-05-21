import { relations } from "drizzle-orm/relations";
import { users, barbers, barberInvites, clientFavoriteServices, services, appointments, clientNotes, clientPreferences, clientProfiles, commissions, payments, productCommissions, products, completedServices, productSales, actionLogs } from "./schema";

export const barbersRelations = relations(barbers, ({one, many}) => ({
	user: one(users, {
		fields: [barbers.userId],
		references: [users.id]
	}),
	clientNotes: many(clientNotes),
	clientPreferences: many(clientPreferences),
	commissions: many(commissions),
	payments: many(payments),
	productCommissions: many(productCommissions),
	completedServices: many(completedServices),
	productSales: many(productSales),
	appointments: many(appointments),
}));

export const usersRelations = relations(users, ({many}) => ({
	barbers: many(barbers),
	barberInvites: many(barberInvites),
	clientFavoriteServices: many(clientFavoriteServices),
	clientNotes: many(clientNotes),
	clientPreferences: many(clientPreferences),
	clientProfiles: many(clientProfiles),
	completedServices: many(completedServices),
	productSales: many(productSales),
	actionLogs: many(actionLogs),
	appointments: many(appointments),
}));

export const barberInvitesRelations = relations(barberInvites, ({one}) => ({
	user: one(users, {
		fields: [barberInvites.createdById],
		references: [users.id]
	}),
}));

export const clientFavoriteServicesRelations = relations(clientFavoriteServices, ({one}) => ({
	user: one(users, {
		fields: [clientFavoriteServices.clientId],
		references: [users.id]
	}),
	service: one(services, {
		fields: [clientFavoriteServices.serviceId],
		references: [services.id]
	}),
}));

export const servicesRelations = relations(services, ({many}) => ({
	clientFavoriteServices: many(clientFavoriteServices),
	commissions: many(commissions),
	completedServices: many(completedServices),
	appointments: many(appointments),
}));

export const clientNotesRelations = relations(clientNotes, ({one}) => ({
	appointment: one(appointments, {
		fields: [clientNotes.appointmentId],
		references: [appointments.id]
	}),
	barber: one(barbers, {
		fields: [clientNotes.barberId],
		references: [barbers.id]
	}),
	user: one(users, {
		fields: [clientNotes.clientId],
		references: [users.id]
	}),
}));

export const appointmentsRelations = relations(appointments, ({one, many}) => ({
	clientNotes: many(clientNotes),
	completedServices: many(completedServices),
	barber: one(barbers, {
		fields: [appointments.barberId],
		references: [barbers.id]
	}),
	user: one(users, {
		fields: [appointments.clientId],
		references: [users.id]
	}),
	service: one(services, {
		fields: [appointments.serviceId],
		references: [services.id]
	}),
}));

export const clientPreferencesRelations = relations(clientPreferences, ({one}) => ({
	user: one(users, {
		fields: [clientPreferences.clientId],
		references: [users.id]
	}),
	barber: one(barbers, {
		fields: [clientPreferences.preferredBarberId],
		references: [barbers.id]
	}),
}));

export const clientProfilesRelations = relations(clientProfiles, ({one}) => ({
	user: one(users, {
		fields: [clientProfiles.userId],
		references: [users.id]
	}),
}));

export const commissionsRelations = relations(commissions, ({one}) => ({
	barber: one(barbers, {
		fields: [commissions.barberId],
		references: [barbers.id]
	}),
	service: one(services, {
		fields: [commissions.serviceId],
		references: [services.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	barber: one(barbers, {
		fields: [payments.barberId],
		references: [barbers.id]
	}),
}));

export const productCommissionsRelations = relations(productCommissions, ({one}) => ({
	barber: one(barbers, {
		fields: [productCommissions.barberId],
		references: [barbers.id]
	}),
	product: one(products, {
		fields: [productCommissions.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	productCommissions: many(productCommissions),
	productSales: many(productSales),
}));

export const completedServicesRelations = relations(completedServices, ({one}) => ({
	appointment: one(appointments, {
		fields: [completedServices.appointmentId],
		references: [appointments.id]
	}),
	barber: one(barbers, {
		fields: [completedServices.barberId],
		references: [barbers.id]
	}),
	user: one(users, {
		fields: [completedServices.clientId],
		references: [users.id]
	}),
	service: one(services, {
		fields: [completedServices.serviceId],
		references: [services.id]
	}),
}));

export const productSalesRelations = relations(productSales, ({one}) => ({
	barber: one(barbers, {
		fields: [productSales.barberId],
		references: [barbers.id]
	}),
	user: one(users, {
		fields: [productSales.clientId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [productSales.productId],
		references: [products.id]
	}),
}));

export const actionLogsRelations = relations(actionLogs, ({one}) => ({
	user: one(users, {
		fields: [actionLogs.userId],
		references: [users.id]
	}),
}));