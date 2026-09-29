# S-Mat by Spinzi

A Windows XP-inspired portfolio built with plain HTML, CSS and JavaScript. No framework, no build step, no backend.

## 1. How it works

The pages are templates and the content is data. `project.html?id=soritoon` reads `id`, loads `projects/soritoon/project.json` and draws the page. The Projects page, the home page and the search box read the small `projects/index.json`.

```
index.html projects.html project.html about.html contact.html 404.html
css/themes.css    all colour variables (light, dark, fonts)
css/style.css     the XP look
js/theme.js       website theme + project theme override (localStorage)
js/main.js        shared helpers, header, footer, SITE settings
js/search.js      header search
js/projects.js    project cards
js/project.js     project renderer (section types live here)
projects/         index.json + one folder per project
```

Set your GitHub URL and email once, in the `SITE` object at the top of `js/main.js`. Edit the About page placeholders (`[]`) in `about.html`.

## 2. Add a project

1. Copy an example folder, e.g. `projects/quizo`, to `projects/my-project`. The folder name is the project id: letters, numbers, `-` and `_` only.
2. Put images in `projects/my-project/images/` (WebP recommended).
3. Edit `projects/my-project/project.json`.
4. Add one entry to `projects/index.json` (below).

No HTML or JavaScript changes are needed. The project appears on the Projects page and at `project.html?id=my-project`.

## 3. Images

Paths inside `project.json` are relative to the project folder: `"images/01.webp"` means `projects/my-project/images/01.webp`. Keep hero images around 1200×675 and always write an `alt` description. Only relative paths or `https://` URLs are accepted.

## 4. `projects/index.json`

The list is sorted by date, newest first. Cards only need this file.

```json
{
  "id": "my-project",
  "title": "My Project",
  "description": "One sentence for the card.",
  "date": "2026-05-01",
  "thumbnail": "projects/my-project/images/hero.webp",
  "accent": "#3a7bd5"
}
```

`thumbnail` is a path from the site root. It defaults to `projects/<id>/images/hero.webp` if left out. `accent` colours the card's title bar. There are no tags.

## 5. `project.json`

```json
{
  "id": "my-project",
  "title": "My Project",
  "description": "Shown under the title.",
  "date": "2026-05-01",
  "hero": "images/hero.webp",
  "heroAlt": "What the hero image shows",
  "theme": { "accent": "#3a7bd5", "background": "#f2f2f2", "surface": "#ffffff", "text": "#111111", "border": "#808080" },
  "meta": { "Role": "Designer", "Stack": "HTML, CSS" },
  "links": [ { "title": "GitHub", "url": "https://github.com/..." } ],
  "sections": [ ]
}
```

Only `title` is required. `theme`, `hero`, `meta`, `links` and `sections` are optional. `meta` and `links` appear in the Properties box.

## 6. Section types

`title` is optional on every section. Text can be a string (a blank line starts a new paragraph) or an array of paragraphs.

| type | fields |
| --- | --- |
| `text` | `content` |
| `image` | `src`, `alt`, optional `caption` |
| `gallery` | `images`: list of `{ "src", "alt" }`. Click to open a viewer with arrow keys |
| `code` | `language`, `content` (string or array of lines). Plain text with a Copy button |
| `link` | `title`, `url`, optional `description` |
| `video` | same as `link`. Videos are links, not embeds |
| `download` | `title`, `url`, optional `description`. `"files/report.pdf"` points into the project folder |

Unknown types are skipped (with a console warning) rather than breaking the page.

**Adding a new type:** in `js/project.js` write `function quote(section, ctx) { return panel(section.title, el('blockquote', null, section.content)); }` and add `quote` to the `renderers` object. Use `el(...)`, never `innerHTML`, so JSON can't inject markup.

## 7. Project themes

`theme` may contain `accent`, `background`, `surface`, `text`, `border`, each a hex colour (`#abc` or `#aabbcc`). Anything else is ignored. There is no way to add CSS or font URLs through JSON. Missing colours fall back to the visitor's site theme. Text on the accent colour is picked automatically (black or white).

## 8. Website theme system

Click **Appearance** in the header.

- **Site theme:** System (follows the OS via `prefers-color-scheme`, the default), Light, Dark or Custom.
- **Project pages:** the project's own theme (default), same as the site, Light, Dark or Custom. This changes colours only, never content.
- **Custom colours:** background, panels, text, accent, borders. One set is shared by both choices above.
- **Font:** sans-serif, serif or monospace, using system fonts only.

Everything is saved in `localStorage` under `smat.settings`. To add a colour variable, add it to `css/themes.css` and to `COLOR_KEYS` and `LABELS` in `js/theme.js`.

## 9. Deploy to Netlify

Push this folder to a Git repo and import it in Netlify. Leave the build command empty and set the publish directory to `/`. Or drag the folder onto app.netlify.com/drop.

No `_redirects` or `netlify.toml` is needed. Netlify serves `404.html` for unknown URLs automatically (it uses `<base href="/">` so its links work at any depth).

## 10. Run locally

Opening files directly won't work because `fetch` needs HTTP. From this folder run:

```
python3 -m http.server 8000
```

then open http://localhost:8000. (`npx serve` works too.)

## Notes

- The example images are generated placeholders. Replace them.
- All example projects are fictional.
