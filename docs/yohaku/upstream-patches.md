# 对上游 Readest 的改动登记

> 基线：Readest `v0.12.16`（`3cc39ad`），以 `git merge --allow-unrelated-histories` 导入并保留完整历史。
> 规则：Yohaku 的新代码放在 `yohaku/` 目录；确需改动的上游文件在改动处标注 `[yohaku]`，并在此登记。合并上游时，先看这张表。

## 运行机制

- `apps/readest-app/.env.tauri` 设置 `NEXT_PUBLIC_YOHAKU_BUILD=true`，所有应用构建（`pnpm build`）都是 Yohaku 构建；单元测试只加载 `.env`，因此上游测试照常验证 Readest 的行为，Yohaku 的测试用 `vi.stubEnv` 打开开关。
- 判断函数在 `apps/readest-app/src/yohaku/build.ts`：`isYohakuBuild()`、`toYohakuBrand()`。

## 配置与环境

| 文件 | 改动 | 原因 |
|---|---|---|
| `apps/readest-app/.env` | 删除 Readest 的 PostHog、Supabase、Stripe 默认密钥；Supabase 指向 `https://supabase.invalid` | 不连接 Readest 的服务；客户端仍需一个 URL 才能构造 |
| `apps/readest-app/.env.tauri` | `DBUS_ID`；新增 `NEXT_PUBLIC_YOHAKU_BUILD`、`NEXT_PUBLIC_SELF_HOSTED`（解锁全部高级功能，无付费墙）、`NEXT_PUBLIC_DISABLE_UPDATER`；`NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_NODE_BASE_URL` 指向 `https://readest.invalid` | 离线、无账户、无更新源；不设置时 Readest 的 Web API 回落到 `web.readest.com`，在线元数据检索、Readest Voice 等调用会连到 Readest，指向永不解析的 `.invalid` 域名后这些调用立即失败 |
| `apps/readest-app/package.json` | 版本号（当前 `1.5.0`） | Yohaku 独立版本号 |
| `apps/readest-app/src-tauri/tauri.conf.json` | 产品名、可执行文件名、应用标识；CSP 去掉 Sentry、PostHog、Supabase、Stripe、readest.com 与远程字体主机；发布者、版权与描述；macOS ad-hoc 签名；不生成更新包；深链接只保留 `readest`；更新地址改为 Yohaku 的 Releases | 品牌与离线 |
| `.gitignore` | 合并上游与 Yohaku 的规则 | `references/`、`local/` 与签名文件不入库 |
| `.github/` | 删除上游全部工作流、资助链接、Issue 模板与 Dependabot；新增 `ci.yml`、`build.yml`、`build-app.yml`、`release.yml` | Yohaku 自己的构建与发布 |

## 前端（`apps/readest-app/src`）

| 文件 | 改动 |
|---|---|
| `i18n/i18n.ts` | Yohaku 构建中注册品牌后处理器，界面文案里的「Readest」显示为「Yohaku」 |
| `utils/supabase.ts`、`context/PHContext.tsx` | 默认密钥缺失时不再抛错（`atob(… ?? '')`） |
| `styles/fonts.ts` | Yohaku 构建不挂载任何远程字体（Google Fonts、jsDelivr、cdnjs、readest 存储） |
| `services/localsend/devicePrefs.ts` | Yohaku 构建中「Nearby BookDrop」默认关闭，首次启动不加入局域网 |
| `app/library/components/SettingsMenu.tsx`、`LibraryEmptyState.tsx` | 隐藏登录入口 |
| `components/settings/IntegrationsPanel.tsx` | 隐藏 Readest Cloud、Google Drive、OneDrive、iCloud、BookOrbit、Readwise、Hardcover、Pagebound、Notion、Audiobookshelf、Send to Readest、Discord，以及「通过 Readest 账户同步」的提示；保留 KOReader、WebDAV、S3、OPDS、Nearby BookDrop |
| `components/Providers.tsx`、`components/settings/ControlPanel.tsx`、`services/commandRegistry.ts` | 不弹出遥测授权，隐藏遥测开关与命令 |
| `helpers/updater.ts` | 不读取 Readest 服务器上的更新说明 |
| `components/AboutWindow.tsx` | 名称；版权「© Yuki」，注明基于 Readest 并保留 Bilingify LLC 的版权声明；源码链接指向本仓库；隐藏检查更新与 Readest 的法律、社区链接 |
| `app/layout.tsx` | 窗口标题使用 Yohaku |
| `services/sync/cloudSyncProvider.ts` | Yohaku 构建中 Readest Cloud 永远关闭（`isReadestCloudEnabled` 返回 false），依赖它的上传、同步与传输队列随之关闭 |
| `utils/nav.ts` | `navigateToLogin` 在 Yohaku 构建中不跳转，作为没有账户时的兜底 |
| `app/library/components/BookItem.tsx` | 书本下的云按钮只在启用了文件同步（WebDAV、S3 等）且书只在服务器上时显示「下载」，不跳转登录（判断函数在 `yohaku/cloud.ts`） |
| `app/library/components/BookshelfItem.tsx` | 书籍右键菜单去掉「分享书籍」；「上传 / 下载」只在启用文件同步时出现 |
| `app/library/components/SelectModeActions.tsx` | 选择模式中没有可下载的书时不显示「下载」 |
| `app/library/page.tsx` | 下拉刷新不再跳转登录，只刷新已配置的文件同步与 OPDS 订阅；启动时不因 `keepLogin` 跳到登录页 |
| `app/user/layout.tsx`；新增 `app/auth/layout.tsx`、`app/link/layout.tsx`、`app/send/layout.tsx` | Yohaku 构建中登录、账户、设备配对与「发送到 Readest」页面不再渲染，直接回到书库（`src/yohaku/BackToLibrary.tsx`），深链接也打不开它们 |
| `components/metadata/BookDetailModal.tsx`、`BookDetailView.tsx` | 书籍详情：上传、下载与「仅删除云端 / 仅删除本地」只在启用文件同步时出现，否则只有一个「删除」；去掉「分享书籍」 |
| `app/reader/components/ViewMenu.tsx` | 阅读器菜单去掉「分享书籍」；没有配置任何同步服务时隐藏同步一行 |
| `i18n/i18n.ts` | 注册 Yohaku 自己的翻译命名空间 `yohaku` 作为 `fallbackNS`（文案在 `src/yohaku/i18n/`，随应用打包，不改动 Readest 的翻译文件，合并上游时不冲突） |
| `styles/themes.ts` | 在「默认」之后加入「暖纸」「月白」「墨夜」三个阅读主题（配色在 `src/yohaku/themes.ts`；这里用相对路径导入，因为 Tailwind 插件加载这个文件时不解析路径别名） |
| `types/settings.ts` | `SystemSettings.yohaku`：Yohaku 自己的设置（`src/yohaku/settings.ts`），保存在 Readest 的设置文件中 |
| `services/settingsService.ts` | 首次启动的全局排版按界面语言（中文、日文、英文）取 Yohaku 的默认值（`src/yohaku/typesetting.ts`） |
| `services/bookService.ts` | `loadBookConfig` / `saveBookConfig` 在全局设置之上加一层「书籍语言的排版」，读写使用同一基准，因此不写进书籍配置，之后修改全局设置仍对这本书生效 |
| `libs/document.ts` | 打开 CBZ 时读取 ComicInfo.xml 的 `Manga` 字段：`YesAndRightToLeft` 从右到左，`No` 从左到右（`src/yohaku/reader/comicInfo.ts`） |
| `app/reader/components/FoliateViewer.tsx` | 没有自身阅读方向的漫画按「漫画默认从右到左」设置打开 |
| `components/settings/LayoutPanel.tsx` | 漫画与书库设置中显示「漫画」一节（`src/yohaku/reader/ComicsSettings.tsx`） |
| `services/tts/TTSController.ts` | 不初始化 Readest Voice（Readest 的服务器）；Edge 在线语音只在用户开启后初始化与列出（开关保存在 localStorage，与 Readest 的朗读偏好相同，见 `src/yohaku/onlineVoices.ts`；不读取设置 store，因为 `services/constants` 导入了这个文件） |
| `components/settings/TTSPanel.tsx` | 「语音」中加入「在线语音」开关（`src/yohaku/reader/OnlineVoicesRow.tsx`） |
| `app/library/components/LibraryHeader.tsx` | 搜索框左侧加入「书籍 / 音乐」切换（`src/yohaku/LibrarySwitcher.tsx`），进入音乐库 |
| `app/reader/components/HeaderBar.tsx` | 右上角加入朗读按钮（`src/yohaku/reader/ReadAloudToggler.tsx`）：开始或停止朗读、环境声场景与朗读快捷键提示；v1.0.0 时这里是音乐按钮，v1.5.0 起音乐移到页脚 |
| `app/reader/components/footerbar/FooterBar.tsx` | 挂载音乐小播放器（`src/yohaku/music/ReaderMusicBar.tsx`），样式与位置同 Readest 的朗读小播放器（`TTSMiniPlayer`），随工具栏出现和隐去；两者同时出现时音乐在上 |
| `app/reader/components/footerbar/DesktopFooterBar.tsx`、`NavigationBar.tsx` | 页脚的「朗读」按钮换成「音乐」按钮（`src/yohaku/music/MusicButton.tsx`），打开或收起音乐小播放器；朗读从右上角的朗读按钮开始 |
| `app/reader/components/notebook/Notebook.tsx` | 桌面上笔记本是浮在页面旁的卡片：四周留出 8px、圆角、细边框，固定时带轻微阴影；手机上仍是底部面板 |
| `app/reader/components/ReaderContent.tsx` | 注册音乐快捷键（`src/yohaku/music/useMusicShortcuts.ts`） |
| `components/Providers.tsx` | 挂载 `useAudioHost()`（`src/yohaku/audio/windows.ts`）：桌面上音乐只在主窗口（书库）播放，书在独立窗口中打开时，那个窗口的音乐按钮与快捷键经 Tauri 事件把指令交给主窗口 |
| `helpers/shortcuts.ts` | 新增「播放 / 暂停音乐」（M）、「下一首」（.）、「上一首」（,）；Yohaku 构建的快捷键列表多一个「音乐」分组 |
| `services/translators/providers/index.ts` | 去掉需要 Readest 账户的翻译服务：DeepL 总是经过 Readest 的服务器；Azure、Yandex 只在网页版中需要，应用里直连，保留 |

## 原生层

| 文件 | 改动 |
|---|---|
| `src-tauri/src/lib.rs` | 单实例 ID 改为 `io.github.chaosnap.yohaku`；窗口标题；注册 `tauri-plugin-yohaku-audio` |
| `src-tauri/Cargo.toml`、`src-tauri/capabilities/default.json` | 加入 Yohaku 的音频插件 `tauri-plugin-yohaku-audio`（Android 的 Media3 后台播放服务与音乐库扫描；桌面上用 lofty 扫描音乐库、读取标签与封面，并让 WebView 读取这些文件）及其权限 |
| 新增 `app/music/page.tsx` | 音乐库路由（页面在 `src/yohaku/music/`），从书库顶部的「书籍 / 音乐」切换进入；v0.0.4 曾放在书库菜单中，v1.0.0 起菜单恢复原样 |
| `src-tauri/src/macos/menu.rs` | 「帮助」菜单指向本仓库与 `PRIVACY.md` |
| `src-tauri/plugins/tauri-plugin-native-tts/src/now_playing.rs` | 系统媒体控制名称与 MPRIS 名 `yohaku` |
| `src-tauri/plugins/tauri-plugin-native-bridge/src/desktop.rs` | 钥匙串条目 `Yohaku Safe Storage` |
| `extensions/windows-thumbnail/src/com_provider.rs`、`src-tauri/nsis/installer-hooks.nsh` | 缩略图提供程序使用新的 CLSID 与显示名称，并识别 `yohaku.exe` |

## Android（`apps/readest-app/src-tauri/gen/android`）

| 文件 | 改动 |
|---|---|
| `app/build.gradle.kts` | `namespace` / `applicationId`；所有构建都不声明 Android Auto；`-PyohakuStore=play` 时以无效权限名代替 `MANAGE_EXTERNAL_STORAGE` |
| `app/src/main/AndroidManifest.xml` | 删除 `REQUEST_INSTALL_PACKAGES`，移除 `BILLING`（含库带入的）；所有文件访问权限改为占位符；删除 Google Drive、OneDrive 回调与 `web.readest.com` 应用链接 |
| `MainActivity.kt`、`KeyLearnCaptureTest.kt` | 移到 `io.github.chaosnap.yohaku` 包 |
| `res/mipmap-anydpi-v26/ic_launcher.xml`、`res/drawable/splash_background.xml` | 改用 Yohaku 的矢量图标；删除 Readest 的单色图标与启动图 PNG |
| 新增 `res/drawable/yohaku_icon_*.xml`、`res/values/yohaku_colors.xml` | 图标矢量与背景色 |

## 上游测试的调整

| 测试 | 调整 |
|---|---|
| `__tests__/utils/supabase-storage-key.test.ts` | 「默认指向 Readest Cloud」改为「不带 Readest Cloud 默认值」 |
| `__tests__/android/themed-icon.test.ts` | 单色图层改为检查 Yohaku 的矢量图标 |
| `__tests__/android/android-auto-declarations.test.ts` | 「仅 Play 版不声明 Android Auto」改为「所有构建都不声明」 |
| `__tests__/components/settings/KeyboardShortcutsSettings.test.tsx` | 改绑测试用的按键由 `m` 换成 `b`：`m` 是 Yohaku 的音乐快捷键，会触发冲突确认 |

## 暂缓的改动（已知差异）

| 事项 | 现状 | 计划 |
|---|---|---|
| 深链接协议 | 仍为 `readest://`（小部件、朗读恢复、分享链接都依赖它）；与已安装的 Readest 同时存在时，系统可能让用户选择由哪个应用打开 | Phase 1 统一迁移到 `yohaku://` |
| 数据子目录名 | 应用数据目录内仍叫 `Readest/`（数据根目录按应用标识区分，不会与 Readest 冲突） | 需要迁移旧数据时一并处理 |
| Rust 包名与 npm 包名 | 仍为 `Readest`、`@readest/readest-app` | 只是内部名称，保留以减少合并冲突 |
| 朗读服务与 TTS 媒体会话 | 沿用 Readest 实现 | Phase 2 与音乐播放器统一仲裁 |
| Sentry 依赖 | 代码保留；未配置 DSN，不会上报 | 之后移除依赖 |
| 阅读统计中的连续天数 | Readest v0.12.16 只记录阅读统计、没有统计界面；上游之后的版本加入了显示连续天数的 `ReadingStatsDialog` | 合并到包含它的上游版本时隐藏连续天数 |
