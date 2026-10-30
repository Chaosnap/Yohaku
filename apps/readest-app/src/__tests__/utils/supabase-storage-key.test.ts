import { afterEach, describe, expect, it, vi } from 'vitest';

const loadStorageKey = async (url?: string) => {
  vi.resetModules();
  if (url) vi.stubEnv('SUPABASE_URL', url);
  vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key');
  const { supabase } = await import('@/utils/supabase');
  return (supabase.auth as unknown as { storageKey: string }).storageKey;
};

describe('supabase session storage key', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // [yohaku] Yohaku ships no Readest Cloud keys; the client points at a host
  // that can never resolve.
  it('ships without the Readest Cloud project as a default', async () => {
    expect(process.env['NEXT_PUBLIC_DEFAULT_SUPABASE_URL_BASE64']).toBeUndefined();
    expect(await loadStorageKey()).toBe('sb-supabase-auth-token');
  });

  it.each([
    'https://readest.supabase.co',
    'https://vbsyxfusjjqdxkjqlysc.supabase.co',
    'https://auth.readest.com',
  ])('keeps the original session key for Readest Cloud at %s', async (url) => {
    expect(await loadStorageKey(url)).toBe('sb-readest-auth-token');
  });

  it('keeps the host-derived key for a self-hosted instance', async () => {
    expect(await loadStorageKey('http://localhost:54321')).toBe('sb-localhost-auth-token');
  });
});
