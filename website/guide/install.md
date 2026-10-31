# Install

Download the build for your platform from [GitHub Releases](https://github.com/Chaosnap/Yohaku/releases/latest). Yohaku is free and has no account: install it and start reading.

| Platform | File | Notes |
|---|---|---|
| 🪟 Windows | `Yohaku_<version>_windows_x64-setup.exe` (installer)<br>`Yohaku_<version>_windows_x64-portable.exe` (portable) | Windows 10 / 11, x64 |
| 🍎 macOS | `Yohaku_<version>_macos_universal.dmg` | Apple silicon and Intel |
| 🐧 Linux | `Yohaku_<version>_linux_amd64.AppImage`<br>`Yohaku_<version>_linux_amd64.deb` | x86_64 |
| 🤖 Android | `Yohaku_<version>_android_arm64.apk` (most phones)<br>`Yohaku_<version>_android_armv7.apk` (older 32-bit phones) | Android 8.0 or later |

## Windows

The **installer** puts Yohaku into the system and the Start menu. The **portable** build is a single `.exe` that runs from wherever you put it, such as a USB stick or a computer you would rather not install things on.

The installers are not code-signed yet, so the first run may bring up a blue SmartScreen warning: click "More info", then "Run anyway".

## macOS

Open the `.dmg` and drag Yohaku into Applications.

Yohaku is not notarized by Apple yet, so macOS stops it the first time:

1. Double-click Yohaku once, and close the warning that appears;
2. Open System Settings → Privacy & Security, find the message about Yohaku near the bottom, and click "Open Anyway";
3. Confirm once more. From then on Yohaku opens like any other app.

If macOS says the app is damaged and cannot be opened, see [Questions](./faq#macos-says-the-app-is-damaged).

## Linux

The **AppImage** needs no installing; make it executable and run it:

```bash
chmod +x Yohaku_*_linux_amd64.AppImage
./Yohaku_*_linux_amd64.AppImage
```

The **deb** is for Debian, Ubuntu and their relatives:

```bash
sudo apt install ./Yohaku_*_linux_amd64.deb
```

## Android

Most phones want **arm64**; only older 32-bit phones need **armv7**. If you are not sure, try arm64 first and switch to armv7 if it will not install.

Open the downloaded `.apk` from your browser or file manager. The first time, Android asks you to allow that app to "install unknown apps"; allow it and carry on.

Yohaku and Readest are separate apps and can live on the same phone.

## Updating

Yohaku has no in-app updater and never checks for new versions in the background (it does not go online when it starts). When a new version is out, download it from [Releases](https://github.com/Chaosnap/Yohaku/releases) and install it over the old one; your library, music library and settings stay. What changed in each version is in the [changelog](/changelog/).

## Verifying downloads

Every release comes with `SHA256SUMS.txt`, which shows that a file was not damaged or swapped on the way to you:

```bash
sha256sum --ignore-missing -c SHA256SUMS.txt
```

On macOS, use `shasum -a 256 -c SHA256SUMS.txt --ignore-missing`.

Every file also carries a GitHub build provenance attestation, which shows that it really was built by this repository's GitHub Actions. With the [GitHub CLI](https://cli.github.com/) installed:

```bash
gh attestation verify Yohaku_*_linux_amd64.AppImage --repo Chaosnap/Yohaku
```

Every Yohaku installer is built on GitHub Actions; see [Built in the cloud](./building).
