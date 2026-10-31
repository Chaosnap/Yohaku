# Built in the cloud

Every Yohaku installer is built on GitHub Actions: format checks, tests, packaging, signing and releases all happen in the cloud, and no installer comes from anyone's own computer. So anyone can see how a version was built, and check that a downloaded file really came from here.

## Workflows

| Workflow | When it runs | What it does |
|---|---|---|
| **CI** | Every push to `main` | Checks Yohaku's configuration (offline, none of Readest's service keys), formatting and types, builds the app's frontend, runs the unit tests |
| **Build** | Pushes to `main` that change code | Builds test packages for every platform, kept for 14 days |
| **Release** | Pushing a `v*` tag | Builds the release installers for every platform, with `SHA256SUMS.txt` and build provenance attestations |
| **Publish release** | After Release succeeds | Publishes the release: `v0.*` and suffixed versions as pre-releases, the rest as the latest version |
| **Pages** | When the site or the documents change | Builds and publishes this site |
| **Upstream sync** | On the 1st of every month | Tries to merge Readest's latest release and reports the result in an issue |

## Build matrix

| Platform | Packages |
|---|---|
| Windows x64 | NSIS installer, portable exe |
| macOS (Apple silicon and Intel) | DMG (ad-hoc signed, not notarized) |
| Linux x64 | AppImage, deb |
| Android arm64 / armv7 | APK |

Release builds are signed with a fixed Android key, so a new version installs straight over the old one. The key lives only in GitHub Secrets and offline backups, never in the repository.

## Checks

Every build checks automatically that:

- the app contains none of Readest's service keys or telemetry addresses, and Yohaku's offline switch is on;
- the Android packages target Android 16 (API 36) or later, their native libraries are aligned to 16 KB pages, and they ask for no permissions they don't need;
- the Linux AppImage carries every library it needs to run; test builds are also started once on Ubuntu 22.04 and 24.04.

## Verifying downloads

Every release comes with `SHA256SUMS.txt` and GitHub build provenance attestations; see [Install](./install#verifying-downloads) for how to check them.

## More detail

The full story of the workflows, signing and keys, package names and upstream syncing is in the development document [Builds, tests and releases](/dev/04-ci-release) (in Chinese). This site is built by GitHub Actions too (`.github/workflows/pages.yml`), from the `website/` folder of the repository.
