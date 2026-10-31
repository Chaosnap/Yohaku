// VitePress's default theme in Yohaku's colours (custom.css), with the brand line above the title
// on the home page.

import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'home-hero-info-before': () =>
        h('p', { class: 'motto' }, 'A Quiet Place Between Words and Sound'),
    }),
};
