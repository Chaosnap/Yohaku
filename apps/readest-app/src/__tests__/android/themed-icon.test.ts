import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Regression guard for the Android themed ("Material You" / monochrome) launcher
 * icon (issue #4733).
 *
 * Android 13+ recolors the adaptive icon's `<monochrome>` layer with a
 * wallpaper-derived tint when the user enables themed icons. Support for it was
 * originally added in #2122/#2153 (the `ic_launcher_monochrome.png` assets) and
 * wired into the source adaptive icon, but #2353 ("fixed Android launcher icon
 * size") rewrote the *committed* `gen/` adaptive icon to inset the foreground
 * and silently dropped the `<monochrome>` layer — so themed icons stopped
 * working in shipped builds.
 *
 * The CI/release flow regenerates `gen/android` from scratch
 * (`tauri android init`) and then restores the *tracked* customizations, so the
 * themed icon only survives if the adaptive-icon XML and every layer it points
 * at are tracked under `gen/`.
 *
 * [yohaku] Yohaku draws every adaptive-icon layer as a tracked vector drawable,
 * so no per-density launcher PNGs are needed.
 *
 * Invariants:
 *  1. The committed adaptive icon declares a `<monochrome>` layer pointing at
 *     `@drawable/yohaku_icon_monochrome`.
 *  2. The vector drawables the adaptive icon points at are tracked.
 */

const appRoot = process.cwd();
const resRoot = resolve(appRoot, 'src-tauri/gen/android/app/src/main/res');

describe('Android themed (monochrome) launcher icon', () => {
  it('declares a <monochrome> layer in the adaptive icon', () => {
    const xml = readFileSync(resolve(resRoot, 'mipmap-anydpi-v26/ic_launcher.xml'), 'utf8');
    expect(xml).toMatch(/<monochrome\b/);
    expect(xml).toMatch(/@drawable\/yohaku_icon_monochrome/);
  });

  it('ships the tracked vector drawables the adaptive icon points at', () => {
    const missing = ['yohaku_icon_foreground', 'yohaku_icon_monochrome'].filter(
      (name) => !existsSync(resolve(resRoot, 'drawable', `${name}.xml`)),
    );
    expect(missing, `missing tracked drawables: ${missing.join(', ')}`).toEqual([]);
  });
});
