export type ThemePreference = 'light' | 'dark' | 'sandal' | 'blue' | 'system';

const VALID_THEME_VALUES = new Set<ThemePreference>(['light', 'dark', 'sandal', 'blue', 'system']);

export async function persistThemePreference(theme: ThemePreference): Promise<boolean> {
  if (!VALID_THEME_VALUES.has(theme)) return false;
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
