import React, { useState } from 'react';
import {
  BookOpen, Sparkles, Wand2, ShieldAlert, FileDown,
  HelpCircle, ChevronDown, ChevronRight, Check, Copy, Sliders, Compass,
  Layers, SpellCheck, FileOutput, Users, Clock, PencilLine, Volume2,
  Feather, MessageSquareQuote, Quote, Box, Bookmark, Type, Divide, Keyboard,
  History, FileUp, Replace, RotateCcw, CheckCheck
} from 'lucide-react';
import { type Language } from '../i18n';
import { findIssues, type ProofMatch } from '../proofread';

interface DocsViewProps {
  lang: Language;
  onOpenEditor: () => void;
  onOpenSettings?: () => void;
  onStartTour?: () => void;
}

type DocsTab = 'intro' | 'formatting' | 'snapshots' | 'importexport' | 'proofread' | 'continuity' | 'ai' | 'faq';

export const DocsView: React.FC<DocsViewProps> = ({ lang, onOpenEditor, onOpenSettings, onStartTour }) => {
  const [activeTab, setActiveTab] = useState<DocsTab>('intro');
  const [playgroundText, setPlaygroundText] = useState<string>(
    'আমি গতকালকে বাজারে গিয়েছিলাম। সরকারী সিদ্ধান্তে ধারনা ভুল ছিল। তিনি অনেকক্ষণ যাবত অপেক্ষা করিতেছিল এবং চলে গেছে।'
  );
  const [testResults, setTestResults] = useState<string[] | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);
  const [copiedSyntax, setCopiedSyntax] = useState<string | null>(null);

  function copyCode(code: string, id: string) {
    void navigator.clipboard.writeText(code);
    setCopiedSyntax(id);
    setTimeout(() => setCopiedSyntax(null), 2000);
  }

  async function runTest() {
    const issues = await findIssues(playgroundText, 'bn', lang, []);
    const msgs = issues.map((iss: ProofMatch) => {
      const fromDisplay = iss.from === '__spaces' ? (lang === 'bn' ? 'অতিরিক্ত স্পেস' : 'Extra space') : iss.from;
      return `${fromDisplay} ➔ ${iss.to} (${iss.why})`;
    });
    setTestResults(msgs);
  }

  function copyShortcode() {
    navigator.clipboard.writeText('[lipishilpo]');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabs: Array<{ id: DocsTab; label: string; icon: React.ReactNode; pro?: boolean }> = [
    { id: 'intro', label: lang === 'bn' ? 'পরিচিতি' : 'Overview', icon: <BookOpen size={15} /> },
    { id: 'formatting', label: lang === 'bn' ? 'ফরম্যাটিং ও স্ল্যাশ' : 'Formatting & Slash', icon: <PencilLine size={15} /> },
    { id: 'snapshots', label: lang === 'bn' ? 'ভার্সন হিস্ট্রি' : 'Version History', icon: <History size={15} /> },
    { id: 'importexport', label: lang === 'bn' ? 'ইমপোর্ট ও এক্সপোর্ট' : 'Import & Export', icon: <FileUp size={15} /> },
    { id: 'proofread', label: lang === 'bn' ? 'প্রুফরিড ও অ্যানালিটিক্স' : 'Proofread & Analytics', icon: <Sparkles size={15} /> },
    { id: 'continuity', label: lang === 'bn' ? 'কোডেক্স ও ওয়ার্কফ্লো' : 'Codex & Workflow', icon: <ShieldAlert size={15} /> },
    { id: 'ai', label: lang === 'bn' ? 'এআই সহায়ক' : 'AI Editorial', icon: <Wand2 size={15} />, pro: true },
    { id: 'faq', label: lang === 'bn' ? 'প্রশ্নোত্তর' : 'FAQ', icon: <HelpCircle size={15} /> },
  ];

  const faqs = [
    {
      q: lang === 'bn' ? 'লিপিশিল্প কী এবং এটি কাদের জন্য?' : 'What is Lipishilpo and who is it for?',
      a: lang === 'bn'
        ? 'লিপিশিল্প হলো বাংলা ও বহুভাষিক উপন্যাসিক, গল্পকার, কবি, গবেষক, সাংবাদিক এবং প্রকাশকদের জন্য একটি পূর্ণাঙ্গ পাণ্ডুলিপি রচনা ও সম্পাদনা স্টুডিও। এতে ব্যাকরণগত শুদ্ধতা, প্রমিত বানান, স্ল্যাশ কমান্ড, চরিত্র কোডেক্স, ভার্সন কন্ট্রোল এবং বিশদ সাহিত্যিক অ্যানালিটিক্স পর্যবেক্ষণ করা যায়।'
        : 'Lipishilpo is a distraction-free manuscript studio for novelists, authors, poets, journalists, and publishers writing in Bengali and multilingual scripts. It includes grammar linting, slash commands, character codex, version history, and literary analytics.'
    },
    {
      q: lang === 'bn' ? 'কী কী ফরম্যাটে পাণ্ডুলিপি ইমপোর্ট করা যায়?' : 'Which formats can I import my manuscript from?',
      a: lang === 'bn'
        ? 'লিপিশিল্পে Microsoft Word (.docx), Markdown (.md), Plain Text (.txt) এবং লিপিশিল্প ব্যাকআপ (.json) ফাইল সরাসরি ব্রাউজারে ড্র্যাগ-অ্যান্ড-ড্রপ করে ইমপোর্ট করা যায়। হেডিংস বা বাংলা মার্কার (অধ্যায় ১, পরিচ্ছেদ ২) থাকলে সেগুলো স্বয়ংক্রিয়ভাবে আলাদা অধ্যায়ে বিভক্ত হয়ে যায়।'
        : 'You can import Microsoft Word (.docx), Markdown (.md), Plain Text (.txt), and LipiShilpo Backup (.json) files. Headings or chapter markers (e.g. Chapter 1, অধ্যায় ১) are automatically split into separate chapters with instant breakdown preview.'
    },
    {
      q: lang === 'bn' ? 'ভার্সন হিস্ট্রি ও স্ন্যাপশট কীভাবে কাজ করে?' : 'How does Version History & Snapshots work?',
      a: lang === 'bn'
        ? 'আপনি যেকোনো সময় কাস্টম নাম দিয়ে লেখার স্ন্যাপশট সেভ করতে পারেন। এছাড়াও সব সংশোধন প্রয়োগ (Apply All Fixes), সার্বিক প্রতিস্থাপন (Global Replace) অথবা রোলব্যাকের আগে স্বয়ংক্রিয় সেফটি ব্যাকআপ সংরক্ষিত হয়। ডিফারেন্স ভিউয়ারে (Diff View) পাশাপাশি যোগ ও বিয়োগ দেখে ১-ক্লিকেই যেকোনো পুরনো সংস্করণে ফেরত যাওয়া যায়।'
        : 'You can create named snapshots anytime. Automatic safety snapshots are created before applying bulk fixes, global replacements, or rollbacks. In the diff viewer, compare additions and deletions side-by-side and restore any previous version with 1 click.'
    },
    {
      q: lang === 'bn' ? 'স্ল্যাশ কমান্ড (/) ও চিটশিট (Ctrl+/) কীভাবে ব্যবহার করব?' : 'How do Slash Commands (/) and Cheat Sheet (Ctrl+/) work?',
      a: lang === 'bn'
        ? 'এডিটরের যেকোনো নতুন লাইনে / টাইপ করলেই নোশন-স্টাইলের কমান্ড প্যালেট চালু হবে (যেমন /dialogue, /poem, /box, /h2)। এছাড়াও কীবোর্ডে Ctrl + / চাপলে সম্পূর্ণ ফরম্যাটিং চিটশিট পপআপ হবে এবং ১-ক্লিকেই এডিটরে সিনট্যাক্স যুক্ত করতে পারবেন।'
        : 'Type / on any new line to open Notion-style slash commands (/dialogue, /poem, /box, /h2). Press Ctrl + / anywhere in the editor to open the interactive formatting cheat sheet and insert literary syntaxes with 1 click.'
    },
    {
      q: lang === 'bn' ? 'বড় উপন্যাসের (৫০,০০০–২,০০,০০০ শব্দ) পারফরম্যান্স কেমন?' : 'How does it perform with large manuscripts (50k–200k words)?',
      a: lang === 'bn'
        ? 'লিপিশিল্পে মেমরি-সেফ লেজি রেন্ডারিং এবং ১২০০ms ডিবাউন্সড অটোসেভ ব্যবহৃত হয়েছে। টাইপিং চলাকালীন অফলাইন লোকালস্টোরেজ ক্যাশিং নিশ্চিত থাকায় নেটওয়ার্ক বন্ধ হলেও এক অক্ষরও হারায় না এবং টাইপিং সর্বদা স্থির ৬০fps বজায় থাকে।'
        : 'Lipishilpo uses memory-safe lazy chapter rendering, 1200ms debounced autosave, and local storage offline caching. Even in 100k+ word manuscripts, typing maintains a steady 60fps with zero data loss.'
    },
    {
      q: lang === 'bn' ? 'আমার পাণ্ডুলিপির ডেটা ও গোপনীয়তা কতটা সুরক্ষিত?' : 'How secure is my manuscript data and privacy?',
      a: lang === 'bn'
        ? 'ফ্রি ভার্সনে কোনো লেখা বাইরের কোনো সার্ভার বা এপিআইতে পাঠানো হয় না। সবকিছু শতভাগ আপনার নিজস্ব ওয়ার্ডপ্রেস ডেটাবেস এবং ব্রাউজারে সুরক্ষিত থাকে। প্রতিটি পাণ্ডুলিপি শুধুমাত্র লেখকের নিজস্ব ইউজার একাউন্টেই দৃশ্যমান।'
        : 'In the Free version, zero data is transmitted to external servers or APIs. Everything is stored strictly inside your local WordPress database and browser, accessible only to the authenticated author.'
    },
    {
      q: lang === 'bn' ? 'লিপিশিল্প প্রোতে কী কী অতিরিক্ত সুবিধা আছে?' : 'What additional features are in Lipishilpo Pro?',
      a: lang === 'bn'
        ? 'লিপিশিল্প প্রোতে রয়েছে বুক গেট-আপ স্টুডিও (প্রিভিউ ডেমো, লাইসেন্সে PDF/EPUB/Word এক্সপোর্ট, কভার ছবি, বারকোড), ইউনিভার্সাল AI সম্পাদক (OpenAI, Gemini, Claude, OpenRouter) এবং ব্রাউজার টেক্সট-টু-স্পিচ।'
        : 'Lipishilpo Pro unlocks the Book Get-Up Studio (preview demo, licensed PDF/EPUB/Word export, cover image, barcode), universal AI editorial (OpenAI, Gemini, Claude, OpenRouter), and browser text-to-speech.'
    },
  ];

  return (
    <div className="docs-container">
      {/* ── Hero Header Banner ── */}
      <div className="docs-hero-card">
        <div className="docs-hero-content">
          <span className="docs-hero-badge">
            <Feather size={13} /> {lang === 'bn' ? 'ব্যবহারকারী নির্দেশিকা ও ডকুমেন্টেশন' : 'User Guide & Documentation'}
          </span>
          <h1>{lang === 'bn' ? 'লিপিশিল্পে স্বাগতম: আপনার ডিজিটাল পাণ্ডুলিপি স্টুডিও' : 'Welcome to Lipishilpo: Your Digital Manuscript Studio'}</h1>
          <p>
            {lang === 'bn'
              ? 'বাংলা সাহিত্য ও পেশাদার লেখার জন্য তৈরি একটি অত্যাধুনিক রচনার পরিবেশ। সহজে অধ্যায় সাজান, প্রমিত বানান ও শুদ্ধ ব্যাকরণ নিশ্চিত করুন এবং বই আকারে প্রকাশ করুন।'
              : 'A dedicated writing studio built for Bengali literature and multilingual authors. Organize chapters, verify grammar and style, and publish clean books.'}
          </p>
        </div>
        <div className="docs-hero-actions">
          <button type="button" className="docs-cta-btn" onClick={onOpenEditor}>
            <BookOpen size={16} />
            <span>{lang === 'bn' ? 'পাণ্ডুলিপি স্টুডিও খুলুন' : 'Open Manuscript Studio'}</span>
          </button>
          {onStartTour && (
            <button type="button" className="docs-hero-sec-btn" onClick={onStartTour}>
              <Compass size={15} />
              <span>{lang === 'bn' ? 'স্টুডিও ট্যুর' : 'Studio Tour'}</span>
            </button>
          )}
          {onOpenSettings && (
            <button type="button" className="docs-hero-sec-btn" onClick={onOpenSettings}>
              <Sliders size={15} />
              <span>{lang === 'bn' ? 'সেটিংস' : 'Settings'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="docs-main-card">
        {/* Navigation Tabs */}
        <div className="docs-tabs-nav" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`doc-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.pro && <span className="doc-pro-badge">Pro</span>}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'intro' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'লিপিশিল্প পরিচিতি ও স্টুডিও ফিচার' : 'Welcome to Lipishilpo Manuscript Studio'}</h2>
            <p>
              {lang === 'bn'
                ? 'লিপিশিল্প হলো ওয়ার্ডপ্রেসের ওপর নির্মিত একটি আধুনিক ও আন্তর্জাতিক মানের রাইটিং ও এডিটিং স্টুডিও। এটি লেখক ও প্রকাশকদের জন্য বিভ্রান্তিমুক্ত (distraction-free) লেখার পরিবেশ তৈরি করে।'
                : 'Lipishilpo is an international-standard writing and editorial studio built for WordPress. It offers a clean, distraction-free environment for novelists, editors, and publishers.'}
            </p>

            <div className="feature-steps-grid three">
              <div className="feature-step-card">
                <div className="step-icon"><PencilLine size={20} /></div>
                <h3>{lang === 'bn' ? '১. জেন ও টাইপরাইটার ফোকাস' : '1. Zen Focus & Typewriter'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'টাইপরাইটার স্ক্রোলিং সর্বদা কার্সারকে চোখের সোজাসুজি সেন্টারে রাখে। লাইট, সেপিয়া, পার্চমেন্ট, স্লেট ডার্ক ও ওলেড ব্ল্যাক ৫টি প্রিমিয়াম পেপার থিম।'
                    : 'Typewriter mode keeps the active line centered vertically. 5 premium paper ambience themes prevent eye strain during long drafting sessions.'}
                </p>
              </div>

              <div className="feature-step-card">
                <div className="step-icon"><History size={20} /></div>
                <h3>{lang === 'bn' ? '২. ভার্সন কন্ট্রোল ও রোলব্যাক' : '2. Version History & Rollback'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'প্রতিটি অধ্যায়ের আনলিমিটেড স্ন্যাপশট সংরক্ষণ। যেকোনো বড় পরিবর্তনের আগে স্বয়ংক্রিয় সেফটি ব্যাকআপ এবং ভিজুয়াল ডিফারেন্স দেখে ১-ক্লিক রোলব্যাক।'
                    : 'Unlimited chapter snapshots with auto-safety backups before major edits. Compare side-by-side diffs and restore any version with 1 click.'}
                </p>
              </div>

              <div className="feature-step-card">
                <div className="step-icon"><FileUp size={20} /></div>
                <h3>{lang === 'bn' ? '৩. মাল্টি-ফরম্যাট ইমপোর্ট' : '3. Multi-Format Import'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'Word (.docx), Markdown (.md), Plain Text (.txt) ও JSON ব্যাকআপ ড্র্যাগ-অ্যান্ড-ড্রপ করে সরাসরি অধ্যায়ভিত্তিক পাণ্ডুলিপিতে রূপান্তর।'
                    : 'Drag & drop Word (.docx), Markdown (.md), Plain Text (.txt), or JSON backups with smart heading/chapter split and instant preview.'}
                </p>
              </div>
            </div>

            {/* Shortcode Embed Callout */}
            <div className="doc-callout info" style={{ marginTop: '24px' }}>
              <div>
                <strong>{lang === 'bn' ? 'ফ্রন্টএন্ড শর্টকোড ব্যবহার' : 'Frontend Shortcode Integration'}</strong>
                <p>
                  {lang === 'bn'
                    ? 'যেকোনো পাসওয়ার্ড প্রোটেক্টেড পেজ বা মেম্বার পোর্টালে সম্পূর্ণ স্টুডিও এডিটর লোড করতে নিচের শর্টকোডটি বসিয়ে দিন:'
                    : 'Embed the complete studio on any password-protected or member page using this shortcode:'}
                </p>
              </div>
              <div className="shortcode-box">
                <code>[lipishilpo]</code>
                <button type="button" className="copy-btn" onClick={copyShortcode}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Formatting & Slash Commands */}
        {activeTab === 'formatting' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'টেক্সট ফরম্যাটিং, স্ল্যাশ কমান্ড ও সাহিত্যিক সিনট্যাক্স' : 'Text Formatting & Slash Commands Guide'}</h2>
            <p>
              {lang === 'bn'
                ? 'লিপিশিল্পে মাউস ছাড়া দ্রুত লেখার জন্য রয়েছে নোশন-স্টাইল স্ল্যাশ কমান্ড (/) এবং সাহিত্যিক সিনট্যাক্স।'
                : 'Format your manuscript at the speed of thought with Notion-style slash commands (/) and literary fiction blocks.'}
            </p>

            <div className="formatting-grid">
              {/* Slash Command */}
              <div className="fmt-guide-card">
                <div className="fmt-card-head">
                  <div className="fmt-icon-box"><Keyboard size={16} /></div>
                  <h4>{lang === 'bn' ? 'স্ল্যাশ কমান্ড প্যালেট (/)' : 'Slash Commands Palette (/)'}</h4>
                </div>
                <p>
                  {lang === 'bn'
                    ? 'এডিটরের যেকোনো নতুন লাইনে / লিখলেই কমান্ড তালিকা ওপেন হবে। কি-বোর্ডের অ্যারো দিয়ে বেছে এন্টার চাপুন।'
                    : 'Type / on any new line to open the instant command palette (/dialogue, /poem, /box, /h2).'}
                </p>
                <div className="fmt-code-box">
                  <code>/dialogue, /poem, /box, /h2, /divider, /quote</code>
                </div>
              </div>

              {/* Bengali Dialogue */}
              <div className="fmt-guide-card">
                <div className="fmt-card-head">
                  <div className="fmt-icon-box"><MessageSquareQuote size={16} /></div>
                  <h4>{lang === 'bn' ? 'প্রমিত বাংলা সংলাপ (Dialogue)' : 'Bangla Dialogue Standard'}</h4>
                </div>
                <p>
                  {lang === 'bn'
                    ? 'বাংলা সাহিত্যের প্রমিত রীতি অনুযায়ী এম-ড্যাশ এবং বাঁকা কোটেশন চিহ্নে সংলাপ সাজান।'
                    : 'Standard literary dialogue with em-dash and smart curly quotes.'}
                </p>
                <div className="fmt-code-box">
                  <code>— “তুমি কি আজ আসবে?”</code>
                  <button type="button" className="copy-syntax-btn" onClick={() => copyCode('— “তুমি কি আজ আসবে?”', 'dlg')}>
                    {copiedSyntax === 'dlg' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Poem Stanza */}
              <div className="fmt-guide-card">
                <div className="fmt-card-head">
                  <div className="fmt-icon-box"><Feather size={16} /></div>
                  <h4>{lang === 'bn' ? 'কবিতা ও স্তবক (Poem Block)' : 'Poem & Verse Stanza'}</h4>
                </div>
                <p>
                  {lang === 'bn'
                    ? 'উপন্যাস বা কাব্যের ভেতরে ছন্দবদ্ধ স্তবক সুন্দর ইন্ডেন্টেশনে প্রদর্শন করার জন্য :::poem ব্যবহার করুন।'
                    : 'Center-aligned indented poem stanzas inside manuscripts.'}
                </p>
                <div className="fmt-code-box">
                  <code>{`:::poem\nমেঘ বলেছে যাব যাব,\nরাত বলেছে যাই।\n:::`}</code>
                  <button type="button" className="copy-syntax-btn" onClick={() => copyCode(':::poem\nমেঘ বলেছে যাব যাব,\nরাত বলেছে যাই।\n:::', 'poem')}>
                    {copiedSyntax === 'poem' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Callout Box */}
              <div className="fmt-guide-card">
                <div className="fmt-card-head">
                  <div className="fmt-icon-box"><Box size={16} /></div>
                  <h4>{lang === 'bn' ? 'তথ্য ও ইসলামিক বক্স (Callout Box)' : 'Callout & Reference Box'}</h4>
                </div>
                <p>
                  {lang === 'bn'
                    ? 'ঐতিহাসিক রেফারেন্স, কুরআনের আয়াত বা বিশেষ সূত্রের জন্য বক্স সিনট্যাক্স ব্যবহার করুন।'
                    : 'Highlighted callout boxes for Islamic references, historical citations, or notes.'}
                </p>
                <div className="fmt-code-box">
                  <code>{`:::box[ইসলামের আলোকে]\nকুরআনের আয়াত বা হাদিস এখানে লিখুন\n:::`}</code>
                  <button type="button" className="copy-syntax-btn" onClick={() => copyCode(':::box[ইসলামের আলোকে]\nকুরআনের আয়াত বা হাদিস এখানে লিখুন\n:::', 'box')}>
                    {copiedSyntax === 'box' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Multi-color Highlighter */}
              <div className="fmt-guide-card">
                <div className="fmt-card-head">
                  <div className="fmt-icon-box"><Sparkles size={16} /></div>
                  <h4>{lang === 'bn' ? 'রঙিন মার্কার হাইলাইট' : 'Multi-Color Semantic Highlighter'}</h4>
                </div>
                <p>
                  {lang === 'bn'
                    ? 'প্লট, চরিত্রের তথ্য বা পরিমার্জনের জন্য ৪টি ভিন্ন রঙের মার্কার ব্যবহার করুন:'
                    : 'Highlight passages with 4 semantic color codes:'}
                </p>
                <div className="fmt-marker-pills">
                  <span className="marker-pill hl-yellow">{lang === 'bn' ? 'হলুদ: মূল প্লট' : 'Yellow: Plot'}</span>
                  <span className="marker-pill hl-green">{lang === 'bn' ? 'সবুজ: তথ্যসূত্র' : 'Green: Fact'}</span>
                  <span className="marker-pill hl-purple">{lang === 'bn' ? 'বেগুনি: চরিত্র' : 'Purple: Character'}</span>
                  <span className="marker-pill hl-pink">{lang === 'bn' ? 'গোলাপি: সংশোধন' : 'Pink: Revise'}</span>
                </div>
                <div className="fmt-code-box">
                  <code>==গুরুত্বপূর্ণ লাইন==</code>
                </div>
              </div>

              {/* Footnotes */}
              <div className="fmt-guide-card">
                <div className="fmt-card-head">
                  <div className="fmt-icon-box"><Bookmark size={16} /></div>
                  <h4>{lang === 'bn' ? 'পাদটীকা ও তথ্যসূত্র (Footnotes)' : 'Footnotes & Citations'}</h4>
                </div>
                <p>
                  {lang === 'bn'
                    ? 'গবেষণা বা উপন্যাসের ব্যাখ্যার জন্য বাংলা সংখ্যাযুক্ত পাদটীকা ব্যবহার করুন।'
                    : 'Scholarly footnotes and references with Bengali numeral support.'}
                </p>
                <div className="fmt-code-box">
                  <code>শব্দ[^১] ... [^১]: বিস্তারিত ব্যাখ্যা বা তথ্যসূত্র</code>
                </div>
              </div>
            </div>

            {/* In-Editor Cheat Sheet reminder */}
            <div className="doc-callout info" style={{ marginTop: '24px' }}>
              <div>
                <strong>{lang === 'bn' ? 'ইন্টারেক্টিভ চিটশিট পপআপ (Ctrl + /)' : 'Interactive Cheat Sheet (Ctrl + /)'}</strong>
                <p>
                  {lang === 'bn'
                    ? 'এডিটরে থাকাকালে যেকোনো মুহূর্তে Ctrl + / চাপলে সম্পূর্ণ ফরম্যাটিং গাইড পপআপ হবে এবং সরাসরি এডিটরে সিনট্যাক্স যুক্ত করতে পারবেন।'
                    : 'Press Ctrl + / anywhere in the editor to open the floating cheat sheet and insert any literary block with 1 click.'}
                </p>
              </div>
              <div className="shortcode-box">
                <code>Ctrl + /</code>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Version History & Snapshots */}
        {activeTab === 'snapshots' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'ভার্সন হিস্ট্রি, স্ন্যাপশট ও রোলব্যাক' : 'Version History & Snapshot Management'}</h2>
            <p>
              {lang === 'bn'
                ? 'লিপিশিল্প আপনার প্রতি মুহূর্তের লেখাকে সুরক্ষিত রাখে। যেকোনো পরিবর্তন নির্ভয়ে করতে পারবেন কারণ যেকোনো মুহূর্তে পূর্বের অবস্থায় ফিরে যাওয়া সম্ভব।'
                : 'Never lose a single word or good paragraph. Track changes, create safety backups, and rollback effortlessly.'}
            </p>

            <div className="feature-steps-grid three">
              <div className="feature-step-card">
                <div className="step-icon"><History size={20} /></div>
                <h3>{lang === 'bn' ? '১. কাস্টম স্ন্যাপশট সংরক্ষণ' : '1. Named Snapshots'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'সাইডবারের «স্ন্যাপশট» ট্যাবে নাম লিখে (যেমন: "প্রথম খসড়া", "ক্লাইম্যাক্স পুনর্লিখন") সংরক্ষণ করে রাখুন।'
                    : 'Save custom-named snapshots (e.g. "Draft 1.0", "Pre-climax rewrite") for each chapter.'}
                </p>
              </div>

              <div className="feature-step-card">
                <div className="step-icon"><Sparkles size={20} /></div>
                <h3>{lang === 'bn' ? '২. স্বয়ংক্রিয় সেফটি ব্যাকআপ' : '2. Automatic Safety Snapshots'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'সব প্রুফরিড ফিক্স প্রয়োগ, সার্বিক প্রতিস্থাপন (Ctrl+Shift+F) বা রোলব্যাক করার ঠিক আগে স্বয়ংক্রিয় সেফটি স্ন্যাপশট তৈরি হয়।'
                    : 'Safety snapshots are auto-created before running Apply All Fixes, Global Replace, or version rollbacks.'}
                </p>
              </div>

              <div className="feature-step-card">
                <div className="step-icon"><RotateCcw size={20} /></div>
                <h3>{lang === 'bn' ? '৩. ভিজুয়াল ডিফারেন্স ও রোলব্যাক' : '3. Visual Diff & 1-Click Rollback'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'বর্তমান লেখার সাথে যেকোনো পুরনো সংস্করণের শব্দভিত্তিক যোগ (সবুজ) ও বিয়োগ (লাল) পাশাপাশি তুলনা করে ১-ক্লিকেই ফিরে যান।'
                    : 'Compare additions (green) and deletions (red) side-by-side and restore any previous state with 1 click.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Import & Export */}
        {activeTab === 'importexport' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'মাল্টি-ফরম্যাট ইমপোর্ট ও এক্সপোর্ট' : 'Manuscript Import & Export Suite'}</h2>
            <p>
              {lang === 'bn'
                ? 'আপনার পুরোনো বা অন্য অ্যাপে লেখা পাণ্ডুলিপি লিপিশিল্পে সহজেই নিয়ে আসুন এবং যেকোনো স্ট্যান্ডার্ড ফরম্যাটে এক্সপোর্ট করুন।'
                : 'Bring existing manuscripts from Word, Markdown, or plain text into Lipishilpo and export to your desired formats.'}
            </p>

            <div className="feature-steps-grid two">
              <div className="feature-step-card">
                <div className="step-icon"><FileUp size={20} /></div>
                <h3>{lang === 'bn' ? 'পাণ্ডুলিপি ইমপোর্ট (Word, MD, TXT, JSON)' : 'Import Manuscript'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'পাণ্ডুলিপি ড্যাশবোর্ডে «পাণ্ডুলিপি ইমপোর্ট» বাটনে ক্লিক করে ফাইল দিন। স্বয়ংক্রিয়ভাবে অধ্যায়গুলো আলাদা হয়ে যাবে এবং নতুন বই তৈরি অথবা চলমান বইতে যোগ করতে পারবেন।'
                    : 'Upload .docx, .md, .txt, or .json files with smart chapter splitting. Choose to create a new book or append to your active manuscript.'}
                </p>
              </div>

              <div className="feature-step-card">
                <div className="step-icon"><FileDown size={20} /></div>
                <h3>{lang === 'bn' ? 'ইউনিভার্সাল এক্সপোর্ট' : 'Universal Export Options'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'Markdown (.md), Plain Text (.txt), Clean HTML এবং JSON ব্যাকআপে ১-ক্লিকে ডাউনলোড করুন। Word (.docx) ইমপোর্ট ফ্রি; লেআউটসহ DOCX/PDF/EPUB প্রোতে।'
                    : 'Export Markdown, Text, HTML, or a full LipiShilpo JSON backup. Word (.docx) import is free; layout DOCX, PDF, and EPUB are in Pro.'}
                </p>
              </div>
            </div>

            <div className="export-comparison-table" style={{ marginTop: '20px' }}>
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>{lang === 'bn' ? 'ফরম্যাট' : 'Format'}</th>
                    <th>{lang === 'bn' ? 'স্তর' : 'Tier'}</th>
                    <th>{lang === 'bn' ? 'ব্যবহার ক্ষেত্র' : 'Best For'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>HTML / TXT / Markdown</strong></td>
                    <td><span className="badge free">Free</span></td>
                    <td>{lang === 'bn' ? 'ওয়েব, রিডার ও সাধারণ ব্যাকআপ' : 'Web, readers, and plain backup'}</td>
                  </tr>
                  <tr>
                    <td><strong>JSON Backup</strong></td>
                    <td><span className="badge free">Free</span></td>
                    <td>{lang === 'bn' ? 'পুরো পাণ্ডুলিপি রিস্টোর' : 'Full project restore'}</td>
                  </tr>
                  <tr>
                    <td><strong>Word (.docx) ইমপোর্ট</strong></td>
                    <td><span className="badge free">Free</span></td>
                    <td>{lang === 'bn' ? 'Word থেকে অধ্যায় নিয়ে আসা' : 'Bring chapters in from Word'}</td>
                  </tr>
                  <tr>
                    <td><strong>Word (.docx) এক্সপোর্ট</strong></td>
                    <td><span className="badge pro">Pro</span></td>
                    <td>{lang === 'bn' ? 'লেআউটসহ সম্পাদক/প্রকাশকের কাছে জমা' : 'Layout-aware editorial submission'}</td>
                  </tr>
                  <tr>
                    <td><strong>Print PDF / EPUB</strong></td>
                    <td><span className="badge pro">Pro</span></td>
                    <td>{lang === 'bn' ? 'বুক লেআউট, হেডার ও প্রিন্ট/ই-বুক' : 'Print-ready layout and e-books'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Proofread & Analytics */}
        {activeTab === 'proofread' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'বাংলা ব্যাকরণ, প্রুফরিড ও সাহিত্যিক অ্যানালিটিক্স' : 'Bangla Grammar, Proofread & Literary Analytics'}</h2>
            <p>
              {lang === 'bn'
                ? 'লিপিশিল্পের অফলাইন প্রুফরিডার বাংলা একাডেমির প্রমিত বানানরীতি অনুসরণ করে রিয়েল-টাইমে ভুল সংশোধন করে।'
                : 'Rule-based offline Bengali grammar linter and deep narrative analytics running directly in your browser.'}
            </p>

            <div className="rules-showcase-grid">
              <div className="rule-badge-card">
                <span className="rule-dot red" />
                <h4>{lang === 'bn' ? 'বাহুল্য দোষ' : 'Redundancy'}</h4>
                <p>{lang === 'bn' ? '«সকল শিক্ষকগণ» → শিক্ষকগণ, «গতকালকে» → গতকাল, «শুধুমাত্র» → শুধু।' : 'Tautology & double plurals like “শুধুমাত্র” → “শুধু”.'}</p>
              </div>
              <div className="rule-badge-card">
                <span className="rule-dot gold" />
                <h4>{lang === 'bn' ? 'সাধু-চলিত মিশ্রণ' : 'Sadhu–Cholit mix'}</h4>
                <p>{lang === 'bn' ? 'একই অনুচ্ছেদে সাধু ক্রিয়া (করিলেন) ও চলিত রূপ মিলিয়ে গেলে সতর্ক করে।' : 'Flags classical and contemporary verb forms mixed together.'}</p>
              </div>
              <div className="rule-badge-card">
                <span className="rule-dot green" />
                <h4>{lang === 'bn' ? 'প্রমিত বানান' : 'Standard spelling'}</h4>
                <p>{lang === 'bn' ? '«বেশী» → বেশি, «শ্রেণী» → শ্রেণি, «পাখী» → পাখি।' : 'Bangla Academy standard spellings.'}</p>
              </div>
              <div className="rule-badge-card">
                <span className="rule-dot blue" />
                <h4>{lang === 'bn' ? 'যতিচিহ্ন ও স্পেস' : 'Punctuation & Spaces'}</h4>
                <p>{lang === 'bn' ? 'দাঁড়ি ও কমার আগে অবাঞ্ছিত স্পেস অপসারণ এবং ফাঁকা ঠিক করে।' : 'Cleans up stray spaces before dari (।) and punctuation.'}</p>
              </div>
            </div>

            {/* Interactive Playground */}
            <div className="playground-card" style={{ marginTop: '24px' }}>
              <h3>{lang === 'bn' ? 'ইন্টারেক্টিভ প্রুফরিডার টেস্ট ল্যাব' : 'Interactive Proofreader Test Lab'}</h3>
              <p>{lang === 'bn' ? 'নিচের বক্সে যেকোনো বাংলা বাক্য লিখে পরীক্ষা করে দেখুন:' : 'Test the offline proofreader directly below:'}</p>
              <textarea
                value={playgroundText}
                onChange={(e) => setPlaygroundText(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
              />
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-primary" onClick={runTest}>
                  <Sparkles size={14} />
                  <span>{lang === 'bn' ? 'পরীক্ষা করুন' : 'Run Test'}</span>
                </button>
              </div>
              {testResults && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <strong>{lang === 'bn' ? `পাওয়া গেছে (${testResults.length}টি সংশোধন):` : `Detected (${testResults.length} issues):`}</strong>
                  {testResults.length === 0 ? (
                    <p style={{ color: '#16a34a', margin: '6px 0 0' }}>{lang === 'bn' ? 'কোনো ভুল পাওয়া যায়নি, লেখা নিখুঁত!' : 'No errors found, text is clean!'}</p>
                  ) : (
                    <ul style={{ margin: '6px 0 0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                      {testResults.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Codex & Workflow */}
        {activeTab === 'continuity' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'চরিত্র কোডেক্স ও ৪-ধাপের ওয়ার্কফ্লো' : 'World Codex & Chapter Workflow'}</h2>
            <p>
              {lang === 'bn'
                ? 'দীর্ঘ উপন্যাসে চরিত্রের স্বভাব, বয়স, টাইমলাইন ও অধ্যায়ের অগ্রগতি ট্র্যাক করার সম্পূর্ণ ব্যবস্থা।'
                : 'Track character profiles, world lore, and chapter drafting progress with structured workflows.'}
            </p>

            <div className="feature-steps-grid three">
              <div className="feature-step-card">
                <div className="step-icon"><Users size={20} /></div>
                <h3>{lang === 'bn' ? 'চরিত্র ও বিশ্ব কোডেক্স' : 'Character & World Codex'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'চরিত্রের ভূমিকা, বয়স, ব্যাকস্টোরি ও লোকেশন নোট রাখুন। ১-ক্লিকেই এডিটরে নাম ইনসার্ট করুন।'
                    : 'Manage character cards, roles, traits, and world lore with 1-click name insertion.'}
                </p>
              </div>

              <div className="feature-step-card">
                <div className="step-icon"><Layers size={20} /></div>
                <h3>{lang === 'bn' ? '৪-স্টেজ ওয়ার্কফ্লো ব্যাজ' : '4-Stage Workflow Badges'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'অধ্যায়ভিত্তিক অগ্রগতি ট্র্যাক করুন: খসড়া (Draft), চলমান (In Progress), সংশোধিত (Revised), এবং চূড়ান্ত (Final)।'
                    : 'Track each chapter across Draft, In Progress, Revised, and Final status badges.'}
                </p>
              </div>

              <div className="feature-step-card">
                <div className="step-icon"><Replace size={20} /></div>
                <h3>{lang === 'bn' ? 'সার্বিক সার্চ ও রিপ্লেস (Ctrl+Shift+F)' : 'Global Search & Replace'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'সমগ্র বইয়ের সমস্ত অধ্যায়ে একসাথে যেকোনো নাম বা শব্দ খুঁজে বের করে ১-ক্লিকে প্রতিস্থাপন করুন।'
                    : 'Find and replace character names or keywords across all book chapters simultaneously.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: AI Editorial (Pro) */}
        {activeTab === 'ai' && (
          <div className="doc-pane">
            <h2>
              {lang === 'bn' ? 'এআই সাহিত্যিক সহায়ক' : 'AI Editorial Assistant'}
              <span className="doc-pro-badge">Pro</span>
            </h2>
            <p>
              {lang === 'bn'
                ? 'লিপিশিল্প প্রোতে সেটিংসে সেভ করা AI প্রোভাইডার (OpenAI, Gemini, Claude, OpenRouter বা কাস্টম) দিয়ে সাহিত্যিক পরিমার্জন এবং ব্রাউজার TTS দিয়ে অডিও প্রুফরিডিং পাওয়া যায়।'
                : 'Pro unlocks literary analysis via the AI provider saved in Settings (OpenAI, Gemini, Claude, OpenRouter, or custom), plus browser text-to-speech proofreading.'}
            </p>
            <div className="ai-card-grid">
              <div className="ai-feature-card">
                <div className="step-icon"><PencilLine size={18} /></div>
                <h4>{lang === 'bn' ? 'বাক্য ও শৈলী পরিমার্জন' : 'Phrasing & Style Polish'}</h4>
                <p>{lang === 'bn' ? 'জটিল বাক্যকে সাবলীল করে, লেখকের নিজস্ব শৈলী বজায় রেখে।' : 'Enhances sentence cadence while preserving your unique author voice.'}</p>
              </div>
              <div className="ai-feature-card">
                <div className="step-icon"><Users size={18} /></div>
                <h4>{lang === 'bn' ? 'চরিত্রের ধারাবাহিকতা অডিট' : 'Character Consistency Audit'}</h4>
                <p>{lang === 'bn' ? 'আগের স্বভাবের বিপরীতে হঠাৎ অসঙ্গতি থাকলে ধরিয়ে দেয়।' : 'Flags inconsistencies with character motivation, backstory, or timeline.'}</p>
              </div>
              <div className="ai-feature-card">
                <div className="step-icon"><Volume2 size={18} /></div>
                <h4>{lang === 'bn' ? 'বাংলা অডিও প্রুফরিডিং' : 'Bengali Audio Proofing'}</h4>
                <p>{lang === 'bn' ? 'বাক্য ধরে ধরে ব্রাউজারের Web Speech API দিয়ে পড়ে শোনায় — নিউরাল স্টুডিও ভয়েস নয়।' : 'Reads sentence by sentence with the browser Web Speech API — not a neural studio voice.'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: FAQ */}
        {activeTab === 'faq' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions'}</h2>
            <div className="faq-accordion">
              {faqs.map((faq, idx) => {
                const open = expandedFaq === idx;
                return (
                  <div key={faq.q} className={'faq-item ' + (open ? 'expanded' : '')}>
                    <button
                      type="button"
                      className="faq-question"
                      aria-expanded={open}
                      onClick={() => setExpandedFaq(open ? null : idx)}
                    >
                      <span>{faq.q}</span>
                      {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    {open && <div className="faq-answer">{faq.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
