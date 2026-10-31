// The Yohaku documentation site, built with VitePress and published to GitHub Pages by
// .github/workflows/pages.yml. English is at the root and Simplified Chinese under /zh/. The guide
// is written here in both languages; the development documents and the changelog are read from
// docs/yohaku (see docs.ts) and are in Chinese in both.

import { type DefaultTheme, defineConfig, type PageData } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { devDocs, type Locale, releases, repo } from './docs';

const base = '/Yohaku/';
const site = `https://chaosnap.github.io${base}`;
const all = releases();
const latest = all[0]?.version ?? '';

/** Where a locale's pages live. */
const root = (locale: Locale) => (locale === 'zh' ? '/zh/' : '/');

/** The guide's sidebar: pages under the locale's root, with their titles in each language. */
const guideGroups = [
  {
    en: 'Getting started',
    zh: '开始',
    pages: [
      ['guide/', 'Introduction', '介绍'],
      ['guide/install', 'Install', '安装'],
      ['guide/gallery', 'Gallery', '截图'],
    ],
  },
  {
    en: 'Using Yohaku',
    zh: '使用',
    pages: [
      ['guide/reading', 'Books and comics', '读书与漫画'],
      ['guide/music', 'The music library', '音乐库'],
      ['guide/listening', 'Listening while reading', '边读边听'],
      ['guide/lyrics', 'Lyrics', '歌词'],
      ['guide/ambient', 'Ambient sounds', '环境声音'],
      ['guide/read-aloud', 'Read aloud', '朗读'],
      ['guide/shortcuts', 'Shortcuts', '快捷键'],
    ],
  },
  {
    en: 'Reference',
    zh: '参考',
    pages: [
      ['guide/privacy', 'Privacy', '隐私'],
      ['guide/faq', 'Questions', '常见问题'],
      ['guide/building', 'Built in the cloud', '云端构建'],
      ['changelog/', 'Changelog', '更新日志'],
    ],
  },
];

const guide = (locale: Locale): DefaultTheme.SidebarItem[] =>
  guideGroups.map((group) => ({
    text: group[locale],
    items: group.pages.map(([page, en, zh]) => ({
      text: locale === 'zh' ? zh : en,
      link: `${root(locale)}${page}`,
    })),
  }));

/** Releases go under their major version; the 0.0.x previews together. */
const series = (version: string, locale: Locale) => {
  const major = Number(version.slice(1).split('.')[0]);
  if (major > 0) return `${major}.x`;
  return locale === 'zh' ? '预览版' : 'Previews';
};

const changelog = (locale: Locale): DefaultTheme.SidebarItem[] => [
  {
    text: locale === 'zh' ? '更新日志' : 'Changelog',
    items: [
      { text: locale === 'zh' ? '全部版本' : 'All releases', link: `${root(locale)}changelog/` },
    ],
  },
  ...[...new Set(all.map(({ version }) => series(version, locale)))].map((text) => ({
    text,
    collapsed: !text.endsWith('.x'),
    items: all
      .filter(({ version }) => series(version, locale) === text)
      .map(({ version }) => ({ text: version, link: `${root(locale)}changelog/${version}` })),
  })),
];

const dev = (locale: Locale): DefaultTheme.SidebarItem[] => [
  {
    text: locale === 'zh' ? '开发文档' : 'Development',
    items: [
      { text: locale === 'zh' ? '概览' : 'Overview', link: `${root(locale)}dev/` },
      ...devDocs.map((doc) => ({ text: doc[locale], link: `${root(locale)}dev/${doc.doc}` })),
    ],
  },
];

const nav = (locale: Locale): DefaultTheme.NavItem[] => {
  const zh = locale === 'zh';
  const at = root(locale);
  return [
    { text: zh ? '指南' : 'Guide', link: `${at}guide/`, activeMatch: `^${at}guide/` },
    {
      text: zh ? '更新日志' : 'Changelog',
      link: `${at}changelog/`,
      activeMatch: `^${at}changelog/`,
    },
    { text: zh ? '开发文档' : 'Development', link: `${at}dev/`, activeMatch: `^${at}dev/` },
    {
      text: latest,
      items: [
        { text: zh ? '下载最新版本' : 'Download the latest', link: `${repo}/releases/latest` },
        { text: zh ? '这一版的变化' : "What's new in it", link: `${at}changelog/${latest}` },
        { text: zh ? '全部发布' : 'All releases', link: `${repo}/releases` },
      ],
    },
  ];
};

// Runs in the browser as well, so it uses nothing from outside itself.
const editPattern = ({ relativePath, params }: PageData) => {
  const source = 'https://github.com/Chaosnap/Yohaku/edit/main/';
  if (params?.doc) return `${source}docs/yohaku/${params.doc}.md`;
  if (params?.version) return `${source}docs/yohaku/release-notes/${params.version}.md`;
  return `${source}website/${relativePath}`;
};

const license = `<a href="${repo}/blob/main/LICENSE">AGPL-3.0</a>`;
const readest = '<a href="https://github.com/readest/readest">Readest</a>';

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
    lang: 'en-US',
    title: 'Yohaku',
    titleTemplate: ':title · Yohaku',
    description:
      'A quiet place between words and sound: a reader for books and comics, with your own music library, lyrics, read-aloud and ambient sounds, for Windows, macOS, Linux and Android.',
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
    },

    themeConfig: {
      logo: '/images/icon.svg',
      siteTitle: 'Yohaku · 余白',
      socialLinks: [{ icon: 'github', link: repo }],
      outline: { level: [2, 3] },
      externalLinkIcon: true,

      search: {
        provider: 'local',
        options: {
          miniSearch: {
            options: {
              // Chinese has no spaces between words, so text is cut into words the way the
              // browser's own segmenter does. This runs in the browser too, so it uses nothing
              // from outside itself.
              tokenize: (text: string) =>
                Array.from(new Intl.Segmenter('zh-CN', { granularity: 'word' }).segment(text))
                  .filter((part) => part.isWordLike)
                  .map((part) => part.segment),
            },
          },
          locales: {
            zh: {
              translations: {
                button: { buttonText: '搜索', buttonAriaLabel: '搜索文档' },
                modal: {
                  displayDetails: '显示详细列表',
                  resetButtonTitle: '清除查询',
                  backButtonTitle: '关闭搜索',
                  noResultsText: '没有找到相关结果',
                  footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
                },
              },
            },
          },
        },
      },
    },

    locales: {
      root: {
        label: 'English',
        lang: 'en-US',
        themeConfig: {
          nav: nav('en'),
          sidebar: { '/guide/': guide('en'), '/changelog/': changelog('en'), '/dev/': dev('en') },
          editLink: { pattern: editPattern, text: 'Edit this page on GitHub' },
          notFound: {
            title: 'This page was left blank',
            quote:
              "The page you are looking for isn't here. Perhaps it moved; perhaps it was always a blank space.",
            linkLabel: 'Go to the home page',
            linkText: 'Take me home',
          },
          footer: {
            message: `Released under the ${license} licence · Built on ${readest}`,
            copyright: '© Yohaku contributors',
          },
        },
      },
      zh: {
        label: '简体中文',
        lang: 'zh-CN',
        link: '/zh/',
        description:
          '在文字与声音之间，留一处属于自己的空白。读书、看漫画、听自己的音乐收藏的安静应用，支持 Windows、macOS、Linux 与 Android。',
        themeConfig: {
          nav: nav('zh'),
          sidebar: {
            '/zh/guide/': guide('zh'),
            '/zh/changelog/': changelog('zh'),
            '/zh/dev/': dev('zh'),
          },
          editLink: { pattern: editPattern, text: '在 GitHub 上编辑此页' },
          outline: { level: [2, 3], label: '本页目录' },
          docFooter: { prev: '上一页', next: '下一页' },
          darkModeSwitchLabel: '外观',
          lightModeSwitchTitle: '切换到浅色模式',
          darkModeSwitchTitle: '切换到深色模式',
          sidebarMenuLabel: '目录',
          returnToTopLabel: '回到顶部',
          langMenuLabel: '语言',
          notFound: {
            title: '这一页留白了',
            quote: '你要找的页面不在这里：也许换了地方，也许它本来就是一处空白。',
            linkLabel: '回到首页',
            linkText: '回到首页',
          },
          footer: {
            message: `以 ${license} 许可证开源 · 基于 ${readest}`,
            copyright: '© Yohaku 贡献者',
          },
        },
      },
    },
  }),
);
