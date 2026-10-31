# Yohaku 项目说明

供开发者与 AI 助手阅读的工作约定。Yohaku 是基于 Readest v0.12.16 改造的应用，仓库根目录就是 Readest 的单仓结构。

## 文档

- 产品需求（原文存档）：`docs/yohaku/00-vision.md`
- 技术可行性评估与已确认的决策：`docs/yohaku/01-feasibility.md`
- 系统架构：`docs/yohaku/02-architecture.md`
- 改造计划与里程碑：`docs/yohaku/03-roadmap.md`
- 构建、测试与发布：`docs/yohaku/04-ci-release.md`
- 对上游的每一处改动：`docs/yohaku/upstream-patches.md`

当前阶段：Phase 1（阅读核心验证与精修），Phase 2 的音乐库与环境声音已先行提供；最新版本 v2.0.0，之后在 2.x 上递增。偏离架构文档的决定要回写到文档中。

## 约定

- 编译、测试、打包、发布全部在 GitHub Actions 上进行，本地不做构建，也不在本地安装依赖。
- `references/` 是上游与参考项目的只读克隆，`local/` 是原始素材，两者都不提交；不要在 `references/` 中运行构建或脚本。
- 签名密钥、`.env.local` 等凭据永远不进入仓库。
- 文档使用简体中文。

## 与上游代码相处

- Yohaku 的新代码放在 `yohaku/` 目录（`apps/readest-app/src/yohaku/` 等）。改动上游文件时在改动处加 `[yohaku]` 注释，并登记在 `docs/yohaku/upstream-patches.md`。
- 离线与品牌行为用 `isYohakuBuild()`（`apps/readest-app/src/yohaku/build.ts`）控制。`.env.tauri` 为所有应用构建打开它；单元测试不打开，所以上游测试照常验证 Readest 的行为，Yohaku 的测试用 `vi.stubEnv('NEXT_PUBLIC_YOHAKU_BUILD', 'true')`。
- `apps/readest-app/AGENTS.md`（`CLAUDE.md`）是 Readest 的说明：命令、源码结构、i18n、设计系统、电子墨水屏等技术内容适用；维护循环、社区 PR 审查、gstack 技能路由、`pnpm worktree:new` 等 Readest 维护者流程不适用于 Yohaku。
