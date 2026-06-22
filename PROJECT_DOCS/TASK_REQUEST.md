# Task Request

Status:
In progress.

## Objective

Prepare FG Lab for entirely free static deployment on Cloudflare Pages and GitHub Pages.

## Scope

- Replace the no-op build with a real static export.
- Write deployable output to `dist`.
- Generate physical pages for every supported route.
- Make routing and JSON asset loading work under a configurable GitHub project base path.
- Preserve direct `file://` support and existing DBFZ behavior.
- Add Cloudflare Pages and GitHub Pages deployment instructions.
- Add a free GitHub Pages workflow.

## Out Of Scope

- No paid hosting.
- No database or backend.
- No runtime Node server dependency.
- No application redesign.
- No content expansion.

## Success Criteria

- `npm run build` creates a complete `dist` folder.
- Every known route has a generated `index.html`.
- Runtime JavaScript, JSON, portraits, and backgrounds are included.
- Cloudflare Pages can publish `dist` directly.
- GitHub Pages can publish `dist` with the repository base path.
- Static route and asset smoke tests pass.

## Notes

`server.js` remains a local development convenience only and is not included in the runtime output.
