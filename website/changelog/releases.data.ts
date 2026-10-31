// The releases for the changelog's front page and the guide, newest first.

import { releases } from '../.vitepress/docs';

export interface ReleaseSummary {
  version: string;
  date?: string;
  /** The note's opening line, as plain text. */
  summary: string;
}

declare const data: ReleaseSummary[];
export { data };

export default {
  load: (): ReleaseSummary[] =>
    releases().map(({ version, date, summary }) => ({
      version,
      date,
      summary: summary.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*|`/g, ''),
    })),
};
