/**
 * Tweet parsing: normalize raw API/scrape data into RawTweet format.
 */

import type { RawTweet, TweetMetrics, TweetContext } from "../types";

/** Parse a Twitter API v2 tweet object into RawTweet */
export function parseApiTweet(
  data: any,
  includes?: any
): RawTweet {
  const authorUser = includes?.users?.find(
    (u: any) => u.id === data.author_id
  );

  return {
    tweet_id: data.id,
    author_username: authorUser?.username ?? data.author_id ?? "unknown",
    text: data.text ?? "",
    created_at: data.created_at ?? new Date().toISOString(),
    metrics: parseApiMetrics(data.public_metrics),
    context: parseApiContext(data, includes),
  };
}

function parseApiMetrics(metrics: any): TweetMetrics {
  return {
    likes: metrics?.like_count ?? 0,
    retweets: metrics?.retweet_count ?? 0,
    replies: metrics?.reply_count ?? 0,
    views: metrics?.impression_count ?? 0,
  };
}

function parseApiContext(data: any, includes?: any): TweetContext {
  const entities = data.entities ?? {};
  const refs = data.referenced_tweets ?? [];

  const replyRef = refs.find((r: any) => r.type === "replied_to");
  const quoteRef = refs.find((r: any) => r.type === "quoted");

  return {
    is_thread: !!replyRef && replyRef.id !== undefined,
    thread_position: undefined,
    is_reply_to: replyRef?.id,
    is_quote_of: quoteRef?.id,
    media_urls: extractMediaUrls(includes?.media, data.attachments),
    urls: (entities.urls ?? []).map((u: any) => u.expanded_url ?? u.url),
    hashtags: (entities.hashtags ?? []).map((h: any) => h.tag),
    cashtags: (entities.cashtags ?? []).map((c: any) => c.tag),
  };
}

function extractMediaUrls(
  mediaIncludes: any[] | undefined,
  attachments: any
): string[] {
  if (!mediaIncludes || !attachments?.media_keys) return [];
  const keys = new Set(attachments.media_keys);
  return mediaIncludes
    .filter((m: any) => keys.has(m.media_key))
    .map((m: any) => m.url ?? m.preview_image_url ?? "")
    .filter(Boolean);
}

/** Parse an HTML-scraped tweet (from Nitter) into RawTweet */
export function parseNitterTweet(
  username: string,
  tweetEl: any
): RawTweet {
  const text = tweetEl.text ?? "";
  const cashtags = extractCashtags(text);
  const hashtags = extractHashtags(text);

  return {
    tweet_id: tweetEl.id ?? `nitter-${Date.now()}-${Math.random()}`,
    author_username: username,
    text,
    created_at: tweetEl.date ?? new Date().toISOString(),
    metrics: {
      likes: tweetEl.likes ?? 0,
      retweets: tweetEl.retweets ?? 0,
      replies: tweetEl.replies ?? 0,
      views: 0,
    },
    context: {
      is_thread: false,
      media_urls: tweetEl.images ?? [],
      urls: tweetEl.links ?? [],
      hashtags,
      cashtags,
    },
  };
}

export function extractCashtags(text: string): string[] {
  const matches = text.match(/\$[A-Za-z]{1,10}/g);
  return matches ? matches.map((m) => m.slice(1).toUpperCase()) : [];
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[A-Za-z0-9_]+/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}
