<script setup>
import { data as releases } from '../../changelog/releases.data.ts'
</script>

# 介绍

> **A Quiet Place Between Words and Sound.**<br>
> 在文字与声音之间，留一处属于自己的空白。

**余白**（よはく）是纸上留下的空白。Yohaku 想做的，就是这样一处空白：读一本书的时候，放一张自己收藏的唱片，或者让窗外下一场雨。书不必离开，音乐也不会打断你。

它把**阅读**和**听**放进同一个安静的地方：文学、漫画、你自己的音乐收藏、歌词、朗读和环境声音。Yohaku 支持 Windows、macOS、Linux 与 Android，免费，开源。

## 能做什么

- 📖 **[读书与漫画](./reading)**：EPUB、MOBI、AZW3、FB2、CBZ、PDF、TXT；横排与竖排；三款阅读主题；划线、笔记、书签、词典与翻译。
- 🎵 **[音乐库](./music)**：导入音乐文件夹，每次启动自动同步；按专辑、艺术家、歌曲、收藏浏览；读取标签与内嵌封面。
- 🎧 **[边读边听](./listening)**：页脚一键换成音乐控制条；在侧栏里换歌、看队列；竖着调音量。
- 🎼 **[歌词](./lyrics)**：`.lrc` 文件或内嵌歌词，逐行流动、逐字填色，翻译跟在原文下面。
- 🌧️ **[环境声音](./ambient)**：十种由 Yohaku 合成的声音，五个场景，每种都能单独调音量。
- 🗣️ **[朗读](./read-aloud)**：从当前页开始朗读，逐句高亮，调语速、定时关闭。
- 🔒 **[隐私](./privacy)**：没有账户、云端、付费墙与遥测，启动时不访问网络。

## 图标

![](/images/icon.svg){.page-icon}

Yohaku 的图标叫「留白」：夜色的底上，一本摊开的书。左页是几行字，右页几乎是空的，只落着一个朱红的音符。文字、声音，和它们之间的那一处空白，就是「余白」。

这也是 Yohaku 整体的样子：夜蓝、纸色、一点朱红，和很多留白。

## 与 Readest 的关系

Yohaku 基于开源阅读器 [Readest](https://github.com/readest/readest) v0.12.16 改造，与 Readest 一样以 [AGPL-3.0](https://github.com/Chaosnap/Yohaku/blob/main/LICENSE) 开源。

- **保留**：Readest 的阅读引擎（[foliate-js](https://github.com/johnfactotum/foliate-js)）、排版、批注、词典与翻译、OPDS 书源，以及 KOReader、WebDAV 等由你自己配置的同步。
- **去掉**：账户、云端服务、付费墙与遥测。Yohaku 启动时不访问网络，见[隐私](./privacy)。
- **加上**：音乐库、歌词、环境声音、页脚的音乐控制条、Yohaku 的阅读主题与一套留白很多的界面。

Yohaku 有自己的应用标识（`io.github.chaosnap.yohaku`），可以与 Readest 同时安装。对 Readest 代码的每一处改动都登记在[对上游的改动登记](/zh/dev/upstream-patches)里。

## 现在在哪里

当前版本是 **{{ releases[0].version }}**：阅读核心、音乐库、歌词、环境声音与朗读都已可用。下一步是「暗室」：一处安静的、只属于你的书与唱片的空间；之后还有留声机与更多声音。每个阶段的计划见[路线图](/zh/dev/03-roadmap)，每个版本的变化见[更新日志](/zh/changelog/)。

## 下一步

- [安装 Yohaku](./install)
- [看看截图](./gallery)
- [常见问题](./faq)
