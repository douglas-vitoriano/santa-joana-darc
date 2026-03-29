import "$styles/index.css"
import "$styles/syntax-highlighting.css"
import "./pdf-reader"
import "./offline-status"
import "./theme-icons"

// ── Service Worker ────────────────────────────────────
let swRegistration = null

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

      setInterval(() => swRegistration.update(), 60 * 60 * 1000)

      swRegistration.addEventListener('updatefound', () => {
        const newWorker = swRegistration.installing
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller &&
            !sessionStorage.getItem('pwa-update-dismissed')
          ) {
            showBanner('pwa-update-banner')
          }
        })
      })

      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) { refreshing = true; window.location.reload() }
      })

    } catch (err) {
      console.warn('[PWA] Falha ao registrar SW:', err)
    }
  })
}

window.updateSW = () => {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
  } else {
    window.location.reload()
  }
}

// ── Helpers de visibilidade ───────────────────────────
function showBanner (id) {
  document.getElementById(id)?.classList.remove('is-hidden')
}
function hideBanner (id) {
  document.getElementById(id)?.classList.add('is-hidden')
}

// ── Install prompt (Android/Chrome) ──────────────────
let deferredInstallPrompt = null

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredInstallPrompt = e
  if (!localStorage.getItem('pwa-install-banner-dismissed')) {
    showBanner('pwa-install-banner')
  }
})

window.addEventListener('appinstalled', () => {
  hideBanner('pwa-install-banner')
  deferredInstallPrompt = null
  const badge = document.getElementById('pwa-installed-badge')
  if (badge) {
    badge.classList.remove('is-hidden')
    setTimeout(() => badge.classList.add('is-hidden'), 5000)
  }
})

// ── DOM pronto ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Bulma: .delete dentro de .notification fecha o pai
  document.querySelectorAll('.notification .delete').forEach(btn => {
    const banner = btn.closest('.notification')
    btn.addEventListener('click', () => {
      banner.classList.add('is-hidden')
      if (banner.id) localStorage.setItem(`${banner.id}-dismissed`, '1')
    })
  })

  // Instalar PWA
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return
    hideBanner('pwa-install-banner')
    deferredInstallPrompt.prompt()
    await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
  })

  // iOS hint
  const isIOS        = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = window.navigator.standalone === true

  if (isIOS && !isStandalone && !localStorage.getItem('ios-install-hint-dismissed')) {
    showBanner('ios-install-hint')
  }

  // Badge se já está instalado
  const inStandalone = isStandalone || window.matchMedia('(display-mode: standalone)').matches
  if (inStandalone) {
    const badge = document.getElementById('pwa-installed-badge')
    if (badge) {
      badge.classList.remove('is-hidden')
      setTimeout(() => badge.classList.add('is-hidden'), 5000)
    }
  }

  // Navbar burger (mobile)
  document.querySelectorAll('.navbar-burger').forEach(burger => {
    burger.addEventListener('click', () => {
      const target = document.querySelector(`#${burger.dataset.target}`)
      burger.classList.toggle('is-active')
      target?.classList.toggle('is-active')
    })
  })

  // Navbar: marcar item ativo
  const currentPath = window.location.pathname
  document.querySelectorAll('.navbar-item[href]').forEach(link => {
    const href = link.getAttribute('href')
    const active = href === '/' ? currentPath === '/' : currentPath.startsWith(href)
    if (active) link.classList.add('is-active')
  })

  // Tabs
  const tabLinks    = document.querySelectorAll('[data-tab]')
  const tabContents = document.querySelectorAll('[data-tab-content]')

  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const target = link.dataset.tab
      tabLinks.forEach(l => l.parentElement.classList.remove('is-active'))
      link.parentElement.classList.add('is-active')
      tabContents.forEach(c => {
        c.style.display = c.dataset.tabContent === target ? 'block' : 'none'
      })
    })
  })

  // Filtros da Estante
  const filterBtns = document.querySelectorAll('[data-filter]')
  const bookItems  = document.querySelectorAll('[data-categoria]')

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter
      filterBtns.forEach(b => {
        b.classList.remove('is-burgundy')
        b.classList.add('is-outline-gold')
      })
      btn.classList.remove('is-outline-gold')
      btn.classList.add('is-burgundy')
      bookItems.forEach(item => {
        item.style.display =
          filter === 'Todos' || item.dataset.categoria === filter ? '' : 'none'
      })
    })
  })

  // Barra offline
  function updateOnlineStatus () {
    const existing = document.getElementById('offline-status-bar')
    if (!navigator.onLine) {
      if (!existing) {
        const bar = document.createElement('div')
        bar.id = 'offline-status-bar'
        bar.className = 'offline-status-bar'
        bar.textContent = '📵 Modo offline — conteúdo cacheado'
        document.body.prepend(bar)
      }
    } else {
      existing?.remove()
    }
  }

  window.addEventListener('online',  updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  updateOnlineStatus()

  // Countdown página 500
  const countdown = document.getElementById('error-countdown')
  if (countdown) {
    let seconds = parseInt(countdown.dataset.seconds ?? '30', 10)
    const tick = setInterval(() => {
      seconds -= 1
      countdown.textContent = seconds
      if (seconds <= 0) { clearInterval(tick); window.location.reload() }
    }, 1000)
    const cancel = () => {
      clearInterval(tick)
      const wrap = document.getElementById('error-countdown-wrap')
      if (wrap) wrap.style.display = 'none'
    }
    document.querySelectorAll('.btn-error-primary, .btn-error-outline')
      .forEach(btn => btn.addEventListener('click', cancel))
  }

  document.getElementById('btn-reload')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.reload()
  })

  document.getElementById('btn-back')?.addEventListener('click', (e) => {
    e.preventDefault()
    history.length > 1 ? history.back() : (window.location.href = '/')
  })
})
