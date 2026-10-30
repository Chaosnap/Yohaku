import { afterEach, describe, expect, it, vi } from 'vitest';
import { isYohakuBuild, toYohakuBrand } from '@/yohaku/build';

describe('isYohakuBuild', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is off in the unit tests, so upstream tests keep checking Readest behaviour', () => {
    expect(isYohakuBuild()).toBe(false);
  });

  it('is on when the app build sets NEXT_PUBLIC_YOHAKU_BUILD', () => {
    vi.stubEnv('NEXT_PUBLIC_YOHAKU_BUILD', 'true');
    expect(isYohakuBuild()).toBe(true);
  });
});

describe('toYohakuBrand', () => {
  it('renames every mention of Readest', () => {
    expect(toYohakuBrand('About Readest')).toBe('About Yohaku');
    expect(toYohakuBrand('Readest 打开了 Readest 书库')).toBe('Yohaku 打开了 Yohaku 书库');
  });

  it('leaves other text untouched', () => {
    expect(toYohakuBrand('余白')).toBe('余白');
  });
});
