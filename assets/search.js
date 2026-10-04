(() => {
  const params = new URLSearchParams(location.search);
  const normalize = value => value.normalize('NFKC').toLowerCase().replace(/\s+/g, '');
  const modeParameters = { welfare: 'welfare_q', benefit: 'benefit_q', license: 'license_q' };
  const sources = {
    welfare: ['복지로', 'https://www.bokjiro.go.kr/'],
    benefit: ['정부24 보조금24', 'https://www.gov.kr/portal/rcvfvrSvc/main'],
    license: ['Q-Net', 'https://www.q-net.or.kr/'],
  };
  let indexPromise;
  const loadIndex = () => indexPromise ||= fetch('/assets/search-index.json').then(response => {
    if (!response.ok) throw new Error('Search index unavailable');
    return response.json();
  });
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function matching(entries, query) {
    const terms = query.trim().split(/\s+/).map(normalize).filter(Boolean);
    return entries.filter(entry => terms.every(term => normalize(`${entry.title} ${entry.description} ${entry.text || ''}`).includes(term)))
      .sort((a, b) => Number(normalize(b.title).includes(normalize(query))) - Number(normalize(a.title).includes(normalize(query))));
  }
  function appendCards(parent, entries, external = false) {
    for (const entry of entries) {
      const card = element('article', '', 'guide-search-result');
      const heading = element('h3');
      if (entry.url) {
        const link = element('a', entry.title);
        link.href = entry.url;
        if (external) { link.target = '_blank'; link.rel = 'noopener'; }
        heading.append(link);
      } else heading.textContent = entry.title;
      card.append(heading, element('p', entry.description));
      parent.append(card);
    }
  }
  function officialLink(mode) {
    const [label, url] = sources[mode];
    const link = element('a', `${label}에서 최신 정보 확인`, 'guide-api-link');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    return link;
  }
  async function render(container, query, mode) {
    container.replaceChildren(element('p', '검색 중입니다.'));
    container.setAttribute('aria-busy', 'true');
    try {
      const index = await loadIndex();
      container.replaceChildren();
      if (!query.trim()) {
        container.append(element('p', '검색어를 입력해 주세요.'));
        return;
      }
      const posts = matching(index.posts, query);
      container.append(element('h2', `“${query}” 안내글 ${posts.length}건`));
      if (posts.length) appendCards(container, posts);
      else container.append(element('p', '일치하는 안내글이 없습니다. 다른 검색어로 다시 검색해 주세요.'));
      if (mode) {
        const saved = matching(index.official[mode], query);
        container.append(element('h2', `저장된 공식 자료 ${saved.length}건`));
        if (saved.length) appendCards(container, saved, true);
        else container.append(element('p', '저장된 자료에는 일치하는 항목이 없습니다. 공식 기관에서 확인해 주세요.'));
        container.append(officialLink(mode));
      }
    } catch {
      container.replaceChildren(element('p', '검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', 'guide-api-error'));
      const retry = element('button', '다시 시도', 'guide-search-retry');
      retry.type = 'button';
      retry.addEventListener('click', () => { indexPromise = null; render(container, query, mode); });
      container.append(retry);
      if (mode) container.append(officialLink(mode));
    } finally {
      container.setAttribute('aria-busy', 'false');
    }
  }
  const tool = document.querySelector('[data-search-mode]');
  if (tool) {
    const mode = tool.dataset.searchMode;
    const parameter = modeParameters[mode];
    const form = tool.querySelector('form');
    const input = form.querySelector('input[type="search"]');
    input.setAttribute('aria-label', '검색어');
    const query = params.get(parameter) ?? input.value;
    input.value = query;
    tool.querySelectorAll('.guide-api-chip').forEach(chip => {
      const value = new URL(chip.href).searchParams.get(parameter);
      chip.classList.toggle('is-active', value === query);
      if (value === query) chip.setAttribute('aria-current', 'true');
      else chip.removeAttribute('aria-current');
    });
    const results = tool.querySelector('.guide-api-list');
    results.setAttribute('aria-live', 'polite');
    render(results, query, mode);
  } else if (params.has('s') && (location.pathname === '/' || location.pathname === '/index.html')) {
    const main = document.querySelector('main');
    const section = element('section', '', 'guide-search-page');
    const form = document.querySelector('.hero-search').cloneNode(true);
    form.action = '/';
    form.querySelector('input').value = params.get('s');
    form.querySelector('input').setAttribute('aria-label', '게시글 검색어');
    const results = element('div', '', 'guide-search-results');
    results.setAttribute('aria-live', 'polite');
    section.append(element('h1', '검색 결과'), form, results);
    main.replaceChildren(section);
    document.title = `${params.get('s')} 검색 결과 - 4050가이드`;
    const robots = document.createElement('meta');
    robots.name = 'robots'; robots.content = 'noindex, follow'; document.head.append(robots);
    render(results, params.get('s'));
  }
})();
