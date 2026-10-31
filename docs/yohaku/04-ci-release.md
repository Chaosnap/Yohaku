# Yohaku 构建、测试与发布（GitHub Actions）

> 版本 v2 · 2026-10-30 · 已在 Phase 0 实现，基于 Readest v0.12.16 的工作流改造。

---

## 1. 原则

- **本地不编译**。本地只保存代码与素材；格式检查、测试、构建、签名、发布全部在 GitHub Actions 上完成。
- **尽量复用 Readest**：沿用其 Android（JDK 17、NDK 28.2、keystore 注入）、Linux CEF（按固定提交安装 tauri-cli）、各 Action 的固定版本等已验证的做法。
- **密钥最小暴露**：签名密钥只存在于 GitHub Secrets 与你的离线备份中，任何步骤都不打印它们。
- **公开仓库**：GitHub 托管的标准 Runner 对公开仓库免费。

---

## 2. 工作流一览

| 文件 | 触发条件 | 内容 | 预计耗时 |
|---|---|---|---|
| `ci.yml` | push 到 `main` / `phase-*`、PR | Yohaku 配置检查（离线、身份、无 Readest 服务）；Biome 格式与 lint、TypeScript 类型检查；构建 Tauri 前端；Vitest 单元测试（两路分片）与 Playwright 浏览器测试；`cargo fmt` / `clippy` / `cargo test` | 15–30 分钟 |
| `build.yml` | push 到 `main` / `phase-*`（只改文档或文档网站时跳过）、手动触发 | 调用 `build-app.yml` 构建全部平台的测试包，上传为 Artifacts（保留 14 天） | 60–100 分钟（并行） |
| `build-app.yml` | 被 `build.yml` 与 `release.yml` 调用 | 实际的构建矩阵与打包、检查、上传 | — |
| `release.yml` | 推送 `v*` tag | 创建 Draft Release → 构建全部平台与 Google Play AAB 并上传 → 生成 `SHA256SUMS.txt` 与构建来源证明 | 90–150 分钟（并行） |
| `publish-release.yml` | `release.yml` 成功完成 | 自动发布这个 Release：预览版为 Pre-release，正式版为最新版本（Latest）；tag 已移到别的提交时跳过（见 §4） | 1 分钟 |
| `upstream-sync.yml` | 每月 1 日、手动触发 | 尝试合并 Readest 最新发布版到 `upstream-sync/<版本>` 分支，用 Issue 报告结果（见 §8） | 5–10 分钟 |
| `pages.yml` | push 到 `main` 且改动了 `website/`、`docs/` 或图标；`publish-release.yml` 完成后；手动触发 | 用 VitePress 构建文档网站并发布到 GitHub Pages（<https://chaosnap.github.io/Yohaku/>）：开发文档与发布说明直接读取 `docs/yohaku/`，图标与截图在构建时复制；依赖版本固定在 `website/package.json`，在 CI 上安装 | 2 分钟 |

- CI 的 Linux 任务固定在 `ubuntu-24.04`：`ubuntu-latest` 自 2026-10-19 起迁移到 Ubuntu 26.04，Playwright 1.60 还无法在上面安装 Chromium。
- 构建与测试命令经 `scripts/yohaku/run-logged.sh` 运行：失败时把日志末尾写成 annotation，不登录 GitHub 也能在 API 与运行页面上看到错误原因。
- 构建时关闭 Next.js 的 CLI 遥测（`NEXT_TELEMETRY_DISABLED=1`）。

- 测试包构建完成后，`build.yml` 的 `linux-smoke` 任务在 Ubuntu 22.04 与 24.04 上用虚拟显示器分别启动 AppImage 与 deb，截图上传为 Artifacts，结论写成 annotation；它不会让构建失败（Spike S3）。

计划中：Android 模拟器冒烟测试（改造 Readest 的 `android-e2e.yml`）。

---

## 3. 构建矩阵

| 平台 | Runner | 目标 | 产物 | 何时构建 |
|---|---|---|---|---|
| Windows x64 | `windows-latest` | `x86_64-pc-windows-msvc` | NSIS 安装包、便携版 exe | 测试包与发布 |
| Linux x64 | `ubuntu-22.04`（较旧的 glibc，兼容性更好） | `x86_64-unknown-linux-gnu`（CEF） | AppImage、deb | 测试包与发布 |
| macOS | `macos-latest` | `universal-apple-darwin` | DMG（ad-hoc 签名） | 测试包与发布 |
| Android arm64 | `ubuntu-latest` | `aarch64-linux-android` | APK | 测试包与发布 |
| Android armv7 | `ubuntu-latest` | `armv7-linux-androideabi` | APK | 测试包与发布 |
| Android（Google Play） | `ubuntu-latest` | arm64 + armv7，`-PyohakuStore=play` | AAB | 仅发布 |

以后按需加入：Windows arm64、Linux arm64、Android x86_64。

---

## 4. 产物命名

```text
Yohaku_<版本>_windows_x64-setup.exe
Yohaku_<版本>_windows_x64-portable.exe
Yohaku_<版本>_linux_amd64.AppImage
Yohaku_<版本>_linux_amd64.deb
Yohaku_<版本>_macos_universal.dmg
Yohaku_<版本>_android_arm64.apk
Yohaku_<版本>_android_armv7.apk
Yohaku_<版本>_android_googleplay.aab      （仅发布）
SHA256SUMS.txt                           （仅发布）
```

- 测试包的 `<版本>` 是 `package.json` 版本加提交号，例如 `0.0.1-da0fb6f`；发布时是 tag 去掉 `v`，例如 `0.0.1`。
- 应用版本号由 `apps/readest-app/package.json` 提供，只使用纯数字的 `主.次.修订`（Android `versionCode` 由它换算）。`v0.*` 与带后缀（如 `v1.1.0-rc.1`）的 tag 是预览版，标记为 Pre-release；其余 tag（如 `v1.0.0`）是正式版。版本号自 2026-10-31 起在 1.x 上递增。
- 发布说明写在 `docs/yohaku/release-notes/<tag>.md`（例如 [`v0.0.1.md`](release-notes/v0.0.1.md)）；没有这个文件时使用通用的安装说明。
- 发布流程：把 `package.json` 改为新版本、写好发布说明并推送 → `git tag v1.1.0 && git push origin v1.1.0` → 全部平台构建成功后由 `publish-release.yml` 自动发布（2026-10-31 起正式版也自动发布，此前正式版停在草稿）。任一平台失败时 Release 保持草稿，修复后把 tag 移到新提交（`git tag -f` 后 `git push -f origin <tag>`）重新运行，产物会覆盖上传到同一个草稿；只有为 tag 当前所指提交构建的那次运行会发布，旧提交的运行即使成功也不会。

---

## 5. 签名与密钥管理

### 5.1 Secrets 清单

在 **Settings → Secrets and variables → Actions → New repository secret** 添加：

| Secret | 用途 | 何时需要 |
|---|---|---|
| `ANDROID_KEY_BASE64` | Android keystore（Base64） | 正式发布前必须；测试包可选 |
| `ANDROID_KEY_ALIAS` | 密钥别名 | 同上 |
| `ANDROID_KEY_PASSWORD` | keystore 与密钥的密码 | 同上 |
| `APPLE_CERTIFICATE`、`APPLE_CERTIFICATE_PASSWORD`、`APPLE_SIGNING_IDENTITY`、`APPLE_ID`、`APPLE_PASSWORD`、`APPLE_TEAM_ID` | macOS 签名与公证 | 可选：需要 Apple Developer Program |

- 测试包与正式版使用同一个 Android 密钥，测试包可以直接覆盖安装正式版。
- 还没有配置密钥时，测试包会用每次随机生成的临时密钥签名（安装新的测试包前需要先卸载旧的）；**正式发布在没有密钥时会直接失败**，不会发出无法升级的安装包。
- 应用内更新器目前关闭，因此不需要 Tauri 更新签名密钥。

### 5.2 生成 Android 签名密钥（只需一次）

在你的 Mac 上执行（系统已有 JDK 自带的 `keytool`）。keystore 保存在仓库目录之外，或者放在仓库内已被 `.gitignore` 排除的 `key/` 目录（当前的做法）：

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore ~/yohaku-release.jks -alias yohaku -keyalg RSA -keysize 4096 -validity 10000
```

把 keystore 转成 Base64 并复制到剪贴板：

```bash
base64 -i ~/yohaku-release.jks | pbcopy
```

然后添加三个 Secret：`ANDROID_KEY_BASE64`（粘贴剪贴板内容）、`ANDROID_KEY_ALIAS`（`yohaku`）、`ANDROID_KEY_PASSWORD`（生成时设置的密码；PKCS12 格式下 keystore 与密钥使用同一个密码）。

**务必离线备份 `yohaku-release.jks` 与密码（建议两份，放在不同位置）。** 丢失后，已安装的用户将无法升级到新版本。上架 Google Play 时启用 Play 应用签名，这个密钥就作为上传密钥使用，丢失后还可以向 Google 申请重置。

### 5.3 macOS 与 Windows

- **macOS**：没有 Apple 开发者证书时，CI 产出 ad-hoc 签名、未经公证的 DMG。用户首次打开如被拦截，需要到「系统设置 → 隐私与安全性」中点击「仍要打开」。加入 Apple Developer Program 后，只需添加上表中的 Apple Secrets，构建会自动签名与公证。
- **Windows**：未签名的安装包会触发 SmartScreen 提示（「更多信息 → 仍要运行」）。之后可以申请 SignPath 的开源项目免费签名，或使用 Azure Trusted Signing。

### 5.4 工作流安全

- 所有第三方 Action 按提交 SHA 固定版本。
- 每个任务只申请所需的最小 `permissions`。
- 外部 PR 只运行 `ci.yml`，读不到任何 Secrets；构建与发布只由推送与 tag 触发。
- 密钥只写入 `$RUNNER_TEMP`，任务结束即销毁。
- `.gitignore` 屏蔽 `*.jks`、`*.keystore`、`keystore.properties`、`.env.local` 等文件，作为最后一道防线。

---

## 6. 自动检查

| 检查 | 位置 | 失败条件 |
|---|---|---|
| Yohaku 配置 | `scripts/yohaku/check-yohaku-config.mjs`（`ci.yml`） | `.env*` 或构建环境中出现 Readest 的服务密钥或遥测 DSN；`.env.tauri` 没有打开 Yohaku 构建，或 Readest Web API 地址没有指向 `.invalid` 域名；`tauri.conf.json` 的标识、产品名、更新地址或 CSP 指向 Readest / 遥测 / 支付服务 |
| Android 目标版本 | `scripts/yohaku/check-android-package.sh`（每个 APK / AAB） | `targetSdkVersion` 低于 36 |
| 16 KB 页对齐 | 同上 | 任一 64 位 `.so` 的 LOAD 段对齐小于 `0x4000`，或 APK 未通过 `zipalign -c -P 16` |
| 权限审计 | 同上 | 请求 `BILLING`、`REQUEST_INSTALL_PACKAGES`；Google Play 版请求 `MANAGE_EXTERNAL_STORAGE` |
| AppImage 完整性 | `build-app.yml`（沿用 Readest） | CEF 运行所需的 NSS、PulseAudio、libspeechd、libxkbcommon-x11 未打包 |
| 素材授权（计划中） | Phase 3 起 | `public/yohaku/` 中的素材未在 `assets-src/LICENSES.md` 登记 |

---

## 7. 缓存与耗时

- pnpm 依赖缓存（`actions/setup-node`）。
- Rust 缓存（`Swatinem/rust-cache`，按平台与 ABI 区分）；CI 的 Rust 检查使用 sccache。
- CEF 版 tauri-cli 按固定提交安装，并用标记文件跳过重复安装。
- Android 单个 ABI 的构建步骤上限 90 分钟，AAB（两个 ABI）上限 150 分钟。

---

## 8. 上游同步工作流

`upstream-sync.yml` 每月 1 日运行一次（也可在 Actions 页面手动触发）：

1. 检出完整历史，添加 `upstream` 远程仓库，把 Readest 的 tag 取到 `upstream/` 命名空间下（例如 `upstream/v0.12.17`），不与 Yohaku 自己的 `v0.0.x` 混在一起；
2. 找到最新的正式发布 tag（不含 `-beta` 等后缀）；`main` 已经包含它时什么也不做；
3. 新建分支 `upstream-sync/<版本>` 并合并：没有冲突时推送分支，开一个 Issue 说明下一步；有冲突时不推送，Issue 中列出冲突文件；
4. 同一版本已有打开的 Issue 时不重复创建。

合并的收尾由人完成：对照 [upstream-patches.md](upstream-patches.md) 确认每一处 `[yohaku]` 改动仍在，合并到 `main` 并推送，CI 与测试包在 `main` 上运行，真机检查后再发布。按「直接推送 main」的约定，这里不开 PR，因此也不需要允许 GitHub Actions 创建 PR。

## 9. 本地与 GitHub 的分工

| 本地（你的 Mac） | GitHub |
|---|---|
| 编辑代码与素材、提交与推送 | 格式检查、类型检查、单元测试 |
| 一次性生成 Android keystore 并离线备份 | 保存 Secrets，签名正式产物 |
| `references/`、`local/` 中的参考代码与原始素材（不提交） | 四平台测试包与正式发布 |
| 在真机上安装测试包并验收 | 构建来源证明与校验和 |
