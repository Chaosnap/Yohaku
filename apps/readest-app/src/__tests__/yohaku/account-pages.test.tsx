import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import AuthLayout from '@/app/auth/layout';
import LinkLayout from '@/app/link/layout';
import SendLayout from '@/app/send/layout';
import ProfileLayout from '@/app/user/layout';

const { routerReplace } = vi.hoisted(() => ({ routerReplace: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplace }) }));

const layouts = { AuthLayout, LinkLayout, SendLayout, ProfileLayout };

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  routerReplace.mockClear();
});

describe.each(Object.entries(layouts))('%s', (_name, Layout) => {
  it('shows the account page in Readest', () => {
    render(<Layout>Sign in to Readest</Layout>);
    expect(screen.getByText('Sign in to Readest')).toBeTruthy();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it('goes straight back to the library in a Yohaku build', () => {
    vi.stubEnv('NEXT_PUBLIC_YOHAKU_BUILD', 'true');
    render(<Layout>Sign in to Readest</Layout>);
    expect(screen.queryByText('Sign in to Readest')).toBeNull();
    expect(routerReplace).toHaveBeenCalledWith('/library');
  });
});
