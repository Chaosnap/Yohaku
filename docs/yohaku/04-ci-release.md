# Yohaku 构建、测试与发布（GitHub Actions）

> 版本 v1 · 2026-10-30 · 基于 Readest 现有工作流（`release.yml`、`pull-request.yml`、`android-e2e.yml`）改造。

---

## 1. 原则

- **本地不编译**。本地只保存代码与素材；格式检查、测试、构建、签名、发布全部在 GitHub Actions 上完成。
- **尽量复用 Readest**：沿用其 Android（JDK 17、NDK 28.2、keystore 注入）、Linux CEF（固定提交的 tauri-cli）、桌面 `tauri-action`、构建来源证明等已验证的做法。
- **密钥最小暴露**：签名密钥只存在于 GitHub Secrets 与你的离线备份中；只有发布任务能读取正式签名密钥。
- **公开仓库**：GitHub 托管的标准 Runner 对公开仓库免费，macOS 与 Android 的长时间构建不产生费用。

---

## 2. 工作流一览

| 文件 | 触发条件 | 内容 | 预计耗时 |
|---|---|---|---|
| `ci.yml` | 每次 push / PR | Biome 格式与 lint、TypeScript 类型检查、Vitest；`cargo fmt` / `clippy` / `cargo test`（含音频引擎离线渲染测试）；Kotlin JVM 单元测试；「禁止外联」检查 | 10–20 分钟 |
| `build.yml` | push 到 `main`、手动触发、PR 带 `build` 标签 | 四平台测试包上传为 Artifacts（保留 14 天）；Playwright 界面截图；Linux AppImage 在 xvfb 中的启动测试 | 60–100 分钟（并行） |
| `release.yml` | 推送 `v*` tag | 正式签名构建；产物上传到 Draft Release；生成 `SHA256SUMS.txt` 与构建来源证明；确认无误后由你手动发布 | 90–120 分钟（并行） |
| `android-e2e.yml` | 每晚、手动 | Android 模拟器（KVM）冒烟测试：启动、导入示例书、打开阅读、播放示例音乐（复用 Readest） | 40–60 分钟 |
| `upstream-sync.yml` | 每月、手动 | 尝试合并 Readest 最新发布版并开 PR，有冲突时开 Issue 列出冲突文件 | 5–10 分钟 |

从 Readest 移除：`docker-image.yml`、`nix-*.yml`、`upload-to-r2.yml`、`vercel-merge.yml`、`try-appimage.yml`、`nightly.yml`（由 `build.yml` 代替），以及 `release.yml` 中的 KOReader / Calibre / CrossPoint 插件、浏览器扩展、Discord 通知、R2 上传等任务。`codeql.yml` 对公开仓库免费，保留作为安全扫描。

---

## 3. 构建矩阵

| 平台 | Runner | 目标 | 产物 | 首发 |
|---|---|---|---|---|
| Windows x64 | `windows-latest` | `x86_64-pc-windows-msvc` | NSIS 安装包、便携版 exe | ✅ |
| Windows arm64 | `windows-latest` | `aarch64-pc-windows-msvc` | NSIS 安装包、便携版 exe | 之后 |
| Linux x64 | `ubuntu-22.04`（较旧的 glibc，兼容性更好） | `x86_64-unknown-linux-gnu`（CEF） | AppImage、deb | ✅ |
| Linux arm64 | `ubuntu-22.04-arm` | `aarch64-unknown-linux-gnu`（CEF） | AppImage、deb | 之后 |
| macOS | `macos-latest` | `universal-apple-darwin` | DMG | ✅ |
| Android arm64 | `ubuntu-latest` | `aarch64-linux-android` | APK | ✅ |
| Android armv7 | `ubuntu-latest` | `armv7-linux-androideabi` | APK | ✅ |
| Android x86_64 | `ubuntu-latest` | `x86_64-linux-android` | APK（模拟器、Chromebook） | 之后 |
| Android（Google Play） | `ubuntu-latest` | 全部 ABI，`storeFlavor=googleplay` | AAB | ✅ |

PR 中的 `build` 标签只构建 Android arm64、Linux x64 与 Windows x64，以缩短等待时间；`main` 与 tag 构建完整矩阵。

---

## 4. 产物与命名

```text
Yohaku_<版本>_windows_x64-setup.exe
Yohaku_<版本>_windows_x64-portable.exe
Yohaku_<版本>_linux_amd64.AppImage
Yohaku_<版本>_linux_amd64.deb
Yohaku_<版本>_macos_universal.dmg
Yohaku_<版本>_android_arm64.apk
Yohaku_<版本>_android_armv7.apk
Yohaku_<版本>_android_googleplay.aab
SHA256SUMS.txt
```

- 版本号遵循 SemVer，由 `apps/readest-app/package.json` 统一提供；Android `versionCode` 由版本号自动换算。
- 预发布使用 `v0.1.0-alpha.1` 这类 tag，并在 GitHub Releases 中标记为 Pre-release。
- 测试包（`build.yml`）的 Android 版本使用 `.dev` 后缀的应用标识与「Yohaku Dev」名称，可以与正式版同时安装。

---

## 5. 签名与密钥管理

### 5.1 Secrets 清单

| Secret | 用途 | 作用范围 | 何时需要 |
|---|---|---|---|
| `ANDROID_RELEASE_KEY_BASE64` | 正式版 keystore（Base64） | `release` 环境 | Phase 0 |
| `ANDROID_RELEASE_KEY_ALIAS` | 密钥别名 | `release` 环境 | Phase 0 |
| `ANDROID_RELEASE_KEY_PASSWORD` | keystore 与密钥密码 | `release` 环境 | Phase 0 |
| `ANDROID_DEV_KEY_BASE64` / `_ALIAS` / `_PASSWORD` | 测试包签名（可选） | 仓库 | 可选：不提供时 CI 使用临时调试密钥，测试包每次都需要卸载重装 |
| `TAURI_SIGNING_PRIVATE_KEY` / `_PASSWORD` | 应用内更新包签名 | `release` 环境 | 暂不需要（Phase 0 关闭更新器） |
| `APPLE_CERTIFICATE`、`APPLE_CERTIFICATE_PASSWORD`、`APPLE_SIGNING_IDENTITY`、`APPLE_ID`、`APPLE_PASSWORD`、`APPLE_TEAM_ID` | macOS 签名与公证 | `release` 环境 | 可选：需要 Apple Developer Program |
| Windows 代码签名（SignPath 或 Azure Trusted Signing） | Windows 签名 | `release` 环境 | 可选 |

`release` 环境建议配置为「只允许 `v*` tag 部署」，这样普通分支与 PR 的构建永远读不到正式签名密钥。

### 5.2 生成 Android 正式签名密钥（只需一次）

在你的 Mac 上执行（系统已有 JDK 自带的 `keytool`）。keystore 请保存在仓库目录**之外**：

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore ~/yohaku-release.jks -alias yohaku -keyalg RSA -keysize 4096 -validity 10000
```

把 keystore 转成 Base64 并复制到剪贴板：

```bash
base64 -i ~/yohaku-release.jks | pbcopy
```

然后在 GitHub 仓库 **Settings → Environments → New environment** 创建 `release` 环境，在其中添加：

- `ANDROID_RELEASE_KEY_BASE64`：粘贴剪贴板内容
- `ANDROID_RELEASE_KEY_ALIAS`：`yohaku`
- `ANDROID_RELEASE_KEY_PASSWORD`：生成时设置的密码（PKCS12 格式下 keystore 与密钥使用同一个密码）

**务必离线备份 `yohaku-release.jks` 与密码（建议两份，放在不同位置）。** 丢失后，已安装的用户将无法升级到新版本。上架 Google Play 时启用 Play 应用签名，这个密钥就作为上传密钥使用，丢失后还可以向 Google 申请重置。

### 5.3 macOS 与 Windows

- **macOS**：没有 Apple 开发者证书时，CI 产出的是 ad-hoc 签名、未经公证的 DMG。用户首次打开需要到「系统设置 → 隐私与安全性」中点击「仍要打开」，发布说明中会写明。加入 Apple Developer Program 后，只需添加上表中的 Apple Secrets，`tauri-action` 会自动签名与公证。
- **Windows**：未签名的安装包会触发 SmartScreen 提示（「更多信息 → 仍要运行」）。之后可以申请 SignPath 的开源项目免费签名，或使用 Azure Trusted Signing。

### 5.4 工作流安全

- 所有第三方 Action 按提交 SHA 固定版本（Readest 已经这样做）。
- 每个任务只申请所需的最小 `permissions`。
- 来自外部 PR 的构建使用 `pull_request` 触发器，读不到任何 Secrets；不使用 `pull_request_target` 运行不受信任的代码。
- 密钥只写入 `$RUNNER_TEMP`，任务结束即销毁，任何步骤都不打印密钥内容。
- `.gitignore` 已屏蔽 `*.jks`、`*.keystore`、`keystore.properties`、`.env.local` 等文件，作为最后一道防线。

---

## 6. 自动合规检查

| 检查 | 方法 | 失败条件 |
|---|---|---|
| 禁止外联 | 扫描前端构建产物（`out/`）与 CSP 配置 | 出现 `posthog.com`、`sentry.io`、`supabase.co`、`stripe.com`、`readest.com` 等域名 |
| Android 目标版本 | `aapt2 dump badging` | `targetSdkVersion` 低于 36 |
| 16 KB 页对齐 | 对 APK / AAB 中每个 64 位 `.so` 执行 `llvm-readelf -l`，并运行 `zipalign -c -P 16 -v 4` | 任一 LOAD 段对齐小于 `0x4000` 或 zipalign 校验失败 |
| 权限审计（Google Play 渠道） | `aapt2 dump permissions` | 包含 `MANAGE_EXTERNAL_STORAGE`、`REQUEST_INSTALL_PACKAGES`、`com.android.vending.BILLING` |
| 前台服务声明 | 解析合并后的 `AndroidManifest.xml` | 媒体服务缺少 `foregroundServiceType="mediaPlayback"` 或对应权限 |
| 素材授权 | 比对 `public/yohaku/` 与 `assets-src/LICENSES.md` | 有素材未登记来源与授权 |

---

## 7. 缓存与耗时

- pnpm 依赖缓存（`actions/setup-node` 的 pnpm 缓存）。
- Rust 缓存（`Swatinem/rust-cache`，按平台与目标区分）。
- Gradle 缓存（`actions/setup-java` 的 Gradle 缓存）。
- CEF 版 tauri-cli 按固定提交安装，并用标记文件跳过重复安装（沿用 Readest 的做法）。
- Android 单个 ABI 的构建上限设为 90 分钟（与 Readest 相同），整个任务上限 110 分钟。

---

## 8. 上游同步工作流

`upstream-sync.yml` 每月运行一次（也可手动触发）：

1. 检出完整历史，添加 `upstream` 远程仓库并获取 tag；
2. 新建分支 `upstream-sync/<日期>`，合并 Readest 最新的发布 tag；
3. 没有冲突时推送分支并开 PR；有冲突时开 Issue 列出冲突文件，由人工处理。

注意：用默认的 `GITHUB_TOKEN` 创建的 PR 不会自动触发 CI，需要在 PR 页面手动重新运行，或者为此配置一个细粒度的 Personal Access Token。另外需要在仓库设置中允许 GitHub Actions 创建 PR。

---

## 9. 本地与 GitHub 的分工

| 本地（你的 Mac） | GitHub |
|---|---|
| 编辑代码与素材、提交与推送 | 格式检查、类型检查、单元测试、模拟器测试 |
| 一次性生成 Android keystore 并离线备份 | 保存 Secrets，签名正式产物 |
| `references/`、`local/` 中的参考代码与原始素材（不提交） | 四平台测试包与正式发布 |
| 在真机上安装测试包并验收 | 构建来源证明与校验和 |
