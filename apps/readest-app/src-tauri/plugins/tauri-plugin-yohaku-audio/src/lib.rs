//! Yohaku's audio plugin (docs/yohaku/02-architecture.md §3).
//!
//! On Android, music and ambient layers play in a Media3 MediaSessionService
//! (android/), so playback outlives the WebView and the Activity; those
//! commands are all Kotlin. On the desktop the WebView plays for now (the
//! native engine is Spike S4), and this plugin only lets it read the files the
//! user picked.

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

/// Lets the WebView stream the music files the user picked, wherever they are.
#[cfg(desktop)]
#[tauri::command]
fn allow_files<R: Runtime>(app: tauri::AppHandle<R>, paths: Vec<String>) -> Result<(), String> {
    use tauri::Manager;
    let scope = app.asset_protocol_scope();
    for path in paths {
        scope.allow_file(&path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    let builder = Builder::new("yohaku-audio");
    #[cfg(desktop)]
    let builder = builder.invoke_handler(tauri::generate_handler![allow_files]);
    builder
        .setup(|_app, _api| {
            #[cfg(target_os = "android")]
            _api.register_android_plugin("io.github.chaosnap.yohaku.audio", "YohakuAudioPlugin")?;
            Ok(())
        })
        .build()
}
