import React, { useState } from 'react';
import {
  Sparkles, Check, Copy, BookOpen, Trash2,
  Globe, Sliders
} from 'lucide-react';
import { type Language } from '../i18n';

interface SettingsViewProps {
  isPro: boolean;
  lang: Language;
  onToggleLang: () => void;
  onOpenEditor: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isPro,
  lang,
  onToggleLang,
  onOpenEditor,
}) => {
  const [copied, setCopied] = useState(false);
  const [dict, setDict] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lipishilpo_personal_dict');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  function handleCopyShortcode() {
    navigator.clipboard.writeText('[lipishilpo]');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRemoveWord(word: string) {
    const updated = dict.filter((w) => w !== word);
    setDict(updated);
    try {
      localStorage.setItem('lipishilpo_personal_dict', JSON.stringify(updated));
    } catch {}
  }

  function handleClearDict() {
    if (!confirm(lang === 'bn' ? 'ব্যক্তিগত ডিকশনারি কি খালি করতে চান?' : 'Clear all words from personal dictionary?')) return;
    setDict([]);
    try {
      localStorage.removeItem('lipishilpo_personal_dict');
    } catch {}
  }

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-hero-card">
        <div>
          <span className="settings-hero-badge">
            <Sliders size={14} /> {lang === 'bn' ? 'প্লাগিন কনফিগারেশন' : 'Plugin Settings'}
          </span>
          <h1>{lang === 'bn' ? 'লিপিশিল্প সেটিংস ও তথ্য' : 'Lipishilpo Settings & Status'}</h1>
          <p>
            {lang === 'bn'
              ? 'শর্টকোড ইন্টিগ্রেশন, ব্যক্তিগত ডিকশনারি এবং প্রো ফিচারের বিস্তারিত পরিচালনা করুন।'
              : 'Manage shortcode integration, personal ignore dictionary, and Lipishilpo Pro status.'}
          </p>
        </div>
        <button className="primary settings-cta-btn" onClick={onOpenEditor}>
          <BookOpen size={16} /> {lang === 'bn' ? 'পান্ডুলিপি স্টুডিও খুলুন' : 'Open Manuscript Studio'}
        </button>
      </div>

      <div className="settings-grid">
        {/* Card 1: Version & Pro Status */}
        <div className="settings-card">
          <h2>
            <span>💎</span> {lang === 'bn' ? 'সংস্করণ ও লাইসেন্স স্ট্যাটাস' : 'Version & License Status'}
          </h2>

          <div className={'pro-status-banner ' + (isPro ? 'active-pro' : 'free-tier')}>
            <div className="status-icon-circle">{isPro ? '⭐' : '🆓'}</div>
            <div>
              <h3>{isPro ? (lang === 'bn' ? 'Lipishilpo Pro সক্রিয় রয়েছে' : 'Lipishilpo Pro is Active') : (lang === 'bn' ? 'Lipishilpo (ফ্রি সংস্করণ) সক্রিয়' : 'Lipishilpo (Free Core) is Active')}</h3>
              <p>
                {isPro
                  ? (lang === 'bn' ? 'OpenAI GPT-4o এডিটিং, পুরো বইয়ের ধারাবাহিকতা এবং DOCX, PDF ও EPUB পাবলিকেশন ইঞ্জিন আনলক করা হয়েছে।' : 'OpenAI AI editorial analysis, whole-book continuity checking, and publication formats unlocked.')
                  : (lang === 'bn' ? 'বাংলা একাডেমির প্রমিত ব্যাকরণ পরীক্ষণ, পান্ডুলিপি সংগঠন ও অফলাইন স্টুডিও আজীবন ফ্রি।' : 'Standard Bangla Academy proofreading and chapter studio are permanently free.')}
              </p>
            </div>
          </div>

          {!isPro && (
            <div className="pro-upgrade-box">
              <h4>{lang === 'bn' ? '✨ লিপিশিল্প Pro-তে যা যা রয়েছে:' : '✨ What unlocks with Lipishilpo Pro:'}</h4>
              <ul className="pro-checklist">
                <li>🤖 {lang === 'bn' ? 'OpenAI GPT-4o সাহিত্যিক সম্পাদনা ও শৈলীগত পরামর্শ' : 'OpenAI GPT-4o literary phrasing polish & tone editing'}</li>
                <li>🛡️ {lang === 'bn' ? 'সমগ্র পান্ডুলিপির চরিত্র, বয়স ও সম্পর্কের ধারাবাহিকতা' : 'Whole-book character, age, and relationship continuity tracking'}</li>
                <li>🔊 {lang === 'bn' ? 'শুনে শুনে প্রুফরিডিং (Web Speech API এবং আধুনিক TTS)' : 'Audio Proofreading (Text-to-Speech synthesis with sentence focus)'}</li>
                <li>📚 {lang === 'bn' ? 'মুদ্রণযোগ্য DOCX, বাংলা ফন্টসহ PDF এবং EPUB ই-বুক এক্সপোর্ট' : 'Print-ready DOCX, PDF with embedded Bengali fonts, and EPUB eBooks'}</li>
              </ul>
            </div>
          )}
        </div>

        {/* Card 2: Shortcode & Embed */}
        <div className="settings-card">
          <h2>
            <span>📌</span> {lang === 'bn' ? 'ওয়ার্ডপ্রেস ফ্রন্টএন্ড শর্টকোড' : 'WordPress Frontend Shortcode'}
          </h2>
          <p>
            {lang === 'bn'
              ? 'আপনার সাইটের যেকোনো পোস্ট বা পেজে নিচের শর্টকোডটি বসিয়ে সম্পূর্ণ পান্ডুলিপি স্টুডিও প্রদর্শন করতে পারেন:'
              : 'Embed the full interactive manuscript studio on any page or post using this shortcode:'}
          </p>

          <div className="shortcode-copy-box">
            <code>[lipishilpo]</code>
            <button className="copy-btn" onClick={handleCopyShortcode}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কপি শর্টকোড' : 'Copy')}
            </button>
          </div>

          <div className="shortcode-hint">
            <strong>{lang === 'bn' ? 'টিপস:' : 'Tip:'}</strong> {lang === 'bn' ? 'শর্টকোডযুক্ত পেজটিকে একটি পূর্ণাঙ্গ ফুল-উইডথ (Full-width / Blank Template) টেমপ্লেটে রাখলে ব্যবহারকারীরা সুন্দর অভিজ্ঞতা পাবেন।' : 'Use a Full-Width page template for the most immersive experience.'}
          </div>
        </div>

        {/* Card 3: Language & Localization */}
        <div className="settings-card">
          <h2>
            <span>🌐</span> {lang === 'bn' ? 'ভাষা ও স্থানীয়করণ' : 'Language & Interface'}
          </h2>
          <p>
            {lang === 'bn'
              ? 'স্টুডিও এবং মেনু ইন্টারফেসের প্রাথমিক ভাষা নির্বাচন করুন:'
              : 'Choose your preferred primary interface language:'}
          </p>

          <div className="lang-toggle-setting">
            <span className="lang-label">
              <Globe size={16} /> {lang === 'bn' ? 'বর্তমান ভাষা:' : 'Current Language:'} <strong>{lang === 'bn' ? 'বাংলা (Bangla)' : 'English'}</strong>
            </span>
            <button className="secondary" onClick={onToggleLang}>
              {lang === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            </button>
          </div>
        </div>

        {/* Card 4: Personal Ignored Words */}
        <div className="settings-card">
          <div className="card-header-flex">
            <h2>
              <span>📚</span> {lang === 'bn' ? 'ব্যক্তিগত ডিকশনারি (অনুমোদিত শব্দ)' : 'Personal Ignored Words'}
            </h2>
            {dict.length > 0 && (
              <button className="danger-text-btn" onClick={handleClearDict}>
                <Trash2 size={13} /> {lang === 'bn' ? 'সব মুছুন' : 'Clear All'}
              </button>
            )}
          </div>
          <p>
            {lang === 'bn'
              ? 'প্রুফরিডিং চলাকালীন যেসব আঞ্চলিক বা বিশেষ শব্দ আপনি "Ignore" বা ডিকশনারিতে যুক্ত করেছেন:'
              : 'Words you have added to your personal ignore list during proofreading sessions:'}
          </p>

          {dict.length === 0 ? (
            <div className="empty-dict-note">
              {lang === 'bn' ? 'এখনও কোনো শব্দ যুক্ত করা হয়নি। এডিটরে প্রুফরিডিংয়ের সময় নতুন শব্দ যুক্ত করতে পারবেন।' : 'No words added yet. You can add unique words to ignore while proofreading.'}
            </div>
          ) : (
            <div className="dict-chip-list">
              {dict.map((word) => (
                <span key={word} className="dict-chip">
                  {word}
                  <button type="button" onClick={() => handleRemoveWord(word)} title="Remove">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
