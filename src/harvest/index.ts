/**
 * Harvest layer public API.
 *
 * Deps: storage/db, harvest/scraper, harvest/monitor
 * Output: RawTweet[] persisted in SQLite
 */

import { config } from "../shared/config";
import { scrapeTweets } from "./scraper";
import {
  addTrackedKOL,
  removeTrackedKOL,
  getTrackedKOLs,
  insertTweets,
  updateKOLTweetCount,
  updateKOLStatus,
  getTweetsByAuthor,
} from "../storage/db";
import {
  startMonitor,
  stopMonitor,
  setOnNewTweets,
  type OnNewTweetsCallback,
} from "./monitor";
import type { TrackedKOL } from "../types";

export { setOnNewTweets } from "./monitor";

export async function addKOL(username: string): Promise<void> {
  const normalized = username.replace(/^@/, "").toLowerCase();
  addTrackedKOL(normalized);
  console.log(`[Harvest] Added @${normalized} to tracking list`);
}

export async function removeKOL(username: string): Promise<void> {
  const normalized = username.replace(/^@/, "").toLowerCase();
  removeTrackedKOL(normalized);
  console.log(`[Harvest] Removed @${normalized} from tracking list`);
}

export async function scrapeHistory(
  username: string,
  count?: number
): Promise<number> {
  const normalized = username.replace(/^@/, "").toLowerCase();
  const depth = count ?? config.harvest.historyDepth;

  console.log(`[Harvest] Scraping ${depth} historical tweets for @${normalized}...`);

  try {
    const result = await scrapeTweets(normalized, depth);
    insertTweets(result.tweets);
    updateKOLTweetCount(normalized, result.tweets.length);
    updateKOLStatus(normalized, "active");

    console.log(
      `[Harvest] @${normalized}: scraped ${result.tweets.length} tweets via ${result.source}`
    );
    return result.tweets.length;
  } catch (err) {
    updateKOLStatus(normalized, "error", (err as Error).message);
    throw err;
  }
}

export function getStatus(): TrackedKOL[] {
  return getTrackedKOLs();
}

export { startMonitor, stopMonitor };
