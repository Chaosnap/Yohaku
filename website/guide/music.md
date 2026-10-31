# The music library

The Books / Music switch at the top of the library, left of the search box, turns the library into the music library. It holds the music you collected yourself: Yohaku sells no songs and connects to no streaming service.

![The music library's album grid](/images/desktop-music-albums.jpg)

## Importing music

Click "+" in the music library, or "Import Music" in the middle of an empty one, and choose:

- **From Directory**: pick a music folder and Yohaku adds every song in it, subfolders included. The folder appears under Synced Folders on the Folders page, and **Yohaku syncs it every time it starts**: songs you add to the folder appear, songs you delete disappear. To sync right away, click the sync button (Sync Now) next to "+" at the top of the music library.
- **From Local File**: choose songs one by one; they appear under Imported Files.

::: tip Your music is only referenced
Yohaku remembers where each song is. It never copies, moves or modifies your music files, and never rewrites their tags. The music library itself is one small file in Yohaku's data folder.
:::

On Android, importing opens the system file picker. Once you pick a folder, Yohaku keeps its permission to read it, so the folder still syncs after a restart.

## Formats and tags

Yohaku reads tags and embedded covers from the common formats:

FLAC, MP3, AAC / M4A, ALAC, Ogg Vorbis, Opus, WAV, AIFF and more.

Title, artist, album, track and disc numbers, year and genre all come from the songs' own tags; songs without tags show their file names. Album covers come from the embedded artwork.

## Browsing

The music library has five pages, and the search box at the top finds songs by title, artist and album:

| Page | What's on it |
|---|---|
| **Albums** | A grid of covers; open an album to see it in disc and track order |
| **Artists** | Each artist's albums and songs |
| **Songs** | Every song in a list |
| **Favorites** | The songs you gave a heart |
| **Folders** | Synced folders and imported files |

In the song list, the heart adds a **favorite** and ⓘ opens **Song Details**: year, genre, length, format, bitrate, sample rate, file size and location. Albums have **Album Details** too.

<figure>

![The song list with favorite and details buttons](/images/desktop-music-songs.jpg)

<figcaption>Songs: the heart for favorites, ⓘ for details</figcaption>
</figure>

## Playing and the queue

- Choose a song in an **album** and the queue is that album, from that song on, in track order.
- Choose a song in a whole list such as **Songs** or **Favorites** and the queue runs from that song to the end of the list.
- When you listen on your own, a frosted-glass player floats at the bottom of the music library: cover, title, controls and progress.

![The frosted-glass player at the bottom of the music library](/images/desktop-music-player.jpg)

Open a book and the music keeps playing. No player floats over the page; the footer controls it, see [Listening while reading](./listening).

## On Android

- Music keeps playing in the background and with the screen locked.
- The lock screen, the notification and Bluetooth headphones all control playback.

## On the desktop

On the desktop each book opens in its own window by default, and music plays only in the main window: however many books you open there is only one sound, and every window's footer controls it.
