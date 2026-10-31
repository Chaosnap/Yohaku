# Books and comics

Yohaku's reading comes from Readest: the same reading engine (foliate-js), the same careful typesetting and annotations. On top of it Yohaku tunes the default typesetting, adds its own reading themes, and turns comic pages in the direction they were drawn for.

## The library

The library is the first thing you see. Click "Import Books" and choose "From Local File" to add books one by one, or "From Directory" to add a whole folder at once; the "+" tile at the end of the library imports too.

At the top of the library, left of the search box, the Books / Music switch takes you between the library and the [music library](./music) in one click.

![The library: a grid of covers](/images/desktop-library.jpg)

## Formats

| Kind | Formats |
|---|---|
| E-books | EPUB, MOBI, AZW3, FB2, TXT |
| Comics | CBZ |
| Fixed layout | PDF |

## Typesetting and themes

- Chinese, Japanese and English each have their own tuned defaults: fonts, line spacing, paragraph spacing and alignment, so a book looks right the moment it opens.
- Horizontal or vertical text: switch the writing mode in Settings → Layout, for Japanese novels and vertical Chinese books.
- One or two columns, pages or scrolling (<kbd>Shift</kbd> + <kbd>J</kbd> toggles scroll mode).
- Three Yohaku reading themes, chosen in Settings → Color. Each has a day look and a night look, following light and dark mode:
  - **Warm Paper** (暖纸): unbleached paper under a lamp, and at night the same page in lamplight;
  - **Moon White** (月白): the pale blue-white of moonlight, and at night a moonlit night;
  - **Ink Night** (墨夜): paper-coloured words on an ink-black night, and by day a light wash of ink.

## Annotations and the notebook

- Select text to **highlight** it, add a **note**, **copy**, **translate** or look it up in the **dictionary**, or start **reading aloud** from there.
- <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>B</kbd> adds a bookmark; bookmarks, highlights and notes all live in the sidebar.
- Press <kbd>N</kbd> for the **notebook**. On the desktop it is a card floating beside the page, so you can write as you read.

## Search and navigation

- <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>F</kbd> searches the whole book.
- The sidebar (<kbd>S</kbd>) holds the table of contents, annotations and bookmarks, plus Yohaku's Songs and Lyrics tabs; see [Listening while reading](./listening).
- You can read a whole book from the keyboard; see [Shortcuts](./shortcuts).

## Comics

- Comics open in the reading direction their `ComicInfo.xml` gives: Japanese manga marked right to left turn pages right to left.
- For comics that say nothing, turn on "Right to Left by Default" under Comics in Settings → Layout.
- The footer turns into a music bar while you read comics, too.

## Windows

On the desktop each book opens in its own window by default, and the library stays in the main window. Music plays only in the main window, so however many books you open there is only one sound, and every window's footer controls it.

## Sync and catalogs

Yohaku has no cloud of its own, but keeps the sync and catalogs from Readest that you set up yourself:

- KOReader sync, WebDAV and others, for reading progress and your library;
- OPDS catalogs, for downloading books from sources you trust.

These only go online once you have set them up, and only to the servers you chose; see [Privacy](./privacy).
