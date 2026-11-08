// Registrerer service workeren (public/sw.js), så appen kan installeres på Android og åbnes uden
// net. Kun i produktion (ikke under udvikling, hvor Vite serverer filerne), og først efter "load",
// så registreringen ikke forsinker opstarten. Fejler den, kører appen videre uden.

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
