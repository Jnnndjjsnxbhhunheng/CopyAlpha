import { extractCashtags, extractHashtags, parseApiTweet } from "../src/harvest/parser";

describe("parser", () => {
  describe("extractCashtags", () => {
    it("extracts cashtags from text", () => {
      expect(extractCashtags("Bullish on $ETH and $SOL")).toEqual([
        "ETH",
        "SOL",
      ]);
    });

    it("returns empty array for no cashtags", () => {
      expect(extractCashtags("Just a normal tweet")).toEqual([]);
    });

    it("handles mixed content", () => {
      expect(extractCashtags("$BTC to 100k! #crypto $PEPE")).toEqual([
        "BTC",
        "PEPE",
      ]);
    });
  });

  describe("extractHashtags", () => {
    it("extracts hashtags", () => {
      expect(extractHashtags("#DeFi is the future #crypto")).toEqual([
        "DeFi",
        "crypto",
      ]);
    });
  });

  describe("parseApiTweet", () => {
    it("parses a minimal API tweet", () => {
      const data = {
        id: "123456",
        text: "Bullish on $ETH",
        created_at: "2026-01-01T00:00:00Z",
        author_id: "user1",
        public_metrics: {
          like_count: 100,
          retweet_count: 20,
          reply_count: 5,
          impression_count: 1000,
        },
      };

      const includes = {
        users: [{ id: "user1", username: "testuser" }],
      };

      const tweet = parseApiTweet(data, includes);
      expect(tweet.tweet_id).toBe("123456");
      expect(tweet.author_username).toBe("testuser");
      expect(tweet.metrics.likes).toBe(100);
      expect(tweet.text).toBe("Bullish on $ETH");
    });

    it("handles missing includes", () => {
      const data = {
        id: "789",
        text: "test",
        created_at: "2026-01-01T00:00:00Z",
        author_id: "user2",
        public_metrics: {},
      };

      const tweet = parseApiTweet(data);
      expect(tweet.author_username).toBe("user2");
      expect(tweet.metrics.likes).toBe(0);
    });
  });
});
