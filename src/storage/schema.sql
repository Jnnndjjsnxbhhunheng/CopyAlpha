-- Tracked KOLs
CREATE TABLE IF NOT EXISTS tracked_kols (
  username      TEXT PRIMARY KEY,
  display_name  TEXT,
  bio           TEXT,
  followers     INTEGER DEFAULT 0,
  following     INTEGER DEFAULT 0,
  added_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_scraped  TEXT,
  tweet_count   INTEGER DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','error')),
  error_message TEXT
);

-- Raw tweets
CREATE TABLE IF NOT EXISTS tweets (
  tweet_id         TEXT PRIMARY KEY,
  author_username  TEXT NOT NULL,
  text             TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  likes            INTEGER DEFAULT 0,
  retweets         INTEGER DEFAULT 0,
  replies          INTEGER DEFAULT 0,
  views            INTEGER DEFAULT 0,
  is_thread        INTEGER DEFAULT 0,
  thread_position  INTEGER,
  is_reply_to      TEXT,
  is_quote_of      TEXT,
  media_urls       TEXT DEFAULT '[]',   -- JSON array
  urls             TEXT DEFAULT '[]',   -- JSON array
  hashtags         TEXT DEFAULT '[]',   -- JSON array
  cashtags         TEXT DEFAULT '[]',   -- JSON array
  scraped_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (author_username) REFERENCES tracked_kols(username)
);

CREATE INDEX IF NOT EXISTS idx_tweets_author ON tweets(author_username);
CREATE INDEX IF NOT EXISTS idx_tweets_created ON tweets(created_at);

-- Extracted trading signals
CREATE TABLE IF NOT EXISTS signals (
  id               TEXT PRIMARY KEY,
  tweet_id         TEXT NOT NULL,
  author_username  TEXT NOT NULL,
  tokens           TEXT NOT NULL,       -- JSON array of TokenSignal
  confidence       REAL NOT NULL,
  reasoning        TEXT NOT NULL,
  topic_tags       TEXT DEFAULT '[]',   -- JSON array
  created_at       TEXT NOT NULL,
  extracted_at     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tweet_id) REFERENCES tweets(tweet_id),
  FOREIGN KEY (author_username) REFERENCES tracked_kols(username)
);

CREATE INDEX IF NOT EXISTS idx_signals_author ON signals(author_username);
CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(created_at);

-- Backtest results
CREATE TABLE IF NOT EXISTS backtest_results (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  signal_id        TEXT NOT NULL,
  price_at_signal  REAL NOT NULL,
  price_at_end     REAL NOT NULL,
  return_pct       REAL NOT NULL,
  outcome          TEXT NOT NULL CHECK(outcome IN ('win','loss')),
  timeframe_used   TEXT NOT NULL,
  tested_at        TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (signal_id) REFERENCES signals(id)
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version   INTEGER PRIMARY KEY,
  applied   TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schema_version (version) VALUES (1);
