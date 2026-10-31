<p align="center">
  <img src="assets-src/icon/yohaku-icon.svg" width="168" alt="Yohaku 的图标：一本摊开的书，左页是字，右页留白，只落着一个朱红的音符">
</p>

<h1 align="center">Yohaku · 余白</h1>

<p align="center">
  <strong>A Quiet Place Between Words and Sound.</strong><br>
  在文字与声音之间，留一处属于自己的空白。
</p>

<p align="center">
  <a href="https://github.com/Chaosnap/Yohaku/releases/latest">下载</a> ·
  <a href="docs/yohaku/00-vision.md">产品愿景</a> ·
  <a href="docs/yohaku/03-roadmap.md">路线图</a> ·
  <a href="PRIVACY.md">隐私</a>
</p>

---

Yohaku 是一款把**阅读**和**听**放在一起的应用，支持 Windows、macOS、Linux 与 Android。读一本书时，放一张自己收藏的唱片，或者让窗外下一场雨；书不必离开，音乐也不会打断你。

图标是一本摊开的书：左页是字，右页几乎是空的，只落着一个朱红的音符。文字、声音，和它们之间的那一处空白，就是「余白」。

## 能做什么

- **读书与漫画**：EPUB、MOBI、AZW3、FB2、CBZ、PDF、TXT 等格式；笔记与高亮、翻译、词典、横排与竖排、为中日英文调好的排版、三款 Yohaku 阅读主题（暖纸、月白、墨夜）；漫画可以默认从右到左。
- **自己的音乐库**：同步电脑或手机里的音乐文件夹（每次启动自动同步），或逐首导入；按专辑、艺术家、歌曲、收藏浏览；读取标签、封面、年份、流派、比特率；支持 `.lrc` 与内嵌歌词，像 Apple Music 那样逐行流动、逐字填色。
- **边读边听**：阅读页脚的音乐按钮把整条页脚换成音乐控制条，侧栏里可以换歌、看歌词；书页上不会浮着任何播放器。
- **环境声音**：雨、屋檐雨、风、海浪、壁炉、森林、蝉鸣、夜晚虫鸣、溪流、唱片底噪，全部由 Yohaku 自己合成；五个场景一键开启，可以单独播放，也可以与音乐或朗读叠加。
- **朗读**：右上角的朗读面板，系统语音之外可选在线语音。
- **安静，也私密**：没有账户、没有云端、没有付费墙，也没有遥测；启动时不访问网络。同步书库只用你自己配置的 WebDAV、S3、KOReader 或 OPDS。

## 下载

在 [Releases](https://github.com/Chaosnap/Yohaku/releases/latest) 下载对应平台：

| 平台 | 文件 | 说明 |
|---|---|---|
| Windows | `…_windows_x64-setup.exe`（安装版）、`…_windows_x64-portable.exe`（便携版） | 可能出现 SmartScreen 提示，选择「更多信息 → 仍要运行」 |
| macOS | `…_macos_universal.dmg` | 未经 Apple 公证；首次打开被拦截时，到「系统设置 → 隐私与安全性」点击「仍要打开」 |
| Linux | `…_linux_amd64.AppImage`、`…_linux_amd64.deb` | x86_64 |
| Android | `…_android_arm64.apk`（大多数手机）、`…_android_armv7.apk`（较旧的 32 位手机） | Android 8.0 及以上 |

每次发布都附有 `SHA256SUMS.txt` 与 GitHub 的构建来源证明。

## 现在在哪里

当前版本 **2.0**：阅读核心与音乐库、环境声音、歌词、朗读都已可用。下一步是「暗室」：一处安静的、属于你自己的书与唱片的空间。详见[路线图](docs/yohaku/03-roadmap.md)。

## 文档

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

## 开发方式

- 本地只保存代码与素材，**编译、测试、打包与发布全部在 GitHub Actions 上完成**。
- `references/`（不提交）：上游与参考项目的只读克隆，仅供本地查阅。
- `local/`（不提交）：原始素材、设计稿等不进入仓库的内容。
- 签名密钥只存放在 GitHub Secrets 与离线备份中，任何时候都不进入仓库。
- 图标的源文件是 [`assets-src/icon/yohaku-icon.svg`](assets-src/icon/yohaku-icon.svg)，各平台的图标由构建从它生成。

## 许可证与致谢

Yohaku 基于 [Readest](https://github.com/readest/readest)（© Bilingify LLC）改造，与 Readest 一样以 **[GNU AGPL-3.0](LICENSE)** 开源。阅读引擎来自 [foliate-js](https://github.com/johnfactotum/foliate-js)（MIT）。歌词的逐字估算与光晕借鉴了 [Folia](https://github.com/chthollyphile/folia-major)（AGPL-3.0）的做法，代码为自行编写。
