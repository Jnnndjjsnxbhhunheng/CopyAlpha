import path from "path";
import os from "os";
import fs from "fs";

// Use a temp DB for testing
const testDbPath = path.join(os.tmpdir(), `copyalpha-test-${Date.now()}.db`);

jest.mock("../src/shared/config", () => ({
  config: {
    paths: {
      db: testDbPath,
      generatedSkills: path.join(os.tmpdir(), "generated-skills-test"),
    },
  },
}));

import {
  addTrackedKOL,
  getTrackedKOLs,
  insertTweet,
  insertTweets,
  getTweetsByAuthor,
  getLatestTweetId,
  insertSignal,
  getSignalsByAuthor,
  insertBacktestResult,
  closeDb,
  updateKOLStatus,
  removeTrackedKOL,
} from "../src/storage/db";
import type { RawTweet, TradingSignal, BacktestResult } from "../src/types";

afterAll(() => {
  closeDb();
  try { fs.unlinkSync(testDbPath); } catch {}
});

describe("storage/db", () => {
  describe("tracked KOLs", () => {
    it("adds and retrieves KOLs", () => {
      addTrackedKOL("testuser1");
      addTrackedKOL("testuser2");
      const kols = getTrackedKOLs();
      expect(kols.length).toBeGreaterThanOrEqual(2);
      expect(kols.some((k) => k.username === "testuser1")).toBe(true);
    });

    it("deduplicates on insert", () => {
      addTrackedKOL("testuser1");
      const kols = getTrackedKOLs();
      const count = kols.filter((k) => k.username === "testuser1").length;
      expect(count).toBe(1);
    });

    it("filters by status", () => {
      const active = getTrackedKOLs("active");
      expect(active.every((k) => k.status === "active")).toBe(true);
    });

    it("removes (pauses) KOL", () => {
      removeTrackedKOL("testuser2");
      const paused = getTrackedKOLs("paused");
      expect(paused.some((k) => k.username === "testuser2")).toBe(true);
    });

    it("updates status", () => {
      updateKOLStatus("testuser1", "error", "test error");
      const kols = getTrackedKOLs("error");
      const kol = kols.find((k) => k.username === "testuser1");
      expect(kol?.error_message).toBe("test error");

      // Reset
      updateKOLStatus("testuser1", "active");
    });
  });

  describe("tweets", () => {
    const tweet: RawTweet = {
      tweet_id: "t1",
      author_username: "testuser1",
      text: "Bullish on $ETH",
      created_at: "2026-01-01T00:00:00Z",
      metrics: { likes: 10, retweets: 5, replies: 2, views: 100 },
      context: {
        is_thread: false,
        media_urls: [],
        urls: [],
        hashtags: [],
        cashtags: ["ETH"],
      },
    };

    it("inserts and retrieves tweets", () => {
      insertTweet(tweet);
      const tweets = getTweetsByAuthor("testuser1");
      expect(tweets.length).toBeGreaterThanOrEqual(1);
      expect(tweets[0].text).toBe("Bullish on $ETH");
    });

    it("deduplicates tweets", () => {
      insertTweet(tweet);
      const tweets = getTweetsByAuthor("testuser1");
      const count = tweets.filter((t) => t.tweet_id === "t1").length;
      expect(count).toBe(1);
    });

    it("batch inserts tweets", () => {
      const batch: RawTweet[] = [
        { ...tweet, tweet_id: "t2", text: "Tweet 2" },
        { ...tweet, tweet_id: "t3", text: "Tweet 3" },
      ];
      insertTweets(batch);
      const tweets = getTweetsByAuthor("testuser1");
      expect(tweets.length).toBeGreaterThanOrEqual(3);
    });

    it("gets latest tweet ID", () => {
      const latest = getLatestTweetId("testuser1");
      expect(latest).toBeDefined();
    });
  });

  describe("signals", () => {
    const signal: TradingSignal = {
      id: "sig-001",
      tweet_id: "t1",
      author_username: "testuser1",
      tokens: [
        {
          symbol: "ETH",
          chain: "ethereum",
          sentiment: "bullish",
          price_target: 5000,
          stop_loss: 3000,
          timeframe: "medium",
        },
      ],
      confidence: 0.8,
      reasoning: "Strong fundamentals",
      topic_tags: ["defi"],
      created_at: "2026-01-01T00:00:00Z",
    };

    it("inserts and retrieves signals", () => {
      insertSignal(signal);
      const signals = getSignalsByAuthor("testuser1");
      expect(signals.length).toBeGreaterThanOrEqual(1);
      expect(signals[0].tokens[0].symbol).toBe("ETH");
    });
  });

  describe("backtest results", () => {
    it("inserts backtest result", () => {
      const result: BacktestResult = {
        signal_id: "sig-001",
        price_at_signal: 3000,
        price_at_end: 3500,
        return_pct: 0.167,
        outcome: "win",
        timeframe_used: "medium",
      };
      insertBacktestResult(result);
      // No error = success
    });
  });
});
