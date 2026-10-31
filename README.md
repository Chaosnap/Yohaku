<p align="center">
  <img src="assets-src/icon/yohaku-icon.svg" width="152" alt="Yohaku 的图标：一本摊开的书，左页是字，右页留白，只落着一个朱红的音符">
</p>

<h1 align="center">Yohaku · 余白</h1>

<p align="center">
  <strong>A Quiet Place Between Words and Sound.</strong><br>
  在文字与声音之间，留一处属于自己的空白。
</p>

<p align="center">
  <a href="https://github.com/Chaosnap/Yohaku/releases/latest"><img src="https://img.shields.io/github/v/release/Chaosnap/Yohaku?style=flat-square&label=release&color=d2543c" alt="最新版本"></a>
  <img src="https://img.shields.io/badge/platform-Windows%20%C2%B7%20macOS%20%C2%B7%20Linux%20%C2%B7%20Android-2c365c?style=flat-square" alt="平台：Windows、macOS、Linux、Android">
  <a href="PRIVACY.md"><img src="https://img.shields.io/badge/offline-no%20account%20%C2%B7%20no%20telemetry-3e6b5c?style=flat-square" alt="离线：没有账户，没有遥测"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-5b6478?style=flat-square" alt="许可证：AGPL-3.0"></a>
  <img src="https://img.shields.io/badge/built%20with-Tauri%202-24c8db?style=flat-square&logo=tauri&logoColor=white" alt="基于 Tauri 2">
</p>

<p align="center">
  <a href="#features">✨ 功能</a> ·
  <a href="#screenshots">🖼️ 截图</a> ·
  <a href="#download">⬇️ 下载</a> ·
  <a href="docs/yohaku/03-roadmap.md">🗺️ 路线图</a> ·
  <a href="PRIVACY.md">🔒 隐私</a>
</p>

<p align="center">
  <img src="docs/screenshots/desktop-reading.jpg" width="100%" alt="Yohaku 的阅读界面：左侧是正在播放的歌曲与随歌声流动的歌词，中间是《老人与海》的正文，右侧是笔记本，页脚是音乐控制条">
</p>

## 🍃 余白

**余白**（よはく）是纸上留下的空白。Yohaku 想做的，就是这样一处空白：读一本书的时候，放一张自己收藏的唱片，或者让窗外下一场雨。书不必离开，音乐也不会打断你。

它把**阅读**和**听**放进同一个安静的地方：文学、漫画、你自己的音乐收藏、歌词、朗读和环境声音，支持 Windows、macOS、Linux 与 Android。Yohaku 基于开源阅读器 [Readest](https://github.com/readest/readest) 改造，去掉了账户、云端、付费墙与遥测，再加上自己的音乐库、歌词与环境声音，以及一套留白很多的界面。

图标是一本摊开的书：左页是字，右页几乎是空的，只落着一个朱红的音符。文字、声音，和它们之间的那一处空白，就是「余白」。

<a id="features"></a>

## ✨ 能做什么

### 📖 读书与漫画

- EPUB、MOBI、AZW3、FB2、CBZ、PDF、TXT 等格式；横排与竖排，单栏与双栏。
- 为中文、日文、英文分别调好的默认排版，三款 Yohaku 阅读主题：**暖纸**、**月白**、**墨夜**。
- 高亮、笔记、书签，和浮在页面旁的笔记本卡片；词典、翻译与全文搜索。
- 漫画按 ComicInfo.xml 里的方向打开，也可以设为默认从右到左。

### 🎵 自己的音乐库

- 「从文件夹导入」一个音乐文件夹，之后每次启动自动同步；或者「从本地文件导入」逐首加入。音乐文件只被引用，不会被复制或修改。
- 按**专辑**、**艺术家**、**歌曲**、**收藏**浏览与搜索；专辑与歌曲都有详情页：年份、流派、格式、比特率、采样率、文件大小与位置。
- 读取 FLAC、MP3、AAC / M4A、ALAC、Ogg、Opus、WAV、AIFF 等格式的标签与内嵌封面。
- Android 上切到后台、锁屏后继续播放，锁屏、通知栏与蓝牙耳机都能控制。

### 🎧 边读边听

- 书页上不浮任何播放器：点页脚的 🎵，整条页脚就换成音乐控制条（上一首、播放、下一首、进度、收藏、音量），再点一下换回阅读。
- 音量是一条竖着的滑杆，调好后自己收起。
- 侧栏里有**歌曲**（队列、全部、收藏）与**歌词**：`.lrc` 文件或内嵌歌词逐行流动、逐字填色，翻译行跟在原文下面。
- 读书时不用离开键盘：`M` 播放 / 暂停，`,` 与 `.` 切换上一首、下一首。

### 🌧️ 环境声音

- 雨、屋檐雨、风、海浪、壁炉、森林、蝉鸣、夜晚虫鸣、溪流、唱片底噪，十种声音全部由 Yohaku 自己合成，不需要任何文件。
- **雨夜**、**夏日午后**、**黄昏海边**、**夜间水族馆**、**冬日书房**五个场景一键开启；每种声音都能单独开关、调节音量。
- 可以单独播放，也可以与音乐或朗读叠加；每次打开都从安静开始。

### 🗣️ 朗读

- 右上角的朗读面板：从当前页开始朗读，逐句高亮，可以调语速、设定时。
- 系统语音之外，也可以开启在线语音。

### 🔒 安静，也私密

- 没有账户、没有云端、没有付费墙，也没有遥测；启动时不访问网络。
- 书库同步只用你自己配置的 WebDAV、S3、KOReader 或 OPDS。详见[隐私说明](PRIVACY.md)。

<a id="screenshots"></a>

## 🖼️ 截图

### 📚 阅读与书库

<table>
  <tr>
    <td colspan="2"><img src="docs/screenshots/desktop-reader.jpg" width="100%" alt="阅读《献给阿尔吉侬的花束》：左侧是目录，正文分两栏"><br><sub>目录在侧，正文分两栏；底部是阅读的页脚</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/desktop-library.jpg" width="100%" alt="书库：封面网格"><br><sub>书库：顶部的「书籍 / 音乐」一键切换</sub></td>
    <td width="50%"><img src="docs/screenshots/desktop-book-details.jpg" width="100%" alt="书籍详情：出版社、语言、格式、页数等"><br><sub>书籍详情，最后一格「+」导入新书</sub></td>
  </tr>
</table>

### 🎵 音乐库

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/desktop-music-albums.jpg" width="100%" alt="音乐库的专辑网格"><br><sub>专辑、艺术家、歌曲、收藏、文件夹</sub></td>
    <td width="50%"><img src="docs/screenshots/desktop-music-player.jpg" width="100%" alt="音乐库底部的磨砂玻璃播放器"><br><sub>单独听歌时，底部是一张磨砂玻璃播放器</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/desktop-music-songs.jpg" width="100%" alt="歌曲列表：收藏与详情按钮"><br><sub>歌曲列表：心形收藏，ⓘ 查看详情</sub></td>
    <td width="50%"><img src="docs/screenshots/desktop-album-details.jpg" width="100%" alt="专辑详情：艺术家、时长、格式、文件大小"><br><sub>专辑详情</sub></td>
  </tr>
</table>

### 🎧 边读边听

<table>
  <tr>
    <td colspan="2"><img src="docs/screenshots/desktop-read-aloud.jpg" width="100%" alt="朗读面板与环境声音场景，页脚是音乐控制条，右下角竖着音量条"><br><sub>右上角的朗读面板与环境声音；页脚换成音乐控制条，音量竖着调</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/desktop-lyrics.jpg" width="100%" alt="侧栏的歌词，日文原文与中文翻译"><br><sub>歌词逐行流动，翻译跟在原文下面</sub></td>
    <td width="50%"><img src="docs/screenshots/desktop-sidebar-songs.jpg" width="100%" alt="侧栏的歌曲：队列、全部、收藏"><br><sub>不离开书页就能换歌</sub></td>
  </tr>
</table>

### 📱 Android

<p align="center">
  <img src="docs/screenshots/android-comics.jpg" width="260" alt="在 Android 上读漫画，底部是音乐控制条">
  &nbsp;&nbsp;
  <img src="docs/screenshots/android-themes.jpg" width="260" alt="在 Android 上读漫画，底部是阅读主题：默认、暖纸、月白、墨夜">
</p>
<p align="center"><sub>手机上读漫画：页脚同样可以换成音乐控制条；三款 Yohaku 阅读主题</sub></p>

<a id="download"></a>

## ⬇️ 下载

在 [Releases](https://github.com/Chaosnap/Yohaku/releases/latest) 下载对应平台：

| 平台 | 文件 | 说明 |
|---|---|---|
| 🪟 Windows | `…_windows_x64-setup.exe`（安装版）、`…_windows_x64-portable.exe`（便携版） | 可能出现 SmartScreen 提示，选择「更多信息 → 仍要运行」 |
| 🍎 macOS | `…_macos_universal.dmg` | 未经 Apple 公证；首次打开被拦截时，到「系统设置 → 隐私与安全性」点击「仍要打开」 |
| 🐧 Linux | `…_linux_amd64.AppImage`、`…_linux_amd64.deb` | x86_64 |
| 🤖 Android | `…_android_arm64.apk`（大多数手机）、`…_android_armv7.apk`（较旧的 32 位手机） | Android 8.0 及以上 |

每次发布都附有 `SHA256SUMS.txt` 与 GitHub 的构建来源证明。

## 🗺️ 现在在哪里

当前版本 **2.0**：阅读核心、音乐库、歌词、环境声音与朗读都已可用。下一步是「暗室」：一处安静的、只属于你的书与唱片的空间。之后还有留声机与更多声音。详见[路线图](docs/yohaku/03-roadmap.md)。

## 📚 文档

| 文档 | 内容 |
|---|---|
| [00 · 产品愿景与需求](docs/yohaku/00-vision.md) | 完整的产品需求（原文存档） |
| [01 · 技术可行性评估](docs/yohaku/01-feasibility.md) | 参考项目调研、复用 / 改造 / 新开发矩阵、技术路线与已确认的决策 |
| [02 · 系统架构设计](docs/yohaku/02-architecture.md) | 仓库结构与上游同步、音频引擎、环境声音、数据模型、Readest 裁剪清单 |
| [03 · 改造计划与里程碑](docs/yohaku/03-roadmap.md) | 各阶段的任务、验收标准与技术验证 |
| [04 · 构建、测试与发布](docs/yohaku/04-ci-release.md) | GitHub Actions 工作流、构建矩阵、签名与自动检查 |
| [对上游的改动登记](docs/yohaku/upstream-patches.md) | 每一处对 Readest 代码的改动及原因 |
| [发布说明](docs/yohaku/release-notes/) | 每个版本的变化 |
| [隐私说明](PRIVACY.md) | Yohaku 不收集任何数据 |

## 🛠️ 开发方式

- 本地只保存代码与素材，**编译、测试、打包与发布全部在 GitHub Actions 上完成**。
- `references/`（不提交）：上游与参考项目的只读克隆，仅供本地查阅。
- `local/`（不提交）：原始素材、设计稿等不进入仓库的内容。
- 签名密钥只存放在 GitHub Secrets 与离线备份中，任何时候都不进入仓库。
- 图标的源文件是 [`assets-src/icon/yohaku-icon.svg`](assets-src/icon/yohaku-icon.svg)，各平台的图标由构建从它生成；截图在 [`docs/screenshots/`](docs/screenshots/)。

## 📜 许可证与致谢

Yohaku 基于 [Readest](https://github.com/readest/readest)（© Bilingify LLC）改造，与 Readest 一样以 **[GNU AGPL-3.0](LICENSE)** 开源。阅读引擎来自 [foliate-js](https://github.com/johnfactotum/foliate-js)（MIT）。歌词的逐字估算与光晕借鉴了 [Folia](https://github.com/chthollyphile/folia-major)（AGPL-3.0）的做法，代码为自行编写。截图中的书籍封面与专辑封面版权归各自的权利人所有。
