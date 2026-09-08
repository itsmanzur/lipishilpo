import nspell from 'nspell';
import { getWPConfig } from '../api';

type Spell = ReturnType<typeof nspell>;

let bnSpellPromise: Promise<Spell | null> | null = null;
let enSpellPromise: Promise<Spell | null> | null = null;

function dictsBaseUrl(): string {
  const fromConfig = getWPConfig().dictsUrl;
  if (fromConfig) return fromConfig.replace(/\/$/, '');
  const el = document.getElementById('lipishilpo-root');
  const raw = el?.dataset.dictsUrl;
  if (raw) return raw.replace(/\/$/, '');
  return '';
}

async function loadText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Dictionary HTTP ${res.status}`);
  return res.text();
}

async function loadSpell(affName: string, dicName: string): Promise<Spell | null> {
  const base = dictsBaseUrl();
  if (!base) return null;
  try {
    const [aff, dic] = await Promise.all([
      loadText(`${base}/${affName}`),
      loadText(`${base}/${dicName}`),
    ]);
    return nspell({ aff, dic });
  } catch {
    return null;
  }
}

export async function getBengaliSpell(): Promise<Spell | null> {
  if (!bnSpellPromise) bnSpellPromise = loadSpell('bn-BD.aff', 'bn-BD.dic');
  return bnSpellPromise;
}

export async function getEnglishSpell(): Promise<Spell | null> {
  if (!enSpellPromise) enSpellPromise = loadSpell('en-US.aff', 'en-US.dic');
  return enSpellPromise;
}

export function addPersonalWords(spell: Spell, words: string[], script: 'bn' | 'en' = 'bn') {
  for (const word of words) {
    if (word.startsWith('__') || word.length < 2) continue;
    if (script === 'bn' && /[\u0980-\u09FF]/.test(word)) spell.add(word);
    if (script === 'en' && /^[A-Za-z][A-Za-z'-]*$/.test(word)) spell.add(word);
  }
}

export function isBengaliToken(word: string): boolean {
  return /^[\u0980-\u09FF]{2,}$/.test(word);
}

export function isEnglishToken(word: string): boolean {
  return /^[A-Za-z][A-Za-z'-]{1,}$/.test(word);
}
