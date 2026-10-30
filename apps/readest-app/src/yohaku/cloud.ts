import type { SystemSettings } from '@/types/settings';
import { getActiveFileSyncBackends } from '@/services/sync/cloudSyncProvider';

/**
 * A Yohaku build has no Readest account, so a book only has a copy in the cloud
 * through a file-sync backend the user set up (WebDAV, S3 …). Upload, download
 * and the cloud-or-device delete choices are offered only then.
 */
export const hasCloudCopies = (settings: SystemSettings | null | undefined) =>
  getActiveFileSyncBackends(settings).length > 0;

/**
 * The book context menu of a Yohaku build: transfers need a file-sync backend,
 * and sharing (a link minted by Readest's server) is never offered.
 */
export const filterBookMenuItems = <T extends string>(
  ids: T[],
  settings: SystemSettings | null | undefined,
): T[] =>
  ids.filter((id) => {
    if (id === 'share') return false;
    if (id === 'upload' || id === 'download') return hasCloudCopies(settings);
    return true;
  });
