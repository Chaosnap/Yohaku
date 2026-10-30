//! Plays files gaplessly through the default output device, for listening and
//! for unplugging headphones mid-track:
//!
//!   cargo run --release --features output --example play -- a.flac b.flac [--rain rain.ogg]

use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};

use yohaku_audio_spike::{output, Engine, LayerSpec};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args().skip(1);
    let mut tracks = Vec::new();
    let mut scene = Vec::new();
    while let Some(arg) = args.next() {
        if arg == "--rain" {
            let path = PathBuf::from(args.next().ok_or("--rain needs a file")?);
            scene.push(LayerSpec {
                id: "rain".into(),
                path,
                volume: 0.7,
            });
        } else {
            tracks.push(PathBuf::from(arg));
        }
    }
    if tracks.is_empty() {
        return Err("give one or more audio files".into());
    }
    let mut engine = Engine::new(48_000);
    engine.set_queue(tracks, 0)?;
    engine.apply_scene(&scene, 2000)?;
    engine.play();
    output::run(
        Arc::new(Mutex::new(engine)),
        Arc::new(AtomicBool::new(false)),
    )?;
    Ok(())
}
