# Yohaku 技术可行性评估

> 版本 v1 · 2026-10-30
> 调研基线：Readest `main@ad42d7c`（2026-10-30）及最新发布 v0.12.16（2026-10-13）；Harmonia `main`（2026-08-06）；foliate-js `main`；Koodo Reader v2.4.7；rodio 0.23.0、cpal 0.18.2、symphonia 0.6.1、souvlaki 0.9.3、lofty 0.25.5、Tauri 2.12.5。
> 本文所有关于 Readest 的结论均来自对其源码、工作流与发布产物的直接阅读；标注「待验证」的条目需要在 Spike 或真机测试中确认。

---

## 0. 结论摘要

**Yohaku 在技术上可行。推荐路线是：Fork Readest 作为阅读核心与四平台构建基础，在其之上新建 Yohaku 的三个空间与艺术表现层；音乐与环境声音由各平台的原生音频引擎承担（桌面 Rust、Android Media3），WebView 只负责界面与控制。**

| 领域 | 可行性 | 依据 |
|---|---|---|
| 阅读核心（EPUB / AZW3 / PDF / CBZ / TXT / MD） | **高** | Readest 已在四个目标平台正式发布，格式、漫画模式、进度保存基本齐全 |
| 四平台云端构建与发布 | **高** | Readest 的 `release.yml` 已覆盖 Windows / Linux / macOS / Android，可直接改造 |
| 本地音乐播放（桌面） | **高** | rodio + symphonia + cpal 成熟；Harmonia 已在 Tauri 2 中实现无缝播放与交叉淡入淡出 |
| 本地音乐后台播放（Android） | **中** | Tauri 没有现成方案，需要自研 Media3 插件；Readest 的朗读前台服务证明这条路在 Tauri 中可行 |
| 环境声音多层混音 | **中高** | 原生多层循环 + 独立音量 + 渐变，没有理论难点，主要是素材与调参 |
| 暗室 / 留声机 / 海月与九种意象 | **中** | 全部为新开发；主要风险是低端 Android WebView 的渲染性能与耗电 |

**最需要警惕的五个风险**（详见 §5、§6）：

1. Android 后台音乐必须由原生前台服务承担，**不能放在 WebView 里播放**（WebView 在后台会被节流，Activity 被回收时直接停止）。
2. Readest 体量很大（约 27 万行 TS/TSX + 2 万行 Rust），且深度耦合了账户、云同步、支付、遥测；**仓库里直接提交了 Readest 自己的 PostHog / Supabase / Stripe 默认密钥**，原样构建会连到 Readest 的服务器，必须首先清除。
3. Fork 后必须以 **AGPL-3.0** 开源，Yohaku 的全部代码（含艺术层）都要公开。
4. 艺术空间在低端 Android 上的帧率与耗电，需要分级渲染与统一调度，并在真机上验证（CI 无法替代）。
5. Google Play 合规：`targetSdk 36`（2026-08-31 起强制）、16 KB 内存页对齐、前台服务类型声明、受限权限的移除。

**需要你确认的 7 个决策**见 [§7](#7-需要确认的决策)。确认后即可进入 Phase 0（Fork、改名、去云端化、四平台 CI 打通）。

---

## 1. 调研范围与方法

| 对象 | 阅读内容 |
|---|---|
| [Readest](https://github.com/readest/readest) | 完整源码结构、`AGENTS.md`、`PRODUCT.md`、Tauri 配置、Cargo 与 pnpm 工作区、4 个自定义 Tauri 插件（含 Android Kotlin 源码）、Android Gradle 工程与清单、`release.yml` / `pull-request.yml` / `android-e2e.yml` / `nightly.yml`、v0.12.16 发布产物、许可证 |
| [foliate-js](https://github.com/johnfactotum/foliate-js) | README、格式支持、API 稳定性声明、与 Readest 分叉的差异 |
| [Koodo Reader](https://github.com/koodo-reader/koodo-reader) | README、`package.json`、许可证 |
| [Harmonia](https://github.com/bgh30539-code/harmonia) | 源码结构、Cargo 依赖、音频引擎、Android 工程、README 中的已知限制 |
| [rodio](https://github.com/RustAudio/rodio) / [cpal](https://github.com/RustAudio/cpal) / [Symphonia](https://github.com/pdeljanov/Symphonia) / [souvlaki](https://github.com/Sinono3/souvlaki) / lofty | 版本、许可证、平台后端、Android 限制、更新日志 |
| Android / Google Play | 目标 API 级别要求、16 KB 页大小要求、Android 15 音频焦点限制、Media3 后台播放指南 |

参考项目的只读克隆保存在本地 `references/`（不提交到仓库）。

---

## 2. 参考项目分析

### 2.1 Readest（推荐作为基础）

#### 2.1.1 架构概览

| 层 | 技术 | 说明 |
|---|---|---|
| 仓库组织 | pnpm 单仓（`pnpm@11`），CI 使用 Node 24 | 主应用 `apps/readest-app`；`packages/` 下为子模块与补丁依赖 |
| 前端 | Next.js 16.4（静态导出）+ React 19.2 + Zustand 5 + Tailwind 4 + daisyUI 5 + i18next | 约 1,366 个源文件、约 27 万行（不含测试） |
| 阅读引擎 | foliate-js（Readest 分叉，子模块）+ pdf.js | Readest 分叉比上游多 267 个提交、少 14 个，已明显分叉 |
| 原生层 | Tauri 2（使用 Readest 自己的 Tauri 分叉）+ Rust（约 2 万行，要求 Rust ≥ 1.90） | Tauri 分叉只比上游多 5 个补丁（含一个移动端主线程阻塞修复） |
| 自定义插件 | `native-bridge`、`native-tts`、`turso`、`webview-upgrade` | 见下表 |
| 数据 | `library.json` 书库索引 + 每本书的配置 JSON + SQLite（libSQL，经 `tauri-plugin-turso`），带按日期命名的迁移框架 | 导入书籍时把文件**复制**到应用的 `Books` 目录，原文件不被修改 |
| Linux 运行时 | **CEF（Chromium）**，经 Readest 的 Tauri `feat/cef` 分支 | 源码注释写明「所有发布的 Linux 构建都运行在 CEF 上」，WebKitGTK 只留给 WebDriver 测试 |

自定义插件中与 Yohaku 关系最大的部分：

| 插件 | 内容 | 对 Yohaku 的意义 |
|---|---|---|
| `native-bridge` | Android 端约 9,700 行 Kotlin：文件选择、SAF 目录选择、`content://` 复制、安全区域、屏幕亮度、系统栏、按键拦截（音量键翻页）、方向锁定、主屏小部件、环境光传感器、翻页卷曲、内购、电子墨水屏、手写笔等 | 大部分可直接复用；环境光传感器可用于「水母随环境光改变透明度」；内购、手写笔需移除 |
| `native-tts` | Android `MediaPlaybackService`（约 1,600 行）：前台服务（`mediaPlayback` 类型）、`MediaSessionCompat`、ExoPlayer（Media3 1.3.1）、音频焦点、耳机拔出、锁屏控制、Android Auto 浏览树；桌面端用 **souvlaki** 接入 macOS Now Playing / Windows SMTC / Linux MPRIS | **证明了「Tauri 插件 + Android 前台媒体服务 + 事件回传 WebView」在生产环境可行**；桌面 Now Playing 代码可直接复用到音乐播放器 |
| `webview-upgrade` | 检测 Android 系统 WebView 版本（最低支持 Chromium 111，低于 121 提示升级） | 对国产 ROM 自带旧 WebView 的情况很有价值，保留 |
| `turso` | libSQL 数据库 | Yohaku 的音乐库与私人记忆数据复用同一数据库与迁移框架 |

#### 2.1.2 跨平台构建方式（`release.yml`）

| 平台 | Runner | 目标 | 产物 | v0.12.16 体积 |
|---|---|---|---|---|
| Android arm64 | `ubuntu-latest` | `aarch64-linux-android` | APK | 57.2 MB |
| Android armv7 | `ubuntu-latest` | `armv7-linux-androideabi` | APK | 46.3 MB |
| Android legacy | `ubuntu-latest` | `i686` + `x86_64` | APK | 122.1 MB |
| Linux x86_64 | `ubuntu-22.04` | CEF | AppImage / deb / rpm | 212.7 / 179.0 / 142.3 MB |
| Linux aarch64 | `ubuntu-22.04-arm` | CEF | AppImage / deb / rpm | 203.4 / 182.1 / 140.8 MB |
| macOS | `macos-latest` | `universal-apple-darwin` | DMG / app.tar.gz | 71.0 MB |
| Windows x64 | `windows-latest` | `x86_64-pc-windows-msvc` | NSIS 安装包 / 便携版 | 58.2 / 92.9 MB |
| Windows arm64 | `windows-latest` | `aarch64-pc-windows-msvc` | NSIS 安装包 / 便携版 | 56.8 / 83.6 MB |

值得直接沿用的做法：

- Android：JDK 17（Zulu）+ Android SDK + **NDK 28.2**；构建前 `tauri android init` 重新生成工程再 `git checkout .` 恢复自定义文件；keystore 以 Base64 存在 Secrets 中、构建时写入 `$RUNNER_TEMP`；Android 任务上限 90 分钟。
- Linux：从 Readest 的 Tauri 分叉按固定提交安装 CEF 版 tauri-cli，并补齐 AppImage 运行时库（NSS、libpulse、libspeechd、libxkbcommon-x11）。
- 桌面使用 `tauri-apps/tauri-action`；所有产物使用 `actions/attest-build-provenance` 生成构建来源证明。
- PR 检查：`cargo fmt` / `clippy` / `cargo test`、Biome 格式与 lint、TypeScript 类型检查、Web 构建；每晚另有 Android 模拟器（KVM）端到端测试与夜间构建。

需要改动的地方：去掉 iOS、Web 部署（Cloudflare / Vercel / R2）、KOReader / Calibre / CrossPoint 插件、浏览器扩展、Discord 通知等任务；Readest 的 GitHub Release 中没有 AAB，Yohaku 需要新增 Google Play 用的 AAB 任务。

#### 2.1.3 可直接复用的能力

- **格式**：EPUB、MOBI、KF8（AZW3）、FB2、CBZ、TXT、HTML、Markdown、PDF。TXT 导入已能识别 UTF-16、GBK / GB18030、Shift-JIS 等编码并自动切分章节，对中文 TXT 很重要。
- **文学阅读**：分页 / 滚动、双页、字体与版式调整、竖排（含割注 warichu 工具）、目录、全文搜索、书签、高亮、批注、导出、自动保存进度、自定义字体导入、词典、朗读（TTS）、无障碍（VoiceOver / TalkBack / NVDA / Orca）、尊重系统「减少动态效果」、自动隐藏工具栏。
- **漫画**：双页跨页（`spreadMode`）、从右到左跨页（`rtlSpread`）、Webtoon 无缝长条模式、宽页重组、ComicInfo.xml 元数据、缩放与双指捏合。
- **PDF**：pdf.js 渲染、目录、页面缩略图侧栏、文字层选择与搜索；导入阶段用 Rust 解析元数据，避免整份文件经过 IPC。
- **平台能力**：文件关联、分享接收、SAF、安全区域、系统栏、音量键翻页、方向锁定、震动反馈（`tauri-plugin-haptics`）、单实例、窗口状态记忆、桌面 Now Playing。
- **工程设施**：i18n 体系、Biome、Vitest / Playwright / WebDriver / Android 模拟器测试、数据库迁移框架、发布流程。

#### 2.1.4 与 Yohaku 理念冲突、必须移除或关闭的部分

| 类别 | Readest 中的实现 | 处理 |
|---|---|---|
| 账户与云同步 | Supabase 登录、云端书库与进度同步、存储配额、云端清理 | 移除入口并关闭（Yohaku 不需要账户） |
| 付费 | Stripe、Apple / Google 内购、`com.android.vending.BILLING` 权限、`iap-reconcile` Worker | 移除 |
| 遥测与崩溃上报 | PostHog、Sentry（JS / Rust / Android） | 移除（离线优先，不收集数据） |
| **已提交的默认密钥** | `apps/readest-app/.env` 中以 Base64 写入了 Readest 的 PostHog key、Supabase URL / anon key、Stripe publishable key；代码在未配置时回退使用它们 | **Phase 0 第一件事：删除并改为无默认值**，否则 Yohaku 会把数据发往 Readest 的服务 |
| 在线服务集成 | AI 助手（Vercel AI SDK）、DeepL / Google / Azure 翻译、Edge TTS、OneDrive / Google Drive、Hardcover、Readwise、Notion、BookOrbit、Audiobookshelf、RSS、网页剪藏与内置浏览器、Discord Rich Presence | 默认关闭或移除（见[架构文档 §7](02-architecture.md#7-readest-裁剪清单)） |
| 自动更新 | 指向 Readest 服务器的 updater 与公钥；Android 端通过 `REQUEST_INSTALL_PACKAGES` 自更新 | Phase 0 先关闭，后续可改为指向 Yohaku 的 GitHub Releases（新密钥） |
| 设备专用 | BOOX 手写笔 SDK（私有 Maven 源）、电子墨水屏适配、Android TV / Auto 声明 | 手写笔移除；墨水屏与 TV 按需保留 |
| 阅读统计 | 统计面板显示「当前连续天数 / 最长连续天数」（streak） | 去掉 streak 等带有催促意味的指标，只保留安静的个人记录 |

另外，Readest 没有统一的「关闭云端」开关（只有 `NEXT_PUBLIC_DISABLE_UPDATER`），需要新增 Yohaku 自己的离线开关并逐个屏蔽入口，这是 Phase 0 的主要工作量。

#### 2.1.5 许可证与品牌

- Readest 采用 **AGPL-3.0**（著作权人 Bilingify LLC）。Fork 后 Yohaku 必须整体以 AGPL-3.0（或更高版本）发布：分发二进制时必须同时提供完整源码，保留原有版权与许可证声明，并标明修改。
- Yohaku 新增的全部代码（三个空间、艺术层、音频插件）也将是 AGPL-3.0。图片、音效等素材可以单独标注授权（例如 CC BY 4.0），但不能使用「禁止再分发」的素材，因为仓库是公开的。
- AGPL 不妨碍上架 Google Play，也不妨碍未来接受捐赠；但无法再把这部分代码闭源或改为宽松许可证。
- 「Readest」名称、Logo 以及 `com.bilingify.readest` 等标识属于原作者，必须全部替换；同时在「关于」页面与 README 中致谢 Readest。

#### 2.1.6 维护成本

Readest 非常活跃（调研当天仍有提交，平均每天多次合并）。Fork 越深，后续合并上游越难。应对策略（详见架构文档 §2）：

- 保留上游目录名与代码标识，只替换面向用户的品牌信息；
- Yohaku 代码集中放在独立目录（`src/yohaku/`、`src-tauri/src/yohaku/`、独立插件）；
- 对上游文件的每一处修改都加 `[yohaku]` 标记，并登记在 `docs/yohaku/upstream-patches.md`；
- 每月合并一次上游，由 CI 验证。

### 2.2 foliate-js

- MIT 许可证，支持 EPUB、MOBI、KF8（AZW3）、FB2、CBZ，PDF 为实验性（依赖 pdf.js）。
- 作者明确声明「库本身并不稳定，API 随时可能变化」。
- 若不 Fork Readest，而是基于 foliate-js 自建（路线 B），可以获得许可证自由，但书库管理、批注、搜索、PDF、漫画、TXT 转换、Android 文件导入、四平台 CI 等全部需要重写，工作量增加数倍。
- 若 Fork Readest，应使用 Readest 的 foliate-js 分叉（作为子模块随 Readest 更新），不要直接换回上游。

### 2.3 Koodo Reader

- AGPL-3.0；`package.json` 显示为 **Electron 34 + React 18 + Redux + Create React App** 架构，桌面打包使用 electron-builder，仓库中没有 Tauri / Capacitor 等移动端依赖；Android / iOS 版本以单独安装包分发。
- 与 Tauri 2 + Next.js 路线不兼容，**不适合作为基础**。仅参考其书库管理、批量导入、备份快照与「库的版本控制」等交互设计。

### 2.4 Harmonia

- MIT；Rust + Tauri 2 + React + **rodio 0.22**（symphonia 全解码器）、rusqlite、lofty、walkdir、rayon、notify；约 6,300 行 Rust；GitHub 星标个位数，单人维护。
- 已实现：无缝播放、交叉淡入淡出、ReplayGain、10 段均衡器、变速不变调、10 万首规模的曲库；引擎是「解码器预先追加 + 100 ms tick 循环驱动自动切歌与淡变」。
- **限制（README 原文明确说明）**：只支持 Linux / Windows / Android，**不支持 macOS**；Android 端**尚无后台播放、通知栏 / 锁屏控制与 SAF 文件夹选择**（计划在 v0.1.3 实现），目前只有应用在前台时才能播放。
- 结论：可作为**桌面音频引擎与曲库扫描的参考实现**（MIT，可在注明出处的前提下借鉴代码），不作为依赖；它恰好印证了 Android 后台播放是需要单独攻克的部分。

### 2.5 Rodio 与 Rust 音频生态

| 库 | 版本 | 许可证 | 作用 | 与 AGPL-3.0 兼容 |
|---|---|---|---|---|
| rodio | 0.23.0 | MIT OR Apache-2.0 | 解码 + 混音 + 播放的高层封装；主干已加入高质量重采样（`Source::resample` / `ResampleConfig`） | 是 |
| cpal | 0.18.2 | Apache-2.0 | 音频输出：Windows WASAPI、macOS CoreAudio、Linux ALSA（可选 PipeWire / PulseAudio / JACK）、Android AAudio（API 26+） | 是 |
| Symphonia | 0.6.1 | MPL-2.0 | 纯 Rust 解码：FLAC、MP3、WAV、AAC / M4A、ALAC、Vorbis 等 | 是（MPL-2.0 允许与 GPL 系许可证组合） |
| souvlaki | 0.9.3 | MIT | 系统媒体控制：MPRIS、SMTC、MPNowPlayingInfoCenter（Readest 已在使用） | 是 |
| lofty | 0.25.5 | MIT OR Apache-2.0 | 标签与内嵌封面读取（只读使用） | 是 |

评估结论：

- **桌面端**：rodio + symphonia + cpal 足以实现 FLAC / MP3 / WAV / AAC 播放、无缝衔接、多音源混合（音乐总线 + 多个环境声音层）与渐变，可行性高。
- **Android 端**：cpal 的 AAudio 后端可以出声，但它只解决「输出」，不解决「后台存活、媒体会话、锁屏控制、音频焦点、`content://` 访问、蓝牙按键」等问题；cpal 文档还要求在 JNI 环境下手动提供 `JavaVM` / `Activity` 上下文，而 Tauri 的 Activity 可能在后台被回收。因此 **Android 不建议使用 rodio 作为播放引擎**，改用 Android 官方的 Media3（ExoPlayer + MediaSessionService），详见 §5 风险 A1 与架构文档 §3。

---

## 3. 技术路线比较

| 维度 | A. Fork Readest（推荐） | B. foliate-js 自建 | C. Fork Koodo Reader |
|---|---|---|---|
| 技术栈 | Tauri 2 + Next.js + Rust，与需求一致 | 同 A，但需从零搭建 | Electron，与需求不一致 |
| 四平台构建 | 现成且已在发布 | 需自行搭建 | 移动端不在仓库中 |
| 阅读功能完整度 | 很高 | 需重写大量功能 | 高（桌面） |
| 到达 Phase 1 验收 | 约 4–6 周（主要是去云端化与改名） | 数月 | 不适用 |
| 许可证 | 必须 AGPL-3.0 | 可自由选择（foliate-js 为 MIT） | 必须 AGPL-3.0 |
| 长期维护 | 需持续合并活跃的上游 | 完全自主，但所有问题自己解决 | — |
| 主要风险 | 代码量大、上游耦合 | 工期与质量风险最高 | 架构不符 |

**结论：选择路线 A。** 阅读核心是 Yohaku「可以长期使用、稳定运行」的基础，Readest 已经在四个平台上把它做到了生产级；Yohaku 的独特价值在空间、声音与记忆体验，开发精力应该集中在这里。

---

## 4. 功能复用矩阵

图例：✅ 直接复用　🔧 需改造　🆕 新开发　🔍 需验证（真机或 Spike）

### 4.1 阅读

| 需求 | 状态 | 说明 |
|---|---|---|
| EPUB / 无 DRM AZW3 / PDF / CBZ / TXT / Markdown | ✅ | Readest 已支持；ZIP 格式漫画需确认扩展名关联（清单中已关联 `.zip`） |
| CBR | 🆕 | 后续阶段。`unrar` 源码许可证与 AGPL 不兼容，应使用 libarchive（BSD）的 WASM 或 Rust 绑定读取 RAR4/RAR5 |
| 高质量中英文排版、字体 / 字号 / 行距 / 页边距 | ✅🔧 | 复用；调整 Yohaku 默认排版参数与字体组合 |
| 目录、全文搜索、书签、高亮、批注、摘录 | ✅ | 复用；「收藏的句子」基于批注扩展 |
| 自动保存进度 | ✅ | 复用；Yohaku 增加数据库备份 |
| 单页 / 双页 / 滚动 | ✅ | 复用 |
| 暖纸、月白、墨夜主题 | 🔧 | 在 Readest 主题系统中新增三套主题并设为默认候选 |
| 漫画从右到左 | 🔧 | 已有手动开关；新增依据 ComicInfo `Manga=YesAndRightToLeft` 自动设置，以及「漫画默认从右到左」全局选项 |
| 双页跨页、Webtoon 长条 | ✅ | 复用 |
| 图片缩放与拖动 | ✅🔍 | 已有缩放 / 捏合逻辑，需在 Android 真机验证手势冲突 |
| 漫画全屏隐藏动态装饰 | 🆕 | Yohaku 装饰层的规则：阅读视图内不渲染任何装饰 |
| PDF 缩放、导航、目录、缩略图、文字选择与搜索 | ✅ | 复用 |
| 大文件与扫描版 PDF 性能 | 🔍 | 需用 300 MB 以上扫描 PDF、500 MB CBZ 在中端手机上测试内存与翻页延迟 |

### 4.2 音乐

| 需求 | 状态 | 说明 |
|---|---|---|
| 曲库扫描与导入 | 🆕 | 桌面：用户添加文件夹 → Rust 扫描（walkdir + lofty）；Android：MediaStore 查询 + 可选 SAF 文件夹 |
| 封面与元数据 | 🆕 | lofty 只读解析；封面缩放后缓存；**从不写回标签** |
| 艺术家 / 专辑 / 歌曲管理、播放列表 | 🆕 | SQLite 数据表 + 传统列表视图 |
| 播放引擎（桌面） | 🆕 | rodio + symphonia + cpal，参考 Harmonia |
| 播放引擎与后台播放（Android） | 🆕 | Media3 ExoPlayer + MediaSessionService，参考 Readest `native-tts` 的插件集成方式 |
| 锁屏 / 通知栏 / 蓝牙按键 | 🆕 / ✅ | Android 由 Media3 自动提供；桌面复用 Readest 基于 souvlaki 的 Now Playing |
| 无缝播放 | 🆕 | 桌面：预先追加下一曲解码器；Android：ExoPlayer 原生支持（FLAC 天然无缝，MP3 / AAC 依赖编码器延迟元数据） |
| 播放进度记忆 | 🆕 | 原生层定时持久化队列与位置 |
| 独立音量 | 🆕 | 音乐、环境声音、风铃、烟花音效各自独立 |
| 输出设备切换、耳机拔出 | 🆕 | 桌面：输出流出错时在新默认设备上重建；Android：`ACTION_AUDIO_BECOMING_NOISY` 与路由变化由 Media3 处理 |
| 翻页、换书、改字体不中断音乐 | ✅（由架构保证） | 音乐在原生层播放，与 WebView 生命周期无关 |

### 4.3 环境声音

| 需求 | 状态 | 说明 |
|---|---|---|
| 多层同时播放、独立音量 | 🆕 | 桌面：同一混音器下的多个环境层；Android：每层一个不申请音频焦点的 ExoPlayer |
| 渐入渐出、睡眠定时器、一键静音 | 🆕 | 全部在原生层实现，避免 WebView 后台计时器被节流 |
| 自定义场景、预设保存、5 个默认场景 | 🆕 | 预设为 JSON，存入 SQLite |
| 音效素材 | 🆕 | 自行录制或使用 CC0 / CC BY 素材，逐条登记来源与授权 |
| 可选唱片底噪 | 🆕 | 作为一个默认关闭的环境层，绝不混入音乐信号本身 |

### 4.4 Yohaku 空间、意象与记忆

| 需求 | 状态 | 说明 |
|---|---|---|
| 暗室：相片、木夹、细绳、显影、风力摆动、自由悬挂、翻转、背面信息 | 🆕 | 数据来自 Readest 书库；布局与背面信息为新数据表 |
| 点击照片展开为阅读界面 | 🆕🔧 | 共享元素过渡（View Transitions API，旧 WebView 降级为 FLIP 动画）衔接 Readest 阅读器 |
| 留声机：唱片柜、封套、唱盘、唱针、仪式动画（可跳过） | 🆕 | — |
| 海月：水母、气泡、光线折射、极简播放器 | 🆕 | WebGL2 场景 |
| 九种意象与蝉鸣、四季 | 🆕 | 统一调度、分级渲染，逐个交付 |
| 伞：沉浸式阅读入口 | 🔧 | Readest 已有自动隐藏工具栏，新增伞的入口与过渡 |
| 声音书签、胶卷记忆、私人阅读场景 | 🆕 | 基于批注、播放状态与环境预设的组合数据 |
| 传统列表视图 | ✅🆕 | 书籍复用 Readest 书库列表 / 网格；音乐与记忆新建列表视图 |

### 4.5 平台与工程

| 需求 | 状态 | 说明 |
|---|---|---|
| 完全离线、不强制注册 | 🔧 | 去掉账户、云同步、遥测与默认密钥；CI 中加入「不得联系外部服务」检查 |
| 数据本地保存、不修改原始文件 | ✅🔧 | 书籍为复制导入；音乐只读引用；增加备份与导出 |
| 动态效果开关、低性能模式 | 🔧🆕 | Readest 已尊重系统减少动态效果；新增四档动态效果与统一调度器 |
| 多语言 | ✅🔧 | 复用 i18next；为新增界面补充简中、繁中、日文、英文 |
| GitHub Actions 四平台构建与 Releases | ✅🔧 | 改造 Readest 工作流；新增 AAB 与合规检查 |

---

## 5. Android 技术风险

| ID | 风险 | 影响 | 可能性 | 对策 | 验证方式 |
|---|---|---|---|---|---|
| **A1** | **后台音乐播放**：Tauri 没有内置媒体服务；WebView 中的音频在应用进入后台后依赖 Activity 存活，JS 计时器会被节流，Activity 被回收后直接停止；Harmonia 正卡在这一步 | 严重 | 确定存在 | 自研 `tauri-plugin-yohaku-audio` 的 Android 实现：Media3 `MediaSessionService` 持有 ExoPlayer，队列、切歌、淡变、睡眠定时全部在服务内完成；WebView 只通过 `MediaController` 发命令、收事件 | Spike S1 |
| A2 | **音频焦点与打断**：Android 15 起只有前台应用或运行中的音频前台服务才能申请焦点；来电、导航播报、其他播放器都会打断 | 高 | 高 | 只让音乐播放器申请焦点，环境声音层跟随音乐的焦点状态（暂时失去时降低音量，永久失去时暂停）；在启动前台服务之后再申请焦点 | S1 |
| A3 | **两个媒体会话冲突**：Readest 朗读服务已有一个 `MediaSession`，Yohaku 音乐再加一个，锁屏和蓝牙按键会在两者间混乱 | 中 | 高 | 引入统一的媒体会话仲裁：音乐与朗读互斥，最终合并为同一个服务；Phase 2 期间朗读默认使用 WebView 内的会话降级 | S1 / Phase 2 |
| A4 | **音乐文件访问**：分区存储、Android 13+ 需要 `READ_MEDIA_AUDIO`、SAF 持久授权数量有限（每个应用约 128–512 个）、MediaStore 元数据不完整 | 中 | 高 | MediaStore 作为主数据源（快、系统已建索引）；SAF 树形授权作为补充；用 `ParcelFileDescriptor` 把文件描述符交给 Rust lofty 读取完整标签；播放直接使用 `content://` URI | Phase 2 |
| A5 | **艺术空间的性能与耗电**：低端 GPU、国产 ROM 的旧版 WebView、WebGL 上下文在后台丢失、长时间运行发热 | 高 | 中 | 四档动态效果；移动端默认 30 fps 上限；不可见即暂停；阅读视图内零装饰；处理 `webglcontextlost`；保留 `webview-upgrade` 插件；以静态图作为最低档 | Spike S2 + 真机 |
| A6 | **厂商后台杀进程**（MIUI / HyperOS、ColorOS、OriginOS、EMUI / HarmonyOS 等） | 高 | 中 | 规范的 `mediaPlayback` 前台服务通常可存活；提供电池优化白名单引导页；Media3 播放恢复（`onPlaybackResumption`）让蓝牙「播放」键在进程被杀后也能恢复 | 你的真机 |
| A7 | **进程死亡后的状态恢复** | 中 | 中 | 阅读进度沿用 Readest 的实时保存；播放队列与位置每 5 秒及暂停时持久化；冷启动恢复 | S1 |
| A8 | **Google Play 合规**：2026-08-31 起新应用与更新必须 `targetSdk 36`；使用原生库的应用必须支持 16 KB 内存页；前台服务类型需在 Play Console 声明；`MANAGE_EXTERNAL_STORAGE`、`REQUEST_INSTALL_PACKAGES`、内购权限受限或不需要 | 高（影响上架） | 确定存在 | 沿用 Readest 的 `targetSdk 36` 与 NDK 28.2；CI 检查 `.so` 的 LOAD 段对齐与 `zipalign -P 16`；Play 渠道（googleplay flavor）构建时自动剔除受限权限并在检测到时让构建失败；产出 AAB | Phase 0 CI |
| A9 | **大文件内存**：大 PDF / CBZ 在 WebView 中占用内存高 | 中 | 中 | Readest 已有 Rust 侧 range 读取与原生解析；对超大文件做测试并调优 pdf.js 参数 | Phase 1 真机 |
| A10 | **Tauri 移动端成熟度**：插件 API 变化、移动端生命周期问题 | 中 | 中 | 跟随 Readest 的 Tauri 分叉（已包含移动端主线程修复）；Android 原生逻辑尽量放在独立 Kotlin 服务中，减少对 Tauri 运行时的依赖 | 持续 |
| A11 | **音质预期**：Android 系统混音器会把音频重采样到设备采样率，这是系统行为 | 低 | 确定存在 | Yohaku 不额外施加任何处理；高解析度 FLAC 使用浮点输出；Android 14+ 的 USB 比特完美输出作为后续高级选项 | S1 |
| A12 | **手势冲突**：WebView 内拖动照片、捏合缩放与系统返回手势冲突 | 中 | 中 | 边缘区域留空、长按与拖动阈值、震动反馈；Readest 已关闭预测性返回（`enableOnBackInvokedCallback=false`） | Phase 3 真机 |
| A13 | **CI 构建耗时**：Android 每个 ABI 最长 90 分钟 | 低 | 确定存在 | 公开仓库的 Actions 分钟数免费；PR 只构建 arm64；Rust 与 Gradle 缓存 | Phase 0 |

> 关于 A1 的补充：Readest 的有声书在 Android 上是由 WebView 的 `<audio>` 元素播放、再由前台服务提供锁屏控制的。这种方式适合单一音轨，但不适合 Yohaku：无缝衔接、多层环境声音混音、淡入淡出与睡眠定时都依赖持续运行的 JS 计时器，而 WebView 在后台无法保证这一点；一旦系统回收 Activity，播放也会随 WebView 一起停止。

---

## 6. 桌面端风险

| ID | 风险 | 对策 |
|---|---|---|
| D1 | Linux 依赖 Readest 维护的 Tauri `feat/cef` 分支；CEF 版 AppImage 约 210 MB | 跟随 Readest 使用 CEF（Chromium 的 WebGL 表现与其他平台一致，且这是 Readest 唯一经过发布验证的 Linux 路径）；把所用分叉的提交固定下来，必要时镜像到自己的账号下 |
| D2 | macOS 未经 Apple 公证的 DMG 会被 Gatekeeper 拦截（macOS 15 起需要到「系统设置 → 隐私与安全性」中点击「仍要打开」） | 初期发布未公证版本并在说明中写明打开方式；如需正常分发，需要 Apple Developer Program（99 美元/年） |
| D3 | Windows 未签名安装包会触发 SmartScreen 提示 | 初期不签名；之后可申请 SignPath 开源免费签名或 Azure Trusted Signing |
| D4 | WebView2 / WKWebView 会在窗口隐藏后节流 JS | 队列、计时、淡变都在 Rust 引擎内执行，界面只是显示 |
| D5 | 输出设备切换、蓝牙耳机断开 | 监听输出流错误并在新默认设备上重建，保留播放位置；可选「设备断开时暂停」 |
| D6 | Linux 音频栈差异（ALSA / PulseAudio / PipeWire） | cpal 默认走 ALSA（PipeWire / Pulse 通过兼容层），必要时启用 cpal 的 PipeWire 后端 |

---

## 7. 需要确认的决策

| # | 决策 | 推荐 | 备选与影响 |
|---|---|---|---|
| 1 | 项目许可证 | **AGPL-3.0**（Fork Readest 的必要条件） | 若必须使用宽松许可证，只能走路线 B（基于 foliate-js 自建），工期大幅增加 |
| 2 | 基础仓库 | **Fork Readest**，保留其完整 Git 历史，便于持续合并上游 | 基于 foliate-js 自建 |
| 3 | 音频架构 | **双原生引擎 + 统一接口**：桌面 Rust（rodio / symphonia / cpal + souvlaki），Android Media3 | 全平台 Rust 引擎（Android 端风险高）；或 WebView 播放（后台不可靠，不推荐） |
| 4 | Linux 运行时 | **跟随 Readest 使用 CEF** | WebKitGTK：安装包更小，但艺术效果性能差，且 Readest 已不在其上发布 |
| 5 | 应用标识（Android `applicationId` 一旦上架不可更改） | **`io.github.chaosnap.yohaku`** | 其他你持有的域名反写，例如 `com.<你的域名>.yohaku` |
| 6 | Readest 功能裁剪范围 | 按[架构文档 §7](02-architecture.md#7-readest-裁剪清单)：移除账户、云同步、付费、遥测、AI 与第三方在线集成；保留 OPDS、词典、朗读（离线引擎）、局域网传书，默认隐藏 | 保留更多在线功能（与「完全离线」的定位冲突） |
| 7 | 签名与分发 | Android：你在本地用 `keytool` 生成一次 keystore 并上传到 GitHub Secrets；macOS / Windows 先发布未签名版本 | 购买 Apple Developer 以公证 macOS 版本；申请 Windows 代码签名 |

---

## 参考来源

- Readest：<https://github.com/readest/readest>（源码与 `.github/workflows/release.yml`、`pull-request.yml`、`android-e2e.yml`）
- foliate-js：<https://github.com/johnfactotum/foliate-js>
- Koodo Reader：<https://github.com/koodo-reader/koodo-reader>
- Harmonia：<https://github.com/bgh30539-code/harmonia>
- rodio：<https://github.com/RustAudio/rodio>　cpal：<https://github.com/RustAudio/cpal>　Symphonia：<https://github.com/pdeljanov/Symphonia>　souvlaki：<https://github.com/Sinono3/souvlaki>
- Google Play 目标 API 级别要求：<https://developer.android.com/google/play/requirements/target-sdk>
- Google Play 目标 API 级别（帮助中心）：<https://support.google.com/googleplay/android-developer/answer/11926878>
- 16 KB 页大小迁移说明（Expo 汇总）：<https://github.com/expo/fyi/blob/main/android-16kb-page-sizes.md>
- Android 15 行为变更（音频焦点限制）：<https://developer.android.com/about/versions/15/summary>
- Media3 后台播放：<https://developer.android.com/media/media3/session/background-playback>
