/* Renders project.html?id=... from projects/<id>/project.json.
   To add a section type: write a function below and register it in `renderers`. */
(function () {
  const { el, titlebar, safeUrl, assetUrl, formatDate, loadJSON, withImageFallback, messageBox, theme } = window.SMat;
  const root = document.getElementById('project-root');
  const main = document.getElementById('main');

  const toArray = v => (Array.isArray(v) ? v : v == null ? [] : [v]).map(String);
  const panel = (title, ...body) => el('section', { class: 'panel' }, title ? el('h2', { class: 'panel-title' }, String(title)) : null, ...body);
  const hostOf = url => { try { return new URL(url).hostname; } catch (e) { return url; } };

  /* ---- Section renderers: (section, {id}) => Node | null ---- */
  function text(s) {
    const paras = Array.isArray(s.content) ? toArray(s.content) : String(s.content || '').split(/\n{2,}/);
    return panel(s.title, ...paras.filter(Boolean).map(t => el('p', null, t)));
  }
  function image(s, ctx) {
    const src = assetUrl(ctx.id, s.src);
    if (!src) return null;
    if (s.alt == null) console.warn('Image section is missing "alt":', s.src);
    return panel(s.title, el('figure', null, withImageFallback(el('img', { src, alt: s.alt || '', loading: 'lazy' })), s.caption ? el('figcaption', null, s.caption) : null));
  }
  function gallery(s, ctx) {
    const imgs = (Array.isArray(s.images) ? s.images : []).map(i => ({ src: assetUrl(ctx.id, i && i.src), alt: (i && i.alt) || '' })).filter(i => i.src);
    if (!imgs.length) return null;
    return panel(s.title, el('ul', { class: 'gallery' }, imgs.map((im, n) =>
      el('li', null, el('button', { class: 'thumb', type: 'button', 'aria-label': `Open image ${n + 1} of ${imgs.length}: ${im.alt}`, onclick: () => openLightbox(imgs, n) },
        withImageFallback(el('img', { src: im.src, alt: '', loading: 'lazy' })))))));
  }
  function code(s) {
    const body = toArray(s.content).join('\n');
    const lang = String(s.language || 'text');
    const btn = el('button', { class: 'btn small', type: 'button', 'aria-live': 'polite', onclick: async () => {
      try { await navigator.clipboard.writeText(body); btn.textContent = 'Copied!'; } catch (e) { btn.textContent = 'Copy failed'; }
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    } }, 'Copy');
    return panel(s.title, el('div', { class: 'code-block' },
      el('div', { class: 'code-head' }, el('span', null, lang), btn),
      el('pre', { tabindex: '0' }, el('code', { class: 'language-' + lang.replace(/[^\w-]/g, '') }, body))));
  }
  function linkRow(kind, s, ctx) {
    const isDownload = kind === 'Download';
    const url = isDownload && assetUrl(ctx.id, s.url) && !/^https:/i.test(s.url) ? assetUrl(ctx.id, s.url) : safeUrl(s.url);
    if (!url) return null;
    const external = /^https?:/i.test(url) && new URL(url).origin !== location.origin;
    return panel(null, el('p', { class: 'link-row' },
      el('span', { class: 'kind' }, kind),
      el('a', { class: 'btn', href: url, download: isDownload && !external ? '' : null, target: external ? '_blank' : null, rel: external ? 'noopener noreferrer' : null },
        s.title || hostOf(url), external ? el('span', { class: 'sr-only' }, ' (opens in a new tab)') : null),
      s.description ? el('span', null, s.description) : null));
  }
  const renderers = {
    text, image, gallery, code,
    link: (s, c) => linkRow('Link', s, c),
    video: (s, c) => linkRow('Video', s, c),      // videos are links, not embeds
    download: (s, c) => linkRow('Download', s, c)
  };

  /* ---- Image viewer (native <dialog>) ---- */
  let lightbox;
  function openLightbox(list, start) {
    if (!lightbox) lightbox = buildLightbox();
    lightbox.show(list, start);
  }
  function buildLightbox() {
    let dlg, items = [], idx = 0;
    const img = el('img', { alt: '' }), cap = el('span'), count = el('span');
    const prev = el('button', { class: 'btn', type: 'button', 'aria-label': 'Previous image', onclick: () => go(idx - 1) }, '‹');
    const next = el('button', { class: 'btn', type: 'button', 'aria-label': 'Next image', onclick: () => go(idx + 1) }, '›');
    const closeBtn = el('button', { class: 'btn small', type: 'button', onclick: () => dlg.close() }, 'Close');
    function go(n) {
      idx = (n + items.length) % items.length;
      img.src = items[idx].src; img.alt = items[idx].alt;
      cap.textContent = items[idx].alt; count.textContent = `${idx + 1} / ${items.length}`;
    }
    dlg = el('dialog', { class: 'lightbox', 'aria-label': 'Image viewer' },
      el('div', { class: 'titlebar' }, el('span', { class: 'title' }, 'Image viewer'), closeBtn),
      el('div', { class: 'lb-body' }, prev, img, next),
      el('div', { class: 'lb-foot' }, count, cap));
    dlg.addEventListener('keydown', e => { if (items.length > 1) { if (e.key === 'ArrowLeft') go(idx - 1); if (e.key === 'ArrowRight') go(idx + 1); } });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    document.body.append(dlg);
    return { show(list, start) { items = list; prev.hidden = next.hidden = list.length < 2; go(start); dlg.showModal(); } };
  }

  /* ---- Page ---- */
  function render(p, id) {
    document.title = `${p.title} – S-Mat by Spinzi`;
    theme.applyProject(main, p.theme);
    const hero = assetUrl(id, p.hero);
    const ctx = { id };

    const sections = el('div', { class: 'sections' });
    for (const s of Array.isArray(p.sections) ? p.sections : []) {
      const fn = s && renderers[s.type];
      if (!fn) { console.warn('Skipping unknown section type:', s && s.type); continue; }
      try { const node = fn(s, ctx); if (node) sections.append(node); }
      catch (e) { console.warn('Section failed:', s, e); sections.append(panel(null, el('p', { class: 'muted' }, 'This section couldn’t be displayed.'))); }
    }

    const meta = p.meta && typeof p.meta === 'object' ? Object.entries(p.meta) : [];
    const links = (Array.isArray(p.links) ? p.links : []).map(l => ({ url: safeUrl(l && l.url), title: l && l.title })).filter(l => l.url);
    const props = el('aside', { 'aria-label': 'Project details' }, el('div', { class: 'window' }, titlebar('Properties'),
      el('div', { class: 'window-body' },
        el('dl', { class: 'props' },
          p.date ? [el('dt', null, 'Date'), el('dd', null, el('time', { datetime: p.date }, formatDate(p.date) || p.date))] : null,
          meta.map(([k, v]) => [el('dt', null, k), el('dd', null, String(v))])),
        links.length ? el('ul', { class: 'side-links' }, links.map(l => el('li', null, el('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.title || hostOf(l.url), el('span', { class: 'sr-only' }, ' (opens in a new tab)'))))) : null)));

    root.replaceChildren(
      el('a', { class: 'back', href: 'projects.html' }, '‹ All projects'),
      el('article', { class: 'window' }, titlebar(p.title, { heading: 'h1' }),
        el('div', { class: 'window-body' },
          hero ? el('div', { class: 'hero-wrap' }, withImageFallback(el('img', { class: 'hero', src: hero, alt: p.heroAlt || '' }))) : null,
          p.description ? el('p', { class: 'lead' }, p.description) : null)),
      el('div', { class: 'project-layout' }, props, sections));
  }

  function fail(kind) {
    document.title = 'Project not found – S-Mat by Spinzi';
    const notFound = kind === 'missing' || kind === 'bad-id';
    root.replaceChildren(messageBox(notFound
      ? { title: 'Project not found', text: 'There is no project with that name. It may have been renamed or removed.', actions: [{ href: 'projects.html', label: 'See all projects' }, { href: 'index.html', label: 'Go to Home' }] }
      : { title: 'This project couldn’t be loaded', text: kind === 'malformed' ? 'The project file is not valid JSON, so it can’t be shown.' : 'Something went wrong while loading the project. Check your connection and try again.',
          actions: [{ href: location.href, label: 'Try again' }, { href: 'projects.html', label: 'See all projects' }] }));
  }

  const id = new URLSearchParams(location.search).get('id');
  if (!id || !/^[\w-]+$/.test(id)) fail('bad-id');
  else loadJSON(`projects/${id}/project.json`).then(p => {
    if (!p || typeof p !== 'object' || typeof p.title !== 'string') throw Object.assign(new Error('shape'), { kind: 'malformed' });
    render(p, id);
  }).catch(e => { console.warn(e); fail(e.kind || 'malformed'); });
})();
