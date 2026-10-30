//! Yohaku's audio plugin (docs/yohaku/02-architecture.md §3).
//!
//! Spike S1: on Android, music and ambient layers play in a Media3
//! MediaSessionService, so playback outlives the WebView and the Activity.
//! The commands are all Kotlin; on the desktop the plugin does nothing yet
//! (the desktop engine is Spike S4).

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("yohaku-audio")
        .setup(|_app, _api| {
            #[cfg(target_os = "android")]
            _api.register_android_plugin("io.github.chaosnap.yohaku.audio", "YohakuAudioPlugin")?;
            Ok(())
        })
        .build()
}
