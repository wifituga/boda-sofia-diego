(() => {
  const guide = document.getElementById('vestimenta');
  const tablist = guide.querySelector('.dress-tabs');
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));

  function selectTab(selected) {
    tabs.forEach((tab, index) => {
      const active = tab === selected;
      tab.tabIndex = active ? 0 : -1;
      tab.setAttribute('aria-selected', String(active));
      panels[index].setAttribute('aria-hidden', String(!active));
      panels[index].inert = !active;
    });
  }

  tabs.forEach((tab, index) => {
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      switch (event.key) {
        case 'ArrowLeft': next = (index + tabs.length - 1) % tabs.length; break;
        case 'ArrowRight': next = (index + 1) % tabs.length; break;
        case 'Home': next = 0; break;
        case 'End': next = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus({ preventScroll: true });
    });
  });

  selectTab(tabs[0]);
  guide.dataset.interactive = '';
  tablist.hidden = false;

  const dialog = document.getElementById('look-ampliado');
  if (typeof dialog.showModal !== 'function') return;

  const enlarged = dialog.querySelector('img');
  const caption = dialog.querySelector('p');
  let opener;
  for (const panel of panels) {
    const link = panel.querySelector('.dress-print');
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;
      event.preventDefault();
      opener = link;
      const preview = link.querySelector('img');
      enlarged.style.backgroundImage = 'url("' + (preview.currentSrc || preview.src) + '")';
      enlarged.alt = preview.alt;
      enlarged.src = link.href;
      caption.textContent = panel.querySelector('h3').textContent;
      dialog.showModal();
    });
  }
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    enlarged.removeAttribute('src');
    enlarged.style.backgroundImage = '';
    opener?.focus({ preventScroll: true });
  });
})();
