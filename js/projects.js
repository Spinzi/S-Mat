/* Fills every <div data-project-grid> with cards built from projects/index.json.
   Optional attribute: data-limit="3" shows only the newest 3. */
(function () {
  const { el, titlebar, loadIndex, formatDate, safeUrl, withImageFallback, messageBox, theme } = window.SMat;

  const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

  function card(p) {
    const accent = HEX.test(p.accent || '') ? p.accent : null;
    const thumb = p.thumbnail || `projects/${p.id}/images/hero.webp`;
    const style = accent ? `--card-accent:${accent};--card-on:${theme.onColor(accent)}` : null;
    const img = withImageFallback(el('img', { src: thumb, alt: '', loading: 'lazy' }), 'No preview');
    return el('li', { style },
      el('a', { class: 'card', href: 'project.html?id=' + encodeURIComponent(p.id) },
        el('div', { class: 'titlebar' }, el('span', { class: 'app-icon', 'aria-hidden': 'true' }), el('h3', null, p.title)),
        img,
        el('div', { class: 'card-body' },
          p.description ? el('p', null, p.description) : null,
          p.date ? el('time', { datetime: p.date }, formatDate(p.date)) : null)));
  }

  async function fill(container) {
    const limit = parseInt(container.dataset.limit, 10) || Infinity;
    const counter = document.querySelector('[data-project-count]');
    try {
      const all = await loadIndex();
      if (!all.length) {
        container.replaceChildren(el('p', null, 'No projects yet. Add one to projects/index.json.'));
        if (counter) counter.textContent = '0 projects';
        return;
      }
      container.replaceChildren(el('ul', { class: 'grid' }, all.slice(0, limit).map(card)));
      if (counter) counter.textContent = `${all.length} project${all.length === 1 ? '' : 's'}`;
    } catch (e) {
      container.replaceChildren(messageBox({
        title: 'Projects couldn’t be loaded',
        text: 'The project list is missing or unreadable. Check your connection and try again.',
        actions: [{ href: location.pathname, label: 'Reload' }]
      }));
      if (counter) counter.textContent = 'Error';
    }
  }
  document.querySelectorAll('[data-project-grid]').forEach(fill);
})();
