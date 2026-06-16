"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-colors",
        theme === "dark"
          ? "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          : "border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-800",
      )}
      title={theme === "dark" ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
    >
      {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}
