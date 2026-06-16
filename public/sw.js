const CACHE = "omnibrain-v3";
const STATIC_ASSETS = ["/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Never intercept: API calls or Next.js JS/CSS chunks.
  // Next.js chunks change hash on every Vercel deploy — cache-first would
  // serve stale files causing "This page couldn't load" after a new deploy.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  // Static icons and manifest: cache-first (these never change between deploys)
  if (STATIC_ASSETS.some((a) => url.pathname.startsWith(a.replace(/[^/]+$/, "")))) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(event.request, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  // Everything else (navigation, page HTML): network-first so deploys are
  // picked up immediately; fall back to cache only when truly offline.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          caches.open(CACHE).then((c) => c.put(event.request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(event.request)),
  );
});

// ── Daily digest notification ──────────────────────────────────
let dailyAlarmInterval = null;

self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_DAILY") {
    const targetHour = event.data.hour ?? 8;
    scheduleDailyNotification(targetHour);
  }
});

function scheduleDailyNotification(targetHour) {
  if (dailyAlarmInterval) clearInterval(dailyAlarmInterval);
  const checkAndNotify = async () => {
    const now = new Date();
    if (now.getHours() === targetHour && now.getMinutes() === 0) {
      try {
        const res = await fetch("/api/tasks/today");
        if (!res.ok) return;
        const data = await res.json();
        const tasks = data.tasks ?? [];
        const critical = tasks.filter((t) => t.urgency === "critical" || t.priority === "urgent").length;
        self.registration.showNotification(`☀️ OmniBrain — ${tasks.length} zadań na dziś`, {
          body: critical > 0
            ? `🔴 ${critical} krytycznych wymaga uwagi!\n${tasks.slice(0, 2).map((t) => `• ${t.title}`).join("\n")}`
            : tasks.length > 0
            ? tasks.slice(0, 3).map((t) => `• ${t.title}`).join("\n")
            : "Dobry dzień! Brak pilnych zadań.",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: "daily-digest",
          renotify: true,
        });
      } catch { /* offline */ }
    }
  };
  dailyAlarmInterval = setInterval(checkAndNotify, 60 * 1000);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      if (list.length > 0) list[0].focus();
      else clients.openWindow("/");
    }),
  );
});
