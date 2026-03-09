/**
 * Twitter data collection with fallback strategy:
 * Twitter API v2 → Nitter scraping → (Browser placeholder)
 */

import { TwitterApi } from "twitter-api-v2";
import * as cheerio from "cheerio";
import { config } from "../shared/config";
import { getBestSource, getHealthyNitterInstance } from "./sources";
import { parseApiTweet, parseNitterTweet } from "./parser";
import type { RawTweet } from "../types";
import type { SourceType } from "./sources";

export interface ScrapeResult {
  tweets: RawTweet[];
  source: SourceType;
  sinceId?: string;
}

/**
 * Scrape tweets from a KOL with automatic fallback.
 * @param username - Twitter username (without @)
 * @param count - Max tweets to fetch
 * @param sinceId - Only fetch tweets newer than this ID
 */
export async function scrapeTweets(
  username: string,
  count: number,
  sinceId?: string
): Promise<ScrapeResult> {
  const source = getBestSource();

  try {
    switch (source.type) {
      case "twitter-api":
        return await scrapeViaApi(username, count, sinceId);
      case "nitter":
        return await scrapeViaNitter(username, count);
      default:
        throw new Error(`Browser automation not yet implemented`);
    }
  } catch (err) {
    console.error(
      `[Harvest] ${source.type} failed for @${username}:`,
      (err as Error).message
    );

    // Fallback: try nitter if API failed
    if (source.type === "twitter-api") {
      try {
        console.log(`[Harvest] Falling back to Nitter for @${username}`);
        return await scrapeViaNitter(username, count);
      } catch (nitterErr) {
        console.error(
          `[Harvest] Nitter also failed:`,
          (nitterErr as Error).message
        );
      }
    }

    throw new Error(
      `All data sources failed for @${username}: ${(err as Error).message}`
    );
  }
}

async function scrapeViaApi(
  username: string,
  count: number,
  sinceId?: string
): Promise<ScrapeResult> {
  const client = new TwitterApi(config.twitter.bearerToken);
  const readOnly = client.readOnly;

  // Get user ID first
  const user = await readOnly.v2.userByUsername(username);
  if (!user.data) {
    throw new Error(`User @${username} not found`);
  }

  const params: any = {
    max_results: Math.min(count, 100),
    "tweet.fields": [
      "created_at",
      "public_metrics",
      "entities",
      "referenced_tweets",
      "attachments",
    ],
    "user.fields": ["username"],
    "media.fields": ["url", "preview_image_url"],
    expansions: [
      "author_id",
      "referenced_tweets.id",
      "attachments.media_keys",
    ],
  };

  if (sinceId) {
    params.since_id = sinceId;
  }

  const allTweets: RawTweet[] = [];
  let paginationToken: string | undefined;

  while (allTweets.length < count) {
    if (paginationToken) {
      params.pagination_token = paginationToken;
    }

    const timeline = await readOnly.v2.userTimeline(user.data.id, params);

    if (!timeline.data?.data?.length) break;

    const parsed = timeline.data.data.map((t: any) =>
      parseApiTweet(t, timeline.data.includes)
    );
    allTweets.push(...parsed);

    paginationToken = timeline.data.meta?.next_token;
    if (!paginationToken) break;
  }

  return {
    tweets: allTweets.slice(0, count),
    source: "twitter-api",
    sinceId: allTweets[0]?.tweet_id,
  };
}

async function scrapeViaNitter(
  username: string,
  count: number
): Promise<ScrapeResult> {
  const instance = getHealthyNitterInstance();
  if (!instance) {
    throw new Error("No Nitter instances configured");
  }

  const url = `${instance}/${username}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Nitter request failed: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const tweets: RawTweet[] = [];

  $(".timeline-item").each((_i, el) => {
    if (tweets.length >= count) return false;

    const $el = $(el);
    const tweetLink = $el.find(".tweet-link").attr("href") ?? "";
    const tweetId = tweetLink.split("/").pop() ?? "";

    const text = $el.find(".tweet-content").text().trim();
    const dateStr = $el.find(".tweet-date a").attr("title") ?? "";
    const stats = $el.find(".tweet-stat");

    const likes = parseStatNum(stats.eq(2).find(".tweet-stat-num").text());
    const retweets = parseStatNum(stats.eq(1).find(".tweet-stat-num").text());
    const replies = parseStatNum(stats.eq(0).find(".tweet-stat-num").text());

    const images: string[] = [];
    $el.find(".attachment img").each((_j, img) => {
      const src = $(img).attr("src");
      if (src) images.push(src);
    });

    const links: string[] = [];
    $el.find(".tweet-content a").each((_j, a) => {
      const href = $(a).attr("href");
      if (href && !href.startsWith("/")) links.push(href);
    });

    tweets.push(
      parseNitterTweet(username, {
        id: tweetId,
        text,
        date: dateStr ? new Date(dateStr).toISOString() : undefined,
        likes,
        retweets,
        replies,
        images,
        links,
      })
    );
  });

  return { tweets, source: "nitter" };
}

function parseStatNum(text: string): number {
  const cleaned = text.trim().replace(/,/g, "");
  if (cleaned.endsWith("K")) {
    return Math.round(parseFloat(cleaned) * 1000);
  }
  if (cleaned.endsWith("M")) {
    return Math.round(parseFloat(cleaned) * 1_000_000);
  }
  return parseInt(cleaned, 10) || 0;
}
