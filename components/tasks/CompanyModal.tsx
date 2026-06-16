"use client";

import { useState, useEffect, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Company } from "@/lib/supabase/types";

interface Props {
  mode: "create" | "edit";
  company?: Company;
  onSave: () => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#84cc16",
  "#f97316", "#a855f7", "#14b8a6", "#eab308",
];

const PRESET_ICONS = [
  "🚀", "💼", "🏋️", "🏠", "📊", "💡",
  "🌟", "⚡", "🎯", "📱", "🔧", "🎓",
  "💰", "🌍", "🎨", "📝", "🔥", "✨",
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CompanyModal({ mode, company, onSave, onClose }: Props) {
  const [name, setName] = useState(company?.name ?? "");
  const [slug, setSlug] = useState(company?.slug ?? "");
  const [icon, setIcon] = useState(company?.icon ?? "🚀");
  const [accentColor, setAccentColor] = useState(company?.accent_color ?? "#8b5cf6");
  const [context, setContext] = useState(company?.context ?? "");
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleNameChange(val: string) {
    setName(val);
    if (!slugEdited) setSlug(slugify(val));
  }

  async function handleSave() {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const url = mode === "edit" ? `/api/companies/${company!.id}` : "/api/companies";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), icon, accent_color: accentColor, context: context.trim() || null }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Błąd zapisu");
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!company) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Błąd usuwania");
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd usuwania");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-xl border shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--edge)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--edge)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {mode === "create" ? "Nowy obszar" : "Edytuj obszar"}
          </h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* Preview */}
          <div className="flex items-center gap-3 rounded-lg border px-4 py-3" style={{ borderColor: accentColor + "60", background: accentColor + "10" }}>
            <span className="text-2xl leading-none">{icon || "?"}</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{name || "Nazwa obszaru"}</p>
              <p className="text-xs text-zinc-500">{slug || "slug"}</p>
            </div>
            <div className="ml-auto h-3 w-3 rounded-full" style={{ background: accentColor }} />
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Nazwa</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="np. AioSystems"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
              style={{ background: "var(--bg)", borderColor: "var(--edge)", color: "var(--text)" }}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Slug (ID obszaru)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
              placeholder="np. aiosystems"
              className="w-full rounded-lg border px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-violet-500"
              style={{ background: "var(--bg)", borderColor: "var(--edge)", color: "var(--text-2)" }}
            />
          </div>

          {/* Icon */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Ikona</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ICONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border text-base transition-all",
                    icon === e
                      ? "border-violet-500 bg-violet-500/20"
                      : "border-zinc-700 hover:border-zinc-500",
                  )}
                >
                  {e}
                </button>
              ))}
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={4}
                placeholder="✏️"
                className="h-8 w-12 rounded-lg border px-1 text-center text-sm outline-none focus:ring-1 focus:ring-violet-500"
                style={{ background: "var(--bg)", borderColor: "var(--edge)", color: "var(--text)" }}
              />
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Kolor akcentu</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccentColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-all",
                    accentColor === c ? "border-white scale-110" : "border-transparent hover:scale-105",
                  )}
                  style={{ background: c }}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent"
                title="Własny kolor"
              />
            </div>
          </div>

          {/* Context — knowledge base for AI */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Kontekst dla AI
              <span className="ml-1.5 text-zinc-600 font-normal">— AI widzi to w każdej rozmowie</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="NIP, kluczowi ludzie, aktywne projekty, ważne info…"
              rows={3}
              maxLength={2000}
              className="w-full resize-none rounded-lg border px-3 py-2 text-xs placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-violet-500"
              style={{ background: "var(--bg)", borderColor: "var(--edge)", color: "var(--text-2)" }}
            />
            {context.length > 0 && (
              <p className="mt-0.5 text-right text-[10px] text-zinc-700">{context.length}/2000</p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--edge)" }}>
          <div>
            {mode === "edit" && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Usuń obszar
              </button>
            )}
            {confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Na pewno?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded px-2 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  {deleting ? "Usuwam…" : "Tak, usuń"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Anuluj
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Anuluj</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim() || !slug.trim()}
            >
              {saving ? "Zapisuję…" : mode === "create" ? "Utwórz" : "Zapisz"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
