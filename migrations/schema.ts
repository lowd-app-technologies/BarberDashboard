import { pgTable, foreignKey, serial, integer, text, boolean, timestamp, unique, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const appointmentStatus = pgEnum("appointment_status", ['pending', 'confirmed', 'completed', 'canceled'])
export const beardType = pgEnum("beard_type", ['none', 'stubble', 'short', 'medium', 'long', 'full'])
export const hairType = pgEnum("hair_type", ['straight', 'wavy', 'curly', 'coily'])
export const paymentPeriod = pgEnum("payment_period", ['weekly', 'biweekly', 'monthly'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'paid'])
export const productCategory = pgEnum("product_category", ['shampoo', 'conditioner', 'styling', 'beard', 'skincare', 'equipment', 'other'])
export const userRole = pgEnum("user_role", ['admin', 'barber', 'client'])


export const barbers = pgTable("barbers", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	nif: text().notNull(),
	iban: text().notNull(),
	paymentPeriod: paymentPeriod("payment_period").default('monthly').notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	calendarVisibility: text("calendar_visibility").default('own'),
	profileImage: text("profile_image"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "barbers_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const barberInvites = pgTable("barber_invites", {
	id: serial().primaryKey().notNull(),
	token: text().notNull(),
	barberId: text("barber_id").notNull(),
	createdById: integer("created_by_id").notNull(),
	isUsed: boolean("is_used").default(false).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "barber_invites_created_by_id_users_id_fk"
		}).onDelete("cascade"),
	unique("barber_invites_token_unique").on(table.token),
]);

export const clientFavoriteServices = pgTable("client_favorite_services", {
	id: serial().primaryKey().notNull(),
	clientId: integer("client_id").notNull(),
	serviceId: integer("service_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [users.id],
			name: "client_favorite_services_client_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "client_favorite_services_service_id_services_id_fk"
		}).onDelete("cascade"),
]);

export const clientNotes = pgTable("client_notes", {
	id: serial().primaryKey().notNull(),
	clientId: integer("client_id").notNull(),
	barberId: integer("barber_id").notNull(),
	note: text().notNull(),
	appointmentId: integer("appointment_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.appointmentId],
			foreignColumns: [appointments.id],
			name: "client_notes_appointment_id_appointments_id_fk"
		}),
	foreignKey({
			columns: [table.barberId],
			foreignColumns: [barbers.id],
			name: "client_notes_barber_id_barbers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [users.id],
			name: "client_notes_client_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const clientPreferences = pgTable("client_preferences", {
	id: serial().primaryKey().notNull(),
	clientId: integer("client_id").notNull(),
	preferredBarberId: integer("preferred_barber_id"),
	preferredDayOfWeek: integer("preferred_day_of_week"),
	preferredTimeOfDay: text("preferred_time_of_day"),
	hairType: hairType("hair_type"),
	beardType: beardType("beard_type"),
	preferredHairStyle: text("preferred_hair_style"),
	preferredBeardStyle: text("preferred_beard_style"),
	allergies: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [users.id],
			name: "client_preferences_client_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.preferredBarberId],
			foreignColumns: [barbers.id],
			name: "client_preferences_preferred_barber_id_barbers_id_fk"
		}),
	unique("client_preferences_client_id_unique").on(table.clientId),
]);

export const clientProfiles = pgTable("client_profiles", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	birthdate: timestamp({ mode: 'string' }),
	address: text(),
	city: text(),
	postalCode: text("postal_code"),
	notes: text(),
	referralSource: text("referral_source"),
	lastVisit: timestamp("last_visit", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "client_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("client_profiles_user_id_unique").on(table.userId),
]);

export const commissions = pgTable("commissions", {
	id: serial().primaryKey().notNull(),
	barberId: integer("barber_id").notNull(),
	serviceId: integer("service_id").notNull(),
	percentage: numeric({ precision: 5, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.barberId],
			foreignColumns: [barbers.id],
			name: "commissions_barber_id_barbers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "commissions_service_id_services_id_fk"
		}).onDelete("cascade"),
]);

export const payments = pgTable("payments", {
	id: serial().primaryKey().notNull(),
	barberId: integer("barber_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	periodStart: timestamp("period_start", { mode: 'string' }).notNull(),
	periodEnd: timestamp("period_end", { mode: 'string' }).notNull(),
	status: paymentStatus().default('pending').notNull(),
	paymentDate: timestamp("payment_date", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.barberId],
			foreignColumns: [barbers.id],
			name: "payments_barber_id_barbers_id_fk"
		}).onDelete("cascade"),
]);

export const productCommissions = pgTable("product_commissions", {
	id: serial().primaryKey().notNull(),
	barberId: integer("barber_id").notNull(),
	productId: integer("product_id").notNull(),
	percentage: numeric({ precision: 5, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.barberId],
			foreignColumns: [barbers.id],
			name: "product_commissions_barber_id_barbers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_commissions_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const completedServices = pgTable("completed_services", {
	id: serial().primaryKey().notNull(),
	barberId: integer("barber_id").notNull(),
	serviceId: integer("service_id").notNull(),
	clientId: integer("client_id"),
	clientName: text("client_name").notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	appointmentId: integer("appointment_id"),
	validatedByAdmin: boolean("validated_by_admin").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.appointmentId],
			foreignColumns: [appointments.id],
			name: "completed_services_appointment_id_appointments_id_fk"
		}),
	foreignKey({
			columns: [table.barberId],
			foreignColumns: [barbers.id],
			name: "completed_services_barber_id_barbers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [users.id],
			name: "completed_services_client_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "completed_services_service_id_services_id_fk"
		}).onDelete("cascade"),
]);

export const productSales = pgTable("product_sales", {
	id: serial().primaryKey().notNull(),
	barberId: integer("barber_id").notNull(),
	productId: integer("product_id").notNull(),
	clientId: integer("client_id"),
	clientName: text("client_name").notNull(),
	quantity: integer().default(1).notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	validatedByAdmin: boolean("validated_by_admin").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.barberId],
			foreignColumns: [barbers.id],
			name: "product_sales_barber_id_barbers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [users.id],
			name: "product_sales_client_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_sales_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	costPrice: numeric("cost_price", { precision: 10, scale:  2 }).notNull(),
	category: productCategory().notNull(),
	sku: text().notNull(),
	stockQuantity: integer("stock_quantity").default(0).notNull(),
	active: boolean().default(true).notNull(),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("products_sku_unique").on(table.sku),
]);

export const services = pgTable("services", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	duration: integer().notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	role: userRole().default('client').notNull(),
	fullName: text("full_name").notNull(),
	phone: text(),
	metadata: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const actionLogs = pgTable("action_logs", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	action: text().notNull(),
	entity: text().notNull(),
	entityId: integer("entity_id"),
	details: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "action_logs_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const appointments = pgTable("appointments", {
	id: serial().primaryKey().notNull(),
	clientId: integer("client_id").notNull(),
	barberId: integer("barber_id").notNull(),
	serviceId: integer("service_id").notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	status: appointmentStatus().default('pending').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.barberId],
			foreignColumns: [barbers.id],
			name: "appointments_barber_id_barbers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [users.id],
			name: "appointments_client_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "appointments_service_id_services_id_fk"
		}).onDelete("cascade"),
]);
