import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  decimal,
  boolean,
  double,
  date,
  time,
} from "drizzle-orm/mysql-core";

/* ============================================================
   RESTAURANTE 1896 — Esquema de base de datos (MySQL)
   ============================================================ */

// ---------- Administradores (credenciales encriptadas bcrypt) ----------
export const adminUsers = mysqlTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 60 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Configuración general (clave/valor administrable) ----------
export const settings = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("setting_key", { length: 80 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// ---------- Categorías del menú (soporta subcategorías: Vinos -> Blanco/Tinto) ----------
export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  parentId: bigint("parent_id", { mode: "number", unsigned: true }),
  sortOrder: int("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

// ---------- Platos ----------
export const dishes = mysqlTable("dishes", {
  id: serial("id").primaryKey(),
  categoryId: bigint("category_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// ---------- Pedidos (con turno y orden de comanda) ----------
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: int("order_number").notNull().unique(), // turno de pedido
  comandaNumber: int("comanda_number").notNull(), // orden de comanda (secuencia de cocina)
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 40 }).notNull(),
  orderType: mysqlEnum("order_type", ["local", "delivery", "recojo"]).notNull().default("local"),
  deliveryAddress: text("delivery_address"),
  status: mysqlEnum("status", [
    "pendiente",
    "confirmado",
    "en_preparacion",
    "listo",
    "en_camino",
    "entregado",
    "cancelado",
  ]).notNull().default("pendiente"),
  source: mysqlEnum("source", ["web", "chatbot"]).notNull().default("web"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
  dishId: bigint("dish_id", { mode: "number", unsigned: true }),
  dishName: varchar("dish_name", { length: 160 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  notes: varchar("notes", { length: 255 }),
});

// ---------- Contadores de turnos (pedidos y reservas) ----------
export const turnCounters = mysqlTable("turn_counters", {
  id: serial("id").primaryKey(),
  counterKey: varchar("counter_key", { length: 40 }).notNull().unique(), // 'order' | 'comanda' | 'reservation'
  currentValue: int("current_value").notNull().default(0),
});

// ---------- Reservas (con turno, aceptar/rechazar) ----------
export const reservations = mysqlTable("reservations", {
  id: serial("id").primaryKey(),
  reservationNumber: int("reservation_number").notNull().unique(), // turno de reserva
  fullName: varchar("full_name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  email: varchar("email", { length: 160 }),
  reservationDate: date("reservation_date", { mode: "string" }).notNull(),
  reservationTime: time("reservation_time").notNull(),
  people: int("people").notNull(),
  occasion: varchar("occasion", { length: 120 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pendiente", "aceptada", "rechazada"]).notNull().default("pendiente"),
  source: mysqlEnum("source", ["web", "chatbot"]).notNull().default("web"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// ---------- Repartidores (delivery) ----------
export const drivers = mysqlTable("drivers", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 80 }).notNull(),
  lastName: varchar("last_name", { length: 80 }).notNull(),
  cedula: varchar("cedula", { length: 30 }).notNull().unique(),
  phone: varchar("phone", { length: 40 }).notNull(),
  address: text("address"),
  vehiclePlate: varchar("vehicle_plate", { length: 20 }).notNull(),
  vehicleType: varchar("vehicle_type", { length: 60 }),
  photoUrl: text("photo_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Envíos (pedido asignado a repartidor + tracking en vivo) ----------
export const deliveries = mysqlTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull().unique(),
  driverId: bigint("driver_id", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["asignado", "recogiendo", "en_camino", "entregado"]).notNull().default("asignado"),
  destAddress: text("dest_address"),
  originLat: double("origin_lat").notNull().default(-12.0464), // restaurante (configurable)
  originLng: double("origin_lng").notNull().default(-77.0428),
  destLat: double("dest_lat"),
  destLng: double("dest_lng"),
  currentLat: double("current_lat"),
  currentLng: double("current_lng"),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Preguntas frecuentes del chatbot ----------
export const chatbotFaqs = mysqlTable("chatbot_faqs", {
  id: serial("id").primaryKey(),
  keywords: varchar("keywords", { length: 255 }).notNull(), // separadas por coma
  question: varchar("question", { length: 255 }).notNull(),
  answer: text("answer").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
});

// ---------- Registro de notificaciones WhatsApp ----------
export const whatsappLogs = mysqlTable("whatsapp_logs", {
  id: serial("id").primaryKey(),
  kind: mysqlEnum("kind", ["pedido", "reserva", "respuesta"]).notNull(),
  refId: bigint("ref_id", { mode: "number", unsigned: true }),
  toNumber: varchar("to_number", { length: 40 }),
  message: text("message"),
  channel: mysqlEnum("channel", ["twilio", "meta", "wame"]).notNull().default("wame"),
  status: varchar("status", { length: 40 }).notNull().default("pendiente"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
