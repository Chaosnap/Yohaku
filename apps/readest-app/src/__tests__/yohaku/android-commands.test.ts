import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Tauri runs a JavaScript call to an Android plugin under the lowerCamelCase
// form of its name (`plugin:yohaku-audio|pick_folder` reaches `pickFolder`),
// while the permissions keep the name as written. A Kotlin command named any
// other way is never found and the call fails: up to 2.1, every Android call
// with an underscore in its name did, from the pickers to the ambient sounds.
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const plugin = 'src-tauri/plugins/tauri-plugin-yohaku-audio';

const called = [
  ...read('src/yohaku/audio/androidEngine.ts').matchAll(/\bcall(?:<[^>]*>)?\('([a-z_]+)'/g),
].map((match) => match[1]!);
const kotlin = [
  ...read(`${plugin}/android/src/main/java/YohakuAudioPlugin.kt`).matchAll(
    /@Command\s+fun (\w+)\(/g,
  ),
].map((match) => match[1]!);
const camelCase = (name: string) =>
  name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

describe('the Android audio plugin', () => {
  it('reads the commands the Android engine calls', () => {
    expect(called).toContain('pick_folder');
    expect(called).toContain('apply_ambient');
  });

  it('has a Kotlin command under the name Tauri runs, for every call', () => {
    for (const name of called) expect(kotlin).toContain(camelCase(name));
  });

  it('allows every command the Android engine calls', () => {
    const commands = read(`${plugin}/build.rs`);
    const permissions = read(`${plugin}/permissions/default.toml`);
    for (const name of called) {
      expect(commands).toContain(`"${name}"`);
      expect(permissions).toContain(`"allow-${name.replaceAll('_', '-')}"`);
    }
  });
});
