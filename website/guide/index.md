<script setup>
import { data as releases } from '../changelog/releases.data.ts'
</script>

# Introduction

> **A Quiet Place Between Words and Sound.**<br>
> 在文字与声音之间，留一处属于自己的空白。

**余白** (*yohaku*) is the blank space left on a page. Yohaku wants to be that kind of space: while you read, put on a record from your own collection, or let it rain outside the window. The book stays where it is, and the music never gets in the way.

It brings **reading** and **listening** into one quiet place: books, comics, your own music collection, lyrics, read-aloud and ambient sound. Yohaku runs on Windows, macOS, Linux and Android, and it is free and open source.

## What it does

- 📖 **[Books and comics](./reading)**: EPUB, MOBI, AZW3, FB2, CBZ, PDF and TXT; horizontal and vertical text; three reading themes; highlights, notes, bookmarks, a dictionary and translation.
- 🎵 **[The music library](./music)**: import a music folder and it syncs every time Yohaku starts; browse by album, artist, song and favorite; tags and embedded covers are read for you.
- 🎧 **[Listening while reading](./listening)**: the footer turns into a music bar with one tap; change songs and see the queue in the sidebar; a vertical volume slider.
- 🎼 **[Lyrics](./lyrics)**: `.lrc` files or embedded lyrics flow line by line and fill in word by word, with translations beneath.
- 🌧️ **[Ambient sounds](./ambient)**: ten sounds synthesized by Yohaku, five scenes, and a volume for every sound.
- 🗣️ **[Read aloud](./read-aloud)**: reads from the current page, highlighting sentence by sentence, with speech rate and a sleep timer.
- 🔒 **[Privacy](./privacy)**: no account, cloud, paywall or telemetry, and nothing goes online when Yohaku starts.

## The icon

![](/images/icon.svg){.page-icon}

Yohaku's icon is called 留白, "leaving a blank": an open book on a night-blue ground. The left page holds a few lines of words; the right page is almost empty but for one vermilion note. Words, sound, and the space between them: that is 余白.

It is also how Yohaku looks as a whole: night blue, paper, a touch of vermilion, and plenty of blank space.

## Yohaku and Readest

Yohaku is built on the open-source reader [Readest](https://github.com/readest/readest) v0.12.16 and, like Readest, is licensed under the [AGPL-3.0](https://github.com/Chaosnap/Yohaku/blob/main/LICENSE).

- **Kept**: Readest's reading engine ([foliate-js](https://github.com/johnfactotum/foliate-js)), typesetting, annotations, dictionary and translation, OPDS catalogs, and the sync you set up yourself, such as KOReader and WebDAV.
- **Taken out**: accounts, cloud services, the paywall and telemetry. Yohaku does not go online when it starts; see [Privacy](./privacy).
- **Added**: the music library, lyrics, ambient sounds, the music bar in the footer, Yohaku's reading themes, and an interface with plenty of blank space.

Yohaku has its own app identifier (`io.github.chaosnap.yohaku`), so it installs alongside Readest. Every change made to Readest's code is recorded in [Changes to Readest](/dev/upstream-patches).

## Where it stands

The current version is **{{ releases[0].version }}**: reading, the music library, lyrics, ambient sounds and read-aloud all work. Next comes the darkroom, a quiet space of your own for books and records, and after it a gramophone and more sounds. The plan for each phase is in the [roadmap](/dev/03-roadmap), and what changed in each version is in the [changelog](/changelog/).

## Next

- [Install Yohaku](./install)
- [Look at the screenshots](./gallery)
- [Questions](./faq)
