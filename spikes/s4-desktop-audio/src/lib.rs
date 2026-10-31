//! Spike S4: the core of Yohaku's desktop audio engine (docs/yohaku/02-architecture.md §3.3).
//!
//! A pull-based mixer: the output (cpal, or a test) asks for frames and the
//! engine renders interleaved stereo f32 at one sample rate. Music plays a
//! queue track after track with no gap between them; ambient layers loop on
//! their own bus; every gain moves a frame at a time; a sleep timer fades
//! everything out and pauses. Rendering offline into a buffer is what lets CI
//! check all of this sample by sample, without a sound card.

mod fade;
#[cfg(feature = "output")]
pub mod output;
mod track;

use std::path::{Path, PathBuf};

pub use fade::{Fade, FadeShape};
pub use track::{Track, TrackError};

/// The engine renders interleaved stereo.
pub const CHANNELS: usize = 2;

/// Volume changes and muting take this long, so that none of them clicks.
const VOLUME_RAMP_MS: u32 = 20;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EngineEvent {
    TrackChanged { index: usize },
    QueueEnded,
    SleepTimerFired,
}

/// One looping ambient sound in a scene, e.g. rain on the eaves at 0.7.
#[derive(Clone, Debug)]
pub struct LayerSpec {
    pub id: String,
    pub path: PathBuf,
    pub volume: f32,
}

struct Layer {
    id: String,
    track: Track,
    gain: Fade,
    /// Fading out of the scene; dropped once silent.
    leaving: bool,
    broken: bool,
}

#[derive(Clone, Copy)]
enum Sleep {
    Waiting { frames_left: u64, fade: u32 },
    Fading,
}

pub struct Engine {
    rate: u32,
    queue: Vec<PathBuf>,
    index: usize,
    current: Option<Track>,
    next: Option<Track>,
    playing: bool,
    position: u64,
    music_gain: Fade,
    layers: Vec<Layer>,
    ambient_gain: Fade,
    master: Fade,
    sleep: Option<Sleep>,
    sleep_gain: Fade,
    sleep_fired: bool,
    events: Vec<EngineEvent>,
    music_buf: Vec<f32>,
    bus: Vec<f32>,
    scratch: Vec<f32>,
}

impl Engine {
    pub fn new(rate: u32) -> Self {
        Self {
            rate,
            queue: Vec::new(),
            index: 0,
            current: None,
            next: None,
            playing: false,
            position: 0,
            music_gain: Fade::new(1.0),
            layers: Vec::new(),
            ambient_gain: Fade::new(1.0),
            master: Fade::new(1.0),
            sleep: None,
            sleep_gain: Fade::new(1.0),
            sleep_fired: false,
            events: Vec::new(),
            music_buf: Vec::new(),
            bus: Vec::new(),
            scratch: Vec::new(),
        }
    }

    pub fn rate(&self) -> u32 {
        self.rate
    }

    /// Replaces the queue and starts from `start`; the track after it is
    /// opened right away so that it follows without a gap.
    pub fn set_queue(&mut self, tracks: Vec<PathBuf>, start: usize) -> Result<(), TrackError> {
        self.current = Some(Track::open(&tracks[start], self.rate)?);
        self.queue = tracks;
        self.index = start;
        self.position = 0;
        self.preload_next();
        Ok(())
    }

    pub fn play(&mut self) {
        self.playing = true;
    }

    pub fn pause(&mut self) {
        self.playing = false;
    }

    pub fn is_playing(&self) -> bool {
        self.playing
    }

    pub fn index(&self) -> usize {
        self.index
    }

    /// Frames played of the current track.
    pub fn position(&self) -> u64 {
        self.position
    }

    pub fn set_music_volume(&mut self, volume: f32) {
        let ramp = self.frames(VOLUME_RAMP_MS);
        self.music_gain.to(volume, ramp, FadeShape::Linear);
    }

    pub fn set_ambient_volume(&mut self, volume: f32) {
        let ramp = self.frames(VOLUME_RAMP_MS);
        self.ambient_gain.to(volume, ramp, FadeShape::Linear);
    }

    pub fn set_muted(&mut self, muted: bool) {
        let ramp = self.frames(VOLUME_RAMP_MS);
        self.master
            .to(if muted { 0.0 } else { 1.0 }, ramp, FadeShape::Linear);
    }

    /// Switches to a scene: layers it does not name fade out, new ones fade in
    /// (equal power, so the crossfade keeps its loudness) and the others move
    /// to their new volume.
    pub fn apply_scene(&mut self, scene: &[LayerSpec], fade_ms: u32) -> Result<(), TrackError> {
        let fade = self.frames(fade_ms);
        for layer in &mut self.layers {
            match scene.iter().find(|spec| spec.id == layer.id) {
                Some(spec) => {
                    layer.leaving = false;
                    layer.gain.to(spec.volume, fade, FadeShape::Linear);
                }
                None => {
                    layer.leaving = true;
                    layer.gain.to(0.0, fade, FadeShape::EqualPower);
                }
            }
        }
        for spec in scene {
            if !self.layers.iter().any(|layer| layer.id == spec.id) {
                let mut gain = Fade::new(0.0);
                gain.to(spec.volume, fade, FadeShape::EqualPower);
                self.layers.push(Layer {
                    id: spec.id.clone(),
                    track: Track::open(&spec.path, self.rate)?,
                    gain,
                    leaving: false,
                    broken: false,
                });
            }
        }
        Ok(())
    }

    pub fn set_layer_volume(&mut self, id: &str, volume: f32, fade_ms: u32) {
        let fade = self.frames(fade_ms);
        if let Some(layer) = self.layers.iter_mut().find(|layer| layer.id == id) {
            layer.gain.to(volume, fade, FadeShape::Linear);
        }
    }

    pub fn layer_ids(&self) -> Vec<&str> {
        self.layers.iter().map(|layer| layer.id.as_str()).collect()
    }

    /// After `after_ms` of rendering, fades music and ambience out over
    /// `fade_ms`, then pauses the music and ends the scene. `None` cancels.
    pub fn set_sleep_timer(&mut self, after_ms: Option<u64>, fade_ms: u32) {
        let rate = u64::from(self.rate);
        let fade = self.frames(fade_ms);
        self.sleep = after_ms.map(|ms| Sleep::Waiting {
            frames_left: rate * ms / 1000,
            fade,
        });
        self.sleep_gain = Fade::new(1.0);
    }

    pub fn take_events(&mut self) -> Vec<EngineEvent> {
        std::mem::take(&mut self.events)
    }

    /// Renders `out.len() / 2` frames of interleaved stereo.
    pub fn render(&mut self, out: &mut [f32]) {
        let frames = out.len() / CHANNELS;
        let samples = frames * CHANNELS;
        self.music_buf.clear();
        self.music_buf.resize(samples, 0.0);
        self.bus.clear();
        self.bus.resize(samples, 0.0);
        self.scratch.resize(samples, 0.0);

        // Music: the queue, one track straight after the other.
        let mut music = 0;
        while self.playing && music < frames {
            let Some(track) = self.current.as_mut() else {
                break;
            };
            let read = track.read(&mut self.music_buf[music * CHANNELS..samples]);
            music += read;
            self.position += read as u64;
            if music < frames {
                self.advance();
            }
        }

        // Ambience: every layer loops on its own and is mixed onto the bus.
        for layer in &mut self.layers {
            let mut filled = 0;
            let mut rewound = false;
            while filled < frames {
                let read = layer
                    .track
                    .read(&mut self.scratch[filled * CHANNELS..samples]);
                filled += read;
                if filled == frames {
                    break;
                }
                // A file that yields nothing even from its start would loop forever.
                if read == 0 && rewound {
                    layer.broken = true;
                    break;
                }
                match layer.track.rewound() {
                    Ok(track) => layer.track = track,
                    Err(_) => {
                        layer.broken = true;
                        break;
                    }
                }
                rewound = true;
            }
            for frame in 0..frames {
                let gain = layer.gain.tick();
                if frame < filled {
                    for channel in 0..CHANNELS {
                        let i = frame * CHANNELS + channel;
                        self.bus[i] += self.scratch[i] * gain;
                    }
                }
            }
        }
        self.layers
            .retain(|layer| !layer.broken && !(layer.leaving && layer.gain.is_settled()));

        for frame in 0..frames {
            let music_gain = self.music_gain.tick();
            let ambient_gain = self.ambient_gain.tick();
            let master = self.master.tick() * self.sleep_step();
            for channel in 0..CHANNELS {
                let i = frame * CHANNELS + channel;
                let sample = if frame < music {
                    self.music_buf[i]
                } else {
                    0.0
                };
                out[i] = (sample * music_gain + self.bus[i] * ambient_gain) * master;
            }
        }

        if std::mem::take(&mut self.sleep_fired) {
            self.playing = false;
            self.layers.clear();
            self.sleep_gain = Fade::new(1.0);
            self.events.push(EngineEvent::SleepTimerFired);
        }
    }

    fn advance(&mut self) {
        self.index += 1;
        self.position = 0;
        self.current = self.next.take();
        if self.current.is_some() {
            self.events
                .push(EngineEvent::TrackChanged { index: self.index });
            self.preload_next();
        } else {
            self.playing = false;
            self.events.push(EngineEvent::QueueEnded);
        }
    }

    fn preload_next(&mut self) {
        let rate = self.rate;
        self.next = self
            .queue
            .get(self.index + 1)
            .and_then(|path| Track::open(path, rate).ok());
    }

    /// One frame of the sleep timer: its gain, starting the fade when the
    /// time is up and noting when the fade has ended.
    fn sleep_step(&mut self) -> f32 {
        if let Some(sleep) = self.sleep {
            match sleep {
                Sleep::Waiting {
                    frames_left: 0,
                    fade,
                } => {
                    self.sleep_gain.to(0.0, fade, FadeShape::Linear);
                    self.sleep = Some(Sleep::Fading);
                }
                Sleep::Waiting { frames_left, fade } => {
                    self.sleep = Some(Sleep::Waiting {
                        frames_left: frames_left - 1,
                        fade,
                    });
                }
                Sleep::Fading => {
                    if self.sleep_gain.is_settled() {
                        self.sleep = None;
                        self.sleep_fired = true;
                    }
                }
            }
        }
        self.sleep_gain.tick()
    }

    fn frames(&self, ms: u32) -> u32 {
        (u64::from(self.rate) * u64::from(ms) / 1000) as u32
    }
}

/// Opens a path for the queue without playing it: lets a caller check a file.
pub fn probe(path: &Path, rate: u32) -> Result<(), TrackError> {
    Track::open(path, rate).map(|_| ())
}
