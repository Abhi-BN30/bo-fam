"use client";

import { useEffect } from "react";

export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;

          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              if (confirm("A new version is available. Update now?")) {
                worker.postMessage({
                  type: "SKIP_WAITING",
                });

                window.location.reload();
              }
            }
          });
        });
      } catch (err) {
        console.error(err);
      }
    });
  }, []);

  return null;
}