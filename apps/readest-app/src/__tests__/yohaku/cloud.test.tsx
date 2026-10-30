import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Book } from '@/types/book';
import type { SystemSettings } from '@/types/settings';
import { useSettingsStore } from '@/store/settingsStore';
import { isReadestCloudEnabled } from '@/services/sync/cloudSyncProvider';
import { filterBookMenuItems, hasCloudCopies } from '@/yohaku/cloud';
import { navigateToLogin } from '@/utils/nav';
import BookItem from '@/app/library/components/BookItem';

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: routerPush }) }));
vi.mock('@/context/EnvContext', () => ({ useEnv: () => ({ appService: null }) }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useTranslation', () => ({ useTranslation: () => (text: string) => text }));
vi.mock('@/hooks/useResponsiveSize', () => ({ useResponsiveSize: (size: number) => size }));
vi.mock('@/hooks/useMedianPageDurationSecs', () => ({
  useMedianPageDurationSecs: () => undefined,
}));
vi.mock('@/components/BookCover', () => ({ default: () => null }));

const noBackend = {} as SystemSettings;
const withWebDAV = { webdav: { enabled: true } } as SystemSettings;

const yohakuBuild = () => {
  // .env.tauri turns both on for every app build.
  vi.stubEnv('NEXT_PUBLIC_YOHAKU_BUILD', 'true');
  vi.stubEnv('NEXT_PUBLIC_SELF_HOSTED', 'true');
};

const localBook: Book = {
  hash: 'local-book',
  title: '雪国',
  author: '川端康成',
  format: 'EPUB',
  createdAt: 1,
  updatedAt: 1,
  downloadedAt: 1,
  uploadedAt: null,
};

// Listed by a WebDAV library sync, with the file still on the server.
const remoteBook: Book = { ...localBook, hash: 'remote-book', downloadedAt: null, uploadedAt: 1 };

const props = {
  mode: 'grid' as const,
  coverFit: 'crop' as const,
  isSelectMode: false,
  bookSelected: false,
  transferProgress: null,
  handleBookUpload: vi.fn(),
  handleBookDownload: vi.fn(),
  showBookDetailsModal: vi.fn(),
  showTimeRemaining: false,
};

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('Readest Cloud', () => {
  it('is on by default in Readest', () => {
    expect(isReadestCloudEnabled(noBackend)).toBe(true);
  });

  it('is never on in a Yohaku build, which has no accounts', () => {
    yohakuBuild();
    expect(isReadestCloudEnabled(noBackend)).toBe(false);
    expect(isReadestCloudEnabled({ readestCloud: { enabled: true } } as SystemSettings)).toBe(
      false,
    );
  });
});

describe('cloud copies in a Yohaku build', () => {
  beforeEach(yohakuBuild);

  it('exist only through a file-sync backend', () => {
    expect(hasCloudCopies(noBackend)).toBe(false);
    expect(hasCloudCopies(withWebDAV)).toBe(true);
  });

  it('never offer sharing, and offer transfers only with a backend', () => {
    const ids = ['showDetails', 'download', 'upload', 'share', 'delete'];
    expect(filterBookMenuItems(ids, noBackend)).toEqual(['showDetails', 'delete']);
    expect(filterBookMenuItems(ids, withWebDAV)).toEqual([
      'showDetails',
      'download',
      'upload',
      'delete',
    ]);
  });
});

describe('the cloud badge under a book', () => {
  it('offers Readest Cloud uploads in Readest', () => {
    useSettingsStore.setState({ settings: noBackend });
    render(<BookItem {...props} book={localBook} />);
    expect(screen.getByRole('button', { name: 'Upload Book' })).toBeTruthy();
  });

  it('is gone in a Yohaku build, so nothing leads to a sign-in page', () => {
    yohakuBuild();
    useSettingsStore.setState({ settings: noBackend });
    render(<BookItem {...props} book={localBook} />);
    expect(screen.queryByRole('button', { name: 'Upload Book' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Download Book' })).toBeNull();
  });

  it('downloads a book that only the WebDAV server holds, without signing in', () => {
    yohakuBuild();
    useSettingsStore.setState({ settings: withWebDAV });
    render(<BookItem {...props} book={remoteBook} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download Book' }));
    expect(props.handleBookDownload).toHaveBeenCalledWith(remoteBook, { queued: true });
    expect(routerPush).not.toHaveBeenCalled();
  });
});

describe('the sign-in page', () => {
  it('is never opened in a Yohaku build', () => {
    yohakuBuild();
    navigateToLogin({ push: routerPush } as unknown as Parameters<typeof navigateToLogin>[0]);
    expect(routerPush).not.toHaveBeenCalled();
  });
});
