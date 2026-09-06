/**
 * Lipishilpo Advanced Multi-language Proofreading & Orthography Engine
 *
 * Primary focus: Comprehensive Bengali (Bangla Academy standards, Sadhu-Cholit forms,
 * ং/ঙ conventions, Visarga rules, Punctuation & Typography)
 * Parallel focus: English orthography, grammar and commonly confused words.
 */

export type RuleCategory = 'spelling' | 'grammar' | 'style' | 'punctuation' | 'typography';

export interface ProofRule {
  id: string;
  lang: 'bn' | 'en' | 'all';
  from: string;
  to: string;
  why: {
    en: string;
    bn: string;
  };
  kind: RuleCategory;
  optional?: boolean;
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
}

// ─────────────────────────────────────────────────────────────────────────────
// 🇧🇩 BENGALI COMPREHENSIVE RULES DATABASE (১০০+ প্রমিত নিয়ম ও শুদ্ধরূপ)
// ─────────────────────────────────────────────────────────────────────────────

export const BENGALI_RULES: ProofRule[] = [
  // ── ১. ই-কার বনাম ঈ-কার (বাংলা একাডেমি প্রমিত বানানরীতি) ─────────────────────
  { id: 'bn_sp_bideshi', lang: 'bn', from: 'বিদেশী', to: 'বিদেশি', why: { en: 'Bangla Academy: Foreign/modern words use short "ি".', bn: 'বাংলা একাডেমি প্রমিত নিয়ম: অতৎসম ও আধুনিক শব্দে হ্রস্ব "ি" হবে।' }, kind: 'spelling' },
  { id: 'bn_sp_sarkari', lang: 'bn', from: 'সরকারী', to: 'সরকারি', why: { en: 'Bangla Academy: "সরকারি" uses short "ি".', bn: 'প্রমিত বানান "সরকারি" (হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_jaruri', lang: 'bn', from: 'জরুরী', to: 'জরুরি', why: { en: 'Standard spelling is "জরুরি".', bn: 'প্রমিত বানান "জরুরি" (হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_shreni', lang: 'bn', from: 'শ্রেণী', to: 'শ্রেণি', why: { en: 'Standard modern spelling is "শ্রেণি".', bn: 'বাংলা একাডেমি অভিধান অনুযায়ী প্রমিত রূপ "শ্রেণি"।' }, kind: 'spelling' },
  { id: 'bn_sp_pakhi', lang: 'bn', from: 'পাখী', to: 'পাখি', why: { en: 'Standard modern spelling is "পাখি".', bn: 'আধুনিক প্রমিত বানান "পাখি" (হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_bari', lang: 'bn', from: 'বাড়ী', to: 'বাড়ি', why: { en: 'Standard modern spelling is "বাড়ি".', bn: 'প্রমিত রূপ "বাড়ি" (হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_gari', lang: 'bn', from: 'গাড়ী', to: 'গাড়ি', why: { en: 'Standard modern spelling is "গাড়ি".', bn: 'প্রমিত রূপ "গাড়ি" (হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_dabi', lang: 'bn', from: 'দাবী', to: 'দাবি', why: { en: 'Standard modern spelling is "দাবি".', bn: 'প্রমিত রূপ "দাবি" (হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_tarikh', lang: 'bn', from: 'তারীখ', to: 'তারিখ', why: { en: 'Standard modern spelling is "তারিখ".', bn: 'প্রমিত রূপ "তারিখ" (হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_chuti', lang: 'bn', from: 'ছুটী', to: 'ছুটি', why: { en: 'Standard modern spelling is "ছুটি".', bn: 'প্রমিত বানান "ছুটি"।' }, kind: 'spelling' },
  { id: 'bn_sp_shroddhanjali', lang: 'bn', from: 'শ্রদ্ধাঞ্জলী', to: 'শ্রদ্ধাঞ্জলি', why: { en: 'Words ending in "অঞ্জলি" take short "ি".', bn: '"অঞ্জলি" যুক্ত শব্দে সর্বদা হ্রস্ব "ি" হয় (শ্রদ্ধাঞ্জলি)।' }, kind: 'spelling' },
  { id: 'bn_sp_gitanjali', lang: 'bn', from: 'গীতাঞ্জলী', to: 'গীতাঞ্জলি', why: { en: 'Standard spelling is "গীতাঞ্জলি".', bn: 'প্রমিত বানান "গীতাঞ্জলি" (অঞ্জলিতে হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_suchipatra', lang: 'bn', from: 'সূচীপত্র', to: 'সূচিপত্র', why: { en: 'Standard spelling is "সূচিপত্র".', bn: 'প্রমিত বানান "সূচিপত্র" ("চি" হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_january', lang: 'bn', from: 'জানুয়ারী', to: 'জানুয়ারি', why: { en: 'Foreign month names use short "ি".', bn: 'বিদেশি মাসের নামে হ্রস্ব "ি" হবে (জানুয়ারি)।' }, kind: 'spelling' },
  { id: 'bn_sp_february', lang: 'bn', from: 'ফেব্রুয়ারী', to: 'ফেব্রুয়ারি', why: { en: 'Foreign month names use short "ি".', bn: 'বিদেশি মাসের নামে হ্রস্ব "ি" হবে (ফেব্রুয়ারি)।' }, kind: 'spelling' },
  { id: 'bn_sp_april', lang: 'bn', from: 'এপ্রিল', to: 'এপ্রিল', why: { en: 'Standard.', bn: 'সঠিক।' }, kind: 'spelling' },
  { id: 'bn_sp_protijogita', lang: 'bn', from: 'প্রতিযোগীতা', to: 'প্রতিযোগিতা', why: { en: 'Suffix "-তা" turns long "ী" into short "ি".', bn: '"-তা" প্রত্যয় যুক্ত হলে দীর্ঘ "ী" হ্রস্ব "ি" হয় (প্রতিযোগিতা)।' }, kind: 'spelling' },
  { id: 'bn_sp_sohojogita', lang: 'bn', from: 'সহযোগীতা', to: 'সহযোগিতা', why: { en: 'Suffix "-তা" turns long "ী" into short "ি".', bn: '"-তা" প্রত্যয় যুক্ত হলে হ্রস্ব "ি" হয় (সহযোগিতা)।' }, kind: 'spelling' },
  { id: 'bn_sp_upojogita', lang: 'bn', from: 'উপযোগীতা', to: 'উপযোগিতা', why: { en: 'Suffix "-তা" requires short "ি".', bn: '"-তা" প্রত্যয়ে হ্রস্ব "ি" হবে (উপযোগিতা)।' }, kind: 'spelling' },
  { id: 'bn_sp_shashuri', lang: 'bn', from: 'শাশুড়ী', to: 'শাশুড়ি', why: { en: 'Standard modern spelling is "শাশুড়ি".', bn: 'প্রমিত রূপ "শাশুড়ি" (হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_nani', lang: 'bn', from: 'নানী', to: 'নানি', why: { en: 'Family relations use short "ি".', bn: 'আত্মীয়বাচক শব্দে হ্রস্ব "ি" হবে (নানি, দাদি)।' }, kind: 'spelling' },
  { id: 'bn_sp_dadi', lang: 'bn', from: 'দাদী', to: 'দাদি', why: { en: 'Family relations use short "ি".', bn: 'প্রমিত বানান "দাদি" (হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_chachi', lang: 'bn', from: 'চাচী', to: 'চাচি', why: { en: 'Family relations use short "ি".', bn: 'প্রমিত বানান "চাচি"।' }, kind: 'spelling' },

  // ── ২. উ-কার বনাম ঊ-কার ────────────────────────────────────────────────
  { id: 'bn_sp_durabostha', lang: 'bn', from: 'দূরবস্থা', to: 'দুরবস্থা', why: { en: 'Correct sandhi form is "দুরবস্থা" (দুর + অবস্থা).', bn: 'সন্ধিজাত শুদ্ধ রূপ "দুরবস্থা" (দুর + অবস্থা, হ্রস্ব "ু")।' }, kind: 'spelling' },
  { id: 'bn_sp_duranto', lang: 'bn', from: 'দূরন্ত', to: 'দুরন্ত', why: { en: 'Standard spelling is "দুরন্ত".', bn: 'প্রমিত রূপ "দুরন্ত" (হ্রস্ব উ-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_durniti', lang: 'bn', from: 'দূর্নীতি', to: 'দুর্নীতি', why: { en: 'Standard spelling is "দুর্নীতি" (short "ু").', bn: 'প্রমিত বানান "দুর্নীতি" ("দু" হ্রস্ব উ-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_durghotona', lang: 'bn', from: 'দূর্ঘটনা', to: 'দুর্ঘটনা', why: { en: 'Standard spelling is "দুর্ঘটনা" (short "ু").', bn: 'প্রমিত বানান "দুর্ঘটনা" ("দু" হ্রস্ব উ-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_durjog', lang: 'bn', from: 'দূর্যোগ', to: 'দুর্যোগ', why: { en: 'Standard spelling is "দুর্যোগ".', bn: 'প্রমিত বানান "দুর্যোগ" (হ্রস্ব উ-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_vuktovogi', lang: 'bn', from: 'ভূক্তভোগী', to: 'ভুক্তভোগী', why: { en: 'Standard spelling is "ভুক্তভোগী" (short "ু").', bn: 'শুদ্ধ বানান "ভুক্তভোগী" ("ভু" হ্রস্ব উ-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_muhurto', lang: 'bn', from: 'মুহুর্ত', to: 'মুহূর্ত', why: { en: 'Standard spelling is "মুহূর্ত" (হ-এ দীর্ঘ "ূ").', bn: 'শুদ্ধ বানান "মুহূর্ত" (হ-এ দীর্ঘ "ূ")।' }, kind: 'spelling' },
  { id: 'bn_sp_onubad', lang: 'bn', from: 'অনূবাদ', to: 'অনুবাদ', why: { en: 'Standard form is "অনুবাদ" (short "ু").', bn: 'শুদ্ধ রূপ "অনুবাদ" (হ্রস্ব উ-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_onudito', lang: 'bn', from: 'অনুদিত', to: 'অনূদিত', why: { en: 'Past participle form is "অনূদিত" (long "ূ").', bn: 'অনুবাদজাত সঠিক রূপ "অনূদিত" (দীর্ঘ ঊ-কার)।' }, kind: 'spelling' },

  // ── ৩. ণ-ত্ব ও ষ-ত্ব বিধান / যুক্তবর্ণ ──────────────────────────────────
  { id: 'bn_sp_porishkar', lang: 'bn', from: 'পরিস্কার', to: 'পরিষ্কার', why: { en: 'Standard orthography uses मूर्धन्य "ষ".', bn: 'ষ-ত্ব বিধান অনুযায়ী প্রমিত বানান "পরিষ্কার" ("ষ্ক")।' }, kind: 'spelling' },
  { id: 'bn_sp_abishkar', lang: 'bn', from: 'আবিস্কার', to: 'আবিষ্কার', why: { en: 'Standard orthography uses मूर्धन্য "ষ".', bn: 'ষ-ত্ব বিধান অনুযায়ী প্রমিত বানান "আবিষ্কার" ("ষ্ক")।' }, kind: 'spelling' },
  { id: 'bn_sp_purashkar', lang: 'bn', from: 'পুরষ্কার', to: 'পুরস্কার', why: { en: 'Standard orthography uses দন্ত্য "স".', bn: 'সন্ধির নিয়মে প্রমিত বানান "পুরস্কার" (দন্ত্য "স", "স্ক")।' }, kind: 'spelling' },
  { id: 'bn_sp_tiroshkar', lang: 'bn', from: 'তিরষ্কার', to: 'তিরস্কার', why: { en: 'Standard orthography uses দন্ত্য "স".', bn: 'সন্ধির নিয়মে প্রমিত বানান "তিরস্কার" (দন্ত্য "স", "স্ক")।' }, kind: 'spelling' },
  { id: 'bn_sp_nistobdhota', lang: 'bn', from: 'নিস্তব্দতা', to: 'নিস্তব্ধতা', why: { en: 'Standard conjunct is "ব্ধ" in "নিস্তব্ধতা".', bn: 'প্রমিত বানান "নিস্তব্ধতা" ("ব্ধ" যুক্তবর্ণ হবে)।' }, kind: 'spelling' },
  { id: 'bn_sp_aschorjo', lang: 'bn', from: 'আশ্চর্য্য', to: 'আশ্চর্য', why: { en: 'Bangla Academy standard: double "য" is dropped.', bn: 'প্রমিত নিয়মে য-ফলা দ্বিত্ব বর্জিত হয়ে "আশ্চর্য" হবে।' }, kind: 'spelling' },
  { id: 'bn_sp_akanhkha', lang: 'bn', from: 'আকাংখা', to: 'আকাঙ্ক্ষা', why: { en: 'Standard spelling is "আকাঙ্ক্ষা" (conjunct ঙ্ক্ষ).', bn: 'শুদ্ধ বানান "আকাঙ্ক্ষা" (যুক্তবর্ণ "ঙ্ক্ষ")।' }, kind: 'spelling' },
  { id: 'bn_sp_santwona', lang: 'bn', from: 'সান্তনা', to: 'সান্ত্বনা', why: { en: 'Standard spelling is "সান্ত্বনা" (with ব-ফলা).', bn: 'শুদ্ধ বানান "সান্ত্বনা" ("ন্ত্ব" যুক্তবর্ণ)।' }, kind: 'spelling' },
  { id: 'bn_sp_ucchwas', lang: 'bn', from: 'উচ্ছাস', to: 'উচ্ছ্বাস', why: { en: 'Standard spelling is "উচ্ছ্বাস" (with ব-ফলা).', bn: 'শুদ্ধ বানান "উচ্ছ্বাস" ("চ্ছ্ব" ব-ফলা যুক্তবর্ণ)।' }, kind: 'spelling' },
  { id: 'bn_sp_ujjwol', lang: 'bn', from: 'উজ্জল', to: 'উজ্জ্বল', why: { en: 'Standard spelling is "উজ্জ্বল" (with ব-ফলা).', bn: 'শুদ্ধ বানান "উজ্জ্বল" ("জ্জ্ব" ব-ফলা যুক্তবর্ণ)।' }, kind: 'spelling' },
  { id: 'bn_sp_shoshur', lang: 'bn', from: 'শশুর', to: 'শ্বশুর', why: { en: 'Standard spelling is "শ্বশুর" (first "শ" has ব-ফলা).', bn: 'শুদ্ধ বানান "শ্বশুর" (প্রথম শ-এ ব-ফলা)।' }, kind: 'spelling' },
  { id: 'bn_sp_dandabidhi', lang: 'bn', from: 'দন্ডবিধি', to: 'দণ্ডবিধি', why: { en: 'In tatsama words, "ড" takes মূর্ধন্য "ণ".', bn: 'তৎসম শব্দে ট-বর্গীয় বর্ণের পূর্বে মূর্ধন্য "ণ" হয় ("দণ্ড")।' }, kind: 'spelling' },
  { id: 'bn_sp_dhonobad', lang: 'bn', from: 'ধন্নবাদ', to: 'ধন্যবাদ', why: { en: 'Standard spelling is "ধন্যবাদ" (uses য-ফলা).', bn: 'প্রমিত বানান "ধন্যবাদ" ("ন্য" য-ফলা)।' }, kind: 'spelling' },
  { id: 'bn_sp_monojog', lang: 'bn', from: 'মনযোগ', to: 'মনোযোগ', why: { en: 'Sandhi form is "মনোযোগ" (মনঃ + যোগ).', bn: 'সন্ধিজাত শুদ্ধ রূপ "মনোযোগ" (মনঃ + যোগ)।' }, kind: 'spelling' },
  { id: 'bn_sp_itopurbey', lang: 'bn', from: 'ইতোপূর্বে', to: 'ইতঃপূর্বে', why: { en: 'Correct sandhi form is "ইতঃপূর্বে".', bn: 'সন্ধির নিয়মে শুদ্ধ রূপ "ইতঃপূর্বে" (বা "এর আগে")।' }, kind: 'spelling' },
  { id: 'bn_sp_akoshmik', lang: 'bn', from: 'আকষ্মিক', to: 'আকস্মিক', why: { en: 'Standard spelling is "আকস্মিক" (দন্ত্য "স্ম").', bn: 'শুদ্ধ বানান "আকস্মিক" (দন্ত্য "স্ম")।' }, kind: 'spelling' },
  { id: 'bn_sp_swayottoshashon', lang: 'bn', from: 'স্বায়ত্বশাসন', to: 'স্বায়ত্তশাসন', why: { en: 'Standard spelling is "স্বায়ত্তশাসন" (ত-এ ত "ত্ত").', bn: 'শুদ্ধ বানান "স্বায়ত্তশাসন" ("ত্ত" যুক্তবর্ণ)।' }, kind: 'spelling' },
  { id: 'bn_sp_onibarjo', lang: 'bn', from: 'অনিবার্য্য', to: 'অনিবার্য', why: { en: 'Double "য" is dropped in modern standard.', bn: 'প্রমিত নিয়মে য-ফলা দ্বিত্ব বর্জিত হয়ে "অনিবার্য" হবে।' }, kind: 'spelling' },
  { id: 'bn_sp_upolokkho', lang: 'bn', from: 'উপলক্ষ্য', to: 'উপলক্ষে', why: { en: 'When meaning "on the occasion of", use "উপলক্ষে".', bn: 'উপলক্ষে (উদ্দেশ্য/উপলক্ষে অর্থে য-ফলাহীন এ-কার হবে)।' }, kind: 'spelling' },

  // ── ৪. ং (অনুস্বার) বনাম ঙ ─────────────────────────────────────────────
  { id: 'bn_sp_rongin', lang: 'bn', from: 'রঙ্গীন', to: 'রঙিন', why: { en: 'Standard modern spelling is "রঙিন" (ং with short ি).', bn: 'প্রমিত রূপ "রঙিন" (ঙ-এর দ্বিত্ব বর্জন ও হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_bhanga', lang: 'bn', from: 'ভাঙ্গা', to: 'ভাঙা', why: { en: 'Bangla Academy standard prefers "ভাঙা".', bn: 'বাংলা একাডেমি নিয়মে প্রমিত রূপ "ভাঙা"।' }, kind: 'spelling' },
  { id: 'bn_sp_angul', lang: 'bn', from: 'আঙ্গুল', to: 'আঙুল', why: { en: 'Standard modern spelling is "আঙুল".', bn: 'প্রমিত রূপ "আঙুল"।' }, kind: 'spelling' },
  { id: 'bn_sp_tangano', lang: 'bn', from: 'টাঙ্গানো', to: 'টাঙানো', why: { en: 'Standard modern spelling is "টাঙানো".', bn: 'প্রমিত রূপ "টাঙানো"।' }, kind: 'spelling' },
  { id: 'bn_sp_onko', lang: 'bn', from: 'অংক', to: 'অঙ্ক', why: { en: 'In tatsama words before k-group, use ঙ conjunct: "অঙ্ক".', bn: 'তৎসম শব্দে ক-বর্গের পূর্বে ঙ-যুক্ত রূপ প্রমিত: "অঙ্ক"।' }, kind: 'spelling' },
  { id: 'bn_sp_atonko', lang: 'bn', from: 'আতংক', to: 'আতঙ্ক', why: { en: 'Tatsama word uses conjunct "ঙ্ক": "আতঙ্ক".', bn: 'তৎসম শব্দে ঙ+ক যুক্ত রূপ "আতঙ্ক" প্রমিত।' }, kind: 'spelling' },
  { id: 'bn_sp_shonko', lang: 'bn', from: 'শংকিত', to: 'শঙ্কিত', why: { en: 'Tatsama word uses conjunct "ঙ্ক": "শঙ্কিত".', bn: 'তৎসম শব্দে ঙ+ক যুক্ত রূপ "শঙ্কিত" প্রমিত।' }, kind: 'spelling' },

  // ── ৫. বিসর্গ (ঃ) সংক্রান্ত প্রমিত নিয়ম ────────────────────────────────
  { id: 'bn_sp_karjoto', lang: 'bn', from: 'কার্যতঃ', to: 'কার্যত', why: { en: 'Bangla Academy: Drop word-final visarga in "কার্যত".', bn: 'বাংলা একাডেমি নিয়মে শব্দের শেষের বিসর্গ বর্জিত হয়ে "কার্যত" হবে।' }, kind: 'spelling' },
  { id: 'bn_sp_foloto', lang: 'bn', from: 'ফলতঃ', to: 'ফলত', why: { en: 'Drop word-final visarga in "ফলত".', bn: 'প্রমিত নিয়মে শব্দের শেষের বিসর্গ বর্জিত হয়ে "ফলত" হবে।' }, kind: 'spelling' },
  { id: 'bn_sp_bostuto', lang: 'bn', from: 'বস্তুতঃ', to: 'বস্তুত', why: { en: 'Drop word-final visarga in "বস্তুত".', bn: 'প্রমিত নিয়মে শব্দের শেষের বিসর্গ বর্জিত হয়ে "বস্তুত" হবে।' }, kind: 'spelling' },
  { id: 'bn_sp_prodhanoto', lang: 'bn', from: 'প্রধানতঃ', to: 'প্রধানত', why: { en: 'Drop word-final visarga in "প্রধানত".', bn: 'প্রমিত নিয়মে শব্দের শেষের বিসর্গ বর্জিত হয়ে "প্রধানত" হবে।' }, kind: 'spelling' },
  { id: 'bn_sp_muloto', lang: 'bn', from: 'মূলতঃ', to: 'মূলত', why: { en: 'Drop word-final visarga in "মূলত".', bn: 'প্রমিত নিয়মে শব্দের শেষের বিসর্গ বর্জিত হয়ে "মূলত" হবে।' }, kind: 'spelling' },
  { id: 'bn_sp_prayosho', lang: 'bn', from: 'প্রায়শঃ', to: 'প্রায়শ', why: { en: 'Drop word-final visarga in "প্রায়শ".', bn: 'প্রমিত নিয়মে শব্দের শেষের বিসর্গ বর্জিত হয়ে "প্রায়শ" হবে।' }, kind: 'spelling' },

  // ── ৬. সাধু-চলতি ও সর্বনাম সংক্রান্ত সতর্কতা ─────────────────────────
  { id: 'bn_gr_jaiteseelo', lang: 'bn', from: 'যাইতেছিল', to: 'যাচ্ছিল', why: { en: 'Sadhu verb form. In modern standard prose, use "যাচ্ছিল".', bn: 'সাধু রূপ। প্রমিত চলিত গদ্যে "যাচ্ছিল" ব্যবহার করুন।' }, kind: 'grammar', optional: true },
  { id: 'bn_gr_koritechhilo', lang: 'bn', from: 'করিতেছিল', to: 'করছিল', why: { en: 'Sadhu verb form. In modern standard prose, use "করছিল".', bn: 'সাধু রূপ। চলিত গদ্যে "করছিল" ব্যবহার করুন।' }, kind: 'grammar', optional: true },
  { id: 'bn_gr_boliachhilen', lang: 'bn', from: 'বলিয়াছিলেন', to: 'বলেছিলেন', why: { en: 'Sadhu verb form. In modern standard prose, use "বলেছিলেন".', bn: 'সাধু রূপ। প্রমিত চলিত ভাষায় "বলেছিলেন" ব্যবহার করুন।' }, kind: 'grammar', optional: true },
  { id: 'bn_gr_tahake', lang: 'bn', from: 'তাহাকে', to: 'তাকে', why: { en: 'Sadhu pronoun. In modern standard prose, use "তাকে".', bn: 'সাধু সর্বনাম। প্রমিত চলিত ভাষায় "তাকে" ব্যবহার করুন।' }, kind: 'grammar', optional: true },
  { id: 'bn_gr_tahader', lang: 'bn', from: 'তাহাদের', to: 'তাদের', why: { en: 'Sadhu pronoun. In modern standard prose, use "তাদের".', bn: 'সাধু সর্বনাম। চলিত ভাষায় "তাদের" ব্যবহার করুন।' }, kind: 'grammar', optional: true },
  { id: 'bn_gr_uhar', lang: 'bn', from: 'উহার', to: 'তার', why: { en: 'Sadhu pronoun. In modern standard prose, use "তার" (বা "ওটার").', bn: 'সাধু সর্বনাম। চলিত ভাষায় "তার" বা "ওটার" ব্যবহার করুন।' }, kind: 'grammar', optional: true },
  { id: 'bn_gr_ihate', lang: 'bn', from: 'ইহাতে', to: 'এতে', why: { en: 'Sadhu pronoun. In modern standard prose, use "এতে".', bn: 'সাধু সর্বনাম। চলিত ভাষায় "এতে" ব্যবহার করুন।' }, kind: 'grammar', optional: true },

  // ── ৭. ক্রিয়ার কথ্য বনাম প্রমিত রূপ (Stylistic Options) ───────────────
  { id: 'bn_st_korlo', lang: 'bn', from: 'করলো', to: 'করল', why: { en: 'Standard prose prefers "করল". Dialogue can retain "করলো".', bn: 'প্রমিত গদ্যে "করল" শ্রেয়। সংলাপে কথ্য রূপ "করলো" রাখা যায়।' }, kind: 'style', optional: true },
  { id: 'bn_st_bollo', lang: 'bn', from: 'বললো', to: 'বলল', why: { en: 'Standard prose prefers "বলল".', bn: 'প্রমিত গদ্যে "বলল" ব্যবহার করতে পারেন।' }, kind: 'style', optional: true },
  { id: 'bn_st_holo', lang: 'bn', from: 'হলো', to: 'হল', why: { en: 'Standard prose prefers "হল".', bn: 'প্রমিত গদ্যে "হল" রূপটি ব্যবহৃত হয়।' }, kind: 'style', optional: true },
  { id: 'bn_st_gelo', lang: 'bn', from: 'গেলো', to: 'গেল', why: { en: 'Standard prose prefers "গেল".', bn: 'প্রমিত গদ্যে "গেল" রূপটি শ্রেয়।' }, kind: 'style', optional: true },
  { id: 'bn_st_khelo', lang: 'bn', from: 'খেলো', to: 'খেল', why: { en: 'Standard prose prefers "খেল".', bn: 'প্রমিত গদ্যে "খেল" রূপটি শ্রেয়।' }, kind: 'style', optional: true },
  { id: 'bn_st_dekhlo', lang: 'bn', from: 'দেখলো', to: 'দেখল', why: { en: 'Standard prose prefers "দেখল".', bn: 'প্রমিত গদ্যে "দেখল" রূপটি শ্রেয়।' }, kind: 'style', optional: true },
  { id: 'bn_st_shunlo', lang: 'bn', from: 'শুনলো', to: 'শুনল', why: { en: 'Standard prose prefers "শুনল".', bn: 'প্রমিত গদ্যে "শুনল" রূপটি শ্রেয়।' }, kind: 'style', optional: true },
  { id: 'bn_st_kenona_comma', lang: 'bn', from: 'কেননা,', to: 'কেননা', why: { en: 'Comma is unnecessary after "কেননা".', bn: '"কেননা"-র পর সাধারণত কমা বসানোর প্রয়োজন নেই।' }, kind: 'punctuation' },

  // ── ৮. বাহুল্য দোষ ও দ্বৈত বহুবচন (Redundancy & Double Plurality) ─────────
  { id: 'bn_rd_sob_pakhira', lang: 'bn', from: 'সব পাখিরা', to: 'সব পাখি', why: { en: 'Redundant double plural: use "সব পাখি" or "পাখিরা".', bn: 'দ্বৈত বহুবচন দোষ। "সব পাখি" অথবা "পাখিরা" লিখুন।' }, kind: 'grammar' },
  { id: 'bn_rd_sokol_shodoshyogon', lang: 'bn', from: 'সকল সদস্যগণ', to: 'সকল সদস্য', why: { en: 'Redundant double plural: use "সকল সদস্য" or "সদস্যগণ".', bn: 'দ্বৈত বহুবচন দোষ। "সকল সদস্য" বা "সদস্যগণ" লিখুন।' }, kind: 'grammar' },
  { id: 'bn_rd_sokol_manushera', lang: 'bn', from: 'সকল মানুষেরা', to: 'সকল মানুষ', why: { en: 'Redundant double plural: use "সকল মানুষ" or "মানুষেরা".', bn: 'দ্বৈত বহুবচন দোষ। "সকল মানুষ" বা "মানুষেরা" লিখুন।' }, kind: 'grammar' },
  { id: 'bn_rd_kebolmatro', lang: 'bn', from: 'কেবলমাত্র', to: 'কেবল', why: { en: 'Semantic redundancy: use "কেবল" or "মাত্র".', bn: 'বাহুল্য দোষ। "কেবল" অথবা "মাত্র" যেকোনো একটি লিখুন।' }, kind: 'grammar' },
  { id: 'bn_rd_oshrujol', lang: 'bn', from: 'অশ্রুজল', to: 'অশ্রু', why: { en: 'Redundancy: "অশ্রু" already means tears.', bn: 'বাহুল্য দোষ। "অশ্রু" অর্থই চোখের জল ("অশ্রু" বা "চোখের জল" লিখুন)।' }, kind: 'grammar' },
  { id: 'bn_rd_shoporibare', lang: 'bn', from: 'স্বপরিবারে', to: 'সপরিবারে', why: { en: 'When meaning "with family", use "সপরিবারে" ("স্বপরিবারে" means with wife only).', bn: 'পরিবারসহ অর্থে "সপরিবারে" শুদ্ধ ("স্বপরিবারে" অর্থ কেবল নিজের স্ত্রীসহ)।' }, kind: 'spelling' },
  { id: 'bn_rd_lojjashkor', lang: 'bn', from: 'লজ্জাস্কর', to: 'লজ্জাকর', why: { en: 'Standard form is "লজ্জাকর" (not লজ্জাস্কর).', bn: 'শুদ্ধ রূপ "লজ্জাকর" ("স্ক" অপ্রয়োজনীয়)।' }, kind: 'spelling' },
  { id: 'bn_rd_utkorshota', lang: 'bn', from: 'উৎকর্ষতা', to: 'উৎকর্ষ', why: { en: 'Redundant suffix: use "উৎকর্ষ" or "উৎকৃষ্টতা".', bn: 'প্রত্যয়জনিত বাহুল্য দোষ। "উৎকর্ষ" অথবা "উৎকৃষ্টতা" লিখুন।' }, kind: 'grammar' },
  { id: 'bn_rd_daridryota', lang: 'bn', from: 'দারিদ্র্যতা', to: 'দারিদ্র্য', why: { en: 'Redundant suffix: use "দারিদ্র্য" or "দরিদ্রতা".', bn: 'প্রত্যয়জনিত বাহুল্য দোষ। "দারিদ্র্য" বা "দরিদ্রতা" লিখুন।' }, kind: 'grammar' },
  { id: 'bn_rd_sokhyota', lang: 'bn', from: 'সখ্যতা', to: 'সখ্য', why: { en: 'Redundant suffix: use "সখ্য" or "সখ্যভাব".', bn: 'প্রত্যয়জনিত বাহুল্য দোষ। শুদ্ধ রূপ "সখ্য" (বা সখ্যভাব)।' }, kind: 'grammar' },
  { id: 'bn_rd_oikyota', lang: 'bn', from: 'ঐক্যতা', to: 'ঐক্য', why: { en: 'Redundant suffix: use "ঐক্য" or "একতা".', bn: 'প্রত্যয়জনিত বাহুল্য দোষ। শুদ্ধ রূপ "ঐক্য" অথবা "একতা"।' }, kind: 'grammar' },
  { id: 'bn_rd_dainyota', lang: 'bn', from: 'দৈন্যতা', to: 'দৈন্য', why: { en: 'Redundant suffix: use "দৈন্য" or "দীনতা".', bn: 'প্রত্যয়জনিত বাহুল্য দোষ। শুদ্ধ রূপ "দৈন্য" অথবা "দীনতা"।' }, kind: 'grammar' },
  { id: 'bn_rd_soujonyota', lang: 'bn', from: 'সৌজন্যতা', to: 'সৌজন্য', why: { en: 'Redundant suffix: use "সৌজন্য".', bn: 'প্রত্যয়জনিত বাহুল্য দোষ। শুদ্ধ রূপ "সৌজন্য"।' }, kind: 'grammar' },

  // ── ৯. হ-এ ণ বনাম হ-এ ন এবং তৎসম যুক্তবর্ণ (Orthography) ─────────────────
  { id: 'bn_sp_oporanhno', lang: 'bn', from: 'অপরাহ্ন', to: 'অপরাহ্ণ', why: { en: 'Tatsama orthography: uses মূর্ধন্য-ণ (হ্ণ).', bn: 'তৎসম শব্দে র-এর পর হ-যুক্ত মূর্ধন্য "ণ" হবে ("অপরাহ্ণ")।' }, kind: 'spelling' },
  { id: 'bn_sp_moddhanho', lang: 'bn', from: 'মধাহ্ন', to: 'মধ্যাহ্ন', why: { en: 'Standard spelling is "মধ্যাহ্ন".', bn: 'শুদ্ধ রূপ "মধ্যাহ্ন" (য-ফলাসহ হ-এ দন্ত্য ন)।' }, kind: 'spelling' },
  { id: 'bn_sp_moddhanho_2', lang: 'bn', from: 'মধ্যহ্ন', to: 'মধ্যাহ্ন', why: { en: 'Standard spelling is "মধ্যাহ্ন".', bn: 'শুদ্ধ বানান "মধ্যাহ্ন" (আ-কারসহ)।' }, kind: 'spelling' },
  { id: 'bn_sp_purbanho', lang: 'bn', from: 'পূর্বাহ্ন', to: 'পূর্বাহ্ণ', why: { en: 'Tatsama orthography: uses মূর্ধন্য-ণ (হ্ণ).', bn: 'তৎসম শব্দে রেফ-এর পর হ-যুক্ত মূর্ধন্য "ণ" হবে ("পূর্বাহ্ণ")।' }, kind: 'spelling' },
  { id: 'bn_sp_sayannho', lang: 'bn', from: 'সায়াহ্ন', to: 'সায়াহ্ণ', why: { en: 'Tatsama orthography: "সায়াহ্ন" takes দন্ত্য ন.', bn: 'শুদ্ধ বানান "সায়াহ্ন" (হ-এ দন্ত্য ন)।' }, kind: 'spelling' },
  { id: 'bn_sp_uporokto', lang: 'bn', from: 'উপরোক্ত', to: 'উপরি-উক্ত', why: { en: 'Sandhi error: correct form is "উপরি-উক্ত" or "উপর্যুক্ত".', bn: 'সন্ধিজনিত ভুল। শুদ্ধ রূপ "উপরি-উক্ত" অথবা "উপর্যুক্ত"।' }, kind: 'spelling' },
  { id: 'bn_sp_shirocched', lang: 'bn', from: 'শিরচ্ছেদ', to: 'শিরশ্ছেদ', why: { en: 'Sandhi form is "শিরশ্ছেদ" (শিরঃ + ছেদ).', bn: 'সন্ধিজাত শুদ্ধ বানান "শিরশ্ছেদ" (তালব্য শ)।' }, kind: 'spelling' },
  { id: 'bn_sp_muhurmuhu', lang: 'bn', from: 'মুহূর্মুহু', to: 'মুহুর্মুহু', why: { en: 'Standard spelling is "মুহুর্মুহু" (short ু throughout).', bn: 'শুদ্ধ বানান "মুহুর্মুহু" (সবগুলো হ্রস্ব উ-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_monokosto', lang: 'bn', from: 'মনকষ্ট', to: 'মনঃকষ্ট', why: { en: 'Sandhi requires visarga: "মনঃকষ্ট".', bn: 'সন্ধির নিয়মে বিসর্গসহ শুদ্ধ রূপ "মনঃকষ্ট"।' }, kind: 'spelling' },
  { id: 'bn_sp_montritwo', lang: 'bn', from: 'মন্ত্রীত্ব', to: 'মন্ত্রিত্ব', why: { en: 'Suffix "-ত্ব" turns long "ী" into short "ি".', bn: '"-ত্ব" প্রত্যয় যুক্ত হলে হ্রস্ব "ি" হয় ("মন্ত্রিত্ব")।' }, kind: 'spelling' },
  { id: 'bn_sp_dayittwo', lang: 'bn', from: 'দায়ীত্ব', to: 'দায়িত্ব', why: { en: 'Standard spelling is "দায়িত্ব" (short ি).', bn: 'শুদ্ধ বানান "দায়িত্ব" (হ্রস্ব ই-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_ainjibi', lang: 'bn', from: 'আইনজীবি', to: 'আইনজীবী', why: { en: 'Suffix "-জীবী" ends with long "ী".', bn: '"-জীবী" প্রত্যয়যুক্ত শব্দে সর্বদা দীর্ঘ "ী" হবে ("আইনজীবী")।' }, kind: 'spelling' },
  { id: 'bn_sp_buddhijibi', lang: 'bn', from: 'বুদ্ধিজীবি', to: 'বুদ্ধিজীবী', why: { en: 'Suffix "-জীবী" ends with long "ী".', bn: 'শুদ্ধ বানান "বুদ্ধিজীবী" (ব-এ দীর্ঘ ঈ-কার)।' }, kind: 'spelling' },
  { id: 'bn_sp_chakurijibi', lang: 'bn', from: 'চাকুরিজীবি', to: 'চাকরিজীবী', why: { en: 'Standard modern spelling is "চাকরিজীবী".', bn: 'আধুনিক প্রমিত রূপ "চাকরিজীবী"।' }, kind: 'spelling' },
  { id: 'bn_sp_peshajibi', lang: 'bn', from: 'পেশাজীবি', to: 'পেশাজীবী', why: { en: 'Suffix "-জীবী" ends with long "ী".', bn: 'শুদ্ধ বানান "পেশাজীবী"।' }, kind: 'spelling' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 🇬🇧 ENGLISH COMPREHENSIVE RULES DATABASE
// ─────────────────────────────────────────────────────────────────────────────

export const ENGLISH_RULES: ProofRule[] = [
  { id: 'en_sp_teh', lang: 'en', from: 'teh', to: 'the', why: { en: 'Common typing error for "the".', bn: 'ইংরেজি "the"-এর সাধারণ টাইপিং ভুল।' }, kind: 'spelling' },
  { id: 'en_sp_recieve', lang: 'en', from: 'recieve', to: 'receive', why: { en: 'Standard spelling: "receive" (i before e except after c).', bn: 'ইংরেজি সঠিক বানান "receive"।' }, kind: 'spelling' },
  { id: 'en_sp_seperate', lang: 'en', from: 'seperate', to: 'separate', why: { en: 'Standard spelling: "separate".', bn: 'ইংরেজি সঠিক বানান "separate"।' }, kind: 'spelling' },
  { id: 'en_sp_definately', lang: 'en', from: 'definately', to: 'definitely', why: { en: 'Standard spelling: "definitely".', bn: 'ইংরেজি সঠিক বানান "definitely"।' }, kind: 'spelling' },
  { id: 'en_sp_occured', lang: 'en', from: 'occured', to: 'occurred', why: { en: 'Standard spelling: "occurred" with double "r".', bn: 'ইংরেজি সঠিক বানান "occurred" (দুটো r)।' }, kind: 'spelling' },
  { id: 'en_sp_accommodate', lang: 'en', from: 'accomodate', to: 'accommodate', why: { en: 'Standard spelling: "accommodate" (double "c" and double "m").', bn: 'ইংরেজি সঠিক বানান "accommodate" (দুটো c ও দুটো m)।' }, kind: 'spelling' },
  { id: 'en_sp_until', lang: 'en', from: 'untill', to: 'until', why: { en: 'Standard spelling: "until" with single "l".', bn: 'ইংরেজি সঠিক বানান "until" (একটি l)।' }, kind: 'spelling' },
  { id: 'en_sp_necessary', lang: 'en', from: 'neccessary', to: 'necessary', why: { en: 'Standard spelling: "necessary" (one "c", double "s").', bn: 'ইংরেজি সঠিক বানান "necessary"।' }, kind: 'spelling' },
  { id: 'en_sp_privilege', lang: 'en', from: 'priviledge', to: 'privilege', why: { en: 'Standard spelling: "privilege" (no "d").', bn: 'ইংরেজি সঠিক বানান "privilege"।' }, kind: 'spelling' },
  { id: 'en_sp_maintenance', lang: 'en', from: 'maintainance', to: 'maintenance', why: { en: 'Standard spelling: "maintenance".', bn: 'ইংরেজি সঠিক বানান "maintenance"।' }, kind: 'spelling' },
  { id: 'en_gr_their_there', lang: 'en', from: 'their is', to: 'there is', why: { en: 'Common homophone confusion: use "there is".', bn: '"there is" ব্যবহার করুন ("their" অধিকারবাচক)।' }, kind: 'grammar', optional: true },
  { id: 'en_gr_its_it_is', lang: 'en', from: 'its a', to: "it's a", why: { en: 'Contraction for "it is a" requires apostrophe.', bn: '"it\'s a" (it is)-এ অ্যাপোস্ট্রফি বসবে।' }, kind: 'grammar', optional: true },
  { id: 'en_gr_loose_lose', lang: 'en', from: 'loose weight', to: 'lose weight', why: { en: 'Use "lose" for reduction/loss ("loose" means not tight).', bn: '"lose weight" হবে ("loose" মানে ঢিলেঢালা)।' }, kind: 'grammar' },
];

export const ALL_RULES: ProofRule[] = [...BENGALI_RULES, ...ENGLISH_RULES];

// ─────────────────────────────────────────────────────────────────────────────
// 🔍 RULE CHECKING & EXECUTION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function wordPattern(word: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{M}])${escapeRegex(word)}(?![\\p{L}\\p{M}])`, 'gu');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

export function findIssues(
  text: string,
  uiLang: 'en' | 'bn' = 'en',
  manuscriptLang = 'all',
  ignored: string[] = []
): ProofMatch[] {
  if (!text || !text.trim()) return [];

  const found: ProofMatch[] = [];

  for (const rule of ALL_RULES) {
    if (ignored.includes(rule.from) || ignored.includes(rule.id)) continue;

    if (manuscriptLang === 'বাংলা' && rule.lang === 'en') continue;
    if (manuscriptLang === 'English' && rule.lang === 'bn') continue;

    const matches = text.match(wordPattern(rule.from));
    if (matches && matches.length > 0) {
      found.push({
        id: rule.id,
        from: rule.from,
        to: rule.to,
        why: rule.why[uiLang] || rule.why.en,
        kind: kindLabels[uiLang][rule.kind] || rule.kind,
        category: rule.kind,
        optional: rule.optional,
        count: matches.length,
      });
    }
  }

  // Space before Bengali Dari (e.g. "কথা ।" -> "কথা।")
  if (!ignored.includes('__dari_space') && /[^\S\n]+[।]/.test(text)) {
    const dariMatches = text.match(/[^\S\n]+[।]/g);
    found.push({
      id: '__dari_space',
      from: ' ।',
      to: '।',
      why: uiLang === 'bn' ? 'দাঁড়ির পূর্বে স্পেস দেওয়া হয় না।' : 'Remove space before the Bengali period (দাঁড়ি)।',
      kind: kindLabels[uiLang].punctuation,
      category: 'punctuation',
      count: dariMatches ? dariMatches.length : 1,
    });
  }

  // Multiple spaces
  if (!ignored.includes('__spaces') && /[^\S\n]{2,}/.test(text)) {
    const spaceMatches = text.match(/[^\S\n]{2,}/g);
    found.push({
      id: '__spaces',
      from: '__spaces',
      to: ' ',
      why: uiLang === 'bn' ? 'অতিরিক্ত একাধিক স্পেস পাওয়া গেছে।' : 'Multiple consecutive spaces found.',
      kind: kindLabels[uiLang].punctuation,
      category: 'punctuation',
      count: spaceMatches ? spaceMatches.length : 1,
    });
  }

  return found;
}

export function applyFix(text: string, from: string, to: string): string {
  if (from === '__spaces') {
    return text.replace(/[^\S\n]{2,}/g, ' ');
  }
  if (from === ' ।') {
    return text.replace(/[^\S\n]+[।]/g, '।');
  }
  return text.replace(wordPattern(from), to);
}

/** Apply all safe fixes in one click */
export function applyAllFixes(text: string, matches: ProofMatch[]): string {
  let updated = text;
  for (const m of matches) {
    if (m.optional) continue; // Skip optional stylistic suggestions during "Accept All"
    updated = applyFix(updated, m.from, m.to);
  }
  return updated;
}

/** Manuscript Stats */
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

/** Long Sentence / Complexity Insight */
export interface LongSentence {
  text: string;
  wordCount: number;
}

export function findLongSentences(text: string, maxWords = 35): LongSentence[] {
  if (!text || !text.trim()) return [];
  // Split by Bengali Dari (।), question mark, exclamation, or English period
  const rawSentences = text.split(/[।!?\n]+/u);
  const results: LongSentence[] = [];

  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/u);
    if (words.length >= maxWords) {
      results.push({
        text: trimmed,
        wordCount: words.length,
      });
    }
  }

  return results;
}

/** Smart Typography & Punctuation Formatter */
export function formatTypography(text: string): string {
  if (!text) return text;
  let formatted = text;

  // 1. Remove space before punctuation: "কথা , গান" -> "কথা, গান", "কথা ।" -> "কথা।"
  formatted = formatted.replace(/[^\S\n]+([,;:।!?])/gu, '$1');

  // 2. Ensure space after punctuation (except newline/quotes)
  formatted = formatted.replace(/([,;।!?])(?=[^\s,;।!?”’'"])/gu, '$1 ');

  // 3. Double/triple question or exclamation marks
  formatted = formatted.replace(/\?{2,}/g, '?');
  formatted = formatted.replace(/!{2,}/g, '!');
  formatted = formatted.replace(/\.{3,}/g, '…');

  // 4. Double hyphen / spaced hyphen to em-dash
  formatted = formatted.replace(/--/g, '—');
  formatted = formatted.replace(/(\s)-(\s)/g, '$1—$2');

  // 5. Smart Quotes: Straight quotes to curly quotes
  formatted = formatted.replace(/"([^"]+)"/gu, '“$1”');
  formatted = formatted.replace(/'([^']+)'/gu, '‘$1’');

  // 6. Multiple consecutive spaces
  formatted = formatted.replace(/[^\S\n]{2,}/g, ' ');

  return formatted;
}

