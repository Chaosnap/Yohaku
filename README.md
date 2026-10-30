# Yohaku（余白）

**A Quiet Place Between Words and Sound.**

*在文字与声音之间，留一处属于自己的空白。*

Yohaku 是一款融合文学阅读、漫画阅读、私人音乐收藏与环境声音的跨平台应用，目标平台为 **Windows、Linux、macOS、Android**。

它的核心视觉概念是「一间属于用户自己的日式私人暗房」：书是用木夹悬挂在细绳上的老照片，音乐是唱片柜里的黑胶，阅读记忆保存在一卷卷旧胶片里；窗外有雨、夕阳与樱花，窗边挂着玻璃风铃。

> **当前状态：Phase 0（基础建立）。** 已基于 [Readest](https://github.com/readest/readest) v0.12.16 完成改名与去云端化：没有账户、云同步、付费与遥测，启动时不访问网络。四平台构建在 GitHub Actions 上运行。暗室、留声机、海月等 Yohaku 自己的空间从 Phase 2 起陆续加入。

## 下载与试用

- **测试包**：在 [Actions → Build](https://github.com/Chaosnap/Yohaku/actions/workflows/build.yml) 中打开最近一次成功的运行，在页面底部的 Artifacts 下载对应平台（保留 14 天，需要登录 GitHub）。
- **正式版本**：发布后见 [Releases](https://github.com/Chaosnap/Yohaku/releases)。
- macOS 版本尚未经过 Apple 公证：首次打开如被拦截，请到「系统设置 → 隐私与安全性」点击「仍要打开」。Windows 可能出现 SmartScreen 提示，选择「更多信息 → 仍要运行」。

## 文档

| 文档 | 内容 |
|---|---|
| [00 · 产品愿景与需求](docs/yohaku/00-vision.md) | 项目负责人提出的完整产品需求（原文存档） |
| [01 · 技术可行性评估](docs/yohaku/01-feasibility.md) | 参考项目调研、复用 / 改造 / 新开发矩阵、Android 风险、技术路线与已确认的决策 |
| [02 · 系统架构设计](docs/yohaku/02-architecture.md) | 仓库结构与上游同步、音频引擎、环境声音、艺术表现层、数据模型、Readest 裁剪清单 |
| [03 · 改造计划与里程碑](docs/yohaku/03-roadmap.md) | Phase 0–6 的任务、验收标准、技术验证（Spike）与测试方式 |
| [04 · 构建、测试与发布](docs/yohaku/04-ci-release.md) | GitHub Actions 工作流、构建矩阵、产物、签名密钥管理与自动检查 |
| [对上游的改动登记](docs/yohaku/upstream-patches.md) | 每一处对 Readest 代码的改动及原因，以及暂缓的差异 |
| [隐私说明](PRIVACY.md) | Yohaku 不收集任何数据 |

## 开发方式

- 本地只保存代码与素材。**编译、测试、打包与发布全部在 GitHub Actions 上完成**。
- `references/`（不提交）：上游与参考项目的只读克隆，仅供本地查阅。
- `local/`（不提交）：原始素材、工作文件等不进入仓库的内容。
- 签名密钥只存放在 GitHub Secrets 与离线备份中，任何时候都不进入仓库。

## 许可证与致谢

Yohaku 基于 [Readest](https://github.com/readest/readest)（© Bilingify LLC）改造，与 Readest 一样以 **[GNU AGPL-3.0](LICENSE)** 开源。阅读引擎来自 [foliate-js](https://github.com/johnfactotum/foliate-js)（MIT）。素材文件（图片、音效）可单独标注各自的授权，见 `assets-src/`。
