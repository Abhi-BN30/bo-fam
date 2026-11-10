"use client";

import { useCallback, useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Platform = "ios" | "samsung" | "android" | "other";

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("other");
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const isSamsung = /SamsungBrowser/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    setPlatform(isIOS ? "ios" : isSamsung ? "samsung" : isAndroid ? "android" : "other");

    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (platform === "ios" || platform === "samsung" || !deferredPrompt) {
      setShowHelp(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") setIsInstalled(true);
    } catch {
      setShowHelp(true);
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, platform]);

  const openChrome = () => {
    const currentUrl = `${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.href = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (isInstalled) return null;

  const buttonLabel = platform === "samsung" ? "Install" : "Install";

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="fixed bottom-6 right-5 z-[80] inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-900/20 transition hover:bg-indigo-700 active:scale-95"
        aria-label="Install app"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {buttonLabel}
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="boorfam-install-title">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-white">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">The Family App</p>
                <h2 id="boorfam-install-title" className="mt-1 text-xl font-bold">Add the app to your device</h2>
              </div>
              <button type="button" onClick={() => setShowHelp(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close install instructions">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>

            {platform === "ios" ? (
              <>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">On iPhone or iPad, Safari needs you to add the website from its Share menu. This creates an app your Home Screen.</p>
                <ol className="mt-5 space-y-3 text-sm">
                  <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">1</span><span>Open this page in <strong>Safari</strong>.</span></li>
                  <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">2</span><span>Tap the <strong>Share</strong> icon.</span></li>
                  <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">3</span><span>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</span></li>
                </ol>
              </>
            ) : platform === "samsung" ? (
              <>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">Samsung Internet may generate an Android install package that triggers the Play Protect outdated-Android warning shown on your device. To avoid that browser-specific install route, open the app in Chrome and install it there.</div>
                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Tap the button below. Chrome must be installed on your Android device.</p>
                <button type="button" onClick={openChrome} className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700">Open the app in Chrome</button>
                <button type="button" onClick={copyLink} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold dark:border-slate-700">{copied ? "Link copied" : "Copy link"}</button>
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">In Chrome, tap the browser menu (⋮) and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
              </>
            ) : platform === "android" ? (
              <>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">If the install prompt doesn't appear, use Chrome's browser menu to add the app to your Home Screen.</p>
                <ol className="mt-4 space-y-3 text-sm">
                  <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">1</span><span>Open this page in <strong>Google Chrome</strong>.</span></li>
                  <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">2</span><span>Tap the <strong>⋮</strong> menu.</span></li>
                  <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">3</span><span>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span></li>
                </ol>
              </>
            ) : (
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Use your browser's install icon or menu and choose <strong>Install the app</strong> or <strong>Install app</strong>. On supported browsers, this adds as an app on your device.</p>
            )}
            <button type="button" onClick={() => setShowHelp(false)} className="mt-5 w-full rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
