package io.github.chaosnap.yohaku.audio

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Looper
import androidx.activity.result.ActivityResult
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.session.MediaController
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionToken
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.google.common.util.concurrent.ListenableFuture
import org.json.JSONArray

@InvokeArg
class QueueArgs {
    var uris: Array<String> = arrayOf()
    var start: Int = 0
}

@InvokeArg
class IndexArgs {
    var index: Int = 0
}

@InvokeArg
class SeekArgs {
    var positionMs: Long = 0
}

@InvokeArg
class AmbientLayerArgs {
    var uri: String = ""
    var volume: Float = 1f
}

@InvokeArg
class AmbientArgs {
    var layers: Array<AmbientLayerArgs> = arrayOf()
}

@InvokeArg
class SleepTimerArgs {
    // 0 cancels the timer.
    var afterMs: Long = 0
    var fadeMs: Long = 30_000
}

/**
 * The WebView's remote control for [YohakuPlaybackService]. Every command goes
 * through a MediaController, so the page can be reloaded or the Activity
 * recreated without touching what is playing.
 */
@TauriPlugin
class YohakuAudioPlugin(private val activity: Activity) : Plugin(activity) {
    private val controller: ListenableFuture<MediaController> by lazy {
        val token = SessionToken(
            activity,
            ComponentName(activity, YohakuPlaybackService::class.java)
        )
        MediaController.Builder(activity, token)
            .setApplicationLooper(Looper.getMainLooper())
            .buildAsync()
    }

    /** Runs [block] on the main thread once the service is connected. */
    private fun withController(invoke: Invoke, block: (MediaController) -> Unit) {
        val future = controller
        future.addListener({
            try {
                block(future.get())
            } catch (e: Exception) {
                invoke.reject(e.message ?: "The playback service is not available")
            }
        }, ContextCompat.getMainExecutor(activity))
    }

    @Command
    fun pick_audio(invoke: Invoke) {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "audio/*"
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
        }
        startActivityForResult(invoke, intent, "pickAudioResult")
    }

    @ActivityCallback
    fun pickAudioResult(invoke: Invoke, result: ActivityResult) {
        val uris = mutableListOf<Uri>()
        val data = result.data
        if (result.resultCode == Activity.RESULT_OK && data != null) {
            val clip = data.clipData
            if (clip != null) {
                for (i in 0 until clip.itemCount) uris.add(clip.getItemAt(i).uri)
            } else {
                data.data?.let { uris.add(it) }
            }
        }
        for (uri in uris) {
            try {
                // Keeps the files playable after a restart, as a library would.
                activity.contentResolver.takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            } catch (ignored: SecurityException) {
                // Not every provider grants persistable access; it still plays now.
            }
        }
        val ret = JSObject()
        ret.put("uris", JSONArray(uris.map { it.toString() }))
        invoke.resolve(ret)
    }

    @Command
    fun set_queue(invoke: Invoke) {
        val args = invoke.parseArgs(QueueArgs::class.java)
        val items = args.uris.map { uri ->
            MediaItem.Builder()
                .setMediaId(uri)
                .setUri(uri)
                .setRequestMetadata(
                    MediaItem.RequestMetadata.Builder().setMediaUri(Uri.parse(uri)).build()
                )
                .setMediaMetadata(MediaMetadata.Builder().setTitle(Uri.parse(uri).lastPathSegment).build())
                .build()
        }
        withController(invoke) { controller ->
            controller.setMediaItems(items, args.start, 0L)
            controller.prepare()
            invoke.resolve()
        }
    }

    @Command
    fun play(invoke: Invoke) {
        withController(invoke) { controller ->
            controller.play()
            invoke.resolve()
        }
    }

    @Command
    fun pause(invoke: Invoke) {
        withController(invoke) { controller ->
            controller.pause()
            invoke.resolve()
        }
    }

    @Command
    fun next(invoke: Invoke) {
        withController(invoke) { controller ->
            controller.seekToNextMediaItem()
            invoke.resolve()
        }
    }

    @Command
    fun previous(invoke: Invoke) {
        withController(invoke) { controller ->
            controller.seekToPreviousMediaItem()
            invoke.resolve()
        }
    }

    @Command
    fun skip_to(invoke: Invoke) {
        val args = invoke.parseArgs(IndexArgs::class.java)
        withController(invoke) { controller ->
            controller.seekToDefaultPosition(args.index)
            controller.play()
            invoke.resolve()
        }
    }

    @Command
    fun seek_to(invoke: Invoke) {
        val args = invoke.parseArgs(SeekArgs::class.java)
        withController(invoke) { controller ->
            controller.seekTo(args.positionMs)
            invoke.resolve()
        }
    }

    @Command
    fun apply_ambient(invoke: Invoke) {
        val args = invoke.parseArgs(AmbientArgs::class.java)
        val extras = Bundle().apply {
            putStringArray(
                YohakuPlaybackService.EXTRA_URIS,
                args.layers.map { it.uri }.toTypedArray()
            )
            putFloatArray(
                YohakuPlaybackService.EXTRA_VOLUMES,
                args.layers.map { it.volume }.toFloatArray()
            )
        }
        withController(invoke) { controller ->
            val command = SessionCommand(YohakuPlaybackService.APPLY_AMBIENT, Bundle.EMPTY)
            controller.sendCustomCommand(command, extras)
            invoke.resolve()
        }
    }

    @Command
    fun set_sleep_timer(invoke: Invoke) {
        val args = invoke.parseArgs(SleepTimerArgs::class.java)
        val extras = Bundle().apply {
            putLong(YohakuPlaybackService.EXTRA_AFTER_MS, args.afterMs)
            putLong(YohakuPlaybackService.EXTRA_FADE_MS, args.fadeMs)
        }
        withController(invoke) { controller ->
            val command = SessionCommand(YohakuPlaybackService.SET_SLEEP_TIMER, Bundle.EMPTY)
            controller.sendCustomCommand(command, extras)
            invoke.resolve()
        }
    }

    @Command
    fun get_state(invoke: Invoke) {
        withController(invoke) { controller ->
            val state = JSObject()
            state.put("playing", controller.isPlaying)
            state.put("index", controller.currentMediaItemIndex)
            state.put("count", controller.mediaItemCount)
            state.put("positionMs", controller.currentPosition)
            state.put("durationMs", controller.duration)
            invoke.resolve(state)
        }
    }
}
