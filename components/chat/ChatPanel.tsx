"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Brain, ChevronDown, Clock, Loader2, Plus, Square, Trash2, X } from "lucide-react";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatSessions } from "@/hooks/useChatSessions";
import type { SessionMeta } from "@/hooks/useChatSessions";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

type AiMode = "claude-sonnet" | "claude-haiku" | "gemini-flash" | "llama-70b" | "deepseek-r1" | "nemotron-120b" | "nemotron-550b" | "ollama";

interface ModelOption {
  id: AiMode;
  label: string;
  badge: string;
  badgeColor: string;
  note: string;
  separator?: boolean;
}

const MODEL_OPTIONS: ModelOption[] = [
  { id: "claude-sonnet",  label: "Claude Sonnet 4.6",     badge: "$$$",  badgeColor: "text-zinc-500",    note: "Najinteligentniejszy · niezawodne tool calling" },
  { id: "claude-haiku",   label: "Claude Haiku 4.5",      badge: "$$",   badgeColor: "text-zinc-500",    note: "~10× tańszy od Sonnet · polecany na co dzień", separator: true },
  { id: "gemini-flash",   label: "Gemma 4 31B",           badge: "FREE", badgeColor: "text-emerald-500", note: "Natywny function calling · 262K ctx · zalecany z darmowych" },
  { id: "llama-70b",      label: "Llama 3.3 70B",         badge: "FREE", badgeColor: "text-emerald-500", note: "Solidny · 131K ctx · prompt-based taski (beta)" },
  { id: "deepseek-r1",    label: "Qwen3 Coder 480B",      badge: "FREE", badgeColor: "text-emerald-500", note: "480B MoE · prompt-based taski (beta)" },
  { id: "nemotron-120b",  label: "Nemotron Super 120B",   badge: "FREE", badgeColor: "text-emerald-500", note: "NVIDIA · 1M ctx · szybki (12B aktywnych) · beta" },
  { id: "nemotron-550b",  label: "Nemotron Ultra 550B",   badge: "FREE", badgeColor: "text-emerald-500", note: "NVIDIA · 1M ctx · najsilniejszy z darmowych · beta", separator: true },
  { id: "ollama",         label: "Local Ollama",          badge: "FREE", badgeColor: "text-amber-500",   note: "Lokalnie · wymaga ollama serve" },
];

const QUICK_PROMPTS: { label: string; prompt: string }[] = [
  { label: "📊 Briefing dnia",       prompt: "Zrób mi briefing na dziś — co pilne, co zaległe, co critical" },
  { label: "🔄 Weekly review",       prompt: "Zrób mi weekly review — co zrobiłem w tym tygodniu, co zaległe, co powinienem zaplanować na następny tydzień" },
  { label: "🎯 Na czym teraz?",      prompt: "Co powinienem teraz robić? Wskaż 1-3 najważniejsze rzeczy na najbliższe godziny biorąc pod uwagę moje firmy i priorytety" },
  { label: "💤 Log wellbeing",       prompt: "Spałem _h, energia _/10, suplementy: _" },
  { label: "📝 Rozłóż notatkę",      prompt: "Mam notatkę do rozłożenia na taski:\n\n" },
  { label: "⚡ Co nowego w firmach?", prompt: "Pokaż mi taski ze wszystkich firm — chcę szybki przegląd co się dzieje" },
];

// ─────────────────────────────────────────────────────────
// Outer component: session management + history panel
// ─────────────────────────────────────────────────────────
export function ChatPanel({ onDataChanged }: { onDataChanged: () => void }) {
  const { sessionId, sessions, initialMessages, isLoading, saveMessages, startNewSession, switchSession, deleteSession } =
    useChatSessions();

  const [showHistory, setShowHistory] = useState(false);

  async function handleNewChat() {
    await startNewSession();
    setShowHistory(false);
  }

  async function handleSelectSession(id: string) {
    await switchSession(id);
    setShowHistory(false);
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await deleteSession(id);
    if (id === sessionId) await startNewSession();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header
        className="flex shrink-0 items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: "var(--edge)" }}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-600/15">
          <Brain className="h-4 w-4 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold" style={{ color: "var(--text)" }}>OmniBrain Inbox</h1>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>Notatka → taski · dyktuj 🎤</p>
        </div>

        {/* History button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className={cn(
              "flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition-colors",
              showHistory
                ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
                : "text-zinc-500 hover:text-zinc-300",
            )}
            style={!showHistory ? { borderColor: "var(--edge)" } : undefined}
            title="Historia rozmów"
          >
            <Clock className="h-3.5 w-3.5" />
            {sessions.length > 0 && (
              <span className="text-[10px]">{sessions.length}</span>
            )}
          </button>

          {/* History dropdown */}
          {showHistory && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowHistory(false)} />
              <div
                className="absolute right-0 top-8 z-20 w-72 rounded-xl border shadow-2xl overflow-hidden"
                style={{ background: "var(--surface)", borderColor: "var(--edge)" }}
              >
                <div
                  className="flex items-center justify-between px-3 py-2 border-b"
                  style={{ borderColor: "var(--edge)" }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Historia rozmów
                  </span>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="flex items-center gap-1 rounded-lg bg-violet-500/15 px-2 py-0.5 text-[11px] text-violet-400 hover:bg-violet-500/25 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Nowa
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {sessions.length === 0 ? (
                    <p className="py-6 text-center text-xs" style={{ color: "var(--text-dim)" }}>
                      Brak zapisanych rozmów
                    </p>
                  ) : (
                    sessions.map((s: SessionMeta) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSession(s.id)}
                        className={cn(
                          "group/hist flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors border-b last:border-0",
                          s.id === sessionId ? "bg-violet-500/10" : "hover:bg-zinc-800/40",
                        )}
                        style={{ borderColor: "var(--edge)" }}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="truncate text-xs font-medium"
                            style={{ color: s.id === sessionId ? "#a78bfa" : "var(--text)" }}
                          >
                            {s.title}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>
                            {formatDistanceToNow(new Date(s.date), { addSuffix: true, locale: pl })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, s.id)}
                          className="shrink-0 mt-0.5 opacity-0 group-hover/hist:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* New chat button */}
        <button
          type="button"
          onClick={handleNewChat}
          className="shrink-0 flex items-center justify-center rounded-lg border p-1.5 transition-colors hover:border-violet-500/40 hover:text-violet-400"
          style={{ borderColor: "var(--edge)", color: "var(--text-dim)" }}
          title="Nowa rozmowa"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Chat body — keyed by sessionId to force remount on session switch */}
      {isLoading || !sessionId ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
        </div>
      ) : (
        <ChatBody
          key={sessionId}
          sessionId={sessionId}
          initialMessages={initialMessages}
          onSave={(msgs) => saveMessages(msgs, sessionId)}
          onDataChanged={onDataChanged}
        />
      )}
    </div>
  );
}

const COMPANY_NAMES: Record<string, string> = {
  aiosystems: "AioSystems",
  kolmat: "Kolmat",
  "hyper-human": "Hyper Human",
  personal: "Personal",
};

function renderMessageParts(parts: UIMessage["parts"], streamingNow: boolean) {
  // Deduplicate: collect toolCallIds that have a "done" result part
  const doneCallIds = new Set<string>();
  for (const part of parts) {
    const p = part as { type: string; toolCallId?: string; state?: string };
    if ((p.type.startsWith("tool-") || p.type === "dynamic-tool") && p.toolCallId) {
      const state = p.state ?? "";
      if (state === "output-available" || state === "result") {
        doneCallIds.add(p.toolCallId);
      }
    }
  }

  const rendered: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const p = part as { type: string; toolCallId?: string; state?: string; output?: unknown; result?: unknown; text?: string };

    if (p.type === "text") {
      // Strip <omni-actions> blocks — they're executed separately and shown as status badges
      const clean = (p.text ?? "").replace(/<omni-actions>[\s\S]*?<\/omni-actions>/g, "").trim();
      if (clean) rendered.push(<p key={i} className="whitespace-pre-wrap">{clean}</p>);
      continue;
    }

    if (p.type.startsWith("tool-") || p.type === "dynamic-tool") {
      const state = p.state ?? "";
      const isResultPart = state === "output-available" || state === "result";
      const isCallPart   = !isResultPart;
      const callId       = p.toolCallId;
      const toolName     = (p as { toolName?: string }).toolName ?? "";

      // Skip "call" parts when a matching "result" part exists (avoids double rendering)
      if (isCallPart && callId && doneCallIds.has(callId)) continue;

      // When stream ended, treat everything as done
      const isDone = isResultPart || (!streamingNow);

      // Extract result payload (varies by SDK version)
      const payload = (p.output ?? p.result) as Record<string, unknown> | undefined;
      const taskTitle   = payload?.title   as string | undefined;
      const taskCompany = payload?.company as string | undefined;
      const taskStatus  = payload?.status  as string | undefined;

      const DATA_TOOLS: Record<string, string> = {
        listTasks:       "📋 Pobrano listę tasków",
        getDailyBriefing:"📊 Pobrano briefing dnia",
        getWeeklyReview: "📊 Pobrano dane tygodnia",
      };

      let label: React.ReactNode;
      if (!isDone) {
        label = <span className="text-violet-400/70">⟳ pobieram…</span>;
      } else if (DATA_TOOLS[toolName]) {
        label = <span className="text-blue-400/80">{DATA_TOOLS[toolName]}</span>;
      } else if (taskTitle) {
        const company = taskCompany ? COMPANY_NAMES[taskCompany] ?? taskCompany : null;
        label = (
          <span className="text-emerald-500/90">
            ✓ <span className="font-medium">{taskTitle}</span>
            {company && <span className="text-emerald-400/60"> → {company}</span>}
            {taskStatus === "archived" && <span className="text-zinc-500"> (kosz)</span>}
          </span>
        );
      } else {
        label = <span className="text-emerald-500/90">✓ zapisano</span>;
      }

      rendered.push(
        <p key={i} className="mt-1 text-[10px] uppercase tracking-wide">{label}</p>
      );
    }
  }
  return rendered;
}

// ─────────────────────────────────────────────────────────
// Action execution types
// ─────────────────────────────────────────────────────────
interface ActionResult {
  action: string;
  success: boolean;
  title?: string;
  company?: string;
  error?: string;
}
type ActionStatus =
  | { state: "executing" }
  | { state: "done"; results: ActionResult[] }
  | { state: "error"; message: string };

const COMPANY_LABELS: Record<string, string> = {
  aiosystems: "AioSystems", kolmat: "Kolmat", "hyper-human": "Hyper Human", personal: "Personal",
};

function ActionStatusBadge({ status }: { status: ActionStatus }) {
  if (status.state === "executing") {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Wykonuję akcje…</span>
      </div>
    );
  }
  if (status.state === "error") {
    return (
      <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-1.5 text-[10px] text-red-400">
        ⚠ {status.message}
      </div>
    );
  }
  const ok  = status.results.filter((r) => r.success);
  const bad = status.results.filter((r) => !r.success);
  return (
    <div className="mt-2 space-y-0.5 border-t pt-1.5" style={{ borderColor: "var(--edge)" }}>
      {ok.map((r, i) => (
        <div key={i} className="text-[10px] text-emerald-400/90">
          {r.action === "createTask"
            ? `✓ Task: ${r.title}${r.company ? ` → ${COMPANY_LABELS[r.company] ?? r.company}` : ""}`
            : r.action === "logWellbeing"
            ? "✓ Wellbeing zalogowany"
            : `✓ ${r.title ?? r.action}`}
        </div>
      ))}
      {bad.map((r, i) => (
        <div key={i} className="text-[10px] text-red-400/80">⚠ Błąd ({r.action}): {r.error}</div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Inner component: keyed by sessionId, owns useChat
// ─────────────────────────────────────────────────────────
function ChatBody({
  sessionId: _sessionId,
  initialMessages,
  onSave,
  onDataChanged,
}: {
  sessionId: string;
  initialMessages: UIMessage[];
  onSave: (messages: UIMessage[]) => void;
  onDataChanged: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showModelPicker, setShowModelPicker] = useState(false);
  const [actionStatuses, setActionStatuses]   = useState<Record<string, ActionStatus>>({});
  const prevStatus = useRef<string>("ready");
  const processedIds = useRef<Set<string>>(new Set());
  const streamStartRef = useRef<number>(0);
  const pendingLogRef  = useRef<{ id: string; model: string; userText: string } | null>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI mode — persisted in localStorage (backward compat: "claude" → "claude-sonnet")
  const [aiMode, setAiMode] = useState<AiMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("omni-ai-mode");
      if (stored === "claude") return "claude-sonnet";
      return (stored as AiMode) ?? "claude-sonnet";
    }
    return "claude-sonnet";
  });

  function selectModel(mode: AiMode) {
    setAiMode(mode);
    setShowModelPicker(false);
    localStorage.setItem("omni-ai-mode", mode);
  }

  // aiModeRef so the fetch interceptor always reads the current value
  const aiModeRef = useRef<AiMode>(aiMode);
  useEffect(() => { aiModeRef.current = aiMode; }, [aiMode]);

  // Transport created once per session — injects aiMode dynamically via fetch interceptor
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (url, init) => {
          const existing = JSON.parse((init?.body as string) ?? "{}");
          return globalThis.fetch(url, {
            ...init,
            body: JSON.stringify({ ...existing, aiMode: aiModeRef.current }),
          });
        },
      }),
    [],
  );

  // Keep messages in a ref so onFinish can read the latest without stale closure
  const messagesRef = useRef<UIMessage[]>(initialMessages);

  const { messages, sendMessage, stop, status, error, setMessages } = useChat({
    transport,
    onFinish: useCallback(() => {
      onSave(messagesRef.current);
      onDataChanged();
    }, [onSave, onDataChanged]),
  });

  // Restore historical messages on mount (useChat doesn't have initialMessages in v3)
  useEffect(() => {
    if (initialMessages.length > 0) setMessages(initialMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const isLoading = status === "submitted" || status === "streaming";

  // Debounced save — catches user messages before assistant responds, without hammering DB during streaming
  useEffect(() => {
    if (messages.length === 0) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => { onSave(messages); }, 2000);
  }, [messages, onSave]);

  // Detect end of stream → parse <omni-actions> block → execute
  useEffect(() => {
    const wasStreaming = prevStatus.current === "streaming" || prevStatus.current === "submitted";
    prevStatus.current = status;
    if (!wasStreaming || status !== "ready") return;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    if (processedIds.current.has(lastMsg.id)) return;

    // Dispatch activity log event
    if (pendingLogRef.current) {
      const toolParts = (lastMsg.parts ?? []).filter(
        (p) => (p as { type: string }).type.startsWith("tool-") || (p as { type: string }).type === "dynamic-tool",
      );
      const toolNames = [...new Set(toolParts.map((p) => (p as { toolName?: string }).toolName ?? "tool"))];
      window.dispatchEvent(new CustomEvent("omni-ai-log", {
        detail: {
          id: pendingLogRef.current.id,
          at: streamStartRef.current,
          duration: Date.now() - streamStartRef.current,
          model: pendingLogRef.current.model,
          userText: pendingLogRef.current.userText,
          tools: toolNames,
        },
      }));
      pendingLogRef.current = null;
    }

    const fullText = (lastMsg.parts ?? [])
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");

    const match = fullText.match(/<omni-actions>([\s\S]*?)<\/omni-actions>/);
    if (!match) return;

    processedIds.current.add(lastMsg.id);

    let actions: unknown[];
    try {
      actions = JSON.parse(match[1].trim());
      if (!Array.isArray(actions) || actions.length === 0) return;
    } catch {
      setActionStatuses((prev) => ({
        ...prev,
        [lastMsg.id]: { state: "error", message: "Model zwrócił niepoprawny JSON akcji" },
      }));
      return;
    }

    setActionStatuses((prev) => ({ ...prev, [lastMsg.id]: { state: "executing" } }));

    fetch("/api/chat/execute-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actions }),
    })
      .then((r) => r.json())
      .then((data: { results: ActionResult[] }) => {
        setActionStatuses((prev) => ({
          ...prev,
          [lastMsg.id]: { state: "done", results: data.results ?? [] },
        }));
        window.dispatchEvent(new CustomEvent("omni-ai-actions", {
          detail: { msgId: lastMsg.id, results: data.results ?? [] },
        }));
        onDataChanged();
      })
      .catch(() => {
        setActionStatuses((prev) => ({
          ...prev,
          [lastMsg.id]: { state: "error", message: "Błąd połączenia z serwerem" },
        }));
      });
  }, [status, messages, onDataChanged]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = (text: string) => {
    streamStartRef.current = Date.now();
    pendingLogRef.current = { id: crypto.randomUUID(), model: aiModeRef.current, userText: text };
    sendMessage({ role: "user", parts: [{ type: "text", text }] });
  };

  const currentModel = MODEL_OPTIONS.find((m) => m.id === aiMode) ?? MODEL_OPTIONS[0];
  const isLocalModel = aiMode === "ollama";
  const isFreeModel  = currentModel.badge === "FREE";

  return (
    <>
      {/* Local/OpenRouter info banner */}
      {isLocalModel && (
        <div
          className="shrink-0 flex items-center gap-2 border-b px-4 py-1.5 text-[11px]"
          style={{ borderColor: "var(--edge)", background: "rgba(245,158,11,0.05)", color: "#f59e0b" }}
        >
          <span>🦙</span>
          <span>Tryb lokalny — Ollama · uruchom: <code className="font-mono text-[10px]">ollama serve</code></span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 px-2 py-8 text-center">
            <p className="max-w-xs text-xs" style={{ color: "var(--text-dim)" }}>
              Wrzuć chaos z notatek — przypiszę firmę, priorytet, sub-taski i terminy. Albo zapytaj o briefing dnia.
            </p>
            <div className="grid w-full max-w-sm grid-cols-2 gap-2">
              {QUICK_PROMPTS.map(({ label, prompt }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:border-zinc-600 hover:text-zinc-200"
                  style={{ borderColor: "var(--edge)", background: "var(--surface-2)", color: "var(--text-2)" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[95%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              message.role === "user"
                ? "ml-auto rounded-tr-sm bg-violet-600/20 text-violet-100"
                : "mr-auto rounded-tl-sm border text-zinc-300",
            )}
            style={message.role !== "user" ? { borderColor: "var(--edge)", background: "var(--surface-2)" } : undefined}
          >
            {renderMessageParts(message.parts, isLoading)}
            {message.role === "assistant" && actionStatuses[message.id] && (
              <ActionStatusBadge status={actionStatuses[message.id]} />
            )}
          </div>
        ))}

        {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
          <div
            className="mr-auto flex items-center gap-2 rounded-2xl border px-3 py-2"
            style={{ borderColor: "var(--edge)", background: "var(--surface-2)" }}
          >
            <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
            <span className="text-xs text-zinc-500">Przetwarzam…</span>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error.message}
          </p>
        )}
      </div>

      {/* Footer: model picker + input */}
      <div className="shrink-0">
        <div
          className="relative flex items-center gap-2 border-t px-3 py-1.5"
          style={{ borderColor: "var(--edge)" }}
        >
          {/* Model picker button */}
          <button
            type="button"
            onClick={() => setShowModelPicker((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-colors",
              showModelPicker
                ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
                : "text-zinc-500 hover:text-zinc-300",
            )}
            style={!showModelPicker ? { borderColor: "var(--edge)" } : undefined}
          >
            <span className={cn("font-medium", isFreeModel ? "text-emerald-400" : "text-zinc-300")}>
              {currentModel.label}
            </span>
            <span className={cn("text-[10px]", currentModel.badgeColor)}>{currentModel.badge}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {/* Model picker dropdown */}
          {showModelPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowModelPicker(false)} />
              <div
                className="absolute bottom-9 left-0 z-20 w-72 overflow-hidden rounded-xl border shadow-2xl"
                style={{ background: "var(--surface)", borderColor: "var(--edge)" }}
              >
                <div className="px-3 py-2 border-b" style={{ borderColor: "var(--edge)" }}>
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-2)" }}>Wybierz model AI</span>
                </div>
                {MODEL_OPTIONS.map((opt, i) => (
                  <div key={opt.id}>
                    {opt.separator && i > 0 && (
                      <div className="border-t mx-2" style={{ borderColor: "var(--edge)" }} />
                    )}
                    <button
                      type="button"
                      onClick={() => selectModel(opt.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                        opt.id === aiMode ? "bg-violet-500/10" : "hover:bg-zinc-800/50",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-medium", opt.id === aiMode ? "text-violet-300" : "text-zinc-200")}>
                            {opt.label}
                          </span>
                          <span className={cn("text-[10px] font-semibold", opt.badgeColor)}>{opt.badge}</span>
                        </div>
                        <span className="text-[10px] text-zinc-600">{opt.note}</span>
                      </div>
                      {opt.id === aiMode && (
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Right side: stop + status */}
          <div className="ml-auto flex items-center gap-1.5">
            {isLoading && (
              <button
                type="button"
                onClick={() => { stop(); onDataChanged(); }}
                className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Square className="h-3 w-3 fill-current" />
                Stop
              </button>
            )}
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              isLoading ? "animate-pulse bg-violet-400" : isFreeModel ? "bg-emerald-500" : isLocalModel ? "bg-amber-500" : "bg-violet-500",
            )} />
            <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{isLoading ? "AI…" : "Gotowy"}</span>
          </div>
        </div>

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </>
  );
}
