/**
 * Tweet parsing: normalize SocialData API responses into RawTweet format.
 */

import type { RawTweet, TweetMetrics, TweetContext } from "../types";

/**
 * Parse a SocialData API tweet object into RawTweet.
 *
 * SocialData response shape (key fields):
 *   id_str, full_text, tweet_created_at,
 *   favorite_count, retweet_count, reply_count, quote_count, views_count,
 *   in_reply_to_status_id_str, is_quote_status,
 *   user.screen_name,
 *   entities.urls[], entities.hashtags[], entities.symbols[],
 *   entities.media[]
 */
export function parseSocialDataTweet(data: any): RawTweet {
  return {
    tweet_id: data.id_str ?? String(data.id ?? ""),
    author_username: data.user?.screen_name ?? "unknown",
    text: data.full_text ?? data.text ?? "",
    created_at: data.tweet_created_at ?? new Date().toISOString(),
    metrics: parseMetrics(data),
    context: parseContext(data),
  };
}

function parseMetrics(data: any): TweetMetrics {
  return {
    likes: data.favorite_count ?? 0,
    retweets: data.retweet_count ?? 0,
    replies: data.reply_count ?? 0,
    views: data.views_count ?? 0,
  };
}

function parseContext(data: any): TweetContext {
  const entities = data.entities ?? {};

  const urls: string[] = (entities.urls ?? []).map(
    (u: any) => u.expanded_url ?? u.url ?? ""
  ).filter(Boolean);

  const hashtags: string[] = (entities.hashtags ?? []).map(
    (h: any) => h.text ?? h.tag ?? ""
  ).filter(Boolean);

  const symbols: string[] = (entities.symbols ?? []).map(
    (s: any) => s.text ?? ""
  ).filter(Boolean);

  const mediaUrls: string[] = (entities.media ?? []).map(
    (m: any) => m.media_url_https ?? m.media_url ?? ""
  ).filter(Boolean);

  // Also extract cashtags from text as fallback
  const textCashtags = extractCashtags(data.full_text ?? data.text ?? "");
  const allCashtags = [
    ...symbols,
    ...textCashtags.filter((c) => !symbols.includes(c)),
  ];

  return {
    is_thread: false,
    is_reply_to: data.in_reply_to_status_id_str ?? undefined,
    is_quote_of: data.is_quote_status ? data.quoted_status_id_str : undefined,
    media_urls: mediaUrls,
    urls,
    hashtags,
    cashtags: allCashtags,
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
