(() => {
  const links = document.querySelectorAll('[data-privacy-settings]');
  if (!links.length) return;
  const fc = window.googlefc = window.googlefc || {};
  fc.callbackQueue = fc.callbackQueue || [];
  fc.callbackQueue.push({
    CONSENT_API_READY: () => {
      if (typeof window.__tcfapi !== 'function') return;
      window.__tcfapi('addEventListener', 0, (data, success) => {
        for (const link of links) link.hidden = !(success && data?.gdprApplies);
      });
    },
  });
  for (const link of links) link.addEventListener('click', event => {
    if (typeof window.googlefc?.showRevocationMessage !== 'function') return;
    event.preventDefault();
    window.googlefc.showRevocationMessage();
  });
})();
