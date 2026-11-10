"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '../lib/authFetch';

type Preferences = {
  birthdays_enabled: boolean;
  anniversaries_enabled: boolean;
  reminder_days: number;
};

const defaults: Preferences = {
  birthdays_enabled: true,
  anniversaries_enabled: true,
  reminder_days: 1,
};

function decodeKey(value: string) {
  const pad = '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

// Register the worker from the action itself instead of relying on the
// background layout component to have finished registering it already.
async function getActiveServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('This browser does not support service workers.');
  }

  const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none',
  });

  if (registration.active) return registration;

  const worker = registration.installing || registration.waiting;
  if (!worker) {
    throw new Error('The notification service could not start. Please close and reopen the app.');
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error('Notification setup is taking too long. Close and reopen the app, then try again.')),
      15000,
    );

    const checkState = () => {
      if (worker.state === 'activated' || registration.active) {
        window.clearTimeout(timeout);
        resolve();
      } else if (worker.state === 'redundant') {
        window.clearTimeout(timeout);
        reject(new Error('The notification service worker failed to install. Please refresh and try again.'));
      }
    };

    worker.addEventListener('statechange', checkState);
    checkState();
  });

  return registration;
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState(defaults);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('user_email')) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        const res = await authFetch('/api/notifications/preferences');
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setPrefs({
            birthdays_enabled: data.birthdays_enabled,
            anniversaries_enabled: data.anniversaries_enabled,
            reminder_days: Number(data.reminder_days),
          });
        }

        const canPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setSupported(canPush);
        if (canPush) {
          // Do not wait indefinitely for `serviceWorker.ready`: on devices where
          // registration failed or has not completed, that promise can remain pending.
          const registration = await navigator.serviceWorker.getRegistration('/');
          if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            setEnabled(!!subscription);
          } else {
            setEnabled(false);
          }
        }
      } catch {
        setMessage('Could not load settings. Please try again.');
        setMessageIsError(true);
      } finally {
        setBusy(false);
      }
    })();
  }, [router]);

  const save = async (next: Preferences) => {
    setSaving(true);
    setMessage('');
    setMessageIsError(false);
    try {
      const response = await authFetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error();
      setPrefs(next);
      setMessage('Your preferences have been saved.');
    } catch {
      setMessage('Could not save preferences. Please try again.');
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const enable = async () => {
    if (enabling) return;
    setEnabling(true);
    try {
      setMessage('');
      setMessageIsError(false);
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error('Push notification key is not configured.');
      // Do not request permission again if the user has already granted it.
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notifications were not allowed. Check your browser settings.');
      }

      // Ensure registration is complete even if the page loads before the
      // layout-level ServiceWorker component finishes its background work.
      const registration = await getActiveServiceWorker();
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeKey(key) as BufferSource,
        });
      }
      const response = await authFetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      if (!response.ok) throw new Error('Could not register this device.');
      setEnabled(true);
      setMessage('Notifications enabled on this device! You can send a test notification below.');
    } catch (error: any) {
      setMessage(error?.message || 'Could not enable notifications.');
      setMessageIsError(true);
    } finally {
      setEnabling(false);
    }
  };

  const disable = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) throw new Error('No notification service is registered on this device. Refresh the page and try again.');
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await authFetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setEnabled(false);
      setMessage('Notifications disabled on this device.');
      setMessageIsError(false);
    } catch {
      setMessage('Could not disable notifications.');
      setMessageIsError(true);
    }
  };

  const sendTestNotification = async () => {
    setTesting(true);
    setMessage('');
    setMessageIsError(false);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) throw new Error('No notification service is registered on this device. Refresh the page and enable notifications again.');
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        throw new Error('Enable phone notifications on this device first.');
      }
      const response = await authFetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not send the test notification.');
      setMessage('Test notification sent! Check your phone or browser notifications.');
    } catch (error: any) {
      setMessage(error?.message || 'Could not send the test notification.');
      setMessageIsError(true);
    } finally {
      setTesting(false);
    }
  };

  if (busy) {
    return <main className="min-h-screen bg-slate-50 p-6 text-center text-slate-500">Loading notification settings…</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <button onClick={() => router.push('/profile')} className="mb-5 text-sm font-semibold text-indigo-600">← Back to family</button>
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">🔔</div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Notification preferences</h1>
              <p className="text-sm text-slate-500">Choose the family reminders you receive.</p>
            </div>
          </div>

          {!supported ? (
            <p className="mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Push notifications aren't supported here. Try installing the website on your phone and opening it from its home-screen icon.</p>
          ) : (
            <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">Phone notifications</p>
                  <p className="text-xs text-slate-600">Allow this device to receive family reminders.</p>
                </div>
                <button onClick={enabled ? disable : enable} disabled={enabling} className={`rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-60 ${enabled ? 'bg-slate-600' : 'bg-indigo-600'}`}>{enabled ? 'Turn off' : enabling ? 'Setting up…' : 'Enable'}</button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Enable separately on each phone or computer.</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-100 p-4">
              <span><b className="block text-slate-800">🎂 Birthdays</b><small className="text-slate-500">Reminders for family birthdays</small></span>
              <input type="checkbox" className="h-5 w-5 accent-indigo-600" checked={prefs.birthdays_enabled} onChange={(event) => save({ ...prefs, birthdays_enabled: event.target.checked })} />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-100 p-4">
              <span><b className="block text-slate-800">💍 Anniversaries</b><small className="text-slate-500">Reminders for couple anniversaries</small></span>
              <input type="checkbox" className="h-5 w-5 accent-indigo-600" checked={prefs.anniversaries_enabled} onChange={(event) => save({ ...prefs, anniversaries_enabled: event.target.checked })} />
            </label>
            <div className="rounded-xl border border-slate-100 p-4">
              <label htmlFor="reminder-days" className="block font-semibold text-slate-800">When should we remind you?</label>
              <p className="mb-3 text-xs text-slate-500">How early should we remind you?</p>
              <select id="reminder-days" value={prefs.reminder_days} onChange={(event) => save({ ...prefs, reminder_days: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <option value={0}>On the day only</option>
                <option value={1}>1 day before and on the day</option>
                <option value={3}>3 days before and on the day</option>
                <option value={7}>7 days before and on the day</option>
              </select>
            </div>
          </div>

          {supported && (
            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Test your notifications</h2>
                  <p className="text-xs leading-relaxed text-slate-500">Send a sample push notification to this device only. It won't affect birthday or anniversary reminders.</p>
                </div>
                <button type="button" onClick={sendTestNotification} disabled={!enabled || testing} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                  {testing ? 'Sending…' : '🔔 Send test'}
                </button>
              </div>
              {!enabled && <p className="mt-2 text-xs text-amber-700">Enable phone notifications on this device before sending a test.</p>}
            </div>
          )}

          {message && <p role="status" aria-live="polite" className={`mt-4 rounded-xl p-3 text-sm ${messageIsError ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}`}>{message}</p>}
          {saving && <p className="mt-2 text-xs text-slate-400">Saving…</p>}
          <p className="mt-5 text-xs leading-relaxed text-slate-400">Your choices apply across your devices. Phone permission is managed separately on each device.</p>
        </section>
      </div>
    </main>
  );
}
