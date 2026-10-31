//! One audio file, decoded with Symphonia and delivered as interleaved stereo
//! f32 at the engine's sample rate, resampled with Rubato when the file's own
//! rate differs.

use std::fmt;
use std::fs::File;
use std::path::{Path, PathBuf};

use rubato::{
    Resampler, SincFixedIn, SincInterpolationParameters, SincInterpolationType, WindowFunction,
};
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::{Decoder, DecoderOptions, CODEC_TYPE_NULL};
use symphonia::core::errors::Error as SymphoniaError;
use symphonia::core::formats::{FormatOptions, FormatReader};
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

use crate::CHANNELS;

/// Frames the resampler takes per call.
const RESAMPLER_CHUNK: usize = 1024;

#[derive(Debug)]
pub enum TrackError {
    Io(std::io::Error),
    Decode(SymphoniaError),
    NoAudio,
    Resampler(String),
}

impl fmt::Display for TrackError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(error) => write!(f, "cannot read the file: {error}"),
            Self::Decode(error) => write!(f, "cannot decode the file: {error}"),
            Self::NoAudio => write!(f, "the file has no audio track"),
            Self::Resampler(error) => write!(f, "cannot set up resampling: {error}"),
        }
    }
}

impl std::error::Error for TrackError {}

impl From<std::io::Error> for TrackError {
    fn from(error: std::io::Error) -> Self {
        Self::Io(error)
    }
}

impl From<SymphoniaError> for TrackError {
    fn from(error: SymphoniaError) -> Self {
        Self::Decode(error)
    }
}

pub struct Track {
    path: PathBuf,
    rate: u32,
    format: Box<dyn FormatReader>,
    decoder: Box<dyn Decoder>,
    track_id: u32,
    resampling: Option<Resampling>,
    /// Decoded frames not read yet: interleaved stereo at the engine's rate.
    pending: Vec<f32>,
    read_pos: usize,
    ended: bool,
}

impl Track {
    /// Opens `path` for playback at `rate` frames per second.
    pub fn open(path: &Path, rate: u32) -> Result<Self, TrackError> {
        let file = File::open(path)?;
        let stream = MediaSourceStream::new(Box::new(file), Default::default());
        let mut hint = Hint::new();
        if let Some(extension) = path.extension().and_then(|e| e.to_str()) {
            hint.with_extension(extension);
        }
        // Gapless: the format reader passes the encoder delay and padding on
        // (MP3 LAME headers, iTunes AAC), and the decoders trim them.
        let format_options = FormatOptions {
            enable_gapless: true,
            ..Default::default()
        };
        let probed = symphonia::default::get_probe().format(
            &hint,
            stream,
            &format_options,
            &MetadataOptions::default(),
        )?;
        let format = probed.format;
        let (track_id, codec_params) = {
            let track = format
                .tracks()
                .iter()
                .find(|track| track.codec_params.codec != CODEC_TYPE_NULL)
                .ok_or(TrackError::NoAudio)?;
            (track.id, track.codec_params.clone())
        };
        let source_rate = codec_params.sample_rate.ok_or(TrackError::NoAudio)?;
        let decoder =
            symphonia::default::get_codecs().make(&codec_params, &DecoderOptions::default())?;
        let resampling = if source_rate == rate {
            None
        } else {
            Some(Resampling::new(source_rate, rate)?)
        };
        Ok(Self {
            path: path.to_owned(),
            rate,
            format,
            decoder,
            track_id,
            resampling,
            pending: Vec::new(),
            read_pos: 0,
            ended: false,
        })
    }

    /// The same file from its start, for looping.
    pub fn rewound(&self) -> Result<Self, TrackError> {
        Self::open(&self.path, self.rate)
    }

    /// Fills `out` (interleaved stereo) and returns the frames written. Fewer
    /// frames than `out` holds means the track has ended.
    pub fn read(&mut self, out: &mut [f32]) -> usize {
        let wanted = out.len() / CHANNELS;
        let mut written = 0;
        while written < wanted {
            let available = (self.pending.len() - self.read_pos) / CHANNELS;
            if available == 0 {
                if !self.decode_more() {
                    break;
                }
                continue;
            }
            let frames = available.min(wanted - written);
            let samples = frames * CHANNELS;
            out[written * CHANNELS..written * CHANNELS + samples]
                .copy_from_slice(&self.pending[self.read_pos..self.read_pos + samples]);
            self.read_pos += samples;
            written += frames;
        }
        written
    }

    /// Decodes the next packets into `pending`; false once the file has ended.
    fn decode_more(&mut self) -> bool {
        self.pending.clear();
        self.read_pos = 0;
        if self.ended {
            return false;
        }
        loop {
            let packet = match self.format.next_packet() {
                Ok(packet) => packet,
                Err(SymphoniaError::ResetRequired) => {
                    self.decoder.reset();
                    continue;
                }
                // The end of the file (an unexpected EOF), or a file broken past here.
                Err(_) => return self.end(),
            };
            if packet.track_id() != self.track_id {
                continue;
            }
            let decoded = match self.decoder.decode(&packet) {
                Ok(decoded) => decoded,
                // A corrupt packet is skipped, as players do.
                Err(SymphoniaError::DecodeError(_)) => continue,
                Err(_) => return self.end(),
            };
            if decoded.frames() == 0 {
                continue;
            }
            let spec = *decoded.spec();
            let mut samples = SampleBuffer::<f32>::new(decoded.capacity() as u64, spec);
            samples.copy_interleaved_ref(decoded);
            let stereo = to_stereo(samples.samples(), spec.channels.count());
            match &mut self.resampling {
                Some(resampling) => resampling.push(&stereo, &mut self.pending),
                None => self.pending.extend_from_slice(&stereo),
            }
            if !self.pending.is_empty() {
                return true;
            }
        }
    }

    fn end(&mut self) -> bool {
        self.ended = true;
        if let Some(resampling) = &mut self.resampling {
            resampling.finish(&mut self.pending);
        }
        !self.pending.is_empty()
    }
}

/// Interleaved samples of any channel count as interleaved stereo. Mono is
/// doubled; more than two channels keep front left and right (a spike
/// shortcut: a real downmix comes with the engine proper).
fn to_stereo(samples: &[f32], channels: usize) -> Vec<f32> {
    match channels {
        1 => samples
            .iter()
            .flat_map(|&sample| [sample, sample])
            .collect(),
        2 => samples.to_vec(),
        _ => samples
            .chunks_exact(channels)
            .flat_map(|frame| [frame[0], frame[1]])
            .collect(),
    }
}

/// Band-limited sinc resampling from a file's rate to the engine's, with the
/// resampler's delay trimmed so that a track keeps its exact length and the
/// next one follows it without a gap.
struct Resampling {
    resampler: SincFixedIn<f32>,
    ratio: f64,
    input: [Vec<f32>; CHANNELS],
    /// Output frames still to drop at the start: the resampler's delay.
    skip: usize,
    frames_in: u64,
    frames_out: u64,
}

impl Resampling {
    fn new(from: u32, to: u32) -> Result<Self, TrackError> {
        let parameters = SincInterpolationParameters {
            sinc_len: 256,
            f_cutoff: 0.95,
            interpolation: SincInterpolationType::Cubic,
            oversampling_factor: 256,
            window: WindowFunction::BlackmanHarris2,
        };
        let ratio = f64::from(to) / f64::from(from);
        let resampler = SincFixedIn::<f32>::new(ratio, 1.0, parameters, RESAMPLER_CHUNK, CHANNELS)
            .map_err(|error| TrackError::Resampler(error.to_string()))?;
        let skip = resampler.output_delay();
        Ok(Self {
            resampler,
            ratio,
            input: [Vec::new(), Vec::new()],
            skip,
            frames_in: 0,
            frames_out: 0,
        })
    }

    fn push(&mut self, stereo: &[f32], out: &mut Vec<f32>) {
        for [left, right] in stereo.as_chunks::<CHANNELS>().0 {
            self.input[0].push(*left);
            self.input[1].push(*right);
        }
        self.frames_in += (stereo.len() / CHANNELS) as u64;
        while self.input[0].len() >= RESAMPLER_CHUNK {
            if !self.process_chunk(out, u64::MAX) {
                break;
            }
        }
    }

    /// Flushes what is left, padding with silence, up to the exact length the
    /// track has at the output rate.
    fn finish(&mut self, out: &mut Vec<f32>) {
        let total = (self.frames_in as f64 * self.ratio).round() as u64;
        while self.frames_out < total {
            for channel in &mut self.input {
                channel.resize(RESAMPLER_CHUNK.max(channel.len()), 0.0);
            }
            if !self.process_chunk(out, total) {
                break;
            }
        }
    }

    fn process_chunk(&mut self, out: &mut Vec<f32>, limit: u64) -> bool {
        let chunk: Vec<Vec<f32>> = self
            .input
            .iter_mut()
            .map(|channel| channel.drain(..RESAMPLER_CHUNK).collect())
            .collect();
        let Ok(resampled) = self.resampler.process(&chunk, None) else {
            return false;
        };
        for (&left, &right) in resampled[0].iter().zip(&resampled[1]) {
            if self.skip > 0 {
                self.skip -= 1;
                continue;
            }
            if self.frames_out >= limit {
                break;
            }
            out.extend([left, right]);
            self.frames_out += 1;
        }
        true
    }
}
