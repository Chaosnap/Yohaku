# 云端构建

Yohaku 的每一个安装包都是在 GitHub Actions 上构建的：格式检查、测试、打包、签名与发布全部在云端完成，没有一个安装包来自某个人的电脑。这样任何人都能看到一个版本是怎样构建出来的，也能验证下载的文件确实来自这里。

## 工作流

| 工作流 | 什么时候运行 | 做什么 |
|---|---|---|
| **CI** | 每次推送到 `main` | 检查 Yohaku 的配置（离线、没有 Readest 的服务密钥）、格式与类型检查、构建应用前端、单元测试 |
| **Build** | 推送到 `main` 且改动了代码 | 构建全部平台的测试包，保留 14 天 |
| **Release** | 推送 `v*` 标签 | 构建全部平台的正式安装包，生成 `SHA256SUMS.txt` 与构建来源证明 |
| **Publish release** | Release 成功以后 | 自动发布这个版本：`v0.*` 与带后缀的版本是预览版，其余是最新版本 |
| **Pages** | 网站或文档有改动时 | 构建并发布这个网站 |
| **Upstream sync** | 每月 1 日 | 尝试合并 Readest 的最新发布版，用 Issue 报告结果 |

## 构建矩阵

| 平台 | 产物 |
|---|---|
| Windows x64 | NSIS 安装包、便携版 exe |
| macOS（Apple 芯片与 Intel 通用） | DMG（ad-hoc 签名，未经公证） |
| Linux x64 | AppImage、deb |
| Android arm64 / armv7 | APK |

正式安装包使用固定的 Android 签名密钥，所以新版本可以直接覆盖安装旧版本。密钥只保存在 GitHub Secrets 与离线备份里，从不进入仓库。

## 检查

每次构建都会自动检查：

- 应用构建里没有 Readest 的服务密钥或遥测地址，Yohaku 的离线开关已经打开；
- Android 安装包的目标版本不低于 Android 16（API 36），原生库按 16 KB 页对齐，没有请求不需要的权限；
- Linux 的 AppImage 带齐了运行所需的库；测试包还会在 Ubuntu 22.04 与 24.04 上实际启动一次。

## 验证下载的文件

每个正式版本都附有 `SHA256SUMS.txt` 与 GitHub 的构建来源证明，验证方法见[安装](./install#校验下载的文件)。

## 更多细节

工作流、签名与密钥管理、产物命名与上游同步的完整说明，见开发文档里的[构建、测试与发布](/zh/dev/04-ci-release)。这个网站本身也由 GitHub Actions 构建（`.github/workflows/pages.yml`），源文件在仓库的 `website/` 目录。
