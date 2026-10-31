//! Yohaku's audio plugin (docs/yohaku/02-architecture.md §3).
//!
//! On Android, music and ambient layers play in a Media3 MediaSessionService
//! (android/), so playback outlives the WebView and the Activity, and the
//! music library is read through the system's folder picker; those commands
//! are all Kotlin. On the desktop the WebView plays for now (the native engine
//! is Spike S4), and the Rust commands here read the library's files.

#[cfg(desktop)]
mod desktop;

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    let builder = Builder::new("yohaku-audio");
    #[cfg(desktop)]
    let builder = builder.invoke_handler(tauri::generate_handler![
        desktop::scan_music,
        desktop::allow_files,
        desktop::read_lyrics
    ]);
    builder
        .setup(|_app, _api| {
            #[cfg(target_os = "android")]
            _api.register_android_plugin("io.github.chaosnap.yohaku.audio", "YohakuAudioPlugin")?;
            Ok(())
        })
        .build()
}
