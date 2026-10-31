package io.github.chaosnap.yohaku.audio

import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

/**
 * Plays the music queue, and up to a few looping ambient sounds, in a
 * foreground media service, so that playback outlives the WebView and the
 * Activity (Spike S1, now the music player's Android engine). Media3 provides the notification, the lock screen
 * and Bluetooth buttons. The music player owns audio focus and pauses when
 * headphones are unplugged. The ambient sounds play by themselves, beside the
 * music, reading aloud or nothing, and also stop when headphones are
 * unplugged. Media3 keeps the service in the foreground only while the music
 * plays, so ambient sounds alone can stop once Yohaku is in the background.
 */
class YohakuPlaybackService : MediaSessionService() {
    companion object {
        const val APPLY_AMBIENT = "io.github.chaosnap.yohaku.APPLY_AMBIENT"
        const val SET_SLEEP_TIMER = "io.github.chaosnap.yohaku.SET_SLEEP_TIMER"
        const val EXTRA_URIS = "uris"
        const val EXTRA_VOLUMES = "volumes"
        const val EXTRA_AFTER_MS = "afterMs"
        const val EXTRA_FADE_MS = "fadeMs"
        private const val FADE_STEP_MS = 33L
    }

    private lateinit var music: ExoPlayer
    private var session: MediaSession? = null
    private val ambient = mutableListOf<Pair<ExoPlayer, Float>>()
    private var ambientUris = listOf<String>()
    private val handler = Handler(Looper.getMainLooper())
    private var sleepFade: Runnable? = null

    private val attributes = AudioAttributes.Builder()
        .setUsage(C.USAGE_MEDIA)
        .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
        .build()

    override fun onCreate() {
        super.onCreate()
        music = ExoPlayer.Builder(this)
            .setAudioAttributes(attributes, true)
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_LOCAL)
            .build()
        session = MediaSession.Builder(this, music).setCallback(SessionCallback()).build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        stopAmbient()
        session?.run {
            player.release()
            release()
        }
        session = null
        super.onDestroy()
    }

    private fun stopAmbient() {
        ambient.forEach { (player, _) -> player.release() }
        ambient.clear()
        ambientUris = listOf()
    }

    private fun applyAmbient(uris: Array<String>, volumes: FloatArray) {
        // The same sounds: only their volumes change, without restarting them.
        if (uris.toList() == ambientUris) {
            ambient.forEachIndexed { index, (player, _) ->
                val volume = volumes.getOrElse(index) { 1f }
                player.volume = volume
                // Back on after headphones were unplugged.
                player.playWhenReady = true
                ambient[index] = player to volume
            }
            return
        }
        stopAmbient()
        ambientUris = uris.toList()
        uris.forEachIndexed { index, uri ->
            // Only the music player asks for audio focus: the ambient sounds mix
            // with whatever else plays.
            val player = ExoPlayer.Builder(this)
                .setAudioAttributes(attributes, false)
                .setHandleAudioBecomingNoisy(true)
                .setWakeMode(C.WAKE_MODE_LOCAL)
                .build()
            val volume = volumes.getOrElse(index) { 1f }
            player.setMediaItem(MediaItem.fromUri(uri))
            player.repeatMode = Player.REPEAT_MODE_ONE
            player.volume = volume
            player.prepare()
            player.playWhenReady = true
            ambient.add(player to volume)
        }
    }

    /**
     * After [afterMs], fades music and ambience out over [fadeMs], then pauses
     * the music and stops the ambient sounds.
     */
    private fun setSleepTimer(afterMs: Long, fadeMs: Long) {
        sleepFade?.let { handler.removeCallbacks(it) }
        sleepFade = null
        if (afterMs <= 0) return
        val steps = (fadeMs / FADE_STEP_MS).coerceAtLeast(1)
        val fade = object : Runnable {
            var step = 0L
            val musicVolume = music.volume

            override fun run() {
                step++
                val gain = (1f - step.toFloat() / steps).coerceAtLeast(0f)
                music.volume = musicVolume * gain
                ambient.forEach { (player, volume) -> player.volume = volume * gain }
                if (step < steps) {
                    handler.postDelayed(this, FADE_STEP_MS)
                    return
                }
                music.pause()
                music.volume = musicVolume
                stopAmbient()
                sleepFade = null
            }
        }
        sleepFade = fade
        handler.postDelayed(fade, afterMs)
    }

    private inner class SessionCallback : MediaSession.Callback {
        override fun onConnect(
            session: MediaSession,
            controller: MediaSession.ControllerInfo
        ): MediaSession.ConnectionResult {
            val commands = MediaSession.ConnectionResult.DEFAULT_SESSION_COMMANDS.buildUpon()
                .add(SessionCommand(APPLY_AMBIENT, Bundle.EMPTY))
                .add(SessionCommand(SET_SLEEP_TIMER, Bundle.EMPTY))
                .build()
            return MediaSession.ConnectionResult.AcceptedResultBuilder(session)
                .setAvailableSessionCommands(commands)
                .build()
        }

        // Media items cross from the controller without their URI; it travels
        // in the request metadata (see YohakuAudioPlugin.set_queue).
        override fun onAddMediaItems(
            mediaSession: MediaSession,
            controller: MediaSession.ControllerInfo,
            mediaItems: MutableList<MediaItem>
        ): ListenableFuture<MutableList<MediaItem>> {
            val playable = mediaItems.map { item ->
                val uri = item.requestMetadata.mediaUri ?: Uri.parse(item.mediaId)
                item.buildUpon().setUri(uri).build()
            }
            return Futures.immediateFuture(playable.toMutableList())
        }

        override fun onCustomCommand(
            session: MediaSession,
            controller: MediaSession.ControllerInfo,
            customCommand: SessionCommand,
            args: Bundle
        ): ListenableFuture<SessionResult> {
            when (customCommand.customAction) {
                APPLY_AMBIENT -> applyAmbient(
                    args.getStringArray(EXTRA_URIS) ?: arrayOf(),
                    args.getFloatArray(EXTRA_VOLUMES) ?: floatArrayOf()
                )
                SET_SLEEP_TIMER -> setSleepTimer(
                    args.getLong(EXTRA_AFTER_MS),
                    args.getLong(EXTRA_FADE_MS)
                )
            }
            return Futures.immediateFuture(SessionResult(SessionResult.RESULT_SUCCESS))
        }
    }
}
