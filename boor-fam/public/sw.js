const CACHE = "boorfam-v5";

const FILES = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install",(event)=>{

self.skipWaiting();

event.waitUntil(
  caches.open(CACHE).then(async (cache) => {
    // A missing optional/offline route must never prevent the push worker
    // from installing. Cache each asset independently.
    await Promise.allSettled(FILES.map((file) => cache.add(file)));
  })
);

});

self.addEventListener("activate",(event)=>{

event.waitUntil(

caches.keys()

.then(keys=>

Promise.all(

keys

.filter(key=>key!==CACHE)

.map(key=>caches.delete(key))

)

)

);

self.clients.claim();

});

self.addEventListener("fetch",(event)=>{

if(event.request.method!=="GET") return;

event.respondWith(

fetch(event.request)

.then(response=>{

const clone=response.clone();

caches.open(CACHE)

.then(cache=>cache.put(event.request,clone));

return response;

})

.catch(async()=>{

const cached=await caches.match(event.request);

if(cached) return cached;

if(event.request.mode==="navigate"){

return caches.match("/offline");

}

})

);

});

self.addEventListener("message",(event)=>{

if(event.data?.type==="SKIP_WAITING"){

self.skipWaiting();

}

});
// Web Push: notifications are displayed by the service worker even when the PWA is closed.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || 'Family reminder';
  const options = {
    body: data.body || 'You have a family reminder.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'family-reminder',
    renotify: false,
    data: { url: data.url || '/profile' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/profile', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
