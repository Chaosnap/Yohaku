package io.github.chaosnap.yohaku.audio

import android.content.Context
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import android.provider.OpenableColumns
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Reads the music library on Android: the audio documents in a folder the user
 * granted (searched recursively) or picked one by one, with their tags and
 * cover from MediaMetadataRetriever. Covers go to the app's cache, one file per
 * album, where the WebView can show them.
 */
class MusicScanner(private val context: Context) {
    private val audioExtensions = setOf(
        "flac", "mp3", "m4a", "aac", "alac", "ogg", "oga", "opus", "wav", "aif", "aiff", "wv", "ape"
    )

    /** The tracks under each URI: a folder (tree) URI or a single document. */
    fun scan(uris: Array<String>): JSONArray {
        val tracks = JSONArray()
        for (value in uris) {
            val uri = Uri.parse(value)
            val documents = mutableListOf<Uri>()
            if (DocumentsContract.isTreeUri(uri)) {
                collect(uri, DocumentsContract.getTreeDocumentId(uri), documents)
            } else {
                documents.add(uri)
            }
            documents.forEach { tracks.put(read(it)) }
        }
        return tracks
    }

    private fun collect(tree: Uri, documentId: String, out: MutableList<Uri>) {
        val children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, documentId)
        val projection = arrayOf(
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_MIME_TYPE,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME
        )
        context.contentResolver.query(children, projection, null, null, null)?.use { cursor ->
            while (cursor.moveToNext()) {
                val id = cursor.getString(0) ?: continue
                val mime = cursor.getString(1) ?: ""
                val name = cursor.getString(2) ?: ""
                if (name.startsWith(".")) continue
                if (mime == DocumentsContract.Document.MIME_TYPE_DIR) {
                    collect(tree, id, out)
                } else if (mime.startsWith("audio/") || isAudioName(name)) {
                    out.add(DocumentsContract.buildDocumentUriUsingTree(tree, id))
                }
            }
        }
    }

    private fun isAudioName(name: String) =
        audioExtensions.contains(name.substringAfterLast('.', "").lowercase())

    private fun read(uri: Uri): JSONObject {
        val track = JSONObject()
        track.put("uri", uri.toString())
        track.put("title", displayName(uri))
        size(uri)?.let { track.put("size", it) }
        val retriever = MediaMetadataRetriever()
        try {
            retriever.setDataSource(context, uri)
            val title = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE)
            val artist = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST)
                ?: retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUMARTIST)
                ?: ""
            val album = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM) ?: ""
            if (!title.isNullOrBlank()) track.put("title", title)
            track.put("artist", artist)
            track.put("album", album)
            track.put(
                "trackNo",
                number(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_CD_TRACK_NUMBER))
            )
            track.put(
                "discNo",
                number(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DISC_NUMBER))
            )
            val duration = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
            track.put("durationMs", duration?.toLongOrNull() ?: 0L)
            retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_YEAR)
                ?.toIntOrNull()?.takeIf { it > 0 }?.let { track.put("year", it) }
            retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_GENRE)
                ?.takeIf { it.isNotBlank() }?.let { track.put("genre", it) }
            // Bits per second; the library keeps kilobits.
            retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_BITRATE)
                ?.toIntOrNull()?.let { track.put("bitrate", it / 1000) }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_SAMPLERATE)
                    ?.toIntOrNull()?.let { track.put("sampleRate", it) }
            }
            retriever.embeddedPicture?.let { picture ->
                val key = if (album.isEmpty()) uri.toString() else "$artist\u0000$album"
                track.put("cover", saveCover(picture, key))
            }
        } catch (e: Exception) {
            // Unreadable tags: the file still plays, under its file name.
        } finally {
            try {
                retriever.release()
            } catch (e: Exception) {
            }
        }
        return track
    }

    private fun size(uri: Uri): Long? = try {
        context.contentResolver.query(uri, arrayOf(OpenableColumns.SIZE), null, null, null)
            ?.use { cursor -> if (cursor.moveToFirst() && !cursor.isNull(0)) cursor.getLong(0) else null }
    } catch (e: Exception) {
        null
    }

    /** "3/12" (track 3 of 12) → 3. */
    private fun number(value: String?) = value?.substringBefore('/')?.trim()?.toIntOrNull() ?: 0

    private fun displayName(uri: Uri): String {
        var name = uri.lastPathSegment ?: uri.toString()
        try {
            context.contentResolver.query(
                uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null
            )?.use { cursor ->
                if (cursor.moveToFirst()) cursor.getString(0)?.let { name = it }
            }
        } catch (e: Exception) {
        }
        return name.substringAfterLast('/').substringBeforeLast('.')
    }

    private fun saveCover(bytes: ByteArray, key: String): String {
        val dir = File(context.cacheDir, "yohaku-covers")
        dir.mkdirs()
        val file = File(dir, Integer.toHexString(key.hashCode()) + ".jpg")
        if (!file.exists()) file.writeBytes(bytes)
        return file.absolutePath
    }
}
