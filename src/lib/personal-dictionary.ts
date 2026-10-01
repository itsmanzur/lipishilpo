// Unscoped legacy caches cannot be attributed to an account and are never imported.
export function dictionaryKey(userId: number): string {
  return `lipishilpo_personal_dict_user_${userId}`;
}

export function readDictionary(userId: number): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(dictionaryKey(userId)) ?? '[]');
    return Array.isArray(value) ? value.filter((word): word is string => typeof word === 'string') : [];
  } catch { return []; }
}

export function writeDictionary(userId: number, words: string[]) {
  try { localStorage.setItem(dictionaryKey(userId), JSON.stringify(words)); } catch {}
}
