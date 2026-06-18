# Deploying DBFZ Team Lab

This is currently a static website. It does not need a backend.

## Easiest Options

### Netlify Drop

1. Go to Netlify Drop.
2. Drag the project folder into the page.
3. Netlify gives you a shareable URL.

### GitHub Pages

1. Put the project in a GitHub repo.
2. Enable GitHub Pages.
3. Set the source to the repo root.

### Vercel

1. Import the repo.
2. Use static/no framework settings.
3. Deploy.

## Files Needed Online

Required:

- `index.html`
- `styles.css`
- `app.js`
- `data/characters-data.js`
- `data/polished-overrides.js`
- `data/knowledge-db.js`
- `data/frame-data.local.js`
- `public/data/dbfz/*`
- `public/data/dbfz/frame-data/*`
- `assets/manifest.js`
- `assets/backgrounds/background.webp`
- `public/characters/portraits/*`

Optional/local-only:

- `transcript.txt`
- `tools/*`
- `public/characters/raw/*`
- `data/characters.raw.json`
- `data/character-notes.cleaned.md`
- `data/frame-data.schema.json`
- `scripts/import-dustloop.js`
- `COMMUNITY_INTELLIGENCE.md`

Keep optional files if you want to keep editing and regenerating data from the same hosted repo. Remove optional files if you want a smaller public upload.

## Before Sharing

Run:

```powershell
npm install
npm run import-dustloop
npm run build
node --check app.js
node --check data/polished-overrides.js
node --check assets/manifest.js
node tools\build_asset_manifest.js
```

Then refresh the page and check:

- All portraits load.
- Search and filters work.
- Dragging into team slots works.
- Recommended partners do not duplicate the current team.
