/**
 * Seed inicial de Restaurante 1896
 * Ejecutar con: npx tsx db/seed.ts
 * Crea: usuario ADMIN (contraseña encriptada), 15 categorías + subcategorías de vino,
 * platos de ejemplo, configuración por defecto y FAQs del chatbot.
 * Es idempotente: si ya existen datos no los duplica.
 */
import { getDb } from "../api/queries/connection";
import { adminUsers, categories, dishes, settings, chatbotFaqs, turnCounters } from "./schema";
import { hashPassword } from "../api/auth/adminAuth";
import { eq } from "drizzle-orm";

async function main() {
  const db = getDb();

  /* ---------- Usuario administrador ---------- */
  const existingAdmin = await db.select().from(adminUsers).where(eq(adminUsers.username, "ADMIN"));
  if (existingAdmin.length === 0) {
    await db.insert(adminUsers).values({ username: "ADMIN", passwordHash: hashPassword("ADMIN1896") });
    console.log("✔ Usuario ADMIN creado (contraseña encriptada con bcrypt)");
  } else {
    console.log("• Usuario ADMIN ya existe, no se duplica");
  }

  /* ---------- Categorías ---------- */
  const catList: { name: string; slug: string; order: number; children?: { name: string; slug: string; order: number }[] }[] = [
    { name: "Asados", slug: "asados", order: 1 },
    { name: "Bebidas Alcohólicas", slug: "bebidas-alcoholicas", order: 2 },
    { name: "Bebidas Calientes", slug: "bebidas-calientes", order: 3 },
    { name: "Bebidas Heladas", slug: "bebidas-heladas", order: 4 },
    { name: "Cócteles", slug: "cocteles", order: 5 },
    {
      name: "Vinos", slug: "vinos", order: 6,
      children: [
        { name: "Vino Blanco", slug: "vino-blanco", order: 1 },
        { name: "Vino Tinto", slug: "vino-tinto", order: 2 },
      ],
    },
    { name: "Chaufas", slug: "chaufas", order: 7 },
    { name: "Sopas", slug: "sopas", order: 8 },
    { name: "Tallarines", slug: "tallarines", order: 9 },
    { name: "Combos / Lunch", slug: "combos-lunch", order: 10 },
    { name: "Mixtos", slug: "mixtos", order: 11 },
    { name: "Entradas", slug: "entradas", order: 12 },
    { name: "Especiales", slug: "especiales", order: 13 },
    { name: "Porciones", slug: "porciones", order: 14 },
    { name: "Postres", slug: "postres", order: 15 },
  ];

  const existingCats = await db.select().from(categories);
  const catIdBySlug = new Map(existingCats.map((c) => [c.slug, Number(c.id)]));

  for (const c of catList) {
    if (!catIdBySlug.has(c.slug)) {
      const [r] = await db.insert(categories).values({ name: c.name, slug: c.slug, sortOrder: c.order });
      catIdBySlug.set(c.slug, Number(r.insertId));
      console.log(`✔ Categoría creada: ${c.name}`);
    }
    if (c.children) {
      const parentId = catIdBySlug.get(c.slug)!;
      for (const ch of c.children) {
        if (!catIdBySlug.has(ch.slug)) {
          const [r] = await db.insert(categories).values({ name: ch.name, slug: ch.slug, sortOrder: ch.order, parentId });
          catIdBySlug.set(ch.slug, Number(r.insertId));
          console.log(`✔ Subcategoría creada: ${ch.name}`);
        }
      }
    }
  }

  /* ---------- Platos de ejemplo (solo si el menú está vacío) ---------- */
  const existingDishes = await db.select().from(dishes);
  if (existingDishes.length === 0) {
    const sample: { cat: string; name: string; desc: string; price: number; featured?: boolean; img?: string }[] = [
      { cat: "asados", name: "Parrilla Mixta 1896", desc: "Selección de cortes de res, cerdo y pollo a la brasa con chimichurri de la casa, papas rústicas y ensalada fresca.", price: 45.9, featured: true, img: "/images/platos/parrilla-mixta.jpg" },
      { cat: "asados", name: "Costillar BBQ Ahumado", desc: "Costillar de cerdo ahumado 6 horas, bañado en salsa BBQ artesanal con miel y especias.", price: 38.5, featured: true, img: "/images/platos/costillar-bbq.jpg" },
      { cat: "asados", name: "Anticuchos de Corazón", desc: "Tres brochetas de corazón de res marinadas en ají panca, acompañadas de papa dorada y choclo.", price: 22.0 },
      { cat: "chaufas", name: "Arroz Chaufa de Pollo", desc: "Arroz frito al wok con pollo, huevo, cebolla china y sillao, estilo tradicional.", price: 18.5 },
      { cat: "chaufas", name: "Chaufa Amazónico", desc: "Con cecina, chorizo regional, plátano maduro y un toque de ají charapita.", price: 24.0, featured: true },
      { cat: "sopas", name: "Sopa Criolla", desc: "Caldo de res con fideos, huevo, leche evaporada y un toque de ají amarillo.", price: 15.0 },
      { cat: "sopas", name: "Chupe de Camarones", desc: "Cremoso chupe con camarones frescos, papas, choclo, habas y huevo poché.", price: 28.0 },
      { cat: "tallarines", name: "Tallarines a la Huancaína", desc: "Tallarines bañados en salsa huancaína cremosa con lomo saltado encima.", price: 26.0, featured: true },
      { cat: "tallarines", name: "Tallarín Saltado Criollo", desc: "Tallarines salteados al wok con carne, tomate, cebolla y sillao.", price: 22.5 },
      { cat: "entradas", name: "Ceviche Clásico", desc: "Pescado fresco marinado en limón, con cebolla morada, ají, camote y choclo.", price: 25.0, featured: true },
      { cat: "entradas", name: "Papa a la Huancaína", desc: "Papas sancochadas cubiertas de salsa huancaína, huevo y aceituna.", price: 12.0 },
      { cat: "especiales", name: "Lomo Saltado 1896", desc: "Nuestra versión insignia: lomo fino flameado al wok con papas nativas y arroz.", price: 32.0, featured: true },
      { cat: "combos-lunch", name: "Lunch Ejecutivo", desc: "Entrada del día + plato de fondo + bebida + postre. De lunes a viernes de 12 a 3 pm.", price: 19.9 },
      { cat: "mixtos", name: "Dúo Mar y Tierra", desc: "Mitad ceviche clásico y mitad arroz con mariscos, para los indecisos.", price: 29.0 },
      { cat: "porciones", name: "Papas Rústicas", desc: "Porción generosa de papas rústicas con salsa de la casa.", price: 9.0 },
      { cat: "porciones", name: "Porción de Arroz", desc: "Arroz graneado cocido al punto, porción individual.", price: 5.0 },
      { cat: "postres", name: "Suspiro a la Limeña", desc: "Manjar blanco cremoso coronado con merengue al oporto y canela.", price: 10.0 },
      { cat: "postres", name: "Picarones", desc: "Picarones de zapallo y camote con miel de chancaca.", price: 12.0, featured: true },
      { cat: "bebidas-calientes", name: "Café Americano", desc: "Café de grano peruano recién molido.", price: 5.0 },
      { cat: "bebidas-calientes", name: "Emoliente Caliente", desc: "Infusión tradicional de hierbas con limón y miel.", price: 4.5 },
      { cat: "bebidas-heladas", name: "Chicha Morada", desc: "Refrescante bebida de maíz morado con piña, limón y canela. Jarra 1L.", price: 10.0 },
      { cat: "bebidas-heladas", name: "Limonada Frozen", desc: "Limonada frappeada con hierbabuena.", price: 7.0 },
      { cat: "bebidas-alcoholicas", name: "Cerveza Artesanal", desc: "Botella 330 ml, variedades rubia, roja y negra.", price: 12.0 },
      { cat: "cocteles", name: "Pisco Sour Clásico", desc: "Pisco quebranta, limón, jarabe, clara de huevo y amargo de angostura.", price: 16.0, featured: true },
      { cat: "cocteles", name: "Chilcano de Maracuyá", desc: "Pisco, ginger ale, jugo de maracuyá y limón.", price: 14.0 },
      { cat: "vino-blanco", name: "Sauvignon Blanc Reserva", desc: "Botella 750 ml. Notas cítricas y florales, ideal para pescados.", price: 55.0 },
      { cat: "vino-tinto", name: "Malbec Reserva", desc: "Botella 750 ml. Cuerpo medio, frutos rojos y final especiado.", price: 60.0 },
    ];
    for (const s of sample) {
      await db.insert(dishes).values({
        categoryId: catIdBySlug.get(s.cat)!,
        name: s.name,
        description: s.desc,
        price: s.price.toFixed(2),
        imageUrl: s.img ?? null,
        featured: s.featured ?? false,
      });
    }
    console.log(`✔ ${sample.length} platos de ejemplo creados`);
  } else {
    console.log("• Ya existen platos, no se agregan de nuevo");
  }

  /* ---------- Configuración por defecto ---------- */
  const defaults: Record<string, string> = {
    restaurant_name: "Restaurante 1896",
    restaurant_slogan: "Sabor que trasciende generaciones",
    restaurant_address: "Av. Principal 123, Centro",
    restaurant_phone: "+51 999 999 999",
    restaurant_hours: "Lun–Dom 12:00 – 23:00",
    currency_symbol: "$",
    whatsapp_admin_number: "",
    whatsapp_provider: "wame",
    twilio_account_sid: "",
    twilio_auth_token: "",
    twilio_whatsapp_from: "",
    meta_whatsapp_token: "",
    meta_phone_number_id: "",
    google_maps_api_key: "",
    restaurant_lat: "-12.0464",
    restaurant_lng: "-77.0428",
  };
  const existingSettings = await db.select().from(settings);
  const existingKeys = new Set(existingSettings.map((s) => s.key));
  for (const [key, value] of Object.entries(defaults)) {
    if (!existingKeys.has(key)) await db.insert(settings).values({ key, value });
  }
  console.log("✔ Configuración por defecto lista");

  /* ---------- Contadores de turnos ---------- */
  for (const key of ["order", "comanda", "reservation"]) {
    const [row] = await db.select().from(turnCounters).where(eq(turnCounters.counterKey, key));
    if (!row) await db.insert(turnCounters).values({ counterKey: key, currentValue: 0 });
  }

  /* ---------- FAQs del chatbot ---------- */
  const existingFaqs = await db.select().from(chatbotFaqs);
  if (existingFaqs.length === 0) {
    const faqs = [
      { keywords: "horario,atienden,abren,cierran,hora", question: "¿Cuál es el horario de atención?", answer: "Atendemos de lunes a domingo de 12:00 a 23:00. ¡Te esperamos!" },
      { keywords: "ubicacion,direccion,donde,llegar", question: "¿Dónde están ubicados?", answer: "Estamos en Av. Principal 123, Centro. Puedes ver la ubicación exacta en la sección de contacto de nuestra página." },
      { keywords: "delivery,envio,domicilio", question: "¿Hacen delivery?", answer: "Sí, contamos con delivery propio. Puedes hacer tu pedido desde el menú y seguir el recorrido del repartidor en tiempo real." },
      { keywords: "reserva,reservar,mesa,cumpleaños", question: "¿Cómo reservo una mesa?", answer: "Puedo ayudarte a reservar aquí mismo. Solo dime tu nombre, teléfono, fecha, hora y número de personas. También puedes usar el formulario de Reservas." },
      { keywords: "pago,tarjeta,efectivo,yape,plin", question: "¿Qué medios de pago aceptan?", answer: "Aceptamos efectivo, tarjetas de crédito/débito y billeteras digitales (Yape/Plin)." },
      { keywords: "carta,menu,precios", question: "¿Puedo ver la carta?", answer: "Claro, en la sección Menú de nuestra página encuentras todos los platos con fotos y precios: asados, chaufas, tallarines, cócteles, vinos y más." },
    ];
    let i = 0;
    for (const f of faqs) {
      await db.insert(chatbotFaqs).values({ ...f, sortOrder: i++ });
    }
    console.log(`✔ ${faqs.length} FAQs del chatbot creadas`);
  }

  console.log("\n✅ Seed completado");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
