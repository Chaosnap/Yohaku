//! Real playback through cpal for manual checks: the default output device
//! pulls frames from the engine, and when that device goes away (headphones
//! unplugged, default device switched) the stream is rebuilt on the new one.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

use crate::{Engine, CHANNELS};

/// Plays `engine` until `stop` is set, following the default output device.
pub fn run(engine: Arc<Mutex<Engine>>, stop: Arc<AtomicBool>) -> Result<(), String> {
    let host = cpal::default_host();
    while !stop.load(Ordering::Relaxed) {
        let lost = Arc::new(AtomicBool::new(false));
        let stream = open_stream(&host, engine.clone(), lost.clone())?;
        stream.play().map_err(|error| error.to_string())?;
        while !stop.load(Ordering::Relaxed) && !lost.load(Ordering::Relaxed) {
            std::thread::sleep(Duration::from_millis(100));
        }
        drop(stream);
        if lost.load(Ordering::Relaxed) {
            eprintln!("output device lost; reopening on the default device");
            std::thread::sleep(Duration::from_millis(500));
        }
    }
    Ok(())
}

fn open_stream(
    host: &cpal::Host,
    engine: Arc<Mutex<Engine>>,
    lost: Arc<AtomicBool>,
) -> Result<cpal::Stream, String> {
    let device = host.default_output_device().ok_or("no output device")?;
    let rate = engine.lock().map_err(|error| error.to_string())?.rate();
    let channels = device
        .default_output_config()
        .map_err(|error| error.to_string())?
        .channels();
    let config = cpal::StreamConfig {
        channels,
        sample_rate: cpal::SampleRate(rate),
        buffer_size: cpal::BufferSize::Default,
    };
    let device_channels = usize::from(channels);
    let mut stereo = Vec::new();
    device
        .build_output_stream(
            &config,
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                let frames = data.len() / device_channels;
                stereo.resize(frames * CHANNELS, 0.0);
                match engine.try_lock() {
                    Ok(mut engine) => engine.render(&mut stereo),
                    Err(_) => stereo.fill(0.0),
                }
                for (frame, out) in data.chunks_exact_mut(device_channels).enumerate() {
                    for (channel, sample) in out.iter_mut().enumerate() {
                        *sample = match (device_channels, channel) {
                            (1, _) => (stereo[frame * 2] + stereo[frame * 2 + 1]) * 0.5,
                            (_, 0 | 1) => stereo[frame * 2 + channel],
                            _ => 0.0,
                        };
                    }
                }
            },
            move |error| {
                eprintln!("output stream error: {error}");
                if matches!(error, cpal::StreamError::DeviceNotAvailable) {
                    lost.store(true, Ordering::Relaxed);
                }
            },
            None,
        )
        .map_err(|error| error.to_string())
}
