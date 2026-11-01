import { describe, expect, it } from 'vitest';
import { errorMessage } from '@/yohaku/errors';

describe('errorMessage', () => {
  it('reads the message a Tauri plugin rejects with on Android', () => {
    expect(errorMessage({ message: 'No command pickFolder found' })).toBe(
      'No command pickFolder found',
    );
  });

  it('reads Errors and plain values', () => {
    expect(errorMessage(new Error('Cannot read the music'))).toBe('Cannot read the music');
    expect(errorMessage('Not allowed')).toBe('Not allowed');
    expect(errorMessage(42)).toBe('42');
  });
});
