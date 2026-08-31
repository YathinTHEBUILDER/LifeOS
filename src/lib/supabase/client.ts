import { createBrowserClient } from '@supabase/ssr';

// Session persistence is controlled by cookie maxAge:
//   - a maxAge set  -> Supabase's auth cookie survives browser restarts ("stay logged in")
//   - no maxAge     -> it becomes a session cookie that clears when the browser closes
// The preference is written by the login page (see src/app/auth/login/page.tsx)
// before it signs in, so it applies from the very first sign-in and stays
// consistent for every client created on later page loads.
function readStayLoggedInPreference(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = window.localStorage.getItem('life_os_stay_logged_in');
  return stored === null ? true : stored === 'true';
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  const stayLoggedIn = readStayLoggedInPreference();

  return createBrowserClient(url, key, {
    cookieOptions: stayLoggedIn
      ? { maxAge: 60 * 60 * 24 * 365 } // 1 year
      : { maxAge: undefined }, // session cookie — clears when the browser closes
  });
}
