---
title: Changelog
outline: false
---

<script setup>
import { data as releases } from './releases.data.ts'
</script>

# Changelog

What changed in every version of Yohaku, newest first. Each page comes from [`docs/yohaku/release-notes/`](https://github.com/Chaosnap/Yohaku/tree/main/docs/yohaku/release-notes) in the repository, and the installers are on [GitHub Releases](https://github.com/Chaosnap/Yohaku/releases).

::: info Written in Chinese
Yohaku's release notes are written in Simplified Chinese, and these pages show them as they are. Your browser can translate them.
:::

<div class="releases">
  <a v-for="release in releases" :key="release.version" class="release" :href="release.version">
    <span class="version">{{ release.version }}</span>
    <span v-if="release.date" class="date">{{ release.date }}</span>
    <p class="summary">{{ release.summary }}</p>
  </a>
</div>
