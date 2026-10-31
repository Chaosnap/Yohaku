# 开发文档

这里是 Yohaku 的设计与工程文档：从最初的产品需求，到技术路线、系统架构、改造计划与构建发布。它们与仓库里 [`docs/yohaku/`](https://github.com/Chaosnap/Yohaku/tree/main/docs/yohaku) 下的文件是同一份，网站构建时直接读取，不另存副本。

| 文档 | 内容 |
|---|---|
| [00 · 产品愿景与需求](./00-vision) | 完整的产品需求（原文存档） |
| [01 · 技术可行性评估](./01-feasibility) | 参考项目调研、复用 / 改造 / 新开发矩阵、技术路线与已确认的决策 |
| [02 · 系统架构设计](./02-architecture) | 仓库结构与上游同步、音频引擎、环境声音、数据模型、Readest 裁剪清单 |
| [03 · 改造计划与里程碑](./03-roadmap) | 各阶段的任务、验收标准与技术验证 |
| [04 · 构建、测试与发布](./04-ci-release) | GitHub Actions 工作流、构建矩阵、签名与自动检查 |
| [对上游的改动登记](./upstream-patches) | 每一处对 Readest 代码的改动及原因 |

每个版本的变化见[更新日志](/zh/changelog/)。

## 约定

- **编译、测试、打包与发布全部在 GitHub Actions 上完成**，本地只保存代码与素材，见[云端构建](/zh/guide/building)。
- Yohaku 的新代码放在 `yohaku/` 目录（例如 `apps/readest-app/src/yohaku/`）。改动 Readest 的文件时，在改动处加 `[yohaku]` 注释，并登记在[对上游的改动登记](./upstream-patches)里。
- 离线与品牌行为由 `isYohakuBuild()` 控制：应用构建打开它；单元测试不打开，所以 Readest 自己的测试照常验证 Readest 的行为。
- 签名密钥与凭据永远不进入仓库。
- 文档使用简体中文。

想参与的话，欢迎在 [GitHub](https://github.com/Chaosnap/Yohaku) 上提 Issue 或 Pull Request。
