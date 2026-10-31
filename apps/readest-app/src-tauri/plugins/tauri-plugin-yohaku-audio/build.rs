// Called from JavaScript as `plugin:yohaku-audio|<command>`. Playback and the
// pickers are Kotlin (android/); scan_music and read_lyrics are Rust on the
// desktop (src/desktop.rs) and Kotlin on Android; allow_files is desktop only.
const COMMANDS: &[&str] = &[
    "pick_folder",
    "pick_files",
    "scan_music",
    "allow_files",
    "set_queue",
    "play",
    "pause",
    "next",
    "previous",
    "skip_to",
    "seek_to",
    "apply_ambient",
    "set_sleep_timer",
    "get_state",
    "set_volume",
    "read_lyrics",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
