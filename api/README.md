# Venue API

A Cloudflare Worker (D1 database, R2 files) behind venue claiming on
alittlehang.com. The public site stays on GitHub Pages; this only holds what
venues and guests send us.

- **Sign in:** owners get a one-time email link (Cloudflare Email Service,
  or Resend); the site keeps a
  bearer session in localStorage.
- **Claims:** an email at the venue's own website domain is approved at
  once. Anything else waits in the review queue (`/venue/admin` on the site),
  where an admin calls the venue's listed number or checks the uploaded
  licence. Admins are the emails in `ADMIN_EMAILS`.
- **Edits:** owners edit times, deals, photos, tags and "temporarily closed".
  `GET /public/edits` serves every venue's edits; the site lays them over the
  nightly pipeline data (`applyEdit` in `web/src/lib/store.tsx`). A drink
  under $3 is flagged for a look but still goes live.
- **Counts:** `POST /e` counts views, saves, directions, calls, website taps
  and shares, once per person per venue per day, from a salted daily hash
  that is deleted the next day.
- **Reports:** guests' "Report a wrong time" lands in the queue and is
  emailed to the venue's managers.
- **Add a happy hour:** anyone can send a photo of a menu or sign at
  `/submit` (no account; honeypot plus 5 an hour per IP and 6 a day per
  email). Photos go to R2, the guest gets a thank-you email and admins get
  one with the photos. In the queue an admin reads the photo, fixes the
  times and publishes, declines with a reason, or passes it to a claimed
  venue's managers (a claimed venue's listing is never overwritten). A spot
  we list goes live through `GET /public/edits` within a minute and the
  guest is emailed at once. A new spot gets an id here; the hourly
  `publish-submissions` workflow reads `GET /public/submissions`, places it
  with Google Places and deploys, and the Worker's hourly cron emails the
  guest once it is in `venues.json`.
- **Check every 2 months:** on the 1st of Jan, Mar, May, Jul, Sep and Nov, managers get a one-tap "still right?" email.

## Run it locally

```sh
npm ci
cp .dev.vars.example .dev.vars
npm run db:local
(cd ../web && npm run sync && cd public && python3 -m http.server 8799) &
npm run dev               # http://127.0.0.1:8787
npm test                  # end-to-end smoke test (use a fresh local db)
```

For the site, run `VITE_API_URL=http://127.0.0.1:8787 npm run dev` in `web/`
and open http://localhost:5173. Sign-in links come straight back in dev.

## Emails

Every email lives in `src/email.ts`, on one branded layout (light and dark,
plain-text twin). The logo it loads is `web/public/email/logo.png` on the
site. To look at them all with sample data:

```sh
node --experimental-strip-types scripts/email-preview.ts /tmp/emails
```

## Deploy

`.github/workflows/deploy-api.yml` runs on pushes to main that touch `api/`.
It needs the repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`,
and creates the database and bucket itself on the first run. Then:

1. Email, either: set the repo variable `EMAIL_PROVIDER=cloudflare` (needs
   Workers Paid and alittlehang.com on Cloudflare DNS, then onboard the
   domain under Email Service), or add the secret `RESEND_API_KEY` and verify
   alittlehang.com in Resend.
2. Optional: with alittlehang.com's DNS on Cloudflare, set the repo variable
   `API_DOMAIN=api.alittlehang.com`. Otherwise the Worker answers on its
   workers.dev address.
3. Set the repo variable `VITE_API_URL` to that address and re-run the site
   deploy. The claim link, report form and venue edits switch on.
