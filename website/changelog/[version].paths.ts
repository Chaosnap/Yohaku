// One page for each release note in docs/yohaku/release-notes, read when the site is built.

import { releases, repo } from '../.vitepress/docs';

export default {
  paths: () =>
    releases().map(({ version, date, body }) => {
      const download = `<a href="${repo}/releases/tag/${version}">在 GitHub 上下载</a>`;
      const meta = date ? `${date} · ${download}` : download;
      return {
        params: { version },
        content: `# ${version}\n\n<p class="release-meta">${meta}</p>\n\n${body}\n`,
      };
    }),
};
