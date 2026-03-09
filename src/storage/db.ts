import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "../shared/config";
import type { RawTweet, TradingSignal, BacktestResult, TrackedKOL } from "../types";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(config.paths.db);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database): void {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  database.exec(schema);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ─── Tracked KOLs ───

export function addTrackedKOL(username: string): void {
  const normalized = username.replace(/^@/, "").toLowerCase();
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO tracked_kols (username) VALUES (?)`
    )
    .run(normalized);
}

export function removeTrackedKOL(username: string): void {
  const normalized = username.replace(/^@/, "").toLowerCase();
  getDb()
    .prepare(`UPDATE tracked_kols SET status = 'paused' WHERE username = ?`)
    .run(normalized);
}

export function getTrackedKOLs(
  status?: "active" | "paused" | "error"
): TrackedKOL[] {
  const base = `SELECT * FROM tracked_kols`;
  if (status) {
    return getDb()
      .prepare(`${base} WHERE status = ?`)
      .all(status) as TrackedKOL[];
  }
  return getDb().prepare(base).all() as TrackedKOL[];
}

export function updateKOLStatus(
  username: string,
  status: TrackedKOL["status"],
  errorMessage?: string
): void {
  getDb()
    .prepare(
      `UPDATE tracked_kols
       SET status = ?, error_message = ?, last_scraped = datetime('now')
       WHERE username = ?`
    )
    .run(status, errorMessage ?? null, username);
}

export function updateKOLTweetCount(
  username: string,
  count: number
): void {
  getDb()
    .prepare(
      `UPDATE tracked_kols SET tweet_count = ?, last_scraped = datetime('now') WHERE username = ?`
    )
    .run(count, username);
}

// ─── Tweets ───

export function insertTweet(tweet: RawTweet): void {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO tweets
       (tweet_id, author_username, text, created_at,
        likes, retweets, replies, views,
        is_thread, thread_position, is_reply_to, is_quote_of,
        media_urls, urls, hashtags, cashtags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      tweet.tweet_id,
      tweet.author_username,
      tweet.text,
      tweet.created_at,
      tweet.metrics.likes,
      tweet.metrics.retweets,
      tweet.metrics.replies,
      tweet.metrics.views,
      tweet.context.is_thread ? 1 : 0,
      tweet.context.thread_position ?? null,
      tweet.context.is_reply_to ?? null,
      tweet.context.is_quote_of ?? null,
      JSON.stringify(tweet.context.media_urls),
      JSON.stringify(tweet.context.urls),
      JSON.stringify(tweet.context.hashtags),
      JSON.stringify(tweet.context.cashtags)
    );
}

export function insertTweets(tweets: RawTweet[]): void {
  const insert = getDb().transaction((items: RawTweet[]) => {
    for (const tweet of items) {
      insertTweet(tweet);
    }
  });
  insert(tweets);
}

export function getTweetsByAuthor(
  username: string,
  limit = 500
): RawTweet[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM tweets
       WHERE author_username = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(username, limit) as any[];

  return rows.map(rowToTweet);
}

export function getLatestTweetId(username: string): string | null {
  const row = getDb()
    .prepare(
      `SELECT tweet_id FROM tweets
       WHERE author_username = ?
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(username) as { tweet_id: string } | undefined;
  return row?.tweet_id ?? null;
}

function rowToTweet(row: any): RawTweet {
  return {
    tweet_id: row.tweet_id,
    author_username: row.author_username,
    text: row.text,
    created_at: row.created_at,
    metrics: {
      likes: row.likes,
      retweets: row.retweets,
      replies: row.replies,
      views: row.views,
    },
    context: {
      is_thread: !!row.is_thread,
      thread_position: row.thread_position ?? undefined,
      is_reply_to: row.is_reply_to ?? undefined,
      is_quote_of: row.is_quote_of ?? undefined,
      media_urls: JSON.parse(row.media_urls || "[]"),
      urls: JSON.parse(row.urls || "[]"),
      hashtags: JSON.parse(row.hashtags || "[]"),
      cashtags: JSON.parse(row.cashtags || "[]"),
    },
  };
}

// ─── Signals ───

export function insertSignal(signal: TradingSignal): void {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO signals
       (id, tweet_id, author_username, tokens, confidence, reasoning, topic_tags, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      signal.id,
      signal.tweet_id,
      signal.author_username,
      JSON.stringify(signal.tokens),
      signal.confidence,
      signal.reasoning,
      JSON.stringify(signal.topic_tags),
      signal.created_at
    );
}

export function getSignalsByAuthor(
  username: string,
  limit = 200
): TradingSignal[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM signals
       WHERE author_username = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(username, limit) as any[];

  return rows.map((row) => ({
    id: row.id,
    tweet_id: row.tweet_id,
    author_username: row.author_username,
    tokens: JSON.parse(row.tokens),
    confidence: row.confidence,
    reasoning: row.reasoning,
    topic_tags: JSON.parse(row.topic_tags || "[]"),
    created_at: row.created_at,
  }));
}

export function getUntestedSignals(username: string): TradingSignal[] {
  const rows = getDb()
    .prepare(
      `SELECT s.* FROM signals s
       LEFT JOIN backtest_results b ON s.id = b.signal_id
       WHERE s.author_username = ? AND b.id IS NULL
       ORDER BY s.created_at ASC`
    )
    .all(username) as any[];

  return rows.map((row) => ({
    id: row.id,
    tweet_id: row.tweet_id,
    author_username: row.author_username,
    tokens: JSON.parse(row.tokens),
    confidence: row.confidence,
    reasoning: row.reasoning,
    topic_tags: JSON.parse(row.topic_tags || "[]"),
    created_at: row.created_at,
  }));
}

// ─── Backtest Results ───

export function insertBacktestResult(result: BacktestResult): void {
  getDb()
    .prepare(
      `INSERT INTO backtest_results
       (signal_id, price_at_signal, price_at_end, return_pct, outcome, timeframe_used)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      result.signal_id,
      result.price_at_signal,
      result.price_at_end,
      result.return_pct,
      result.outcome,
      result.timeframe_used
    );
}

export function getBacktestResults(
  username: string
): (BacktestResult & { author_username: string })[] {
  return getDb()
    .prepare(
      `SELECT b.*, s.author_username FROM backtest_results b
       JOIN signals s ON b.signal_id = s.id
       WHERE s.author_username = ?
       ORDER BY b.tested_at DESC`
    )
    .all(username) as any[];
}
