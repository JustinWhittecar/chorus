const COLUMN_PREFS_KEY = 'chorus.csvColumnPrefs';
const LAST_COLUMN_KEY = 'chorus.lastSelectedColumnName';

export interface ColumnPreferences {
  [headerSetHash: string]: string;
}

export function headerSetHash(headers: string[]): string {
  return headers
    .map(h => h.toLowerCase().trim())
    .sort()
    .join('|');
}

export function loadColumnPrefs(): ColumnPreferences {
  try {
    const stored = localStorage.getItem(COLUMN_PREFS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveColumnPref(hash: string, columnName: string): void {
  try {
    const prefs = loadColumnPrefs();
    prefs[hash] = columnName;
    localStorage.setItem(COLUMN_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function getLastSelectedColumnName(): string {
  try {
    return localStorage.getItem(LAST_COLUMN_KEY) || '';
  } catch {
    return '';
  }
}

export function setLastSelectedColumnName(name: string): void {
  try {
    localStorage.setItem(LAST_COLUMN_KEY, name);
  } catch {
    // ignore
  }
}

export function getSavedColumnForHeaders(headers: string[]): string | null {
  const hash = headerSetHash(headers);
  const prefs = loadColumnPrefs();

  if (prefs[hash]) {
    const savedColumn = prefs[hash];
    if (headers.some(h => h === savedColumn)) {
      return savedColumn;
    }
  }

  const lastColumn = getLastSelectedColumnName();
  if (lastColumn && headers.some(h => h === lastColumn)) {
    return lastColumn;
  }

  return null;
}
