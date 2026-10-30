# Yohaku（余白）

**A Quiet Place Between Words and Sound.**

*在文字与声音之间，留一处属于自己的空白。*

Yohaku 是一款融合文学阅读、漫画阅读、私人音乐收藏与环境声音的跨平台应用，目标平台为 **Windows、Linux、macOS、Android**。

它的核心视觉概念是「一间属于用户自己的日式私人暗房」：书是用木夹悬挂在细绳上的老照片，音乐是唱片柜里的黑胶，阅读记忆保存在一卷卷旧胶片里；窗外有雨、夕阳与樱花，窗边挂着玻璃风铃。

> **当前状态**：技术可行性评估与改造计划已完成，**等待确认技术路线**后进入 Phase 0。仓库目前只有设计文档，尚无代码。

## 文档

| 文档 | 内容 |
|---|---|
| [00 · 产品愿景与需求](docs/yohaku/00-vision.md) | 项目负责人提出的完整产品需求（原文存档） |
| [01 · 技术可行性评估](docs/yohaku/01-feasibility.md) | 参考项目调研、复用 / 改造 / 新开发矩阵、Android 风险、推荐路线与待确认决策 |
| [02 · 系统架构设计](docs/yohaku/02-architecture.md) | 仓库结构与上游同步、音频引擎、环境声音、艺术表现层、数据模型、Readest 裁剪清单 |
| [03 · 改造计划与里程碑](docs/yohaku/03-roadmap.md) | Phase 0–6 的任务、验收标准、技术验证（Spike）与测试方式 |
| [04 · 构建、测试与发布](docs/yohaku/04-ci-release.md) | GitHub Actions 工作流、构建矩阵、产物、签名密钥管理与合规检查 |

## 开发方式

- 本地只保存代码与素材。**编译、测试、打包与发布全部在 GitHub Actions 上完成**，测试包从 Actions Artifacts 下载，正式版本发布在 GitHub Releases。
- `references/`（不提交）：上游与参考项目的只读克隆，仅供本地查阅。
- `local/`（不提交）：原始素材、工作文件等不进入仓库的内容。
- 签名密钥只存放在 GitHub Secrets 与离线备份中，任何时候都不进入仓库。

## 许可证

Yohaku 计划基于 [Readest](https://github.com/readest/readest)（AGPL-3.0）改造，因此将以 **AGPL-3.0** 开源（待确认，见[可行性评估 · 需要确认的决策](docs/yohaku/01-feasibility.md#7-需要确认的决策)）。素材文件（图片、音效）可单独标注各自的授权。
