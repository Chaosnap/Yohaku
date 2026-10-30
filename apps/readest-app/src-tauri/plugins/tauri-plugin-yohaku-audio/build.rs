// The playback commands are Kotlin (android/), called from JavaScript as
// `plugin:yohaku-audio|<command>`; `allow_files` is the desktop's only command.
const COMMANDS: &[&str] = &[
    "pick_audio",
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
    "allow_files",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
