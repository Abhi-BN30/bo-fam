"use client";

import { useEffect } from "react";

export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Register immediately. Waiting for window.load can miss the event when
    // this component mounts after client-side navigation, leaving
    // navigator.serviceWorker.ready pending forever on some devices.
    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;

        await registration.update().catch(() => undefined);

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              // The worker calls skipWaiting during install; reload once it controls the page.
              worker.addEventListener("statechange", () => {
                if (worker.state === "activated" && !cancelled) window.location.reload();
              }, { once: true });
            }
          });
        });
      } catch (error) {
        console.error("BoorFam service worker registration failed:", error);
      }
    };

    void register();
    return () => { cancelled = true; };
  }, []);

  return null;
}
