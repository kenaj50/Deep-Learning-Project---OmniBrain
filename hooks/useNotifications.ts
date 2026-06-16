"use client";

import { useEffect, useState } from "react";

export type NotifPermission = "default" | "granted" | "denied";

export function useNotifications() {
  const [permission, setPermission] = useState<NotifPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission as NotifPermission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result as NotifPermission);

    if (result === "granted") {
      // Schedule daily digest via Service Worker
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        // Send message to SW to schedule daily notification
        reg.active?.postMessage({ type: "SCHEDULE_DAILY", hour: 8 });
      }

      // Show welcome notification immediately
      new Notification("OmniBrain 🧠", {
        body: "Powiadomienia włączone. Codziennie o 8:00 dostaniesz briefing zadań na dziś.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      });
    }
  };

  // Show today's tasks notification (call this at app startup if granted)
  const showTodayDigest = async (taskCount: number, criticalCount: number) => {
    if (permission !== "granted") return;
    const hour = new Date().getHours();
    // Only show morning digest (6-10am) or if explicitly called
    if (hour < 6 || hour > 10) return;

    new Notification(`☀️ OmniBrain — Dziś masz ${taskCount} zadań`, {
      body:
        criticalCount > 0
          ? `🔴 ${criticalCount} krytycznych do zrobienia teraz!`
          : "Sprawdź panel Dziś po szczegóły.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "daily-digest", // replace previous digest notification
    });
  };

  return { permission, requestPermission, showTodayDigest };
}
