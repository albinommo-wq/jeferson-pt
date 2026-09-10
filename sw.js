/* Guarda o app no aparelho para abrir offline.
   Entrega o que está guardado (rápido, funciona sem internet) e busca a
   versão nova em paralelo, sempre direto do servidor — sem passar pelo
   cache do navegador, que na hospedagem segura o arquivo por minutos.
   Trocar o número da versão abaixo apaga a cópia antiga do aparelho. */
const CACHE = 'jeferson-pt-v3';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icone-192.png', './icone-512.png'];

const semCache = url => new Request(url, {cache: 'reload'});

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ARQUIVOS.map(u => fetch(semCache(u)).then(r => c.put(u, r)))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(guardado => {
      const daRede = fetch(semCache(req.url)).then(resp => {
        if(resp && resp.status === 200){
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return resp;
      }).catch(() => guardado);
      return guardado || daRede;
    })
  );
});
