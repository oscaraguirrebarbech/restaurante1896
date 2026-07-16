import { Routes, Route, Outlet, Navigate } from "react-router";
import { CartProvider } from "@/hooks/useCart";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ChatbotWidget from "@/components/ChatbotWidget";
import Home from "@/pages/Home";
import MenuPage from "@/pages/MenuPage";
import ReservationsPage from "@/pages/ReservationsPage";
import DeliveryPage from "@/pages/DeliveryPage";
import TrackPage from "@/pages/TrackPage";
import LoginPage from "@/pages/admin/LoginPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import DashboardPage from "@/pages/admin/DashboardPage";
import OrdersPage from "@/pages/admin/OrdersPage";
import SalesPage from "@/pages/admin/SalesPage";
import ReservationsAdmin from "@/pages/admin/ReservationsAdmin";
import DeliveryAdmin from "@/pages/admin/DeliveryAdmin";
import MenuAdmin from "@/pages/admin/MenuAdmin";
import ChatbotAdmin from "@/pages/admin/ChatbotAdmin";
import SettingsAdmin from "@/pages/admin/SettingsAdmin";

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <ChatbotWidget />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/reservas" element={<ReservationsPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/seguimiento" element={<TrackPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="ventas" element={<SalesPage />} />
          <Route path="reservas" element={<ReservationsAdmin />} />
          <Route path="delivery" element={<DeliveryAdmin />} />
          <Route path="menu" element={<MenuAdmin />} />
          <Route path="chatbot" element={<ChatbotAdmin />} />
          <Route path="config" element={<SettingsAdmin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
  );
}
