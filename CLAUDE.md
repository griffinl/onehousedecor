# CLAUDE.md — onehousedecor.com

This is a **generated site** from the BlogTemplate factory (home-decor niche). It is its
own GitHub repo, deployed to Vercel as a static Astro site, auto-rebuilding on push to
`main`.

**Read the full architecture, data contract, conventions, and gotchas in the template's
doc:** `/Users/liqiang/Documents/claudecode/BlogTemplate/CLAUDE.md`.

## Site-specific facts

- Niche: home decor. Theme: deep green (`#2D4A3E`) + warm clay accent (`#B8732E`).
- GitHub: `griffinl/onehousedecor`. Vercel project: `onehousedecor`
  (team `griffinls-projects`). Deploy hook is stored in AmazonScrapling's Blog settings.
- Articles live in `src/content/articles/*.json`, pushed in by AmazonScrapling. Do not
  hand-edit them except for quick local testing.
- `site.config.ts` here is the customized (non-template) config: theme, nav, categories,
  page copy.

## Working here

- This is where we do live design iteration. **When you change a shared component, mirror
  it back to BlogTemplate** (`src/components/*`, `src/pages/*`, `src/lib/types.ts`,
  `src/styles/global.css`) so future sites inherit the fix.
- Local dev: `npm run dev`, then `curl --noproxy localhost http://localhost:4321/...`
  (system proxy interferes). `git push` needs the proxy; REST API calls must clear it.
- `npm run gen-og` regenerates the social share image from `site.config.ts`.
