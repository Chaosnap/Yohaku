# Lyrics

The **Lyrics** tab in the sidebar shows the lyrics of the song playing. They flow with the singing, line by line: the line being sung lights up and gently breathes, and its characters fill with colour one by one, with translations beneath the original lines. Tap any line and the song plays from there.

![Lyrics in the sidebar: Japanese lines with Chinese translations](/images/desktop-lyrics.jpg)

## Where lyrics come from

Yohaku looks in this order:

1. **an `.lrc` file with the same name** beside the song, such as `Rain Outside.lrc` next to `Rain Outside.flac`;
2. **lyrics embedded** in the song's tags.

When there are neither, the Lyrics tab suggests putting an `.lrc` file with the same name beside the song, or adding lyrics to its tags.

## Writing LRC

LRC is plain text with timed lines: each line starts with the time it begins.

```text
[ti:Rain Outside]
[ar:Some Singer]
[offset:0]

[00:12.40]雨落在窗台上
[00:12.40]Rain falls on the windowsill
[00:18.10]书页还停在昨天
[00:18.10]The page still rests on yesterday
```

- `[mm:ss.xx]` is when the line begins.
- **A line with the same time as the line before is its translation**, and shows beneath the original. Many Chinese and Japanese lyrics files carry translations this way.
- `[offset:+200]` shows the whole lyrics 200 ms earlier, and `-200` 200 ms later, to fix lyrics that run out of step.
- Information lines such as `[ti:]`, `[ar:]` and `[al:]` are not shown.

### Word timing

The enhanced form of LRC also times each word or character, and the colour then follows the singing exactly:

```text
[00:12.40]<00:12.40>雨<00:12.90>落在<00:13.60>窗台<00:14.30>上
```

For lyrics without word timing, Yohaku estimates when each character is sung from how long the line lasts, so the colour still fills evenly.

### Lyrics without times

Lyrics embedded in tags often have no times. They are shown in full; they just don't scroll with the singing.

## Encodings

`.lrc` files can be UTF-8, UTF-16 with a BOM, or GBK (GB18030), which many older Chinese lyrics files use; Yohaku works out which. If you still see garbled text, save the file as UTF-8.
