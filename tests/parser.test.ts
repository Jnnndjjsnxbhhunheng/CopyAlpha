import { extractCashtags, extractHashtags, parseSocialDataTweet } from "../src/harvest/parser";

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

  describe("parseSocialDataTweet", () => {
    it("parses a SocialData API tweet", () => {
      const data = {
        id_str: "123456",
        full_text: "Bullish on $ETH",
        tweet_created_at: "2026-01-01T00:00:00.000000Z",
        favorite_count: 100,
        retweet_count: 20,
        reply_count: 5,
        views_count: 1000,
        user: { screen_name: "testuser" },
        entities: {
          hashtags: [],
          urls: [],
          symbols: [{ text: "ETH" }],
        },
      };

      const tweet = parseSocialDataTweet(data);
      expect(tweet.tweet_id).toBe("123456");
      expect(tweet.author_username).toBe("testuser");
      expect(tweet.metrics.likes).toBe(100);
      expect(tweet.metrics.views).toBe(1000);
      expect(tweet.text).toBe("Bullish on $ETH");
      expect(tweet.context.cashtags).toContain("ETH");
    });

    it("handles missing fields gracefully", () => {
      const data = {
        id_str: "789",
        full_text: "test",
      };

      const tweet = parseSocialDataTweet(data);
      expect(tweet.author_username).toBe("unknown");
      expect(tweet.metrics.likes).toBe(0);
    });
  });
});
