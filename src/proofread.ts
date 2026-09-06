/**
 * Lipishilpo proofreading engine
 *
 * Layers: Unicode variants → lexicon (with suffixes) → pattern rules
 * → sadhu/cholit mixing → Hunspell dictionary → punctuation.
 */

import { BENGALI_RULES, ENGLISH_RULES } from './lib/proof-lexicon';
import { addPersonalWords, getBengaliSpell } from './lib/bn-spell';
import type { ProofRule, RuleCategory } from './proofread-types';

export type { ProofRule, RuleCategory };

export interface ProofOccurrence {
  start: number;
  end: number;
  from: string;
  to: string;
}

export interface ProofMatch {
  id: string;
  from: string;
  to: string;
  why: string;
  kind: string;
  category: RuleCategory;
  optional?: boolean;
  count: number;
  occurrences: ProofOccurrence[];
}

export interface ProofOptions {
  includeOptionalStyle?: boolean;
}

export const ALL_RULES: ProofRule[] = [...BENGALI_RULES, ...ENGLISH_RULES].filter(
  (rule) => rule.from !== rule.to
);

const kindLabels = {
  en: {
    spelling: 'Spelling',
    grammar: 'Grammar',
    style: 'Style',
    punctuation: 'Punctuation',
    typography: 'Typography',
  },
  bn: {
    spelling: 'বানান',
    grammar: 'ব্যাকরণ',
    style: 'লেখার ধরন',
    punctuation: 'যতিচিহ্ন',
    typography: 'মুদ্রণরীতি',
  },
};

const BN_SUFFIX = '(তে|কে|র|য়|রা|গুলি|গুলো|গুলোতে|টা|টি|দের|তেই|কেই|ও)?';
const BOUNDARY = '(?<![\\p{L}\\p{M}])';
const BOUNDARY_END = '(?![\\p{L}\\p{M}])';

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function nuktaVariants(s: string): string[] {
  const nfc = s.normalize('NFC');
  const decomposed = nfc
    .replace(/\u09DF/g, '\u09AF\u09BC')
    .replace(/\u09DC/g, '\u09A1\u09BC')
    .replace(/\u09DD/g, '\u09A2\u09BC');
  return [...new Set([s, nfc, decomposed])];
}

export function wordPattern(word: string, withSuffix = false): RegExp {
  const body = nuktaVariants(word).map(escapeRegex).join('|');
  const suffix = withSuffix && !/\s/.test(word) ? BN_SUFFIX : '';
  return new RegExp(`${BOUNDARY}(?:${body})${suffix}${BOUNDARY_END}`, 'gu');
}

function alreadyCovered(map: Map<string, ProofMatch>, start: number, end: number): boolean {
  for (const item of map.values()) {
    if (item.occurrences.some((o) => o.start < end && o.end > start)) return true;
  }
  return false;
}

function pushOccurrence(
  map: Map<string, ProofMatch>,
  seed: Omit<ProofMatch, 'count' | 'occurrences'>,
  occ: ProofOccurrence,
  skipIfCovered = false
) {
  if (skipIfCovered && alreadyCovered(map, occ.start, occ.end)) return;
  const existing = map.get(seed.id);
  if (existing) {
    if (existing.occurrences.some((o) => o.start === occ.start && o.end === occ.end)) return;
    existing.occurrences.push(occ);
    existing.count += 1;
    return;
  }
  map.set(seed.id, { ...seed, count: 1, occurrences: [occ] });
}

function findLexiconIssues(
  text: string,
  uiLang: 'en' | 'bn',
  manuscriptLang: string,
  ignored: string[],
  includeOptionalStyle: boolean,
  map: Map<string, ProofMatch>
) {
  for (const rule of ALL_RULES) {
    if (rule.from === rule.to) continue;
    if (ignored.includes(rule.from) || ignored.includes(rule.id)) continue;
    if (manuscriptLang === 'বাংলা' && rule.lang === 'en') continue;
    if (manuscriptLang === 'English' && rule.lang === 'bn') continue;
    if (!includeOptionalStyle && rule.kind === 'style' && rule.optional) continue;

    const allowSuffix = rule.lang === 'bn' && !/\s/.test(rule.from) && rule.kind !== 'punctuation';
    const regex = wordPattern(rule.from, allowSuffix);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const suffix = allowSuffix ? m[1] || '' : '';
      const matched = m[0];
      const replacement = rule.to + suffix;
      if (matched === replacement) continue;
      pushOccurrence(
        map,
        {
          id: rule.id,
          from: matched,
          to: replacement,
          why: rule.why[uiLang] || rule.why.en,
          kind: kindLabels[uiLang][rule.kind],
          category: rule.kind,
          optional: rule.optional,
        },
        { start: m.index, end: m.index + matched.length, from: matched, to: replacement }
      );
    }
  }
}

function findPatternIssues(
  text: string,
  uiLang: 'en' | 'bn',
  ignored: string[],
  map: Map<string, ProofMatch>
) {
  if (!ignored.includes('__double_plural')) {
    const re = new RegExp(
      `${BOUNDARY}(সব|সকল|সমস্ত)\\s+([\\u0980-\\u09FF]+?)(রা|গণ|গুলি|গুলো)${BOUNDARY_END}`,
      'gu'
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const matched = m[0];
      const replacement = `${m[1]} ${m[2]}`;
      pushOccurrence(
        map,
        {
          id: '__double_plural',
          from: matched,
          to: replacement,
          why:
            uiLang === 'bn'
              ? 'দ্বৈত বহুবচন দোষ। নির্ধারক (সব/সকল/সমস্ত) থাকলে রা/গণ/গুলি লাগে না।'
              : 'Double plural: drop রা/গণ/গুলি after সব/সকল/সমস্ত.',
          kind: kindLabels[uiLang].grammar,
          category: 'grammar',
        },
        { start: m.index, end: m.index + matched.length, from: matched, to: replacement },
        true
      );
    }
  }

  if (!ignored.includes('__ita_suffix')) {
    const re = new RegExp(`${BOUNDARY}([\\u0980-\\u09FF]*?(?:যোগ|বাদ|কার|চার))ীতা${BOUNDARY_END}`, 'gu');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const matched = m[0];
      const replacement = `${m[1]}িতা`;
      pushOccurrence(
        map,
        {
          id: '__ita_suffix',
          from: matched,
          to: replacement,
          why:
            uiLang === 'bn'
              ? '"-তা" প্রত্যয় যুক্ত হলে দীর্ঘ ী হ্রস্ব ই হয় (প্রতিযোগিতা, সহযোগিতা)।'
              : 'The -তা suffix turns long ী into short ই (প্রতিযোগিতা).',
          kind: kindLabels[uiLang].spelling,
          category: 'spelling',
        },
        { start: m.index, end: m.index + matched.length, from: matched, to: replacement },
        true
      );
    }
  }

  if (!ignored.includes('__final_visarga')) {
    const re = new RegExp(`${BOUNDARY}([\\u0980-\\u09FF]+?)(তঃ|শঃ)${BOUNDARY_END}`, 'gu');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const matched = m[0];
      const replacement = m[1] + (m[2] === 'তঃ' ? 'ত' : 'শ');
      pushOccurrence(
        map,
        {
          id: '__final_visarga',
          from: matched,
          to: replacement,
          why:
            uiLang === 'bn'
              ? 'বাংলা একাডেমি: পদান্তে বিসর্গ বর্জনীয় (প্রধানত, ক্রমশ)।'
              : 'Bangla Academy: drop word-final visarga (প্রধানত, ক্রমশ).',
          kind: kindLabels[uiLang].spelling,
          category: 'spelling',
        },
        { start: m.index, end: m.index + matched.length, from: matched, to: replacement },
        true
      );
    }
  }

  if (!ignored.includes('__dari_space')) {
    const re = /[^\S\n]+।/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      pushOccurrence(
        map,
        {
          id: '__dari_space',
          from: ' ।',
          to: '।',
          why: uiLang === 'bn' ? 'দাঁড়ির পূর্বে স্পেস দেওয়া হয় না।' : 'Remove the space before দাঁড়ি.',
          kind: kindLabels[uiLang].punctuation,
          category: 'punctuation',
        },
        { start: m.index, end: m.index + m[0].length, from: m[0], to: '।' }
      );
    }
  }

  if (!ignored.includes('__spaces')) {
    const re = /[^\S\n]{2,}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      pushOccurrence(
        map,
        {
          id: '__spaces',
          from: '__spaces',
          to: ' ',
          why: uiLang === 'bn' ? 'অতিরিক্ত একাধিক স্পেস পাওয়া গেছে।' : 'Multiple consecutive spaces found.',
          kind: kindLabels[uiLang].punctuation,
          category: 'punctuation',
        },
        { start: m.index, end: m.index + m[0].length, from: m[0], to: ' ' }
      );
    }
  }
}

const SADHU_HINT = /(?:করিতেছে|করিতেছিল|যাইতেছে|যাইতেছিল|বলিতেছে|বলিয়াছে|বলিয়াছিলেন|তাহাকে|তাহাদের|যাইবে|করিবে|হইতেছে|আসিতেছে|করিল|বলিল)(?![\u0980-\u09FF])/;
const CHOLIT_HINT = /(?:করছে|যাচ্ছে|বলছে|খাচ্ছে|আসছে|হচ্ছে|যাবে|করবে|হয়েছে|গেছে|এসেছে|বলেছে)(?![\u0980-\u09FF])/;

function findGuruchandali(
  text: string,
  uiLang: 'en' | 'bn',
  ignored: string[],
  map: Map<string, ProofMatch>
) {
  if (ignored.includes('__guruchandali')) return;
  const parts = text.split(/([।!?\n]+)/u);
  let offset = 0;
  for (const part of parts) {
    const sentence = part.trim();
    if (sentence.length > 8 && SADHU_HINT.test(sentence) && CHOLIT_HINT.test(sentence)) {
      const sadhu = sentence.match(SADHU_HINT);
      pushOccurrence(
        map,
        {
          id: '__guruchandali',
          from: sadhu?.[0] || sentence.slice(0, 24),
          to: uiLang === 'bn' ? 'এক রীতি রাখুন' : 'Keep one register',
          why:
            uiLang === 'bn'
              ? 'গুরুচণ্ডালী দোষ: একই বাক্যে সাধু ও চলিত ক্রিয়া/সর্বনাম মেশানো হয়েছে।'
              : 'Sadhu and cholit forms are mixed in the same sentence.',
          kind: kindLabels[uiLang].grammar,
          category: 'grammar',
          optional: true,
        },
        { start: offset, end: offset + part.length, from: part, to: part }
      );
    }
    offset += part.length;
  }
}

const BN_TOKEN = /[\u0980-\u09FF]{2,}/gu;
const MAX_DICT_FLAGS = 40;

async function findDictionaryIssues(
  text: string,
  uiLang: 'en' | 'bn',
  ignored: string[],
  map: Map<string, ProofMatch>
) {
  if (ignored.includes('__dictionary')) return;
  const spell = await getBengaliSpell();
  if (!spell) return;
  addPersonalWords(spell, ignored);

  const grouped = new Map<string, ProofOccurrence[]>();
  BN_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BN_TOKEN.exec(text)) !== null) {
    const word = m[0];
    if (ignored.includes(word) || ignored.includes(`bn_hunspell:${word}`)) continue;
    if (alreadyCovered(map, m.index, m.index + word.length)) continue;
    let ok = false;
    try {
      ok = spell.correct(word);
    } catch {
      ok = true;
    }
    if (ok) continue;
    const list = grouped.get(word) ?? [];
    list.push({ start: m.index, end: m.index + word.length, from: word, to: word });
    grouped.set(word, list);
  }

  let added = 0;
  for (const [word, occs] of grouped) {
    if (added >= MAX_DICT_FLAGS) break;
    let suggestions: string[] = [];
    try {
      suggestions = spell.suggest(word).filter((s) => s && s !== word).slice(0, 3);
    } catch {
      suggestions = [];
    }
    if (suggestions.length === 0) continue;
    const to = suggestions[0];
    const alt = suggestions.slice(1);
    const why =
      uiLang === 'bn'
        ? `অভিধানে শব্দটি নেই। সম্ভাব্য শুদ্ধ রূপ: ${suggestions.join(' / ')}`
        : `Not in the Bengali dictionary. Suggested: ${suggestions.join(' / ')}`;
    for (const occ of occs) {
      pushOccurrence(
        map,
        {
          id: `bn_hunspell:${word}`,
          from: word,
          to,
          why: alt.length ? why : why,
          kind: kindLabels[uiLang].spelling,
          category: 'spelling',
        },
        { ...occ, to },
        true
      );
    }
    added += 1;
  }
}

export async function findIssues(
  text: string,
  uiLang: 'en' | 'bn' = 'en',
  manuscriptLang = 'all',
  ignored: string[] = [],
  options: ProofOptions = {}
): Promise<ProofMatch[]> {
  if (!text || !text.trim()) return [];
  const includeOptionalStyle = options.includeOptionalStyle === true;
  const map = new Map<string, ProofMatch>();
  findLexiconIssues(text, uiLang, manuscriptLang, ignored, includeOptionalStyle, map);
  if (manuscriptLang !== 'English') {
    findPatternIssues(text, uiLang, ignored, map);
    findGuruchandali(text, uiLang, ignored, map);
    await findDictionaryIssues(text, uiLang, ignored, map);
  } else {
    findPatternIssues(
      text,
      uiLang,
      [...ignored, '__double_plural', '__ita_suffix', '__final_visarga'],
      map
    );
  }
  return [...map.values()].sort((a, b) => (a.occurrences[0]?.start ?? 0) - (b.occurrences[0]?.start ?? 0));
}

export function applyFix(text: string, from: string, to: string, start?: number, end?: number): string {
  if (from === '__spaces') return text.replace(/[^\S\n]{2,}/g, ' ');
  if (from === ' ।' || from === '__dari_space') return text.replace(/[^\S\n]+।/g, '।');
  if (from === '__guruchandali' || to === text.slice(start ?? 0, end ?? 0)) return text;
  if (typeof start === 'number' && typeof end === 'number' && end > start) {
    const slice = text.slice(start, end);
    if (slice === from || nuktaVariants(from).includes(slice)) {
      return text.slice(0, start) + to + text.slice(end);
    }
  }
  const allowSuffix = !/\s/.test(from) && from !== '__spaces';
  return text.replace(wordPattern(from, allowSuffix), (matched, suffix = '') => {
    if (allowSuffix && typeof suffix === 'string' && matched.endsWith(suffix)) {
      return to.endsWith(suffix) ? to : to + suffix;
    }
    return to;
  });
}

export function applyAllFixes(text: string, matches: ProofMatch[]): string {
  const occs = matches
    .filter((m) => !m.optional && m.id !== '__guruchandali')
    .flatMap((m) => m.occurrences.map((o) => ({ ...o, id: m.id })))
    .sort((a, b) => b.start - a.start);

  let updated = text;
  const seen = new Set<string>();
  for (const occ of occs) {
    const key = `${occ.start}:${occ.end}:${occ.from}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (updated.slice(occ.start, occ.end) !== occ.from && !nuktaVariants(occ.from).includes(updated.slice(occ.start, occ.end))) {
      continue;
    }
    updated = updated.slice(0, occ.start) + occ.to + updated.slice(occ.end);
  }
  return updated;
}

export interface ManuscriptStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  paragraphs: number;
  readingTimeMinutes: number;
}

export function calculateStats(text: string): ManuscriptStats {
  const trimmed = text.trim();
  if (!trimmed) {
    return { words: 0, characters: 0, charactersNoSpaces: 0, paragraphs: 0, readingTimeMinutes: 0 };
  }
  const words = trimmed.split(/\s+/u).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s+/gu, '').length;
  const paragraphs = text.split(/\n+/u).filter((p) => p.trim().length > 0).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 180));
  return { words, characters, charactersNoSpaces, paragraphs, readingTimeMinutes };
}

export interface LongSentence {
  text: string;
  wordCount: number;
}

export function findLongSentences(text: string, maxWords = 35): LongSentence[] {
  if (!text || !text.trim()) return [];
  const rawSentences = text.split(/[।!?\n]+/u);
  const results: LongSentence[] = [];
  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/u);
    if (words.length >= maxWords) {
      results.push({ text: trimmed, wordCount: words.length });
    }
  }
  return results;
}

export function formatTypography(text: string): string {
  if (!text) return text;
  let formatted = text.normalize('NFC');
  formatted = formatted.replace(/[^\S\n]+([,;:।!?])/gu, '$1');
  formatted = formatted.replace(/([,;।!?])(?=[^\s,;।!?”’'"])/gu, '$1 ');
  formatted = formatted.replace(/\?{2,}/g, '?');
  formatted = formatted.replace(/!{2,}/g, '!');
  formatted = formatted.replace(/\.{3,}/g, '…');
  formatted = formatted.replace(/--/g, '—');
  formatted = formatted.replace(/(\s)-(\s)/g, '$1—$2');
  formatted = formatted.replace(/"([^"]+)"/gu, '“$1”');
  formatted = formatted.replace(/'([^']+)'/gu, '‘$1’');
  formatted = formatted.replace(/[^\S\n]{2,}/g, ' ');
  return formatted;
}
