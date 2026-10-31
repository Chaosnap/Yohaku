// The Yohaku documentation site, built with VitePress and published to GitHub Pages by
// .github/workflows/pages.yml. The guide is written here; the development documents and the
// changelog are read from docs/yohaku (see docs.ts).

import { type DefaultTheme, defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { devDocs, releases, repo } from './docs';

const base = '/Yohaku/';
const site = `https://chaosnap.github.io${base}`;
const all = releases();
const latest = all[0]?.version ?? '';

const guide: DefaultTheme.SidebarItem[] = [
  {
    text: '开始',
    items: [
      { text: '介绍', link: '/guide/' },
      { text: '安装', link: '/guide/install' },
      { text: '截图', link: '/guide/gallery' },
    ],
  },
  {
    text: '使用',
    items: [
      { text: '读书与漫画', link: '/guide/reading' },
      { text: '音乐库', link: '/guide/music' },
      { text: '边读边听', link: '/guide/listening' },
      { text: '歌词', link: '/guide/lyrics' },
      { text: '环境声音', link: '/guide/ambient' },
      { text: '朗读', link: '/guide/read-aloud' },
      { text: '快捷键', link: '/guide/shortcuts' },
    ],
  },
  {
    text: '参考',
    items: [
      { text: '隐私', link: '/guide/privacy' },
      { text: '常见问题', link: '/guide/faq' },
      { text: '云端构建', link: '/guide/building' },
      { text: '更新日志', link: '/changelog/' },
    ],
  },
];

/** Releases go under their major version; the 0.0.x previews together. */
const series = (version: string) => {
  const major = Number(version.slice(1).split('.')[0]);
  return major === 0 ? '预览版' : `${major}.x`;
};

const changelog: DefaultTheme.SidebarItem[] = [
  { text: '更新日志', items: [{ text: '全部版本', link: '/changelog/' }] },
  ...[...new Set(all.map(({ version }) => series(version)))].map((text) => ({
    text,
    collapsed: text === '预览版',
    items: all
      .filter(({ version }) => series(version) === text)
      .map(({ version }) => ({ text: version, link: `/changelog/${version}` })),
  })),
];

const dev: DefaultTheme.SidebarItem[] = [
  {
    text: '开发文档',
    items: [
      { text: '概览', link: '/dev/' },
      ...devDocs.map(({ doc, text }) => ({ text, link: `/dev/${doc}` })),
    ],
  },
];

/** Heading anchors as GitHub makes them, which the documents in docs/yohaku link to. */
const slugify = (heading: string) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');

const fonts =
  'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;600;700&display=swap';

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: 'Yohaku',
    titleTemplate: ':title · Yohaku',
    description:
      '在文字与声音之间，留一处属于自己的空白。读书、看漫画、听自己的音乐收藏的安静应用，支持 Windows、macOS、Linux 与 Android。',
    base,
    cleanUrls: true,
    appearance: 'dark',
    ignoreDeadLinks: 'localhostLinks',
    sitemap: { hostname: site },

    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}images/icon.svg` }],
      ['meta', { name: 'theme-color', content: '#131829' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: 'Yohaku · 余白' }],
      ['meta', { property: 'og:image', content: `${site}images/desktop-reading.jpg` }],
      ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
      ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
      // Loaded without holding up the page: where Google Fonts cannot be reached, the headings
      // fall back to the serif fonts the system has.
      ['link', { rel: 'stylesheet', href: fonts, media: 'print', onload: "this.media='all'" }],
    ],

    markdown: {
      anchor: { slugify },
      image: { lazyLoading: true },
      container: {
        tipLabel: '提示',
        warningLabel: '注意',
        dangerLabel: '警告',
        infoLabel: '说明',
        detailsLabel: '详细信息',
        noteLabel: '注',
        importantLabel: '重要',
        cautionLabel: '小心',
      },
    },

    themeConfig: {
      logo: '/images/icon.svg',
      siteTitle: 'Yohaku · 余白',

      nav: [
        { text: '指南', link: '/guide/', activeMatch: '/guide/' },
        { text: '更新日志', link: '/changelog/', activeMatch: '/changelog/' },
        { text: '开发文档', link: '/dev/', activeMatch: '/dev/' },
        {
          text: latest,
          items: [
            { text: '下载最新版本', link: `${repo}/releases/latest` },
            { text: '这一版的变化', link: `/changelog/${latest}` },
            { text: '全部发布', link: `${repo}/releases` },
          ],
        },
      ],

      sidebar: { '/guide/': guide, '/changelog/': changelog, '/dev/': dev },
      socialLinks: [{ icon: 'github', link: repo }],

      search: {
        provider: 'local',
        options: {
          miniSearch: {
            options: {
              // Chinese has no spaces between words, so the text is cut into words the way the
              // browser's own segmenter does. This runs in the browser too, so it uses nothing
              // from outside itself.
              tokenize: (text: string) =>
                Array.from(new Intl.Segmenter('zh-CN', { granularity: 'word' }).segment(text))
                  .filter((part) => part.isWordLike)
                  .map((part) => part.segment),
            },
          },
          translations: {
            button: { buttonText: '搜索', buttonAriaLabel: '搜索文档' },
            modal: {
              displayDetails: '显示详细列表',
              resetButtonTitle: '清除查询',
              backButtonTitle: '关闭搜索',
              noResultsText: '没有找到相关结果',
              footer: {
                selectText: '选择',
                navigateText: '切换',
                closeText: '关闭',
              },
            },
          },
        },
      },

      editLink: {
        // Runs in the browser as well, so it uses nothing from outside itself.
        pattern: ({ relativePath, params }) => {
          const source = 'https://github.com/Chaosnap/Yohaku/edit/main/';
          if (params?.doc) return `${source}docs/yohaku/${params.doc}.md`;
          if (params?.version) return `${source}docs/yohaku/release-notes/${params.version}.md`;
          return `${source}website/${relativePath}`;
        },
        text: '在 GitHub 上编辑此页',
      },

      outline: { level: [2, 3], label: '本页目录' },
      docFooter: { prev: '上一页', next: '下一页' },
      darkModeSwitchLabel: '外观',
      lightModeSwitchTitle: '切换到浅色模式',
      darkModeSwitchTitle: '切换到深色模式',
      sidebarMenuLabel: '目录',
      returnToTopLabel: '回到顶部',
      externalLinkIcon: true,

      notFound: {
        title: '这一页留白了',
        quote: '你要找的页面不在这里：也许换了地方，也许它本来就是一处空白。',
        linkLabel: '回到首页',
        linkText: '回到首页',
      },

      footer: {
        message: `以 <a href="${repo}/blob/main/LICENSE">AGPL-3.0</a> 许可证开源 · 基于 <a href="https://github.com/readest/readest">Readest</a>`,
        copyright: '© Yohaku 贡献者',
      },
    },
  }),
);
