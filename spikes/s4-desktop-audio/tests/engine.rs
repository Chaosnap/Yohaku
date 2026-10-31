//! Spike S4 measured offline: the engine renders into memory and every claim
//! of the design (gapless queue, smooth volume, sleep timer, ambient layers,
//! resampling quality and cost) is checked sample by sample.

use std::f32::consts::TAU;
use std::path::{Path, PathBuf};
use std::time::Instant;

use yohaku_audio_spike::{Engine, EngineEvent, LayerSpec};

const RATE: u32 = 44_100;

fn temp_dir(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("yohaku-s4-{name}-{}", std::process::id()));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

/// Writes stereo frames as 32-bit float WAV, which decodes back bit for bit.
fn write_wav(path: &Path, rate: u32, frames: &[(f32, f32)]) {
    let spec = hound::WavSpec {
        channels: 2,
        sample_rate: rate,
        bits_per_sample: 32,
        sample_format: hound::SampleFormat::Float,
    };
    let mut writer = hound::WavWriter::create(path, spec).unwrap();
    for &(left, right) in frames {
        writer.write_sample(left).unwrap();
        writer.write_sample(right).unwrap();
    }
    writer.finalize().unwrap();
}

fn constant(value: f32, frames: usize) -> Vec<(f32, f32)> {
    vec![(value, value); frames]
}

fn sine(frequency: f32, rate: u32, frames: usize) -> Vec<(f32, f32)> {
    (0..frames)
        .map(|i| {
            let t = i as f32 / rate as f32;
            let sample = (t * frequency * TAU).sin() * 0.5;
            (sample, sample)
        })
        .collect()
}

/// Renders `frames` frames in blocks of `block`, as an output device would ask.
fn render(engine: &mut Engine, frames: usize, block: usize) -> Vec<f32> {
    let mut out = Vec::with_capacity(frames * 2);
    let mut buffer = vec![0.0; block * 2];
    while out.len() < frames * 2 {
        let n = block.min(frames - out.len() / 2);
        engine.render(&mut buffer[..n * 2]);
        out.extend_from_slice(&buffer[..n * 2]);
    }
    out
}

fn left(out: &[f32]) -> Vec<f32> {
    out.iter().step_by(2).copied().collect()
}

#[test]
fn a_queue_plays_track_after_track_without_a_gap() {
    let dir = temp_dir("gapless");
    let signal: Vec<(f32, f32)> = (0..RATE as usize * 2)
        .map(|i| {
            let t = i as f32 / RATE as f32;
            ((t * 441.0 * TAU).sin() * 0.5, (t * 661.5 * TAU).sin() * 0.5)
        })
        .collect();
    // Cut at odd places, nowhere near the 512-frame blocks the output asks for.
    let cuts = [0, 23_457, 51_233, signal.len()];
    let paths: Vec<PathBuf> = cuts
        .windows(2)
        .enumerate()
        .map(|(i, cut)| {
            let path = dir.join(format!("part{i}.wav"));
            write_wav(&path, RATE, &signal[cut[0]..cut[1]]);
            path
        })
        .collect();

    let mut engine = Engine::new(RATE);
    engine.set_queue(paths, 0).unwrap();
    engine.play();
    let out = render(&mut engine, signal.len() + 1000, 512);

    for (i, &(l, r)) in signal.iter().enumerate() {
        assert_eq!(out[2 * i], l, "left channel differs at frame {i}");
        assert_eq!(out[2 * i + 1], r, "right channel differs at frame {i}");
    }
    assert!(out[signal.len() * 2..].iter().all(|&sample| sample == 0.0));
    assert_eq!(
        engine.take_events(),
        [
            EngineEvent::TrackChanged { index: 1 },
            EngineEvent::TrackChanged { index: 2 },
            EngineEvent::QueueEnded,
        ]
    );
    assert!(!engine.is_playing());
}

#[test]
fn a_volume_change_ramps_without_a_step() {
    let dir = temp_dir("volume");
    let path = dir.join("constant.wav");
    write_wav(&path, RATE, &constant(0.5, RATE as usize));
    let mut engine = Engine::new(RATE);
    engine.set_queue(vec![path], 0).unwrap();
    engine.play();

    let before = left(&render(&mut engine, 4410, 512));
    assert!(before.iter().all(|&sample| sample == 0.5));
    engine.set_music_volume(0.0);
    let after = left(&render(&mut engine, 4410, 512));

    // 20 ms at 44.1 kHz: 882 frames, each a 1/882 step of the way down.
    let ramp = 882;
    assert!(after[0] < 0.5 && after[0] > 0.49);
    for pair in after[..ramp].windows(2) {
        assert!(pair[1] <= pair[0]);
        assert!(pair[0] - pair[1] <= 0.5 / ramp as f32 + 1e-6);
    }
    assert!(after[ramp - 1..].iter().all(|&sample| sample == 0.0));
}

#[test]
fn muting_ramps_down_and_unmuting_restores_the_volume() {
    let dir = temp_dir("mute");
    let path = dir.join("constant.wav");
    write_wav(&path, RATE, &constant(0.5, RATE as usize));
    let mut engine = Engine::new(RATE);
    engine.set_queue(vec![path], 0).unwrap();
    engine.play();

    engine.set_muted(true);
    let muted = left(&render(&mut engine, 2000, 512));
    assert!(muted[882..].iter().all(|&sample| sample == 0.0));
    engine.set_muted(false);
    let unmuted = left(&render(&mut engine, 2000, 512));
    assert!(unmuted[882..].iter().all(|&sample| sample == 0.5));
}

#[test]
fn the_sleep_timer_fades_out_on_time_then_pauses() {
    let dir = temp_dir("sleep");
    let path = dir.join("constant.wav");
    write_wav(&path, RATE, &constant(0.5, RATE as usize * 3));
    let mut engine = Engine::new(RATE);
    engine.set_queue(vec![path], 0).unwrap();
    engine.play();
    // After 500 ms, fade out over 250 ms.
    engine.set_sleep_timer(Some(500), 250);
    let out = left(&render(&mut engine, RATE as usize, 512));

    let (start, fade) = (22_050, 11_025);
    assert!(out[..start].iter().all(|&sample| sample == 0.5));
    for pair in out[start - 1..start + fade].windows(2) {
        assert!(pair[1] < pair[0]);
    }
    assert!(out[start + fade - 1..].iter().all(|&sample| sample == 0.0));
    assert_eq!(engine.take_events(), [EngineEvent::SleepTimerFired]);
    assert!(!engine.is_playing());
}

#[test]
fn ambient_layers_mix_with_their_own_volumes_beside_the_music() {
    let dir = temp_dir("ambient");
    let (rain, wind, song) = (
        dir.join("rain.wav"),
        dir.join("wind.wav"),
        dir.join("song.wav"),
    );
    write_wav(&rain, RATE, &constant(0.25, 10_000));
    write_wav(&wind, RATE, &constant(0.5, 7_000));
    write_wav(&song, RATE, &constant(0.125, RATE as usize));
    let scene = [
        LayerSpec {
            id: "rain".into(),
            path: rain,
            volume: 1.0,
        },
        LayerSpec {
            id: "wind".into(),
            path: wind,
            volume: 0.5,
        },
    ];
    let mut engine = Engine::new(RATE);
    engine.apply_scene(&scene, 0).unwrap();
    engine.set_queue(vec![song], 0).unwrap();
    engine.play();

    // 0.25 + 0.5 × 0.5 of ambience, plus the music: over several loops.
    let out = left(&render(&mut engine, 30_000, 512));
    assert!(out.iter().all(|&sample| sample == 0.625));

    engine.set_music_volume(0.0);
    engine.set_layer_volume("wind", 0.0, 0);
    let out = left(&render(&mut engine, 2000, 512));
    assert!(out[882..].iter().all(|&sample| sample == 0.25));
}

#[test]
fn a_layer_loops_without_a_seam() {
    let dir = temp_dir("loop");
    let path = dir.join("pattern.wav");
    // A prime length, so that the loop point drifts across the output blocks.
    let pattern: Vec<(f32, f32)> = (0..997)
        .map(|i| (i as f32 / 997.0, -(i as f32) / 997.0))
        .collect();
    write_wav(&path, RATE, &pattern);
    let mut engine = Engine::new(RATE);
    let layer = LayerSpec {
        id: "pattern".into(),
        path,
        volume: 1.0,
    };
    engine.apply_scene(&[layer], 0).unwrap();

    let out = render(&mut engine, 5_000, 512);
    for i in 0..5_000 {
        assert_eq!(out[2 * i], pattern[i % 997].0, "left differs at frame {i}");
        assert_eq!(
            out[2 * i + 1],
            pattern[i % 997].1,
            "right differs at frame {i}"
        );
    }
}

#[test]
fn switching_scenes_crossfades_and_drops_the_old_layers() {
    let dir = temp_dir("scenes");
    let (rain, waves) = (dir.join("rain.wav"), dir.join("waves.wav"));
    write_wav(&rain, RATE, &constant(0.5, 20_000));
    write_wav(&waves, RATE, &constant(0.5, 20_000));
    let mut engine = Engine::new(RATE);
    let rain = LayerSpec {
        id: "rain".into(),
        path: rain,
        volume: 1.0,
    };
    let waves = LayerSpec {
        id: "waves".into(),
        path: waves,
        volume: 1.0,
    };
    engine.apply_scene(&[rain], 0).unwrap();
    render(&mut engine, 1000, 512);

    // 100 ms equal-power crossfade: the sum of two equal sources peaks at √2.
    engine.apply_scene(&[waves], 100).unwrap();
    let out = left(&render(&mut engine, 6000, 512));
    let peak = out.iter().copied().fold(0.0f32, f32::max);
    assert!((peak - 0.5 * 2f32.sqrt()).abs() < 1e-3);
    assert!(out[4410..]
        .iter()
        .all(|&sample| (sample - 0.5).abs() < 1e-6));
    assert_eq!(engine.layer_ids(), ["waves"]);
}

#[test]
fn a_44k1_track_plays_at_48k_with_high_quality_and_little_cpu() {
    let dir = temp_dir("resample");
    let path = dir.join("sine.wav");
    let seconds = 10;
    write_wav(&path, RATE, &sine(1000.0, RATE, RATE as usize * seconds));

    let mut engine = Engine::new(48_000);
    engine.set_queue(vec![path], 0).unwrap();
    engine.play();
    let started = Instant::now();
    let out = left(&render(&mut engine, 48_000 * seconds + 2_000, 512));
    let elapsed = started.elapsed().as_secs_f64();

    // The exact length at the new rate, then silence.
    let length = 48_000 * seconds;
    assert!(out[length - 10..length].iter().any(|&sample| sample != 0.0));
    assert!(out[length..].iter().all(|&sample| sample == 0.0));

    // Over the steady middle part, fit a 1 kHz sine of any phase (least
    // squares): what is left is the resampler's distortion and noise, and the
    // phase gives how far the output lags the input, which the trimmed
    // resampler delay should have brought to (almost) zero.
    let omega = 1000.0 * std::f64::consts::TAU / 48_000.0;
    let middle = 48_000..48_000 * (seconds - 1);
    let (mut sin_dot, mut cos_dot, mut sin_sq, mut cos_sq) = (0.0, 0.0, 0.0, 0.0);
    for n in middle.clone() {
        let (s, c) = (n as f64 * omega).sin_cos();
        sin_dot += f64::from(out[n]) * s;
        cos_dot += f64::from(out[n]) * c;
        sin_sq += s * s;
        cos_sq += c * c;
    }
    let (a, b) = (sin_dot / sin_sq, cos_dot / cos_sq);
    let (mut residual, mut power) = (0.0f64, 0.0f64);
    for n in middle {
        let fit = a * (n as f64 * omega).sin() + b * (n as f64 * omega).cos();
        residual += (f64::from(out[n]) - fit).powi(2);
        power += fit.powi(2);
    }
    let db = 10.0 * (residual / power).log10();
    let lag = -b.atan2(a) / omega;
    let realtime = seconds as f64 / elapsed;
    println!("44.1 -> 48 kHz: {db:.1} dB error, lag {lag:.2} frames, {realtime:.0}x real time");
    assert!(db < -80.0, "resampling error {db:.1} dB");
    assert!(lag.abs() < 10.0, "the output lags by {lag:.2} frames");
    assert!(
        realtime > 20.0,
        "decoding and resampling run at only {realtime:.1}x real time"
    );
}
