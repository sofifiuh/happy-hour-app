# Happy Hour — Design System

One fixed light brand look, modeled on an editorial food-app reference: bold
display type, a warm full-bleed photo hero, and a clean white content sheet
below it. No dark-mode variant — this is a deliberate brand identity, not a
theme that adapts.

Tokens live in [styles.css](styles.css) (`:root`) and are shared by every
page, including `menu.html` via [menu.css](menu.css). Never hardcode a color
that already has a token — add or reuse one instead.

## Color roles

| Token            | Value     | Role                                                             |
| ---------------- | --------- | ----------------------------------------------------------------- |
| `--bg`           | `#ffffff` | Page canvas                                                       |
| `--sheet-bg`     | `#ffffff` | Content sheet below the hero                                      |
| `--card`         | `#f7f5f1` | Inset surfaces at rest: text inputs, unselected chips             |
| `--card-border`  | `#eae7e0` | Hairline dividers and borders                                     |
| `--text`         | `#14140f` | Ink — primary text                                                |
| `--text-dim`     | `#6b6a63` | Secondary/muted text                                              |
| `--accent`       | `#e0781f` | Amber — the brand accent: inline buttons, active tabs, badges     |
| `--accent-dim`   | `#ffe3c2` | Soft amber tint, for icon circles sitting on white                |
| `--pill`         | `#14140f` | Black — reserved for the *one* floating CTA pill / sticky bar     |
| `--green`        | `#0f9d68` | Live / success status                                             |
| `--red`          | `#d64545` | Destructive actions                                               |

**The one rule that matters most:** amber is the everyday primary-action
color (form buttons, selected chips, active tab underline). Black (`--pill`)
is reserved for exactly two things — the floating "Add a Spot" CTA and the
sticky hours/Share bar on the menu page — because those are the closest
things this app has to the reference's "Order now" pill. Don't introduce a
third black surface; if something needs emphasis, reach for amber first.

## Type

System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
Helvetica, Arial, sans-serif`) — no webfont, keeps pages fast and works
offline.

- **Display headline** (`.hero-title`): `font-weight: 800`, tight
  `letter-spacing: -0.02em`, `line-height: 0.92`, uppercase, sized with
  `clamp()` so it scales with viewport width. Used once per page, at the
  top of the hero.
- **Section/modal headings**: `font-weight: 800`, `letter-spacing: -0.01em`,
  ~1.4rem.
- **Body/row text**: regular weight, `--text`; secondary lines use
  `--text-dim` at a smaller size.
- **Numeric displays** (countdown timer): `font-variant-numeric:
  tabular-nums` so digits don't jitter as they change.

## Components

**Hero** (`.hero` / `.menu-photo`) — full-bleed warm gradient standing in
for a photo, white/cream text on top, small circular icon buttons
(`.hero-icon-btn`) in the corners. The content sheet below overlaps it by
`-18px` with a `24px` top border-radius, reading like a bottom sheet drawn
over the photo.

**Pill CTA** (`.cta-pill`) — black, full-width-minus-margins, fixed to the
bottom of the viewport. Label left-aligned, a circular translucent-white
arrow bubble (`.cta-arrow`) right-aligned. This is the only fixed-position
button in the app; don't add a second one on the same screen.

**List row** (`.venue-row`) — icon circle (`--accent-dim` background) +
name/subtext stack + status label + chevron, separated by `--card-border`
hairlines. No card backgrounds, no shadows — rows read as a single
continuous list, matching the reference's "Log in / Sign up" rows.

**Tabs & filter chips** (`.view-tab`, `.filter-btn`) — two different shapes
on purpose: view tabs are block segmented-control buttons (equal width,
solid fill when active); filter chips are small rounded pills. The shape
difference alone communicates "mode switch" vs. "filter," without needing
extra labels.

**Modal** (`.modal-content`) — bottom sheet on mobile widths, centered
dialog above 480px, white background, same hairline borders and type scale
as the rest of the app. Inputs sit on `--card`, not `--bg`, so they read as
insets rather than blending into the page.

## Extending this system

- Reuse a token before adding a color. If nothing fits, add the token to
  `:root` in `styles.css` with a one-line comment on its role, not just its
  value — the next person (including future you) needs to know *when* to
  reach for it, not just what it renders as.
- New pages load `styles.css` first, then their own page-specific
  stylesheet (see `menu.html` loading `menu.css` after it) — page styles
  should only add layout/components unique to that page, never redefine a
  color that already has a token.
