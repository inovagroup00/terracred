import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Input, Spinner } from "@credshow/ui";
import { getSupabase } from "@credshow/lib";
import type { EventStatus } from "@credshow/types";

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [status, setStatus] = useState<EventStatus>("draft");

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    void (async () => {
      const sb = getSupabase();
      const { data, error: err } = await sb
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (err || !data) {
        setError(err?.message ?? "Evento nao encontrado.");
        setLoading(false);
        return;
      }
      setName(data.name);
      setVenue(data.venue);
      setEventDate(toLocalInput(data.event_date));
      setStatus(data.status);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !venue.trim() || !eventDate) {
      setError("Preencha todos os campos obrigatorios.");
      return;
    }

    const dt = new Date(eventDate);
    if (Number.isNaN(dt.getTime())) {
      setError("Data do evento invalida.");
      return;
    }

    setSaving(true);
    try {
      const sb = getSupabase();
      if (isEdit && id) {
        const { error: err } = await sb
          .from("events")
          .update({
            name: name.trim(),
            venue: venue.trim(),
            event_date: dt.toISOString(),
            status,
          })
          .eq("id", id);
        if (err) throw err;
      } else {
        const { error: err } = await sb.from("events").insert({
          name: name.trim(),
          venue: venue.trim(),
          event_date: dt.toISOString(),
          status,
        });
        if (err) throw err;
      }
      nav("/eventos", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar evento.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Spinner className="h-4 w-4" />
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          {isEdit ? "Editar evento" : "Novo evento"}
        </h2>
        <p className="text-sm text-slate-500">
          Informe os dados do evento. Eventos em rascunho nao aceitam operacoes.
        </p>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do evento"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Show ABC - Turne 2026"
            required
          />
          <Input
            label="Local / Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Allianz Parque"
            required
          />
          <Input
            label="Data e hora"
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="closed">Encerrado</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              {isEdit ? "Salvar alteracoes" : "Criar evento"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => nav(-1)}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
