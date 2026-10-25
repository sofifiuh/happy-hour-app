-- "Submit a happy hour": a guest sends a photo of a menu or sign, for a
-- venue we list (venue_id) or one we don't yet (place_*). An admin reads the
-- photo, types the hours into `published` and publishes it, or declines.
-- status: pending | published | declined | forwarded (the venue keeps its
-- own listing, so it went to its managers instead).
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  venue_id TEXT,
  place_name TEXT,
  place_address TEXT,
  place_website TEXT,
  hh TEXT,            -- the guest's own reading of the times, JSON, optional
  note TEXT,
  name TEXT,
  email TEXT NOT NULL,
  works_there INTEGER NOT NULL DEFAULT 0,
  photos INTEGER NOT NULL DEFAULT 0, -- R2 submissions/<id>/<n>, n from 0
  status TEXT NOT NULL DEFAULT 'pending',
  published TEXT,     -- what went live: { venue_id?, name?, address?, website?, hh }
  reason TEXT,        -- why it was declined, sent to the guest
  created_at TEXT NOT NULL,
  decided_at TEXT,
  decided_by TEXT,
  notified_at TEXT    -- when the guest got the "it's live" email
);
CREATE INDEX submissions_status ON submissions(status, created_at);
CREATE INDEX submissions_email ON submissions(email, created_at);
