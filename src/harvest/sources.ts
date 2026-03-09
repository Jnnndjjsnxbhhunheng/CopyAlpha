/**
 * Data source management with fallback strategy:
 * Twitter API v2 (P0) → Nitter (P1) → Browser automation (P2)
 */

import { config } from "../shared/config";

export type SourceType = "twitter-api" | "nitter" | "browser";

export interface DataSource {
  type: SourceType;
  available: boolean;
  priority: number;
}

export function getAvailableSources(): DataSource[] {
  const sources: DataSource[] = [];

  if (config.twitter.bearerToken) {
    sources.push({
      type: "twitter-api",
      available: true,
      priority: 0,
    });
  }

  if (config.twitter.nitterInstances.length > 0) {
    sources.push({
      type: "nitter",
      available: true,
      priority: 1,
    });
  }

  // Browser automation always available as last resort
  sources.push({
    type: "browser",
    available: true,
    priority: 2,
  });

  return sources.sort((a, b) => a.priority - b.priority);
}

export function getBestSource(): DataSource {
  const sources = getAvailableSources();
  const best = sources.find((s) => s.available);
  if (!best) {
    throw new Error("No data source available");
  }
  return best;
}

export function getHealthyNitterInstance(): string | null {
  const instances = config.twitter.nitterInstances;
  if (instances.length === 0) return null;
  // Round-robin: pick random instance
  return instances[Math.floor(Math.random() * instances.length)];
}
