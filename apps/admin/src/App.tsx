import { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { EventsList } from "./pages/EventsList";
import { EventForm } from "./pages/EventForm";
import { EventDetails } from "./pages/EventDetails";
import { OperatorsList } from "./pages/OperatorsList";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col md:pl-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/eventos" element={<EventsList />} />
        <Route path="/eventos/novo" element={<EventForm />} />
        <Route path="/eventos/:id/editar" element={<EventForm />} />
        <Route path="/eventos/:id" element={<EventDetails />} />
        <Route path="/operadores" element={<OperatorsList />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">404</h1>
      <p className="text-sm text-slate-600">Pagina nao encontrada.</p>
      <a href="/" className="text-sm text-orange-600 hover:underline">
        Voltar
      </a>
    </div>
  );
}
