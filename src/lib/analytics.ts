/**
 * Advanced Writing Analytics & Overused Words Engine
 */

export interface DetailedWritingStats {
  words: number;
  chars: number;
  charsNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMin: number;
  speakingTimeMin: number;
  dialogueWords: number;
  narrativeWords: number;
  dialogueRatio: number; // 0 - 100%
  sentenceCadence: {
    short: number; // < 10 words
    medium: number; // 10 - 25 words
    long: number; // > 25 words
  };
  overusedWords: {
    word: string;
    count: number;
    percentage: number;
    alternatives: string[];
  }[];
}

const BENGALI_CRUTCH_WORDS: Record<string, string[]> = {
  'হঠাৎ': ['সহসা', 'আচমকা', 'অতর্কিতে', 'চকিতে', 'অপ্রত্যাশিতভাবে'],
  'কিন্তু': ['তবে', 'পক্ষান্তরে', 'তথাপি', 'অথচ', 'বটে'],
  'আসলে': ['বস্তুত', 'প্রকৃতপক্ষে', 'মূলত', 'সত্যিকার অর্থে'],
  'তখন': ['সেই মুহূর্তে', 'তৎক্ষণাৎ', 'সেই ক্ষণে', 'অনন্তর'],
  'মূলত': ['প্রধানত', 'মূলতপক্ষে', 'বস্তুত', 'সারত'],
  'একটু': ['সামান্য', 'ঈষৎ', 'কিয়ৎকাল', 'অল্প', 'কিছুটা'],
  'যেন': ['মনে হয়', 'বোধকরি', 'সাদৃশ্যে', 'যেনবা'],
  'সম্ভবত': ['হয়তোবা', 'সম্ভাব্য', 'বোধহয়', 'অনুমেয়'],
  'প্রায়': ['কাছাকাছি', 'অধিকাংশ', 'নিকটবর্তী', 'প্রায়শই'],
  'অবশ্য': ['নিশ্চয়', 'নিঃসন্দেহে', 'অবশ্যই', 'অনস্বীকার্য'],
  'সত্যি': ['বাস্তবিক', 'সত্যিকার', 'যথাযথ', 'অকপট'],
  'খুব': ['অত্যন্ত', 'প্রচণ্ড', 'দারুণ', 'অপরিসীম', 'অধিক'],
  'অনেক': ['প্রচুর', 'অগণিত', 'বিপুল', 'অজস্র', 'ভূরি ভূরি'],
  'হয়তো': ['সম্ভবত', 'বোধকরি', 'হতে পারে'],
  'তাছাড়া': ['অধিকন্তু', 'তদুপরি', 'পাশাপাশি', 'অপরদিকে'],
};

const BENGALI_STOP_WORDS = new Set([
  'ও', 'এবং', 'বা', 'না', 'কি', 'কী', 'কে', 'যে', 'সে', 'তা', 'এই', 'ওই', 'এর', 'তার',
  'একটি', 'হলো', 'হল', 'হবে', 'হয়ে', 'হতে', 'আছে', 'ছিল', 'থেকে', 'করে', 'করা', 'দিয়ে',
  'জন্য', 'পর', 'পরে', 'সাথে', 'নিয়ে', 'বলে', 'বলা', 'গেলে', 'গেল', 'যায়', 'আগে', 'এখন',
  'এখানে', 'সেখানে', 'কোথায়', 'কীভাবে', 'কোন', 'কোনো', 'কিছু', 'সব', 'সমস্ত', 'যিনি', 'তিনি',
  'আমি', 'তুমি', 'আমরা', 'তোমরা', 'তারা', 'তাদের', 'আমাকে', 'তোমাকে', 'আমায়', 'তোমায়',
]);

export function analyzeManuscript(text: string): DetailedWritingStats {
  if (!text || !text.trim()) {
    return {
      words: 0,
      chars: 0,
      charsNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMin: 0,
      speakingTimeMin: 0,
      dialogueWords: 0,
      narrativeWords: 0,
      dialogueRatio: 0,
      sentenceCadence: { short: 0, medium: 0, long: 0 },
      overusedWords: [],
    };
  }

  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;

  // Words breakdown
  const rawWords = text.trim().split(/\s+/).filter(Boolean);
  const totalWords = rawWords.length;

  // Sentences breakdown (Bengali Dari |, Question mark ?, Exclamation !, Period .)
  const sentenceList = text
    .split(/[।!?\.]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const totalSentences = sentenceList.length || 1;

  // Sentence Cadence
  let shortCount = 0;
  let mediumCount = 0;
  let longCount = 0;

  for (const s of sentenceList) {
    const wCount = s.split(/\s+/).filter(Boolean).length;
    if (wCount < 10) shortCount++;
    else if (wCount <= 25) mediumCount++;
    else longCount++;
  }

  // Dialogue extraction (extract matches within “...”, "...", ‘...’)
  const dialogueRegex = /(?:“([^”]+)”|"([^"]+)"|‘([^’]+)’)/g;
  let dialogueWordCount = 0;
  let match;

  while ((match = dialogueRegex.exec(text)) !== null) {
    const quoteContent = match[1] || match[2] || match[3] || '';
    const qWords = quoteContent.trim().split(/\s+/).filter(Boolean).length;
    dialogueWordCount += qWords;
  }

  dialogueWordCount = Math.min(totalWords, dialogueWordCount);
  const narrativeWordCount = Math.max(0, totalWords - dialogueWordCount);
  const dialogueRatio = totalWords > 0 ? Math.round((dialogueWordCount / totalWords) * 100) : 0;

  // Reading time (average 200 wpm for Bengali reading, 130 wpm for speech)
  const readingTimeMin = Math.max(1, Math.round(totalWords / 200));
  const speakingTimeMin = Math.max(1, Math.round(totalWords / 130));

  // Overused Words Frequency
  const wordFreq: Record<string, number> = {};
  for (const raw of rawWords) {
    const clean = raw.replace(/[।,!?"'“”‘’;:—\(\)\[\]\{\}]/g, '').trim().toLowerCase();
    if (!clean || clean.length < 2) continue;
    wordFreq[clean] = (wordFreq[clean] || 0) + 1;
  }

  const overused: DetailedWritingStats['overusedWords'] = [];

  for (const [w, count] of Object.entries(wordFreq)) {
    // Flag if in crutch words list or used excessively (> 1% of total words for non-stop words)
    const isCrutch = BENGALI_CRUTCH_WORDS[w];
    const isOverusedNonStop = !BENGALI_STOP_WORDS.has(w) && count >= 4 && (count / totalWords) > 0.008;

    if (isCrutch && count >= 2) {
      overused.push({
        word: w,
        count,
        percentage: Number(((count / totalWords) * 100).toFixed(1)),
        alternatives: isCrutch,
      });
    } else if (isOverusedNonStop) {
      overused.push({
        word: w,
        count,
        percentage: Number(((count / totalWords) * 100).toFixed(1)),
        alternatives: [],
      });
    }
  }

  overused.sort((a, b) => b.count - a.count);

  return {
    words: totalWords,
    chars,
    charsNoSpaces,
    sentences: totalSentences,
    paragraphs,
    readingTimeMin,
    speakingTimeMin,
    dialogueWords: dialogueWordCount,
    narrativeWords: narrativeWordCount,
    dialogueRatio,
    sentenceCadence: {
      short: shortCount,
      medium: mediumCount,
      long: longCount,
    },
    overusedWords: overused.slice(0, 8),
  };
}
