/**
 * Data source management — SocialData API only.
 */

import { config } from "../shared/config";

export type SourceType = "socialdata";

export interface DataSource {
  type: SourceType;
  available: boolean;
}

export function getSource(): DataSource {
  if (!config.socialdata.apiKey) {
    throw new Error(
      "SOCIALDATA_API_KEY is required. Get one at https://socialdata.tools"
    );
  }
  return { type: "socialdata", available: true };
}
