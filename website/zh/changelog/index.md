---
title: 更新日志
outline: false
---

<script setup>
import { data as releases } from '../../changelog/releases.data.ts'
</script>

# 更新日志

Yohaku 每个版本的变化，从新到旧。每一页都来自仓库里的 [`docs/yohaku/release-notes/`](https://github.com/Chaosnap/Yohaku/tree/main/docs/yohaku/release-notes)，安装包在 [GitHub Releases](https://github.com/Chaosnap/Yohaku/releases)。

<div class="releases">
  <a v-for="release in releases" :key="release.version" class="release" :href="release.version">
    <span class="version">{{ release.version }}</span>
    <span v-if="release.date" class="date">{{ release.date }}</span>
    <p class="summary">{{ release.summary }}</p>
  </a>
</div>
