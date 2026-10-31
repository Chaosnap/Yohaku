# Questions

## Installing

### macOS says the app is damaged

Yohaku is not notarized by Apple yet. Usually it is enough to follow [Install](./install#macos) and click "Open Anyway" in System Settings → Privacy & Security.

If macOS says outright that the app is damaged, with no "Open Anyway" button, the quarantine flag the browser added while downloading is to blame. After dragging Yohaku into Applications, run this in Terminal:

```bash
xattr -dr com.apple.quarantine /Applications/Yohaku.app
```

Then open Yohaku again.

### Windows shows a SmartScreen warning

The installers are not code-signed yet, so Windows doesn't recognise them. Click "More info", then "Run anyway".

### Android: arm64 or armv7?

Most phones want **arm64**. Only older 32-bit phones need **armv7**; switch to it if arm64 will not install.

### Can I install it alongside Readest?

Yes. Yohaku has its own app identifier, so the two don't touch each other, and each keeps its own library and settings.

### Is there an iOS version?

No. Yohaku runs on Windows, macOS, Linux and Android.

### How do I update?

Yohaku has no in-app updater. Download the new version from [Releases](https://github.com/Chaosnap/Yohaku/releases) and install it over the old one; your library, music library and settings stay.

## Music

### I added songs to my music folder and they don't show up

Synced folders sync every time Yohaku starts. If you don't want to restart, click the sync button (Sync Now) next to "+" at the top of the music library.

### On Android, importing music does nothing

That was a bug in Yohaku 2.0 and earlier. Update to 2.1 or later: From Directory and From Local File then open the system file manager, as importing books does.

### Are my music files copied?

No. Yohaku only remembers where each song is; it never copies, moves or modifies them. If you move your music files, sync or import them again.

### Why does this song have no lyrics?

Yohaku reads only an `.lrc` file with the same name beside the song, or lyrics embedded in its tags; it never downloads lyrics. See [Lyrics](./lyrics) for how to write them.

### The lyrics are garbled

Yohaku understands lyrics files in UTF-8, UTF-16 and GBK. If they are still garbled, save the `.lrc` file as UTF-8.

### Does the music stop when I open a book?

No. The music keeps playing, and the 🎵 button in the reading footer controls it; see [Listening while reading](./listening). On the desktop a book opens in its own window while the music keeps playing in the main window, and every window can control it.

### Can I listen with my phone locked?

Yes. On Android, music keeps playing in the background and with the screen locked, with controls on the lock screen, in the notification and on Bluetooth headphones.

## Everything else

### Why are the ambient sounds always off?

On purpose: Yohaku always starts from silence, so nothing starts playing while you aren't looking.

### Why did read-aloud stop when I closed the book?

Reading aloud belongs to the book: close the book being read and the reading stops, rather than carrying on in the library. Music is not affected.

### Does Yohaku cost anything?

No. Yohaku is free and open source (AGPL-3.0), with no paywall and no account.

### Found a problem, or have an idea?

[Open an issue](https://github.com/Chaosnap/Yohaku/issues) on GitHub. Say which platform and which version of Yohaku you use, and how to make the problem happen again.
