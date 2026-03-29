// Converte URL de download do Google Drive para URL de preview (iframe)
function toPreviewUrl (url) {
  // https://drive.google.com/uc?export=download&id=ID
  const downloadMatch = url.match(/[?&]id=([^&]+)/)
  if (downloadMatch && url.includes('drive.google.com')) {
    return `https://drive.google.com/file/d/${downloadMatch[1]}/preview`
  }
  // https://drive.google.com/file/d/ID/view  →  /preview
  const fileMatch = url.match(/\/file\/d\/([^/]+)/)
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`
  }
  return url
}

window.openPdfReader = function (url, title) {
  const modal    = document.getElementById('pdf-reader-modal')
  const frame    = document.getElementById('pdf-reader-frame')
  const fallback = document.getElementById('pdf-reader-fallback')
  const dlBtn    = document.getElementById('pdf-reader-download')
  const fbOpen   = document.getElementById('pdf-fallback-open')
  const fbDl     = document.getElementById('pdf-fallback-download')

  document.getElementById('pdf-reader-title').textContent = title

  // Botões de download sempre usam a URL original
  dlBtn.href = url
  fbDl.href  = url
  // Abrir em nova aba usa preview
  fbOpen.href = toPreviewUrl(url)

  const previewUrl = toPreviewUrl(url)

  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    // iOS não suporta iframe de PDF — vai direto para fallback
    frame.style.display    = 'none'
    fallback.style.display = 'flex'
  } else {
    frame.style.display    = 'block'
    fallback.style.display = 'none'
    frame.src = previewUrl

    frame.addEventListener('error', function () {
      frame.style.display    = 'none'
      fallback.style.display = 'flex'
    }, { once: true })
  }

  modal.style.display          = 'flex'
  document.body.style.overflow = 'hidden'
}

window.closePdfReader = function () {
  const modal = document.getElementById('pdf-reader-modal')
  const frame = document.getElementById('pdf-reader-frame')
  if (!modal) return
  modal.style.display          = 'none'
  frame.src                    = ''
  document.body.style.overflow = ''
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.js-pdf-open').forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.openPdfReader(btn.dataset.pdfUrl, btn.dataset.pdfTitle)
    })
  })

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.closePdfReader()
  })

  const modal = document.getElementById('pdf-reader-modal')
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) window.closePdfReader()
    })
  }
})