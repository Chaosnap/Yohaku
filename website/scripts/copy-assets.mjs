// Copies the icon and the screenshots into public/images before the site is built or served, so
// the site always shows the same pictures as the README. public/images is not committed.

import { cpSync, mkdirSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const images = new URL('../public/images/', import.meta.url);

mkdirSync(images, { recursive: true });
cpSync(new URL('assets-src/icon/yohaku-icon.svg', root), new URL('icon.svg', images));
cpSync(new URL('docs/screenshots/', root), images, { recursive: true });
