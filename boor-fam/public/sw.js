const CACHE = "boorfam-v3";

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

caches.open(CACHE)

.then(cache=>cache.addAll(FILES))

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