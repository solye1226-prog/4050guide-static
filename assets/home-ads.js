(() => {
  // Search results share the homepage HTML, so decide before contacting Google.
  const params = new URLSearchParams(location.search);
  if (params.has('s') || !['/', '/index.html'].includes(location.pathname)) return;
  if (document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2258793659580551';
  script.crossOrigin = 'anonymous';
  document.head.append(script);
})();
