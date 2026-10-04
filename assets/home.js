(() => {
  const tabs = [...document.querySelectorAll('.home-tabs a')];
  if (!tabs.length) return;
  const panels = [...document.querySelectorAll('.home-plan')];
  const boxes = [...document.querySelectorAll('.home-plan input[type=checkbox]')];
  const count = document.querySelector('.home-count');
  const reset = document.querySelector('#home-reset');
  const key = '4050-next-steps-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
  boxes.forEach(box => { box.checked = saved[box.id] === true; });
  function update() {
    const panel = panels.find(item => !item.hidden);
    const selected = [...panel.querySelectorAll('input')];
    count.textContent = `${selected.filter(box => box.checked).length} / ${selected.length} 확인`;
  }
  function activate(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
    update();
  }
  document.querySelector('.home-tabs').setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    tab.addEventListener('click', event => { event.preventDefault(); activate(index); });
    tab.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (next !== null) { event.preventDefault(); activate(next, true); }
    });
  });
  boxes.forEach(box => box.addEventListener('change', () => {
    saved = Object.fromEntries(boxes.map(item => [item.id, item.checked]));
    try { localStorage.setItem(key, JSON.stringify(saved)); } catch {}
    update();
  }));
  reset.hidden = false;
  reset.addEventListener('click', () => {
    panels.find(panel => !panel.hidden).querySelectorAll('input').forEach(box => { box.checked = false; delete saved[box.id]; });
    try { localStorage.setItem(key, JSON.stringify(saved)); } catch {}
    update();
  });
  const initial = panels.findIndex(panel => `#${panel.id}` === location.hash);
  activate(initial < 0 ? 0 : initial);
})();
