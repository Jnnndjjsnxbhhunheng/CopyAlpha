/**
 * Incremental monitoring: poll for new tweets from tracked KOLs.
 */

import cron from "node-cron";
import { config } from "../shared/config";
import { scrapeTweets } from "./scraper";
import {
  getTrackedKOLs,
  insertTweets,
  getLatestTweetId,
  updateKOLStatus,
  updateKOLTweetCount,
  getTweetsByAuthor,
} from "../storage/db";

export type OnNewTweetsCallback = (
  username: string,
  count: number
) => void | Promise<void>;

let cronTask: cron.ScheduledTask | null = null;
let onNewTweets: OnNewTweetsCallback | null = null;

export function setOnNewTweets(cb: OnNewTweetsCallback): void {
  onNewTweets = cb;
}

export function startMonitor(): void {
  if (cronTask) {
    console.log("[Monitor] Already running");
    return;
  }

  const intervalSec = config.harvest.intervalSeconds;
  const cronExpr =
    intervalSec >= 60
      ? `*/${Math.floor(intervalSec / 60)} * * * *`
      : `*/${intervalSec} * * * * *`;

  console.log(
    `[Monitor] Starting poll every ${intervalSec}s`
  );

  cronTask = cron.schedule(cronExpr, () => {
    pollAllKOLs().catch((err) =>
      console.error("[Monitor] Poll error:", err.message)
    );
  });
}

export function stopMonitor(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log("[Monitor] Stopped");
  }
}

async function pollAllKOLs(): Promise<void> {
  const kols = getTrackedKOLs("active");
  const maxConcurrent = config.harvest.maxConcurrent;

  for (let i = 0; i < kols.length; i += maxConcurrent) {
    const batch = kols.slice(i, i + maxConcurrent);
    await Promise.allSettled(
      batch.map((kol) => pollSingleKOL(kol.username))
    );
  }
}

async function pollSingleKOL(username: string): Promise<void> {
  try {
    const sinceId = getLatestTweetId(username) ?? undefined;
    const result = await scrapeTweets(username, 50, sinceId);

    if (result.tweets.length === 0) return;

    insertTweets(result.tweets);

    const total = getTweetsByAuthor(username, 99999).length;
    updateKOLTweetCount(username, total);
    updateKOLStatus(username, "active");

    console.log(
      `[Monitor] @${username}: +${result.tweets.length} tweets (total: ${total})`
    );

    if (onNewTweets) {
      await onNewTweets(username, result.tweets.length);
    }
  } catch (err) {
    console.error(
      `[Monitor] @${username} poll failed:`,
      (err as Error).message
    );
    updateKOLStatus(username, "error", (err as Error).message);
  }
}
