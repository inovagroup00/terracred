import { Routes, Route, Navigate } from "react-router-dom";
import { Onboarding } from "./pages/Onboarding";
import { InvalidLink } from "./pages/InvalidLink";
import { Expired } from "./pages/Expired";

export default function App() {
  return (
    <div className="min-h-full bg-slate-50">
      <main className="mx-auto flex min-h-full w-full max-w-md flex-col">
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/invalido" element={<InvalidLink />} />
          <Route path="/expirado" element={<Expired />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
