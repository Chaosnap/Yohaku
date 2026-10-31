package io.github.chaosnap.yohaku.audio

import android.content.Context
import android.net.Uri
import android.provider.DocumentsContract
import androidx.media3.common.MediaItem
import androidx.media3.common.Metadata
import androidx.media3.exoplayer.MetadataRetriever
import androidx.media3.extractor.metadata.id3.BinaryFrame
import androidx.media3.extractor.metadata.id3.TextInformationFrame
import androidx.media3.extractor.metadata.vorbis.VorbisComment
import java.util.concurrent.TimeUnit

/**
 * A song's lyrics on Android: a `.lrc` file of the same name beside it, when
 * the song is in a synced folder, or else the lyrics in its tags (ID3 USLT,
 * Vorbis LYRICS, MP4 ©lyr), as Media3 reads them.
 */
class LyricsReader(private val context: Context) {
    /** The `.lrc` file's bytes, for the WebView to decode: it may not be UTF-8. */
    fun file(uri: Uri): ByteArray? {
        // Only a document inside a granted folder can reach the files beside it.
        if (!DocumentsContract.isTreeUri(uri)) return null
        val authority = uri.authority ?: return null
        val documentId = DocumentsContract.getDocumentId(uri)
        val dot = documentId.lastIndexOf('.')
        if (dot <= documentId.lastIndexOf('/')) return null
        val name = documentId.substring(0, dot)
        val tree = DocumentsContract.buildTreeDocumentUri(
            authority,
            DocumentsContract.getTreeDocumentId(uri)
        )
        for (extension in listOf("lrc", "LRC")) {
            val lyrics = DocumentsContract.buildDocumentUriUsingTree(tree, "$name.$extension")
            try {
                context.contentResolver.openInputStream(lyrics)?.use { return it.readBytes() }
            } catch (e: Exception) {
                // Not there under this name.
            }
        }
        return null
    }

    /** The lyrics in the song's tags, or null. */
    fun tags(uri: Uri): String? {
        val groups = try {
            MetadataRetriever.retrieveMetadata(context, MediaItem.fromUri(uri))
                .get(10, TimeUnit.SECONDS)
        } catch (e: Exception) {
            return null
        }
        for (i in 0 until groups.length) {
            val group = groups.get(i)
            for (j in 0 until group.length) {
                val metadata = group.getFormat(j).metadata ?: continue
                for (k in 0 until metadata.length()) {
                    val lyrics = lyricsOf(metadata.get(k))
                    if (!lyrics.isNullOrBlank()) return lyrics
                }
            }
        }
        return null
    }

    private fun lyricsOf(entry: Metadata.Entry): String? = when (entry) {
        is BinaryFrame -> if (entry.id == "USLT") uslt(entry.data) else null
        is TextInformationFrame -> if (entry.id == "USLT") entry.values.firstOrNull() else null
        is VorbisComment ->
            if (entry.key.equals("LYRICS", ignoreCase = true) ||
                entry.key.equals("UNSYNCEDLYRICS", ignoreCase = true)
            ) {
                entry.value
            } else {
                null
            }
        else -> null
    }

    /** An ID3 USLT frame: its text encoding, a language, a description, then the lyrics. */
    private fun uslt(data: ByteArray): String? {
        if (data.size < 5) return null
        val encoding = data[0].toInt()
        val charset = when (encoding) {
            1 -> Charsets.UTF_16
            2 -> Charsets.UTF_16BE
            3 -> Charsets.UTF_8
            else -> Charsets.ISO_8859_1
        }
        // The description ends with a zero, two bytes wide in UTF-16.
        val width = if (encoding == 1 || encoding == 2) 2 else 1
        var start = 4
        while (start + width <= data.size) {
            val end = (0 until width).all { data[start + it].toInt() == 0 }
            start += width
            if (end) break
        }
        if (start >= data.size) return null
        return String(data, start, data.size - start, charset).trimEnd('\u0000')
    }
}
