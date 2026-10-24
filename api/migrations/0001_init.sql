-- People who signed in with an email link. Venue owners and admins alike.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

-- One-time sign-in links (hash of the token, never the token itself).
CREATE TABLE login_tokens (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- "Own this place?" requests. method: domain (email matches the venue's
-- website, approved at once) or manual (an admin checks, often by phoning
-- the venue's listed number or looking at the uploaded licence).
CREATE TABLE claims (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  licence_key TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  decided_at TEXT,
  decided_by TEXT
);
CREATE INDEX claims_status ON claims(status, created_at);
CREATE INDEX claims_user ON claims(user_id);

CREATE TABLE owners (
  venue_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (venue_id, user_id)
);
CREATE INDEX owners_user ON owners(user_id);

-- The venue's own version of its listing. Fields in data win over the
-- nightly pipeline's copy. flagged = held for an admin look (a drink price
-- under the BC minimum, say) but still live.
CREATE TABLE venue_edits (
  venue_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  confirmed_at TEXT NOT NULL,
  flagged TEXT
);

CREATE TABLE edit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venue_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Per-venue counts by day: view, save, directions, call, website, share.
-- Each counts a person once per venue, type and day (see event_seen).
CREATE TABLE events_daily (
  venue_id TEXT NOT NULL,
  day TEXT NOT NULL,
  type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (venue_id, day, type)
);

-- Salted daily hashes for de-duplication; purged after a day, so no
-- visitor can be followed from one day to the next.
CREATE TABLE event_seen (
  hash TEXT PRIMARY KEY,
  day TEXT NOT NULL
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  resolved_at TEXT
);
CREATE INDEX reports_status ON reports(status, created_at);
