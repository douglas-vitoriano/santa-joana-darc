// =====================================================
// Santa d'Arc — Service Worker v2
// Cache First para assets · Network First para páginas
// =====================================================

const CACHE_NAME = 'santa-darc-v2'
const OFFLINE_URL = '/offline/'

// __CSS_FILE__ e __JS_FILE__ são substituídos pelo plugins/builders/sw_builder.rb
const PRECACHE_ASSETS = [
  '/',
  '/joana-darc/',
  '/estante/',
  '/offline/',
  '/manifest.json',
  '/images/santajoanadarc.png',
  '/images/santajoanadarc_white.png',
  '/images/santa_joana_darc_black.png',
  '/images/santa_joana_darc_white.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png',
  '__CSS_FILE__',
  '__JS_FILE__',
  'https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css',
]

// ── INSTALL ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Pré-cacheando assets...')
      // allSettled: não falha se uma URL der erro
      await Promise.allSettled(
        PRECACHE_ASSETS
          .filter(url => url && url !== '' && !url.startsWith('__'))
          .map(url =>
            cache.add(url).catch(err =>
              console.warn('[SW] Não cacheado:', url, err.message)
            )
          )
      )
      console.log('[SW] Instalado!')
      return self.skipWaiting()
    })
  )
})

// ── ACTIVATE ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(n => n !== CACHE_NAME)
          .map(n => { console.log('[SW] Removendo cache:', n); return caches.delete(n) })
      )
    ).then(() => {
      console.log('[SW] Ativado!')
      return self.clients.claim()
    })
  )
})

// ── FETCH ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.protocol === 'chrome-extension:') return
  if (url.pathname.startsWith('/_bridgetown/live_reload')) return
  if (url.pathname.includes('__')) return

  // PDFs: sempre buscar da rede
  if (url.pathname.startsWith('/downloads/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response('Arquivo indisponível offline.', { status: 503 })
      )
    )
    return
  }

  // Google Fonts e CDNs: Cache First
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdn.jsdelivr.net' ||
    url.hostname === 'cdnjs.cloudflare.com'
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // HTML: Network First com fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Assets estáticos: Cache First
  event.respondWith(cacheFirst(request))
})

// ── Cache First ───────────────────────────────────────
async function cacheFirst (request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Recurso indisponível offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }
}

// ── Network First ─────────────────────────────────────
async function networkFirst (request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    const offline = await caches.match(OFFLINE_URL)
    return offline || new Response(
      '<!DOCTYPE html><html lang="pt-BR"><body style="font-family:serif;text-align:center;padding:3rem;background:#1A1208;color:#C9A84C"><h1>Sem conexão</h1><p>Volte quando tiver internet.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

// ── Mensagem (forçar update) ──────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
