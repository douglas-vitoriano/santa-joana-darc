import "$styles/index.css"
import "$styles/syntax-highlighting.css"

// =====================================================
// Santa d'Arc — JS principal + PWA
// =====================================================

// ── Service Worker ───────────────────────────────────
let swRegistration = null

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      console.log('[PWA] SW registrado:', swRegistration.scope)

      // Checar updates a cada 60 min
      setInterval(() => swRegistration.update(), 60 * 60 * 1000)

      // Nova versão disponível
      swRegistration.addEventListener('updatefound', () => {
        const newWorker = swRegistration.installing
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            const banner = document.getElementById('pwa-update-banner')
            if (banner) banner.style.display = 'block'
          }
        })
      })

      // Reload automático quando SW novo assume controle
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

// ── Install prompt ────────────────────────────────────
let deferredInstallPrompt = null

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredInstallPrompt = e

  if (!localStorage.getItem('pwa-dismissed')) {
    const banner = document.getElementById('pwa-install-banner')
    if (banner) banner.style.display = 'flex'
  }
})

window.addEventListener('appinstalled', () => {
  console.log('[PWA] Instalada!')
  const banner = document.getElementById('pwa-install-banner')
  if (banner) banner.style.display = 'none'
  deferredInstallPrompt = null
})

// ── DOM pronto ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Botão instalar
  const installBtn = document.getElementById('pwa-install-btn')
  const dismissBtn = document.getElementById('pwa-dismiss-btn')
  const installBanner = document.getElementById('pwa-install-banner')

  installBtn?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return
    installBanner.style.display = 'none'
    deferredInstallPrompt.prompt()
    const { outcome } = await deferredInstallPrompt.userChoice
    console.log('[PWA] Escolha:', outcome)
    deferredInstallPrompt = null
  })

  dismissBtn?.addEventListener('click', () => {
    if (installBanner) installBanner.style.display = 'none'
    localStorage.setItem('pwa-dismissed', '1')
  })

  // Hint iOS
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = window.navigator.standalone === true
  if (isIOS && !isStandalone && !localStorage.getItem('ios-hint-dismissed')) {
    const hint = document.getElementById('ios-install-hint')
    if (hint) hint.style.display = 'block'
  }

  // ── Navbar burger ──────────────────────────────────
  document.querySelectorAll('.navbar-burger').forEach(burger => {
    burger.addEventListener('click', () => {
      const target = document.querySelector(`#${burger.dataset.target}`)
      burger.classList.toggle('is-active')
      target?.classList.toggle('is-active')
    })
  })

  // ── Navbar: link ativo ─────────────────────────────
  const currentPath = window.location.pathname
  document.querySelectorAll('.navbar-item[href]').forEach(link => {
    const href = link.getAttribute('href')
    const active = href === '/'
      ? currentPath === '/'
      : currentPath.startsWith(href)
    if (active) link.classList.add('is-active')
  })

  // ── Tabs (Joana d'Arc) ─────────────────────────────
  const tabLinks = document.querySelectorAll('[data-tab]')
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

  // ── Filtro Estante ─────────────────────────────────
  const filterBtns = document.querySelectorAll('[data-filter]')
  const bookItems = document.querySelectorAll('[data-categoria]')

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

  // ── Status online/offline ──────────────────────────
  function updateOnlineStatus () {
    const existing = document.getElementById('offline-status-bar')
    if (!navigator.onLine) {
      if (!existing) {
        const bar = document.createElement('div')
        bar.id = 'offline-status-bar'
        bar.style.cssText = [
          'position:fixed', 'top:0', 'left:0', 'right:0',
          'background:#5C4A3A', 'color:#F0D98C',
          'text-align:center', 'padding:0.4rem',
          'font-size:0.80rem', 'z-index:9997',
          "font-family:'Cinzel',serif", 'letter-spacing:0.05em',
          'border-bottom:1px solid rgba(201,168,76,0.4)'
        ].join(';')
        bar.textContent = '📵 Modo offline — conteúdo cacheado'
        document.body.prepend(bar)
      }
    } else {
      existing?.remove()
    }
  }

  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  updateOnlineStatus()
})

document.addEventListener('DOMContentLoaded', () => {

  // ── Contador regressivo (apenas 500) ──────────────
  // Recarrega automaticamente após N segundos se o
  // elemento #error-countdown estiver presente na página.
  const countdown = document.getElementById('error-countdown')
  if (countdown) {
    let seconds = parseInt(countdown.dataset.seconds ?? '30', 10)

    const tick = setInterval(() => {
      seconds -= 1
      countdown.textContent = seconds

      if (seconds <= 0) {
        clearInterval(tick)
        window.location.reload()
      }
    }, 1000)

    // Cancela o reload se o usuário interagir com a página
    const cancel = () => {
      clearInterval(tick)
      const wrap = document.getElementById('error-countdown-wrap')
      if (wrap) wrap.style.display = 'none'
    }

    document.querySelectorAll('.btn-error-primary, .btn-error-outline')
      .forEach(btn => btn.addEventListener('click', cancel))
  }

  // ── Botão "Tentar novamente" (500) ────────────────
  document.getElementById('btn-reload')
    ?.addEventListener('click', (e) => {
      e.preventDefault()
      window.location.reload()
    })

  // ── Voltar (history.back com fallback para /) ─────
  document.getElementById('btn-back')
    ?.addEventListener('click', (e) => {
      e.preventDefault()
      if (history.length > 1) {
        history.back()
      } else {
        window.location.href = '/'
      }
    })

})