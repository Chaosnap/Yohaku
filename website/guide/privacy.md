# Privacy

**Yohaku collects no data.**

- No account, no cloud services, no analytics, telemetry or crash reporting.
- Your books, reading progress, annotations, music library and every setting stay on your own device.
- Yohaku never modifies your original books and music. Music files are only referenced; not even their tags are rewritten.

## When Yohaku goes online

Starting Yohaku, sorting your library, reading, listening to music and playing ambient sounds never touch the network. Yohaku has no in-app updater and never checks for new versions in the background.

Yohaku goes online only when you use one of these features yourself, and then only to the servers or devices that feature needs:

| Feature | Connects to |
|---|---|
| OPDS catalogs | The catalogs you added |
| KOReader sync, WebDAV and others | The sync servers you set up |
| Nearby book transfer | The device you chose on the same network |
| Online voices for read-aloud | Microsoft's speech service (the text being read is sent to Microsoft; off by default) |
| Dictionary | Wiktionary and Wikipedia, the two default online dictionaries, only when you look a word up; you can turn them off in the dictionary settings and use local dictionaries only |
| Translation | The translation service you chose: Google, Azure or Yandex, only when you tap "Translate" |

If you would rather stay offline, simply don't use these features; the rest of Yohaku is entirely offline.

## How it differs from Readest

Yohaku is built on Readest. Readest's accounts and cloud sync, paid features, analytics and telemetry are all gone from Yohaku, and every app build is checked in CI to make sure none of Readest's service keys or telemetry addresses are in it; see [Built in the cloud](./building).

## Open source

Yohaku is open source under the AGPL-3.0, so every sentence on this page can be checked against the [source code](https://github.com/Chaosnap/Yohaku). [PRIVACY.md](https://github.com/Chaosnap/Yohaku/blob/main/PRIVACY.md) at the root of the repository says the same in Chinese and English.
