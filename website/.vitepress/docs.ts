// The documents the site reads straight from the repository, so it never keeps copies that could
// fall behind: the development documents in docs/yohaku and the release notes beside them.

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const repo = 'https://github.com/Chaosnap/Yohaku';

const docsDir = fileURLToPath(new URL('../../docs/yohaku/', import.meta.url));
const notesDir = `${docsDir}release-notes/`;

/** The development documents, in the order the sidebar lists them. */
export const devDocs = [
  { doc: '00-vision', text: '00 · 产品愿景与需求' },
  { doc: '01-feasibility', text: '01 · 技术可行性评估' },
  { doc: '02-architecture', text: '02 · 系统架构设计' },
  { doc: '03-roadmap', text: '03 · 改造计划与里程碑' },
  { doc: '04-ci-release', text: '04 · 构建、测试与发布' },
  { doc: 'upstream-patches', text: '对上游的改动登记' },
];

/** A development document as the site shows it: release notes are pages of the changelog here. */
export const readDevDoc = (doc: string) =>
  readFileSync(`${docsDir}${doc}.md`, 'utf8').replaceAll('](release-notes/', '](/changelog/');

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
