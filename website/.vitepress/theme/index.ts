// VitePress's default theme in Yohaku's colours (custom.css), with a brand line above the title on
// the home page, taken from the page's `hero.motto`.

import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';

import './custom.css';

const Motto = () => {
  const motto = useData().frontmatter.value.hero?.motto;
  return motto ? h('p', { class: 'motto' }, motto) : null;
};

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-info-before': () => h(Motto) }),
};
