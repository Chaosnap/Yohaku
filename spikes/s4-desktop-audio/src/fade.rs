//! Gains that change a frame at a time, so that a volume change, a scene
//! crossfade, muting or the sleep timer never jumps (no zipper noise, no clicks).

use std::f32::consts::FRAC_PI_2;

/// How a fade moves from where it starts to its target.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FadeShape {
    /// A straight line: volume changes, muting and the sleep timer.
    Linear,
    /// Sine in, cosine out: two sounds crossfading keep their combined power.
    EqualPower,
}

/// A gain moving towards a target over a number of frames.
#[derive(Clone, Debug)]
pub struct Fade {
    from: f32,
    target: f32,
    value: f32,
    length: u32,
    elapsed: u32,
    shape: FadeShape,
}

impl Fade {
    pub fn new(value: f32) -> Self {
        Self {
            from: value,
            target: value,
            value,
            length: 0,
            elapsed: 0,
            shape: FadeShape::Linear,
        }
    }

    /// Moves from the current value to `target` over `frames` frames, or at once
    /// when `frames` is 0.
    pub fn to(&mut self, target: f32, frames: u32, shape: FadeShape) {
        self.from = self.value;
        self.target = target;
        self.length = frames;
        self.elapsed = 0;
        self.shape = shape;
        if frames == 0 {
            self.value = target;
        }
    }

    /// The gain for the next frame.
    pub fn next(&mut self) -> f32 {
        if self.elapsed < self.length {
            self.elapsed += 1;
            self.value = if self.elapsed == self.length {
                self.target
            } else {
                let t = self.elapsed as f32 / self.length as f32;
                let progress = match self.shape {
                    FadeShape::Linear => t,
                    FadeShape::EqualPower if self.target >= self.from => (t * FRAC_PI_2).sin(),
                    FadeShape::EqualPower => 1.0 - (t * FRAC_PI_2).cos(),
                };
                self.from + (self.target - self.from) * progress
            };
        }
        self.value
    }

    pub fn value(&self) -> f32 {
        self.value
    }

    pub fn is_settled(&self) -> bool {
        self.elapsed >= self.length
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_linear_fade_moves_in_even_steps_and_lands_on_its_target() {
        let mut fade = Fade::new(1.0);
        fade.to(0.0, 4, FadeShape::Linear);
        let values: Vec<f32> = (0..6).map(|_| fade.next()).collect();
        assert_eq!(values, [0.75, 0.5, 0.25, 0.0, 0.0, 0.0]);
        assert!(fade.is_settled());
    }

    #[test]
    fn an_equal_power_crossfade_keeps_the_combined_power() {
        let (mut out, mut into) = (Fade::new(1.0), Fade::new(0.0));
        out.to(0.0, 100, FadeShape::EqualPower);
        into.to(1.0, 100, FadeShape::EqualPower);
        for _ in 0..100 {
            let (a, b) = (out.next(), into.next());
            assert!((a * a + b * b - 1.0).abs() < 1e-5);
        }
    }
}
