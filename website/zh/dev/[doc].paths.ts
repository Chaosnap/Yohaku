// One page for each development document in docs/yohaku, read when the site is built.

import { devDocs, readDevDoc } from '../../.vitepress/docs';

export default {
  paths: () => devDocs.map(({ doc }) => ({ params: { doc }, content: readDevDoc(doc, 'zh') })),
};
