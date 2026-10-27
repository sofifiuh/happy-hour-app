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

The app follows the system light/dark setting. Map tiles default to CARTO
Dark Matter and, in light mode, CARTO Positron tinted to the app's warm
paper (no key for either). Set `VITE_MAP_STYLE` / `VITE_MAP_STYLE_LIGHT` to
Mapbox or MapTiler style URLs for production.

## Colour

Each of Sofia's pops means one thing, so two colours next to each other never
say the same thing. Tokens live in `src/index.css`; use the category names
(`bg-live`, `text-score-fg`...) rather than the raw pops in new code.

| Category | Pop | Tokens | Used for |
| --- | --- | --- | --- |
| Live | lime | `live`, `live-fg` | Happening now: status dots, "Happening now" badge, "Until 11pm", live map pins; also done/success ticks |
| Soon | amber | `soon`, `soon-fg` | Starts later / upcoming dots, badges and pins |
| Urgent + action | orange | `primary`, `orange-fg` | Brand actions (buttons, links, selection) and "Ends in 20 min" |
| Score | pink | `score`, `score-fg` | Hangout Score chips and card, rankings, Best of |
| Info | sky | `info-fg` | Place facts: walk time, distance, verified, your location |
| Neutral | cream / ink | `foreground`, `muted-foreground`, `ink-*` | Names, prices, labels, scores below 7.5 |

Pops are fills with `on-pop` text; for coloured text use the `*-fg` twin
(it darkens in light mode for contrast). The pink thank-you stamp after a
submission is a brand moment, not a score, and is the one exception.
