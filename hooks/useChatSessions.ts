"use client";

import { useCallback, useEffect, useState } from "react";
import type { UIMessage } from "ai";

export interface SessionMeta {
  id: string;
  title: string;
  date: string;
}

const CURRENT_KEY = "omni-session-current";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getStoredCurrentId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_KEY);
}

function setStoredCurrentId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_KEY, id);
}

export function useChatSessions() {
  const [sessionId, setSessionId]           = useState<string>("");
  const [sessions, setSessions]             = useState<SessionMeta[]>([]);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading]           = useState(true);

  const fetchMessages = useCallback(async (id: string): Promise<UIMessage[]> => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.messages ?? []) as UIMessage[];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        // Load sessions list
        const res = await fetch("/api/chat/sessions");
        const data = res.ok ? await res.json() : { sessions: [] };
        const remoteSessions: SessionMeta[] = data.sessions ?? [];
        setSessions(remoteSessions);

        // Resolve current session
        let currentId = getStoredCurrentId();
        if (currentId && !remoteSessions.find((s) => s.id === currentId)) {
          currentId = null; // stored ID no longer exists in DB
        }
        if (!currentId && remoteSessions.length > 0) {
          currentId = remoteSessions[0].id;
        }
        if (!currentId) {
          // First ever use — create initial session
          currentId = genId();
          await fetch("/api/chat/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: currentId, title: "Nowa rozmowa" }),
          });
          setSessions([{ id: currentId, title: "Nowa rozmowa", date: new Date().toISOString() }]);
        }

        setStoredCurrentId(currentId);
        const messages = await fetchMessages(currentId);
        setSessionId(currentId);
        setInitialMessages(messages);
      } catch {
        // Fallback: create a local-only session ID so the UI still works
        const id = genId();
        setSessionId(id);
        setInitialMessages([]);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [fetchMessages]);

  const saveMessages = useCallback(async (messages: UIMessage[], id: string) => {
    if (!messages.length) return;

    const firstText =
      messages
        .find((m) => m.role === "user")
        ?.parts?.find((p): p is { type: "text"; text: string } => p.type === "text")
        ?.text ?? "Rozmowa";
    const title = firstText.slice(0, 70);

    // Fire-and-forget — don't block chat on save
    fetch(`/api/chat/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, messages }),
    }).catch(() => {});

    setSessions((prev) => {
      const existing = prev.find((s) => s.id === id);
      const updated = { id, title, date: new Date().toISOString() };
      if (existing) return [updated, ...prev.filter((s) => s.id !== id)];
      return [updated, ...prev];
    });
  }, []);

  const startNewSession = useCallback(async (): Promise<string> => {
    const id = genId();
    setStoredCurrentId(id);
    await fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: "Nowa rozmowa" }),
    }).catch(() => {});
    setSessions((prev) => [{ id, title: "Nowa rozmowa", date: new Date().toISOString() }, ...prev]);
    setSessionId(id);
    setInitialMessages([]);
    return id;
  }, []);

  const switchSession = useCallback(async (id: string) => {
    setStoredCurrentId(id);
    const messages = await fetchMessages(id);
    setSessionId(id);
    setInitialMessages(messages);
  }, [fetchMessages]);

  const deleteSession = useCallback(async (id: string) => {
    await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" }).catch(() => {});
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    sessionId,
    sessions,
    initialMessages,
    isLoading,
    saveMessages,
    startNewSession,
    switchSession,
    deleteSession,
  };
}
