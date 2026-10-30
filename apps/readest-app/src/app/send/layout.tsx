import { isYohakuBuild } from '@/yohaku/build';
import BackToLibrary from '@/yohaku/BackToLibrary';

// [yohaku] There are no accounts in Yohaku: this page goes straight back to the library.
export default function SendLayout({ children }: { children: React.ReactNode }) {
  return isYohakuBuild() ? <BackToLibrary /> : <>{children}</>;
}
