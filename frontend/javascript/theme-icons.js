(function () {
  'use strict'

  function applyThemeIcons (dark) {
    var favicon = document.querySelector('link[rel="icon"][data-icon-light]')
    if (favicon) {
      favicon.href = dark ? favicon.dataset.iconDark : favicon.dataset.iconLight
    }

    var apple = document.querySelector('link[rel="apple-touch-icon"][data-icon-light]')
    if (apple) {
      apple.href = dark ? apple.dataset.iconDark : apple.dataset.iconLight
    }
  }

  var mq = window.matchMedia('(prefers-color-scheme: dark)')
  applyThemeIcons(mq.matches)
  mq.addEventListener('change', function (e) {
    applyThemeIcons(e.matches)
  })
})()
