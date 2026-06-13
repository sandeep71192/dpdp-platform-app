// Shared display names for ISO language codes used across consent analytics.
export const LANG_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', bn: 'Bengali', te: 'Telugu', mr: 'Marathi',
  ta: 'Tamil', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', or: 'Odia',
}

export function languageName(code: string): string {
  return LANG_NAMES[code] || code.toUpperCase()
}
