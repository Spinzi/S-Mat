/* Title-only search using the small projects/index.json file. Pattern: ARIA combobox + listbox. */
(function () {
  window.SMat = window.SMat || {};
  window.SMat.initSearch = function (box) {
    const { el, loadIndex } = window.SMat;
    const input = el('input', { type: 'search', id: 'site-search', placeholder: 'Search projects', autocomplete: 'off', role: 'combobox', 'aria-expanded': 'false', 'aria-controls': 'search-results', 'aria-autocomplete': 'list' });
    const list = el('ul', { id: 'search-results', class: 'search-results', role: 'listbox', 'aria-label': 'Search results', hidden: true });
    box.append(el('label', { class: 'sr-only', for: 'site-search' }, 'Search projects by name'), input, list);

    let matches = [], active = -1;

    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }
    function setActive(i) {
      active = i;
      [...list.children].forEach((li, n) => li.setAttribute('aria-selected', String(n === i)));
      if (i >= 0) { input.setAttribute('aria-activedescendant', 'result-' + i); list.children[i].scrollIntoView({ block: 'nearest' }); }
      else input.removeAttribute('aria-activedescendant');
    }
    function go(p) { location.href = 'project.html?id=' + encodeURIComponent(p.id); }
    function show(items) {
      list.replaceChildren(...items);
      list.hidden = false; input.setAttribute('aria-expanded', 'true');
    }
    async function update() {
      const q = input.value.trim().toLowerCase();
      if (!q) { close(); return; }
      let index;
      try { index = await loadIndex(); }
      catch (e) { matches = []; show([el('li', { class: 'empty', role: 'option', 'aria-disabled': 'true' }, 'Search is unavailable right now.')]); return; }
      if (input.value.trim().toLowerCase() !== q) return; // a newer keystroke won the race
      matches = index.filter(p => p.title.toLowerCase().includes(q));
      active = -1;
      if (!matches.length) { show([el('li', { class: 'empty', role: 'option', 'aria-disabled': 'true' }, `No projects match “${input.value.trim()}”.`)]); return; }
      show(matches.map((p, i) => el('li', { id: 'result-' + i, role: 'option', 'aria-selected': 'false', onmousedown: e => { e.preventDefault(); go(p); } }, p.title, el('small', null, window.SMat.formatDate(p.date || '')))));
    }

    input.addEventListener('input', update);
    input.addEventListener('focus', () => { if (input.value.trim()) update(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' && matches.length) { e.preventDefault(); if (list.hidden) update(); else setActive((active + 1) % matches.length); }
      else if (e.key === 'ArrowUp' && matches.length) { e.preventDefault(); setActive((active - 1 + matches.length) % matches.length); }
      else if (e.key === 'Enter') { const p = matches[active >= 0 ? active : 0]; if (p && !list.hidden) { e.preventDefault(); go(p); } }
      else if (e.key === 'Escape') { if (!list.hidden) close(); else input.value = ''; }
    });
    document.addEventListener('click', e => { if (!box.contains(e.target)) close(); });
    box.addEventListener('focusout', () => setTimeout(() => { if (!box.contains(document.activeElement)) close(); }, 0));
  };
})();
