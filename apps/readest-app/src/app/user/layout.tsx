import { Metadata } from 'next';
import { isYohakuBuild } from '@/yohaku/build';
import BackToLibrary from '@/yohaku/BackToLibrary';

export const metadata: Metadata = {
  title: 'Account & Sign In',
  description:
    'Sign in to your Readest account or manage your subscription, cloud library storage, and account settings.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  // [yohaku] There are no accounts in Yohaku: this page goes straight back to the library.
  return isYohakuBuild() ? <BackToLibrary /> : <>{children}</>;
}
