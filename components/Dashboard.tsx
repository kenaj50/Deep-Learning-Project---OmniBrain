"use client";

import { useEffect, useState } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import type { PanelSize } from "react-resizable-panels";
import {
  Activity, Bell, BellOff, CalendarDays, LayoutGrid,
  MessageSquare, Search, Sun, PanelLeftOpen,
} from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { OpsPanel } from "@/components/tasks/OpsPanel";
import { TodayPanel } from "@/components/today/TodayPanel";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SearchModal } from "@/components/search/SearchModal";
import { LogPanel } from "@/components/log/LogPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTasks } from "@/hooks/useTasks";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

type MobileTab = "today" | "chat" | "ops" | "calendar";
type RightTab  = "ops" | "calendar" | "logs";

export default function Dashboard() {
  const [mobileTab, setMobileTab]           = useState<MobileTab>("today");
  const [rightTab,  setRightTab]            = useState<RightTab>("ops");
  const [chatCollapsed,  setChatCollapsed]  = useState(false);
  const [todayCollapsed, setTodayCollapsed] = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);

  const chatRef  = usePanelRef();
  const todayRef = usePanelRef();

  const taskState = useTasks();
  const { permission, requestPermission } = useNotifications();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function toggleChat() {
    const p = chatRef.current;
    if (!p) return;
    if (p.isCollapsed()) p.expand(); else p.collapse();
  }

  function toggleToday() {
    const p = todayRef.current;
    if (!p) return;
    if (p.isCollapsed()) p.expand(); else p.collapse();
  }

  return (
    <div
      className="h-[100dvh] overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {searchOpen && (
        <SearchModal
          companies={taskState.companies}
          onClose={() => setSearchOpen(false)}
          onDataChanged={taskState.refetch}
        />
      )}
      {/* ══════════════════════════════════════════
          DESKTOP LAYOUT — hidden on mobile
          Wrapper div (not Group) controls visibility
          so inline styles from react-resizable-panels
          don't override Tailwind hidden class.
      ══════════════════════════════════════════ */}
      <div className="hidden md:flex h-full flex-col">
        {/* Desktop top bar */}
        <div
          className="shrink-0 flex items-center justify-between border-b px-4 py-2"
          style={{ borderColor: "var(--edge)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>OmniBrain</span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={toggleChat}
                title={chatCollapsed ? "Pokaż Chat" : "Ukryj Chat"}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
                  chatCollapsed
                    ? "text-zinc-600 hover:text-zinc-400"
                    : "bg-zinc-800/50 text-zinc-400 hover:text-zinc-200",
                )}
              >
                <MessageSquare className="h-3 w-3" />
                <span className="hidden lg:inline">Chat</span>
              </button>
              <button
                type="button"
                onClick={toggleToday}
                title={todayCollapsed ? "Pokaż Dziś" : "Ukryj Dziś"}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
                  todayCollapsed
                    ? "text-zinc-600 hover:text-zinc-400"
                    : "bg-zinc-800/50 text-zinc-400 hover:text-zinc-200",
                )}
              >
                <Sun className="h-3 w-3" />
                <span className="hidden lg:inline">Dziś</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              title="Wyszukaj (⌘K)"
              className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors border-zinc-800"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Szukaj</span>
              <kbd className="hidden lg:inline-flex h-4 select-none items-center rounded px-1 font-mono text-[9px] text-zinc-700 bg-zinc-800/80">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={requestPermission}
              title={permission === "granted" ? "Powiadomienia włączone" : "Włącz powiadomienia"}
              className={cn(
                "flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition-colors",
                permission === "granted"
                  ? "border-emerald-500/30 text-emerald-400"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300",
              )}
            >
              {permission === "granted"
                ? <><Bell className="h-3.5 w-3.5" /> Włączone</>
                : <><BellOff className="h-3.5 w-3.5" /> Powiadomienia</>
              }
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Desktop 3-panel resizable layout */}
        <Group className="flex-1 min-h-0" orientation="horizontal">
          <Panel
            panelRef={chatRef}
            id="chat"
            defaultSize={25}
            minSize={0}
            collapsible
            onResize={(size: PanelSize) => setChatCollapsed(size.asPercentage === 0)}
          >
            <div className="flex flex-col h-full border-r overflow-hidden" style={{ borderColor: "var(--edge)" }}>
              <ErrorBoundary label="Chat">
                <ChatPanel onDataChanged={taskState.refetch} />
              </ErrorBoundary>
            </div>
          </Panel>

          <ResizeHandle collapsed={chatCollapsed} onExpand={() => chatRef.current?.expand()} />

          <Panel
            panelRef={todayRef}
            id="today"
            defaultSize={18}
            minSize={0}
            collapsible
            onResize={(size: PanelSize) => setTodayCollapsed(size.asPercentage === 0)}
          >
            <div className="flex flex-col h-full border-r overflow-hidden" style={{ borderColor: "var(--edge)" }}>
              <ErrorBoundary label="Dziś">
                <TodayPanel onTaskDone={taskState.refetch} companies={taskState.companies} />
              </ErrorBoundary>
            </div>
          </Panel>

          <ResizeHandle collapsed={todayCollapsed} onExpand={() => todayRef.current?.expand()} />

          <Panel id="ops" defaultSize={57} minSize={20}>
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex shrink-0 border-b" style={{ borderColor: "var(--edge)" }}>
                <DesktopTabBtn active={rightTab === "ops"}      onClick={() => setRightTab("ops")}      icon={<LayoutGrid className="h-3.5 w-3.5" />}  label="Operacje" />
                <DesktopTabBtn active={rightTab === "calendar"} onClick={() => setRightTab("calendar")} icon={<CalendarDays className="h-3.5 w-3.5" />} label="Kalendarz" />
                <DesktopTabBtn active={rightTab === "logs"}     onClick={() => setRightTab("logs")}     icon={<Activity className="h-3.5 w-3.5" />}     label="Logi" />
              </div>
              <div className="flex-1 min-h-0">
                {rightTab === "ops" && <ErrorBoundary label="Operacje"><OpsPanel {...taskState} /></ErrorBoundary>}
                {rightTab === "logs" && <ErrorBoundary label="Logi"><LogPanel /></ErrorBoundary>}
                {rightTab === "calendar" && (
                  <ErrorBoundary label="Kalendarz">
                    <div className="flex h-full min-h-0 flex-col">
                      <header className="flex shrink-0 items-center gap-2 border-b px-4 py-3" style={{ borderColor: "var(--edge)" }}>
                        <CalendarDays className="h-5 w-5 text-zinc-400" />
                        <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Kalendarz</h2>
                      </header>
                      <CalendarWidget tasks={taskState.tasks} companies={taskState.companies} onUpdate={taskState.refetch} />
                    </div>
                  </ErrorBoundary>
                )}
              </div>
            </div>
          </Panel>
        </Group>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE LAYOUT — hidden on desktop
          Native iOS-style: header + content + bottom tabs
          Safe area insets for notch + home indicator
      ══════════════════════════════════════════ */}
      <div
        className="flex md:hidden h-full flex-col"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        {/* Mobile top header */}
        <div
          className="shrink-0 flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--edge)", background: "var(--bg)" }}
        >
          <span className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>
            OmniBrain
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={requestPermission}
              className={cn(
                "flex items-center justify-center rounded-full w-8 h-8 transition-colors",
                permission === "granted"
                  ? "text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
              title={permission === "granted" ? "Powiadomienia włączone" : "Włącz powiadomienia"}
            >
              {permission === "granted"
                ? <Bell className="h-4 w-4" />
                : <BellOff className="h-4 w-4" />
              }
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile content — full screen, one panel at a time */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {mobileTab === "today"    && <ErrorBoundary label="Dziś"><TodayPanel onTaskDone={taskState.refetch} companies={taskState.companies} /></ErrorBoundary>}
          {mobileTab === "chat"     && <ErrorBoundary label="Chat"><ChatPanel onDataChanged={taskState.refetch} /></ErrorBoundary>}
          {mobileTab === "ops"      && <ErrorBoundary label="Operacje"><OpsPanel {...taskState} /></ErrorBoundary>}
          {mobileTab === "calendar" && (
            <ErrorBoundary label="Kalendarz">
              <CalendarWidget
                tasks={taskState.tasks}
                companies={taskState.companies}
                onUpdate={taskState.refetch}
              />
            </ErrorBoundary>
          )}
        </div>

        {/* Mobile bottom tab navigation — iOS native style */}
        <nav
          className="shrink-0 flex border-t"
          style={{
            borderColor: "var(--edge)",
            background: "var(--bg)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <MobileTabBtn active={mobileTab === "today"}    onClick={() => setMobileTab("today")}    icon={<Sun className="h-5 w-5" />}          label="Dziś" />
          <MobileTabBtn active={mobileTab === "chat"}     onClick={() => setMobileTab("chat")}     icon={<MessageSquare className="h-5 w-5" />} label="Chat" />
          <MobileTabBtn active={mobileTab === "ops"}      onClick={() => setMobileTab("ops")}      icon={<LayoutGrid className="h-5 w-5" />}    label="Operacje" />
          <MobileTabBtn active={mobileTab === "calendar"} onClick={() => setMobileTab("calendar")} icon={<CalendarDays className="h-5 w-5" />}  label="Kalendarz" />
        </nav>
      </div>
    </div>
  );
}

function ResizeHandle({ collapsed, onExpand }: { collapsed: boolean; onExpand: () => void }) {
  return (
    <Separator
      className={cn(
        "group relative flex items-center justify-center transition-all duration-150",
        collapsed
          ? "w-6 cursor-pointer"
          : "w-[3px] cursor-col-resize hover:bg-violet-500/40",
      )}
      style={collapsed ? undefined : { background: "var(--edge)" }}
      disableDoubleClick={collapsed}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={onExpand}
          className="flex h-full w-full items-center justify-center text-zinc-500 hover:text-violet-400 transition-colors bg-zinc-900/60 hover:bg-zinc-800/80"
          title="Rozwiń panel"
        >
          <PanelLeftOpen className="h-3.5 w-3.5" />
        </button>
      ) : (
        <div className="absolute inset-0 group-hover:bg-violet-500/20 transition-colors" />
      )}
    </Separator>
  );
}

function MobileTabBtn({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] transition-colors",
        active ? "text-violet-400" : "text-zinc-500",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center w-10 h-7 rounded-xl transition-colors",
          active && "bg-violet-500/15",
        )}
      >
        {icon}
      </span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function DesktopTabBtn({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition border-b-2",
        active
          ? "border-violet-500 text-violet-400"
          : "border-transparent text-zinc-500 hover:text-zinc-300",
      )}
    >
      {icon}{label}
    </button>
  );
}
