// One page for each release note in docs/yohaku/release-notes, read when the site is built.

import { releasePage, releases } from '../../.vitepress/docs';

export default {
  paths: () =>
    releases().map((release) => ({
      params: { version: release.version },
      content: releasePage(release, 'zh'),
    })),
};
