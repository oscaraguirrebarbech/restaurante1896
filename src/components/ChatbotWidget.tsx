import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { trpc } from "@/providers/trpc";

type Msg = { from: "bot" | "user"; text: string; link?: string | null };
type Flow =
  | { step: "menu" }
  | { step: "order_name" }
  | { step: "order_phone"; name: string }
  | { step: "order_type"; name: string; phone: string }
  | { step: "order_address"; name: string; phone: string; orderType: string }
  | { step: "order_items"; name: string; phone: string; orderType: string; address?: string; items: { dishId: number; name: string; price: number; quantity: number }[] }
  | { step: "res_name" }
  | { step: "res_phone"; name: string }
  | { step: "res_date"; name: string; phone: string }
  | { step: "res_time"; name: string; phone: string; date: string }
  | { step: "res_people"; name: string; phone: string; date: string; time: string };

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [flow, setFlow] = useState<Flow>({ step: "menu" });
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: faqs } = trpc.settings.listFaqs.useQuery(undefined, { staleTime: 60_000 });
  const { data: menu } = trpc.menu.publicMenu.useQuery(undefined, { staleTime: 60_000 });

  const createOrder = trpc.orders.create.useMutation();
  const createReservation = trpc.reservations.create.useMutation();

  const push = (m: Msg) => setMsgs((prev) => [...prev, m]);

  useEffect(() => {
    if (open && msgs.length === 0) {
      push({
        from: "bot",
        text: "¡Hola! Soy el asistente virtual del restaurante. Puedo ayudarte a:\n\n1️⃣ Hacer un pedido\n2️⃣ Reservar una mesa\n3️⃣ Agendar una cita\n4️⃣ Responder tus dudas\n\nEscribe el número o cuéntame qué necesitas.",
      });
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  const findDish = (text: string) => {
    if (!menu) return null;
    const t = norm(text);
    return menu.dishes.find((d) => d.available && (t.includes(norm(d.name)) || norm(d.name).includes(t)));
  };

  const finishOrder = (f: Extract<Flow, { step: "order_items" }>) => {
    createOrder.mutate(
      {
        customerName: f.name,
        customerPhone: f.phone,
        orderType: f.orderType as "local" | "delivery" | "recojo",
        deliveryAddress: f.address ?? null,
        source: "chatbot",
        items: f.items.map((i) => ({ dishId: i.dishId, quantity: i.quantity })),
      },
      {
        onSuccess: (data) => {
          push({
            from: "bot",
            text: `✅ ¡Pedido confirmado!\n\n🎫 Turno: #${data.orderNumber}\n📋 Comanda: #${data.comandaNumber}\n💵 Total: $${data.total}\n\nTu pedido fue enviado a cocina y notificado al restaurante por WhatsApp.${data.whatsapp?.waMeLink ? "\n\nToca el botón de abajo para verlo en WhatsApp." : ""}`,
            link: data.whatsapp?.waMeLink,
          });
          setFlow({ step: "menu" });
        },
        onError: (e) => push({ from: "bot", text: `Hubo un problema: ${e.message}. Intenta de nuevo.` }),
      }
    );
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    push({ from: "user", text });
    setInput("");
    const t = norm(text);

    setTimeout(() => {
      switch (flow.step) {
        case "menu": {
          if (["1", "pedido", "pedir", "orden", "comer", "comida"].some((k) => t.includes(k))) {
            setFlow({ step: "order_name" });
            push({ from: "bot", text: "¡Perfecto! Vamos a tomar tu pedido paso a paso. 🍽️\n\nPrimero, ¿cuál es tu nombre?" });
          } else if (["2", "reserva", "reservar", "mesa"].some((k) => t.includes(k))) {
            setFlow({ step: "res_name" });
            push({ from: "bot", text: "Con gusto te ayudo a reservar una mesa. 📅\n\n¿Cuál es tu nombre completo?" });
          } else if (["3", "cita", "agendar"].some((k) => t.includes(k))) {
            setFlow({ step: "res_name" });
            push({ from: "bot", text: "Agendemos tu cita. 📅\n\n¿Cuál es tu nombre completo?" });
          } else {
            const faq = faqs?.find((f) => f.keywords.split(",").some((k) => k.trim() && t.includes(norm(k.trim()))));
            if (faq) {
              push({ from: "bot", text: faq.answer + "\n\n¿Algo más? Escribe: 1 pedido · 2 reserva · 3 cita" });
            } else {
              push({ from: "bot", text: "No estoy seguro de entender. Puedo ayudarte con:\n1️⃣ Pedido · 2️⃣ Reserva · 3️⃣ Cita\nO pregúntame por horarios, ubicación, delivery, pagos…" });
            }
          }
          break;
        }

        case "order_name":
          setFlow({ step: "order_phone", name: text });
          push({ from: "bot", text: `Encantado, ${text}. 📞 ¿A qué número de teléfono/WhatsApp te contactamos?` });
          break;

        case "order_phone":
          setFlow({ step: "order_type", name: flow.name, phone: text });
          push({ from: "bot", text: "¿Cómo quieres tu pedido?\n\n1️⃣ Para comer en el local\n2️⃣ Para recoger\n3️⃣ Delivery a domicilio" });
          break;

        case "order_type": {
          const orderType = t.includes("3") || t.includes("delivery") || t.includes("domicilio") ? "delivery" : t.includes("2") || t.includes("recog") ? "recojo" : "local";
          if (orderType === "delivery") {
            setFlow({ step: "order_address", name: flow.name, phone: flow.phone, orderType });
            push({ from: "bot", text: "📍 ¿Cuál es la dirección de entrega completa?" });
          } else {
            setFlow({ step: "order_items", name: flow.name, phone: flow.phone, orderType, items: [] });
            push({ from: "bot", text: "Ahora dime qué platos deseas. Escríbelos uno por uno (ej: “2 ceviche clásico”).\nCuando termines escribe *listo*." });
          }
          break;
        }

        case "order_address":
          setFlow({ step: "order_items", name: flow.name, phone: flow.phone, orderType: flow.orderType, address: text, items: [] });
          push({ from: "bot", text: "Anotado. 📦 Ahora dime qué platos deseas, uno por uno (ej: “1 parrilla mixta”).\nCuando termines escribe *listo*." });
          break;

        case "order_items": {
          if (t === "listo" || t === "ya" || t === "eso es todo" || t === "confirmar") {
            if (flow.items.length === 0) {
              push({ from: "bot", text: "Aún no agregaste platos. Escríbeme el nombre de un plato del menú para agregarlo." });
            } else {
              const total = flow.items.reduce((a, i) => a + i.price * i.quantity, 0);
              push({ from: "bot", text: `🧾 Resumen de tu pedido:\n${flow.items.map((i) => `• ${i.quantity}x ${i.name} — $${(i.price * i.quantity).toFixed(2)}`).join("\n")}\n\n💵 Total: $${total.toFixed(2)}\n\nConfirmando...` });
              finishOrder(flow);
            }
          } else {
            const match = text.match(/^(\d+)\s*[x]?\s*(.+)$/);
            const qty = match ? parseInt(match[1]) : 1;
            const dishName = match ? match[2] : text;
            const dish = findDish(dishName);
            if (dish) {
              const items = [...flow.items];
              const existing = items.find((i) => i.dishId === Number(dish.id));
              if (existing) existing.quantity += qty;
              else items.push({ dishId: Number(dish.id), name: dish.name, price: Number(dish.price), quantity: qty });
              setFlow({ ...flow, items });
              push({ from: "bot", text: `✔ Agregado: ${qty}x ${dish.name} ($${(Number(dish.price) * qty).toFixed(2)}).\n¿Algo más? Escribe otro plato o *listo* para confirmar.` });
            } else {
              push({ from: "bot", text: `No encontré “${dishName}” en la carta. Intenta con otro nombre (ej: ceviche, chaufa, pisco sour) o escribe *listo*.` });
            }
          }
          break;
        }

        case "res_name":
          setFlow({ step: "res_phone", name: text });
          push({ from: "bot", text: `Gracias, ${text}. 📞 ¿Tu teléfono de contacto?` });
          break;

        case "res_phone":
          setFlow({ step: "res_date", name: flow.name, phone: text });
          push({ from: "bot", text: "🗓️ ¿Para qué fecha? (ej: 2026-07-25 o “sábado 25 de julio”)" });
          break;

        case "res_date":
          setFlow({ step: "res_time", name: flow.name, phone: flow.phone, date: text });
          push({ from: "bot", text: "⏰ ¿A qué hora? (ej: 19:30)" });
          break;

        case "res_time":
          setFlow({ step: "res_people", name: flow.name, phone: flow.phone, date: flow.date, time: text });
          push({ from: "bot", text: "👥 ¿Para cuántas personas?" });
          break;

        case "res_people": {
          const people = parseInt(text);
          if (isNaN(people) || people < 1) {
            push({ from: "bot", text: "Necesito un número válido de personas. 👥" });
            break;
          }
          const dateParsed = /^\d{4}-\d{2}-\d{2}$/.test(flow.date) ? flow.date : new Date().toISOString().slice(0, 10);
          const timeParsed = /^\d{2}:\d{2}/.test(flow.time) ? flow.time.slice(0, 5) : "19:00";
          push({ from: "bot", text: "Un momento, registro tu reserva..." });
          createReservation.mutate(
            { fullName: flow.name, phone: flow.phone, reservationDate: dateParsed, reservationTime: timeParsed, people, source: "chatbot" },
            {
              onSuccess: (data) => {
                push({
                  from: "bot",
                  text: `✅ ¡Reserva registrada!\n\n🎫 Turno de reserva: #${data.reservationNumber}\n👤 ${flow.name}\n🗓️ ${dateParsed} ⏰ ${timeParsed}\n👥 ${people} personas\n\nEl restaurante la confirmará en breve por WhatsApp.`,
                  link: data.whatsapp?.waMeLink,
                });
                setFlow({ step: "menu" });
              },
              onError: (e) => push({ from: "bot", text: `No pude registrar la reserva: ${e.message}` }),
            }
          );
          break;
        }
      }
    }, 350);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105"
        aria-label="Abrir chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[480px] w-[350px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border bg-secondary/60 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">Asistente Virtual</p>
              <p className="text-xs text-emerald-400">● En línea</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.from === "user" ? "justify-end" : ""}`}>
                {m.from === "bot" && <Bot className="mt-1 h-5 w-5 shrink-0 text-primary" />}
                <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm ${m.from === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {m.text}
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noreferrer" className="mt-2 block rounded-lg bg-emerald-600 px-3 py-2 text-center font-semibold text-white hover:bg-emerald-500">
                      Abrir en WhatsApp
                    </a>
                  )}
                </div>
                {m.from === "user" && <User className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe tu mensaje..."
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button onClick={handleSend} className="rounded-xl bg-primary p-2.5 text-primary-foreground hover:brightness-110" aria-label="Enviar">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
