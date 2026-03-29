function isStandalone () {
  return window.navigator.standalone === true ||
         window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches
}

async function getSWState () {
  if (!('serviceWorker' in navigator)) return 'unsupported'
  try {
    const reg = await navigator.serviceWorker.getRegistration('/')
    if (!reg)           return 'not_registered'
    if (reg.installing) return 'installing'
    if (reg.waiting)    return 'needs_update'
    if (reg.active)     return 'active'
  } catch {
    return 'error'
  }
  return 'unknown'
}

async function renderOfflineStatus () {
  const icon   = document.getElementById('pwa-status-icon')
  const title  = document.getElementById('pwa-status-title')
  const desc   = document.getElementById('pwa-status-desc')
  const action = document.getElementById('pwa-status-action')
  const guide  = document.getElementById('pwa-install-guide')

  if (!icon) return

  const swState    = await getSWState()
  const standalone = isStandalone()

  const states = {
    unsupported: {
      icon: '⚠️',
      title: 'Navegador sem suporte',
      desc: 'Use o Chrome (Android) ou Safari (iOS) para ter acesso offline.',
      showGuide: true
    },
    not_registered: {
      icon: '⚠️',
      title: 'App não instalado',
      desc: 'Acesse o site online ao menos uma vez para ativar o modo offline.',
      showGuide: true
    },
    installing: {
      icon: '⏳',
      title: 'Preparando cache…',
      desc: 'Primeira instalação em andamento. Aguarde alguns instantes.'
    },
    needs_update: {
      icon: '🔄',
      title: 'Atualização disponível',
      desc: 'Uma nova versão está pronta.',
      actionHtml: '<button onclick="window.updateSW()" class="button is-gold is-small">Atualizar agora</button>'
    },
    active_standalone: {
      icon: '✅',
      title: 'App instalado e ativo',
      desc: 'Acesso offline completo disponível.'
    },
    active_browser: {
      icon: '📲', 
      title: 'Offline disponível — app não instalado',
      desc: 'O cache está ativo. Instale o app para a melhor experiência.',
      showGuide: true,
      actionHtml: '<button onclick="document.getElementById(\'pwa-install-banner\').classList.remove(\'is-hidden\')" class="button is-burgundy is-small">Instalar app</button>'
    },
    unknown: {
      icon: '📱',
      title: 'Status desconhecido',
      desc: 'Não foi possível verificar o estado do app.'
    }
  }

  let key = swState
  if (swState === 'active') key = standalone ? 'active_standalone' : 'active_browser'

  const s = states[key] ?? states.unknown
  icon.textContent  = s.icon
  title.textContent = s.title
  desc.textContent  = s.desc
  if (s.actionHtml && action) action.innerHTML = s.actionHtml
  if (s.showGuide  && guide)  guide.style.display = 'block'
}

document.addEventListener('DOMContentLoaded', renderOfflineStatus)
