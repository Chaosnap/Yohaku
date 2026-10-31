// One page for each development document in docs/yohaku, read when the site is built. The
// documents are written in Chinese; the English pages show them with a note saying so.

import { devDocs, readDevDoc } from '../.vitepress/docs';

export default {
  paths: () => devDocs.map(({ doc }) => ({ params: { doc }, content: readDevDoc(doc, 'en') })),
};
