/* Theme system. Loaded in <head> (not deferred) so saved colours apply before first paint.
   Two independent choices are stored in localStorage:
   - site appearance:  system | light | dark | custom
   - project pages:    project | site | light | dark | custom
   "custom" uses one shared set of user colours for both. */
(function () {
  const KEY = 'smat.settings';
  const COLOR_KEYS = ['bg', 'surface', 'text', 'accent', 'border']; // add new variables here
  const LABELS = { bg: 'Background', surface: 'Panels', text: 'Text', accent: 'Accent', border: 'Borders' };
  const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
  const DEFAULTS = {
    mode: 'system', projectMode: 'project', font: 'sans',
    custom: { bg: '#ece9d8', surface: '#ffffff', text: '#111111', accent: '#245edb', border: '#7f9db9' }
  };

  const SMat = (window.SMat = window.SMat || {});
  let settings = load();
  let scope = null, scopeTheme = null; // the project page registers itself here

  function load() {
    const s = JSON.parse(JSON.stringify(DEFAULTS));
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && typeof saved === 'object') {
        for (const k of ['mode', 'projectMode', 'font']) if (typeof saved[k] === 'string') s[k] = saved[k];
        for (const k of COLOR_KEYS) if (saved.custom && HEX.test(saved.custom[k])) s.custom[k] = saved.custom[k];
      }
    } catch (e) { /* storage blocked or corrupt: use defaults */ }
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ } }

  // Pick black or white text for a given background colour.
  function onColor(hex) {
    let h = hex.slice(1);
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#000000' : '#ffffff';
  }
  function setColors(node, colors) {
    for (const k of COLOR_KEYS) if (colors && typeof colors[k] === 'string' && HEX.test(colors[k])) node.style.setProperty('--' + k, colors[k]);
    if (colors && HEX.test(colors.accent || '')) node.style.setProperty('--on-accent', onColor(colors.accent));
  }
  function clearColors(node) { for (const k of [...COLOR_KEYS, 'on-accent']) node.style.removeProperty('--' + k); }

  function applySite() {
    const root = document.documentElement;
    clearColors(root);
    if (settings.mode === 'system') delete root.dataset.theme; else root.dataset.theme = settings.mode;
    if (settings.mode === 'custom') setColors(root, settings.custom);
    if (settings.font === 'sans') delete root.dataset.font; else root.dataset.font = settings.font;
  }

  // Called by project.js with the project's own colours (already just data, never CSS).
  function applyProject(node, projectTheme) {
    if (node) { scope = node; scopeTheme = projectTheme; }
    if (!scope) return;
    clearColors(scope);
    scope.classList.remove('theme-light', 'theme-dark');
    const m = settings.projectMode;
    if (m === 'project') setColors(scope, scopeTheme);
    else if (m === 'custom') setColors(scope, settings.custom);
    else if (m === 'light' || m === 'dark') scope.classList.add('theme-' + m);
    // 'site' = do nothing, inherit the site appearance
  }

  applySite();

  /* ---- Settings dialog (built on first open) ---- */
  let dialog;
  function build() {
    const { el, titlebar } = SMat;
    const radio = (name, value, label) => el('label', null, el('input', { type: 'radio', name, value }), label);
    const color = k => el('label', null, LABELS[k], el('input', { type: 'color', 'data-color': k }));
    dialog = el('dialog', { class: 'settings', 'aria-labelledby': 'settings-title' },
      titlebar('Appearance', { heading: 'h2', id: 'settings-title' }),
      el('form', { method: 'dialog' },
        el('fieldset', null, el('legend', null, 'Site theme'),
          radio('mode', 'system', 'System'), radio('mode', 'light', 'Light'), radio('mode', 'dark', 'Dark'), radio('mode', 'custom', 'Custom')),
        el('fieldset', null, el('legend', null, 'Project pages'),
          el('label', null, 'Use ', el('select', { name: 'projectMode' },
            el('option', { value: 'project' }, "The project's own theme"), el('option', { value: 'site' }, 'Same as the site'),
            el('option', { value: 'light' }, 'Light'), el('option', { value: 'dark' }, 'Dark'), el('option', { value: 'custom' }, 'Custom colours')))),
        el('fieldset', { 'data-custom': true }, el('legend', null, 'Custom colours'), COLOR_KEYS.map(color)),
        el('fieldset', null, el('legend', null, 'Font'),
          radio('font', 'sans', 'Sans-serif'), radio('font', 'serif', 'Serif'), radio('font', 'mono', 'Monospace')),
        el('p', { class: 'actions' },
          el('button', { class: 'btn', type: 'button', onclick: reset }, 'Reset'),
          el('button', { class: 'btn primary', value: 'close' }, 'Close'))));
    dialog.addEventListener('change', readForm);
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    document.body.append(dialog);
  }
  function syncForm() {
    for (const r of dialog.querySelectorAll('input[type=radio]')) r.checked = settings[r.name] === r.value;
    dialog.querySelector('[name=projectMode]').value = settings.projectMode;
    for (const c of dialog.querySelectorAll('[data-color]')) c.value = settings.custom[c.dataset.color];
    dialog.querySelector('[data-custom]').hidden = settings.mode !== 'custom' && settings.projectMode !== 'custom';
  }
  function readForm() {
    const checked = name => dialog.querySelector(`input[name=${name}]:checked`);
    settings.mode = checked('mode').value;
    settings.font = checked('font').value;
    settings.projectMode = dialog.querySelector('[name=projectMode]').value;
    for (const c of dialog.querySelectorAll('[data-color]')) settings.custom[c.dataset.color] = c.value;
    save(); applySite(); applyProject(); syncForm();
  }
  function reset() { settings = JSON.parse(JSON.stringify(DEFAULTS)); save(); applySite(); applyProject(); syncForm(); }
  function openSettings() { if (!dialog) build(); syncForm(); dialog.showModal(); }

  SMat.theme = { applyProject, openSettings, onColor };
})();
