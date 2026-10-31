// One page for each release note in docs/yohaku/release-notes, read when the site is built. The
// notes are written in Chinese; the English pages show them as they are.

import { releasePage, releases } from '../.vitepress/docs';

export default {
  paths: () =>
    releases().map((release) => ({
      params: { version: release.version },
      content: releasePage(release, 'en'),
    })),
};
