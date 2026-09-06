import nspell from 'nspell';
import { getWPConfig } from '../api';

type Spell = ReturnType<typeof nspell>;

let spellPromise: Promise<Spell | null> | null = null;

function dictsBaseUrl(): string {
  const fromConfig = getWPConfig().dictsUrl;
  if (fromConfig) return fromConfig.replace(/\/$/, '');
  const el = document.getElementById('lipishilpo-root');
  const raw = el?.dataset.dictsUrl;
  if (raw) return raw.replace(/\/$/, '');
  return '';
}

async function loadGzipText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Dictionary HTTP ${res.status}`);
  if (typeof DecompressionStream === 'undefined' || !res.body) {
    throw new Error('Gzip dictionary is not supported in this browser');
  }
  const stream = res.body.pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

export async function getBengaliSpell(): Promise<Spell | null> {
  if (spellPromise) return spellPromise;
  const base = dictsBaseUrl();
  if (!base) {
    spellPromise = Promise.resolve(null);
    return spellPromise;
  }

  spellPromise = (async () => {
    try {
      const [aff, dic] = await Promise.all([
        loadGzipText(`${base}/bn-BD.aff.gz`),
        loadGzipText(`${base}/bn-BD.dic.gz`),
      ]);
      return nspell({ aff, dic });
    } catch {
      return null;
    }
  })();

  return spellPromise;
}

export function addPersonalWords(spell: Spell, words: string[]) {
  for (const word of words) {
    if (/[\u0980-\u09FF]/.test(word) && word.length >= 2 && !word.startsWith('__')) {
      spell.add(word);
    }
  }
}

export function isBengaliToken(word: string): boolean {
  return /^[\u0980-\u09FF]{2,}$/.test(word);
}
