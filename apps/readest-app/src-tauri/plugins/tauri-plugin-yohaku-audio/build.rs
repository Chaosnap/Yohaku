// Every command is implemented in Kotlin (android/); JavaScript calls them as
// `plugin:yohaku-audio|<command>`.
const COMMANDS: &[&str] = &[
    "pick_audio",
    "set_queue",
    "play",
    "pause",
    "apply_ambient",
    "set_sleep_timer",
    "get_state",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
