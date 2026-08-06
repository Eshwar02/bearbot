export type ThemePreference = 'light' | 'dark' | 'system';

const VALID_THEME_VALUES = new Set<ThemePreference>(['light', 'dark', 'system']);

// A stale client-side session can exist while the server has no matching
// auth cookie. Once the protected endpoint rejects it, keep theme changes
// local rather than issuing a 401 for every subsequent toggle.
let canPersistRemotely = true;

export async function persistThemePreference(theme: ThemePreference): Promise<boolean> {
  if (!VALID_THEME_VALUES.has(theme) || !canPersistRemotely) return false;
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
    if (response.status === 401) canPersistRemotely = false;
    return response.ok;
  } catch {
    return false;
  }
}
