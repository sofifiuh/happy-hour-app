# A Little Hang (web app)

The rebuilt front end: React + TypeScript + Vite, Tailwind v4 and
shadcn/ui (Base UI primitives), themed with the A Little Hang brand from
Sofia's Figma Branding page. Tokens live in `src/index.css`.

The existing site at the repo root stays live until this replaces it.

```
npm install
npm run dev      # syncs ../venues.json + ../photos into public/, starts Vite
npm run build    # production build into dist/
```

Routes (hash-based so it works on any static host and inside Capacitor):
`#/welcome`, `#/` list, `#/map`, `#/spot/:id`, and `#/screens`, a board
showing every screen side by side for design review.

Map tiles default to CARTO Dark Matter (no key). Set `VITE_MAP_STYLE` to a
Mapbox or MapTiler style URL for production.
