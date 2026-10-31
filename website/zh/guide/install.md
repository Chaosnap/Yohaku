# 安装

在 [GitHub Releases](https://github.com/Chaosnap/Yohaku/releases/latest) 下载对应平台的安装包。Yohaku 免费，没有账户，装好就能用。

| 平台 | 文件 | 说明 |
|---|---|---|
| 🪟 Windows | `Yohaku_<版本>_windows_x64-setup.exe`（安装版）<br>`Yohaku_<版本>_windows_x64-portable.exe`（便携版） | Windows 10 / 11，x64 |
| 🍎 macOS | `Yohaku_<版本>_macos_universal.dmg` | Apple 芯片与 Intel 通用 |
| 🐧 Linux | `Yohaku_<版本>_linux_amd64.AppImage`<br>`Yohaku_<版本>_linux_amd64.deb` | x86_64 |
| 🤖 Android | `Yohaku_<版本>_android_arm64.apk`（大多数手机）<br>`Yohaku_<版本>_android_armv7.apk`（较旧的 32 位手机） | Android 8.0 及以上 |

## Windows

**安装版**会把 Yohaku 装进系统，出现在开始菜单里；**便携版**是单独一个 `.exe`，放在哪里都能直接运行，适合放进 U 盘或不想安装的电脑。

安装包还没有代码签名，第一次运行时可能看到 SmartScreen 的蓝色提示：点「更多信息」，再点「仍要运行」。

## macOS

打开 `.dmg`，把 Yohaku 拖进「应用程序」。

Yohaku 还没有经过 Apple 公证，第一次打开时 macOS 会拦下它：

1. 先双击打开一次，看到提示后关掉；
2. 打开「系统设置 → 隐私与安全性」，在页面下方找到关于 Yohaku 的提示，点「仍要打开」；
3. 再确认一次，之后就能像其他应用一样打开了。

如果提示的是「已损坏，无法打开」，见[常见问题](./faq#macos-提示已损坏无法打开)。

## Linux

**AppImage** 不需要安装，加上执行权限就能运行：

```bash
chmod +x Yohaku_*_linux_amd64.AppImage
./Yohaku_*_linux_amd64.AppImage
```

**deb** 适合 Debian、Ubuntu 及其衍生发行版：

```bash
sudo apt install ./Yohaku_*_linux_amd64.deb
```

## Android

大多数手机选 **arm64**；只有较旧的 32 位手机才需要 **armv7**。拿不准时先装 arm64，装不上再换 armv7。

用浏览器或文件管理器打开下载的 `.apk`。第一次安装时，Android 会请你允许这个应用「安装未知应用」，允许后继续即可。

Yohaku 与 Readest 是两个不同的应用，可以同时装在一台手机上。

## 更新

Yohaku 没有应用内更新，也不会在后台检查新版本（它启动时不访问网络）。有新版本时，到 [Releases](https://github.com/Chaosnap/Yohaku/releases) 下载，直接覆盖安装即可，书库、音乐库与设置都会保留。每个版本的变化见[更新日志](/zh/changelog/)。

## 校验下载的文件

每次发布都附有 `SHA256SUMS.txt`，可以确认文件在下载途中没有损坏或被替换：

```bash
sha256sum --ignore-missing -c SHA256SUMS.txt
```

macOS 上用 `shasum -a 256 -c SHA256SUMS.txt --ignore-missing`。

每个文件还带有 GitHub 的构建来源证明，说明它确实是由这个仓库的 GitHub Actions 构建出来的。装有 [GitHub CLI](https://cli.github.com/) 时可以这样验证：

```bash
gh attestation verify Yohaku_*_linux_amd64.AppImage --repo Chaosnap/Yohaku
```

Yohaku 的每一个安装包都是在 GitHub Actions 上构建的，见[云端构建](./building)。
