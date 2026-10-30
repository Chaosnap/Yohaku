# Yohaku 项目说明

供开发者与 AI 助手阅读的工作约定。

## 文档

- 产品需求（原文存档）：`docs/yohaku/00-vision.md`
- 技术可行性评估与待确认决策：`docs/yohaku/01-feasibility.md`
- 系统架构：`docs/yohaku/02-architecture.md`
- 改造计划与里程碑：`docs/yohaku/03-roadmap.md`
- 构建、测试与发布：`docs/yohaku/04-ci-release.md`

当前阶段：可行性评估已完成，技术路线待确认（见 01 §7）。偏离架构文档的决定要回写到文档中。

## 约定

- 编译、测试、打包、发布全部在 GitHub Actions 上进行，本地不做构建。
- `references/` 是上游与参考项目的只读克隆，`local/` 是原始素材，两者都不提交；不要在 `references/` 中运行构建或脚本。
- 签名密钥、`.env.local` 等凭据永远不进入仓库。
- 文档使用简体中文。
