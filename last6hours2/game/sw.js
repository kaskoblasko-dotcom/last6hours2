/* Network-first: always pulls the latest game when online, falls back to cache offline. */
const CACHE='l6h2-cache';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    try{
      const f=await Promise.race([fetch(r,{cache:'no-store'}),new Promise((_,j)=>setTimeout(j,4000))]);
      if(f&&f.ok&&!/\/(version|app)\.json/.test(u.pathname))c.put(r,f.clone());
      return f;
    }catch(err){
      const m=await c.match(r);
      if(m)return m;
      throw err;
    }
  })());
});
