/**
 * Twitter data collection via SocialData API.
 * https://docs.socialdata.tools/reference/
 *
 * Two endpoints:
 * - GET /twitter/user/{user_id}/tweets — recent tweets (paginated, ~20/page)
 * - GET /twitter/user/{user_id}/highlights — highlighted tweets
 */

import { config } from "../shared/config";
import { getSource } from "./sources";
import { parseSocialDataTweet } from "./parser";
import type { RawTweet } from "../types";
import type { SourceType } from "./sources";

const BASE = "https://api.socialdata.tools";

export interface ScrapeResult {
  tweets: RawTweet[];
  source: SourceType;
  sinceId?: string;
}

/**
 * Scrape tweets from a KOL via SocialData API.
 * Fetches regular tweets + highlights, deduplicates, and returns merged.
 */
export async function scrapeTweets(
  username: string,
  count: number,
  _sinceId?: string
): Promise<ScrapeResult> {
  getSource(); // validates API key

  const userId = await resolveUserId(username);

  const [tweets, highlights] = await Promise.all([
    fetchUserTweets(userId, count),
    fetchUserHighlights(userId),
  ]);

  const merged = deduplicateTweets([...tweets, ...highlights]);

  return {
    tweets: merged.slice(0, count),
    source: "socialdata",
    sinceId: merged[0]?.tweet_id,
  };
}

async function resolveUserId(username: string): Promise<string> {
  const url = `${BASE}/twitter/user/${encodeURIComponent(username)}`;
  const data = await socialdataGet<any>(url);

  if (!data.id_str) {
    throw new Error(`User @${username} not found on SocialData`);
  }
  return data.id_str;
}

async function fetchUserTweets(
  userId: string,
  count: number
): Promise<RawTweet[]> {
  const all: RawTweet[] = [];
  let cursor: string | undefined;

  while (all.length < count) {
    const url = buildUrl(`${BASE}/twitter/user/${userId}/tweets`, cursor);
    const data = await socialdataGet<any>(url);
    const tweets: any[] = data.tweets ?? [];

    if (tweets.length === 0) break;

    for (const t of tweets) {
      all.push(parseSocialDataTweet(t));
    }

    cursor = data.next_cursor ?? undefined;
    if (!cursor) break;
  }

  return all.slice(0, count);
}

async function fetchUserHighlights(userId: string): Promise<RawTweet[]> {
  const all: RawTweet[] = [];
  let cursor: string | undefined;

  // Fetch up to 3 pages of highlights (~60 tweets max)
  for (let page = 0; page < 3; page++) {
    const url = buildUrl(
      `${BASE}/twitter/user/${userId}/highlights`,
      cursor
    );
    const data = await socialdataGet<any>(url);
    const tweets: any[] = data.tweets ?? [];

    if (tweets.length === 0) break;

    for (const t of tweets) {
      all.push(parseSocialDataTweet(t));
    }

    cursor = data.next_cursor ?? undefined;
    if (!cursor) break;
  }

  return all;
}

function buildUrl(base: string, cursor?: string): string {
  if (!cursor) return base;
  return `${base}?cursor=${encodeURIComponent(cursor)}`;
}

function deduplicateTweets(tweets: RawTweet[]): RawTweet[] {
  const seen = new Set<string>();
  return tweets.filter((t) => {
    if (seen.has(t.tweet_id)) return false;
    seen.add(t.tweet_id);
    return true;
  });
}

async function socialdataGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.socialdata.apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `SocialData API ${response.status}: ${body.slice(0, 300)}`
    );
  }

  return response.json() as Promise<T>;
}
