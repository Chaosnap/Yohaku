// The documents the site reads straight from the repository, so it never keeps copies that could
// fall behind: the development documents in docs/yohaku and the release notes beside them.

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const repo = 'https://github.com/Chaosnap/Yohaku';

const docsDir = fileURLToPath(new URL('../../docs/yohaku/', import.meta.url));
const notesDir = `${docsDir}release-notes/`;

export type Locale = 'en' | 'zh';

/** The development documents, in the order the sidebar lists them. */
export const devDocs = [
  { doc: '00-vision', en: '00 · Product vision', zh: '00 · 产品愿景与需求' },
  { doc: '01-feasibility', en: '01 · Feasibility study', zh: '01 · 技术可行性评估' },
  { doc: '02-architecture', en: '02 · Architecture', zh: '02 · 系统架构设计' },
  { doc: '03-roadmap', en: '03 · Roadmap and milestones', zh: '03 · 改造计划与里程碑' },
  { doc: '04-ci-release', en: '04 · Builds, tests and releases', zh: '04 · 构建、测试与发布' },
  { doc: 'upstream-patches', en: 'Changes to Readest', zh: '对上游的改动登记' },
];

const inChinese = `::: info Written in Chinese
Yohaku's development documents are written in Simplified Chinese, and this page shows the original. Your browser can translate it.
:::`;

/**
 * A development document as a locale shows it: release notes are pages of that locale's
 * changelog, and the English pages say under the title that the document is in Chinese.
 */
export const readDevDoc = (doc: string, locale: Locale) => {
  const text = readFileSync(`${docsDir}${doc}.md`, 'utf8').replaceAll(
    '](release-notes/',
    locale === 'zh' ? '](/zh/changelog/' : '](/changelog/',
  );
  if (locale === 'zh') return text;
  const [title, ...rest] = text.split('\n');
  return [title, '', inChinese, ...rest].join('\n');
};

export interface Release {
  /** The tag, such as v2.0.0. */
  version: string;
  /** The note's opening line. */
  summary: string;
  /** The day of the tagged commit, when the checkout has the tag. */
  date?: string;
  body: string;
}

const numbers = (version: string) => version.slice(1).split('.').map(Number);

const newerFirst = (a: string, b: string) => {
  const [x, y] = [numbers(a), numbers(b)];
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return (y[i] ?? 0) - (x[i] ?? 0);
  }
  return 0;
};

const tagDate = (version: string) => {
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cs', version], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return date.trim() || undefined;
  } catch {
    return undefined;
  }
};

/** Every release with a note in docs/yohaku/release-notes, newest first. */
export const releases = (): Release[] =>
  readdirSync(notesDir)
    .filter((name) => /^v\d+\.\d+\.\d+\.md$/.test(name))
    .map((name) => name.slice(0, -3))
    .sort(newerFirst)
    .map((version) => {
      const body = readFileSync(`${notesDir}${version}.md`, 'utf8').trim();
      return { version, summary: body.split('\n')[0] ?? '', date: tagDate(version), body };
    });

/** A release's page: its version, date and download link above the note. */
export const releasePage = ({ version, date, body }: Release, locale: Locale) => {
  const download = locale === 'zh' ? '在 GitHub 上下载' : 'Download on GitHub';
  const meta = [date, `<a href="${repo}/releases/tag/${version}">${download}</a>`];
  if (locale === 'en') meta.push('Notes in Chinese');
  return `# ${version}\n\n<p class="release-meta">${meta.filter(Boolean).join(' · ')}</p>\n\n${body}\n`;
};
