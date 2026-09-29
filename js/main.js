/* Shared helpers + site header/footer. Edit SITE below to change your links. */
(function () {
  const SITE = {
    name: 'S-Mat',
    author: 'Spinzi',
    github: 'https://github.com/YOUR-USERNAME', // <- replace
    email: 'hello@example.com'                  // <- replace
  };
  const NAV = [
    { href: 'projects.html', label: 'Projects', also: ['project.html'] },
    { href: 'about.html', label: 'About' },
    { href: 'contact.html', label: 'Contact' }
  ];
  const SMat = (window.SMat = window.SMat || {});

  /* Tiny DOM builder: el('a', {href: '#'}, 'text', childNode). Text is never parsed as HTML. */
  function el(tag, attrs, ...children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat(Infinity)) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c));
    return n;
  }

  function titlebar(text, opts = {}) {
    return el('div', { class: 'titlebar', style: opts.style },
      el('span', { class: 'app-icon', 'aria-hidden': 'true' }),
      el(opts.heading || 'span', { class: 'title', id: opts.id }, text),
      el('span', { class: 'wm', 'aria-hidden': 'true' }, el('i', null, '_'), el('i', null, '▢'), el('i', { class: 'x' }, '×')));
  }

  /* Only http(s) and mailto links are allowed, so JSON can't inject javascript: URLs. */
  function safeUrl(url) {
    try {
      const u = new URL(url, location.href);
      return ['http:', 'https:', 'mailto:'].includes(u.protocol) ? u.href : null;
    } catch (e) { return null; }
  }
  /* Turn "images/01.webp" into "projects/<id>/images/01.webp". Rejects paths that climb out of the project. */
  function assetUrl(id, path) {
    if (typeof path !== 'string' || !path) return null;
    if (/^https:\/\//i.test(path)) return path;
    if (path.includes('..') || path.startsWith('/') || path.includes(':')) return null;
    return `projects/${id}/${path}`;
  }
  function formatDate(s) {
    const d = new Date(s + 'T00:00:00');
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  async function loadJSON(url) {
    let res;
    try { res = await fetch(url, { cache: 'no-cache' }); }
    catch (e) { throw Object.assign(new Error('network'), { kind: 'network' }); }
    if (!res.ok) throw Object.assign(new Error('http'), { kind: res.status === 404 ? 'missing' : 'http' });
    try { return await res.json(); }
    catch (e) { throw Object.assign(new Error('json'), { kind: 'malformed' }); }
  }
  let indexPromise;
  function loadIndex() { // fetched once, shared by the grid and the search box
    indexPromise = indexPromise || loadJSON('projects/index.json').then(list => {
      if (!Array.isArray(list)) throw Object.assign(new Error('json'), { kind: 'malformed' });
      return list.filter(p => p && typeof p.id === 'string' && typeof p.title === 'string')
                 .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    });
    indexPromise.catch(() => { indexPromise = null; }); // allow retry
    return indexPromise;
  }

  function withImageFallback(img, text = 'Image unavailable') {
    img.addEventListener('error', () => img.replaceWith(el('div', { class: 'img-fallback', role: 'img', 'aria-label': img.alt || text }, text)), { once: true });
    return img;
  }

  function messageBox({ title, text, actions = [] }) {
    return el('article', { class: 'window', role: 'alert' }, titlebar(title, { heading: 'h1' }),
      el('div', { class: 'window-body' }, el('p', null, text),
        el('p', { class: 'actions' }, actions.map((a, i) => el('a', { class: 'btn' + (i ? '' : ' primary'), href: a.href }, a.label)))));
  }

  Object.assign(SMat, { SITE, el, titlebar, safeUrl, assetUrl, formatDate, loadJSON, loadIndex, withImageFallback, messageBox });

  /* ---- Header & footer ---- */
  const page = location.pathname.split('/').pop() || 'index.html';
  const header = document.getElementById('site-header');
  if (header) {
    const current = n => (n.href === page || (n.also || []).includes(page)) ? 'page' : null;
    header.append(
      titlebar(`${SITE.name} by ${SITE.author}`),
      el('div', { class: 'toolbar' },
        el('a', { class: 'brand', href: 'index.html' }, SITE.name),
        el('div', { class: 'search', role: 'search' }),
        el('nav', { 'aria-label': 'Main' }, el('ul', { class: 'nav' },
          NAV.map(n => el('li', null, el('a', { href: n.href, 'aria-current': current(n) }, n.label))),
          el('li', null, el('a', { href: SITE.github, target: '_blank', rel: 'noopener noreferrer' }, 'GitHub', el('span', { class: 'sr-only' }, ' (opens in a new tab)'))),
          el('li', null, el('button', { type: 'button', onclick: () => SMat.theme.openSettings() }, 'Appearance')))))
    );
    if (SMat.initSearch) SMat.initSearch(header.querySelector('.search'));
  }
  const footer = document.getElementById('site-footer');
  if (footer) footer.textContent = `© ${new Date().getFullYear()} ${SITE.name} by ${SITE.author}. Made with plain HTML, CSS and JavaScript.`;

  document.querySelectorAll('[data-email]').forEach(a => { a.href = 'mailto:' + SITE.email; a.textContent = SITE.email; });
  document.querySelectorAll('[data-github]').forEach(a => { a.href = SITE.github; });

  // Skip link: handled in JS because <base href="/"> on the 404 page would break "#main".
  const skip = document.querySelector('.skip-link');
  if (skip) skip.addEventListener('click', e => { e.preventDefault(); document.getElementById('main').focus(); });
})();
