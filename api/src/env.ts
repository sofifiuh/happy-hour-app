export interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  SITE_URL: string;
  API_URL: string;
  ALLOWED_ORIGINS: string;
  ADMIN_EMAILS: string;
  MAIL_FROM: string;
  // Secrets (wrangler secret put): RESEND_API_KEY sends email; SIGNING_KEY
  // signs the monthly one-tap confirm links.
  RESEND_API_KEY?: string;
  SIGNING_KEY?: string;
  // Local development only: return sign-in links in the response instead
  // of emailing them, and read venues from another URL.
  DEV_LINKS?: string;
  VENUES_URL?: string;
}
