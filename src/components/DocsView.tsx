import React, { useState } from 'react';
import {
  BookOpen, Sparkles, Wand2, ShieldAlert, FileDown,
  HelpCircle, ChevronDown, ChevronRight, Check, Copy, Sliders, Compass,
  Layers, SpellCheck, FileOutput, Users, Clock, PencilLine, Volume2,
  Feather, MessageSquareQuote, Quote, Box, Bookmark, Type, Divide, Keyboard
} from 'lucide-react';
import { type Language } from '../i18n';
import { findIssues, type ProofMatch } from '../proofread';

interface DocsViewProps {
  lang: Language;
  onOpenEditor: () => void;
  onOpenSettings?: () => void;
  onStartTour?: () => void;
}

type DocsTab = 'intro' | 'formatting' | 'proofread' | 'continuity' | 'ai' | 'export' | 'faq';

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
    { id: 'formatting', label: lang === 'bn' ? 'টেক্সট ফরম্যাটিং' : 'Formatting Guide', icon: <PencilLine size={15} /> },
    { id: 'proofread', label: lang === 'bn' ? 'প্রুফরিড' : 'Proofread', icon: <Sparkles size={15} /> },
    { id: 'continuity', label: lang === 'bn' ? 'ধারাবাহিকতা' : 'Continuity', icon: <ShieldAlert size={15} /> },
    { id: 'ai', label: lang === 'bn' ? 'এআই সহায়ক' : 'AI Editorial', icon: <Wand2 size={15} />, pro: true },
    { id: 'export', label: lang === 'bn' ? 'এক্সপোর্ট' : 'Export', icon: <FileDown size={15} /> },
    { id: 'faq', label: lang === 'bn' ? 'প্রশ্নোত্তর' : 'FAQ', icon: <HelpCircle size={15} /> },
  ];

  const faqs = [
    {
      q: lang === 'bn' ? 'লিপিশিল্প কী এবং এটি কাদের জন্য?' : 'What is Lipishilpo and who is it for?',
      a: lang === 'bn'
        ? 'লিপিশিল্প হলো বাংলা ও বহুভাষিক উপন্যাসিক, গল্পকার, কবি, সাংবাদিক এবং কন্টেন্ট নির্মাতাদের জন্য একটি পূর্ণাঙ্গ পাণ্ডুলিপি রচনা ও সম্পাদনা স্টুডিও। এতে ব্যাকরণগত শুদ্ধতা, বাহুল্য দোষ পরিহার, প্রমিত বানান ও চরিত্র ধারাবাহিকতা পর্যবেক্ষণ করা যায় সহজে।'
        : 'Lipishilpo is a manuscript writing and editorial studio for Bengali and multilingual novelists, storytellers, poets, journalists, and content creators. It provides grammatical proofreading, style linting, and character continuity tracking.'
    },
    {
      q: lang === 'bn' ? 'আমি কি সাইন-আপ ছাড়াই ফ্রি ব্যবহার করতে পারব?' : 'Can I use this for free without signing up?',
      a: lang === 'bn'
        ? 'হ্যাঁ। মূল পাণ্ডুলিপি এডিটর, অধ্যায় ব্যবস্থাপনা, অফলাইন বাংলা ব্যাকরণ পরীক্ষণ এবং HTML/TXT এক্সপোর্ট সম্পূর্ণ ফ্রি। লেখা আপনার ওয়ার্ডপ্রেস ও ব্রাউজারেই থাকে।'
        : 'Yes. The core studio, chapter management, offline Bangla proofreading, and HTML/TXT exports are free. Your writing stays in WordPress and the browser.'
    },
    {
      q: lang === 'bn' ? 'প্রুফরিডিং ইঞ্জিন কীভাবে কাজ করে?' : 'How does the offline proofreading engine work?',
      a: lang === 'bn'
        ? 'লিপিশিল্প বাংলা একাডেমির প্রমিত বানানরীতি, বাহুল্য দোষ, সাধু ও চলিত ভাষার মিশ্রণ, অপ্রয়োজনীয় ইংরেজি স্পেস ও যতিচিহ্নের নিয়মাবলি মেনে রিয়েল-টাইমে লেখা বিশ্লেষণ করে।'
        : 'Lipishilpo analyzes text in real time against Bangla Academy spelling, redundancy, Sadhu–Cholit mixing, and punctuation rules.'
    },
    {
      q: lang === 'bn' ? 'Word বা ডক ফাইল থেকে কীভাবে পাণ্ডুলিপি ইমপোর্ট করব?' : 'How do I import a Word document?',
      a: lang === 'bn'
        ? 'পাণ্ডুলিপি পাতার «ইমপোর্ট» বাটনে ক্লিক করে .docx ফাইল দিন। Heading 1/2 অথবা «অধ্যায় ১» লেখা থাকলে সেগুলো আলাদা অধ্যায় হয়ে যায়। পুরনো .doc ফাইল আগে .docx করে সেভ করুন। JSON ব্যাকআপও একই বাটন দিয়ে ফিরে আনে।'
        : 'On the manuscripts page, click Import and choose a .docx file. Heading 1/2 styles or lines such as “Chapter 1” become separate chapters. Older .doc files must first be saved as .docx. The same button also restores a Lipishilpo JSON backup.'
    },
    {
      q: lang === 'bn' ? 'আমার পাণ্ডুলিপির গোপনীয়তা কতটা সুরক্ষিত?' : 'How secure is my manuscript privacy?',
      a: lang === 'bn'
        ? 'ফ্রি ভার্সনে কোনো লেখা বাইরের সার্ভারে যায় না। সবকিছু আপনার ওয়ার্ডপ্রেস ডেটাবেস ও লোকাল স্টোরেজে থাকে।'
        : 'In the free version, no manuscript text is sent to external servers. Everything stays in your WordPress database and local storage.'
    },
    {
      q: lang === 'bn' ? 'স্টুডিও ট্যুর পরে আবার কীভাবে দেখব?' : 'How do I replay the studio tour later?',
      a: lang === 'bn'
        ? 'হেডারের কম্পাস আইকনে ক্লিক করুন, অথবা সেটিংস ও এই নির্দেশিকা থেকে «ট্যুর আবার দেখুন» চাপুন। আগে একটি পাণ্ডুলিপি খুলতে হবে।'
        : 'Click the compass icon in the header, or use Replay studio tour from Settings or this guide. Open a manuscript first.'
    },
    {
      q: lang === 'bn' ? 'লিপিশিল্প প্রোতে কী কী অতিরিক্ত সুবিধা আছে?' : 'What additional features are in Lipishilpo Pro?',
      a: lang === 'bn'
        ? 'প্রোতে রয়েছে OpenAI GPT-4o সাহিত্যিক সম্পাদনা, পুরো বইয়ের চরিত্র ও বয়স ধারাবাহিকতা, শুনে শুনে প্রুফরিডিং, এবং প্রিন্ট-রেডি DOCX, বাংলা ফন্টসহ PDF ও EPUB।'
        : 'Pro unlocks OpenAI GPT-4o literary polishing, whole-book continuity, audio proofreading, and print-ready DOCX, PDF, and EPUB export.'
    }
  ];

  return (
    <div className="docs-container">
      <div className="docs-hero-card">
        <div className="docs-hero-content">
          <span className="docs-hero-badge">
            <BookOpen size={14} /> {lang === 'bn' ? 'ব্যবহার নির্দেশিকা' : 'User guide'}
          </span>
          <h1>{lang === 'bn' ? 'লিপিশিল্পে স্বাগতম' : 'Welcome to Lipishilpo'}</h1>
          <p>
            {lang === 'bn'
              ? 'বাংলা ও ইংরেজি পাণ্ডুলিপির জন্য একটি নিরিবিলি স্টুডিও। অধ্যায় সাজান, প্রুফ চালান, বই আকারে প্রকাশ করুন।'
              : 'A calm studio for Bengali and English manuscripts. Organize chapters, proofread, and publish a clean book.'}
          </p>
        </div>
        <div className="docs-hero-actions">
          <button className="primary hero-action-btn" onClick={onOpenEditor}>
            <BookOpen size={16} /> {lang === 'bn' ? 'স্টুডিও খুলুন' : 'Open studio'}
          </button>
          {onOpenSettings && (
            <button className="secondary hero-action-btn" onClick={onOpenSettings}>
              <Sliders size={16} /> {lang === 'bn' ? 'সেটিংস' : 'Settings'}
            </button>
          )}
          {onStartTour && (
            <button className="secondary hero-action-btn" onClick={onStartTour}>
              <Compass size={16} /> {lang === 'bn' ? 'ট্যুর দেখুন' : 'Replay tour'}
            </button>
          )}
        </div>
      </div>

      <div className="docs-nav-tabs" role="tablist" aria-label={lang === 'bn' ? 'নির্দেশিকার বিভাগ' : 'Guide sections'}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={'doc-tab-btn ' + (activeTab === tab.id ? 'active' : '')}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.pro && <span className="doc-pro-badge">Pro</span>}
          </button>
        ))}
      </div>

      <div className="docs-content-area" role="tabpanel">
        {activeTab === 'intro' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'লিপিশিল্প কীভাবে কাজ করে' : 'How Lipishilpo works'}</h2>
            <p>
              {lang === 'bn'
                ? 'উপন্যাস, ছোটগল্প, প্রবন্ধ বা বই — লিপিশিল্প বিভ্রান্তিমুক্ত লেখার জায়গা এবং প্রুফ–সম্পাদনার সরঞ্জাম একসাথে দেয়।'
                : 'For novels, stories, essays, or books, Lipishilpo pairs a distraction-free page with proof and chapter tools.'}
            </p>

            <div className="feature-steps-grid">
              <div className="feature-step-card">
                <div className="step-icon"><Layers size={18} /></div>
                <div className="step-num">১</div>
                <h3>{lang === 'bn' ? 'অধ্যায় সংগঠন' : 'Chapters'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'বইকে অধ্যায়ে ভাগ করুন, টেনে সাজান, প্রতিটি অধ্যায়ের শব্দসংখ্যা দেখুন।'
                    : 'Split the book into chapters, drag to reorder, and watch live word counts.'}
                </p>
              </div>
              <div className="feature-step-card">
                <div className="step-icon"><SpellCheck size={18} /></div>
                <div className="step-num">২</div>
                <h3>{lang === 'bn' ? 'স্মার্ট প্রুফরিড' : 'Smart proofread'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'প্রমিত বানান, বাহুল্য দোষ ও ব্যাকরণ হাইলাইট হয়। এক ক্লিকে সংশোধন নিন।'
                    : 'Spelling, redundancy, and grammar highlight as you write. Accept a fix in one click.'}
                </p>
              </div>
              <div className="feature-step-card">
                <div className="step-icon"><FileOutput size={18} /></div>
                <div className="step-num">৩</div>
                <h3>{lang === 'bn' ? 'প্রকাশনা' : 'Publish'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'ফ্রিতে HTML ও টেক্সট। প্রোতে প্রিন্ট-রেডি DOCX, PDF ও EPUB।'
                    : 'HTML and text on Free. Print-ready DOCX, PDF, and EPUB on Pro.'}
                </p>
              </div>
            </div>

            <div className="doc-callout info">
              <div>
                <strong>{lang === 'bn' ? 'ফ্রন্টএন্ডে স্টুডিও' : 'Embed on the site'}</strong>
                <p>
                  {lang === 'bn'
                    ? 'যেকোনো পেজ বা পোস্টে শর্টকোড বসালে স্টুডিও সেখানেই খুলবে।'
                    : 'Place the shortcode on any page or post to open the studio there.'}
                </p>
              </div>
              <div className="shortcode-box">
                <code>[lipishilpo]</code>
                <button type="button" className="copy-btn" onClick={copyShortcode}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'formatting' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'টেক্সট ফরম্যাটিং ও সাহিত্যিক নির্দেশিকা' : 'Text Formatting & Literary Guide'}</h2>
            <p>
              {lang === 'bn'
                ? 'লিপিশিল্পের পাওয়ারফুল সিনট্যাক্স, নোশন-স্টাইল স্ল্যাশ কমান্ড, ডায়লগ, কবিতা, পাদটীকা এবং কালার হাইলাইটিং দিয়ে আপনার পাণ্ডুলিপিকে পেশাদার বইয়ের মতো সাজান।'
                : 'Format your manuscript like a professionally published book using Notion-style slash commands, dialogue dashes, poems, footnotes, and multi-color markers.'}
            </p>

            {/* Quick Slash Commands Showcase */}
            <div className="doc-feature-highlight">
              <div className="highlight-header">
                <span className="pill-badge"><Sparkles size={13} /> {lang === 'bn' ? 'সুপার পাওয়ার ফিচার' : 'Superpower Feature'}</span>
                <h3>{lang === 'bn' ? 'স্ল্যাশ কমান্ড (/) মেনু' : 'Slash Commands (/) Menu'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'এডিটরের যেকোনো লাইনে শুধু "/" টাইপ করলেই ভেসে উঠবে ইনস্ট্যান্ট কমান্ড প্যালেট। মাউস না ছুঁয়েই কীবোর্ডের তীরচিহ্ন (↑ / ↓) ও Enter চেপে ফরম্যাট সিলেক্ট করুন।'
                    : 'Type "/" on any line in the editor to pop up the command palette. Navigate with arrow keys (↑ / ↓) and press Enter to select without touching your mouse.'}
                </p>
              </div>

              <div className="slash-cmd-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>{lang === 'bn' ? 'কমান্ড' : 'Command'}</th>
                      <th>{lang === 'bn' ? 'কাজ ও বর্ণনা' : 'Action & Purpose'}</th>
                      <th>{lang === 'bn' ? 'সিনট্যাক্স / শর্টকাট' : 'Syntax / Shortcut'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>/h2</code></td>
                      <td>{lang === 'bn' ? 'অধ্যায়ের প্রধান উপ-পরিচ্ছেদ শিরোনাম' : 'Major chapter subheading'}</td>
                      <td><code>## শিরোনাম</code></td>
                    </tr>
                    <tr>
                      <td><code>/h3</code></td>
                      <td>{lang === 'bn' ? 'ছোট পরিচ্ছেদ বা অনুচ্ছেদ শিরোনাম' : 'Minor paragraph subsection'}</td>
                      <td><code>### ছোট শিরোনাম</code></td>
                    </tr>
                    <tr>
                      <td><code>/dialogue</code></td>
                      <td>{lang === 'bn' ? 'বাংলা উপন্যাসের প্রমিত সংলাপ (ড্যাশ ও কোট)' : 'Standard Bengali character dialogue'}</td>
                      <td><code>— “উক্তি”</code> <span className="kbd-pill">Ctrl+Shift+D</span></td>
                    </tr>
                    <tr>
                      <td><code>/quote</code></td>
                      <td>{lang === 'bn' ? 'সাহিত্যিক উদ্ধৃতি বা এপিগ্রাফ ব্লক' : 'Literary quote or epigraph block'}</td>
                      <td><code>&gt; উক্তি</code></td>
                    </tr>
                    <tr>
                      <td><code>/poem</code></td>
                      <td>{lang === 'bn' ? 'কবিতার চরণ ও ছন্দবদ্ধ স্তবক' : 'Poem stanzas and indented verse'}</td>
                      <td><code>:::poem ... :::</code></td>
                    </tr>
                    <tr>
                      <td><code>/box</code></td>
                      <td>{lang === 'bn' ? 'তথ্য, ইসলামিক নোট বা হাদিস বক্স' : 'Callout box for notes or Hadith'}</td>
                      <td><code>:::box[শিরোনাম] ... :::</code></td>
                    </tr>
                    <tr>
                      <td><code>/citation</code></td>
                      <td>{lang === 'bn' ? 'বই বা প্রামাণ্য দলিলের তথ্যসূত্র' : 'Source reference attribution'}</td>
                      <td><code>তথ্যসূত্র: বই, পৃষ্ঠা ১২</code></td>
                    </tr>
                    <tr>
                      <td><code>/footnote</code></td>
                      <td>{lang === 'bn' ? 'পাতার নিচে পাদটীকা ও বিস্তারিত ব্যাখ্যা' : 'Footnote reference & bottom note'}</td>
                      <td><code>[^১]</code> এবং <code>[^১]: টীকা...</code></td>
                    </tr>
                    <tr>
                      <td><code>/dropcap</code></td>
                      <td>{lang === 'bn' ? 'অধ্যায়ের শুরুর প্রথম অক্ষর অলঙ্করণ' : 'Decorative drop cap initial'}</td>
                      <td><code>:::dropcap ... :::</code></td>
                    </tr>
                    <tr>
                      <td><code>/divider</code></td>
                      <td>{lang === 'bn' ? 'দৃশ্য বিভাজক মোটিফ (❖ ❖ ❖, ~ ❦ ~, — ✦ —)' : 'Artistic scene break divider'}</td>
                      <td><code>❖ ❖ ❖</code></td>
                    </tr>
                    <tr>
                      <td><code>/list</code>, <code>/number</code></td>
                      <td>{lang === 'bn' ? 'বুলেট ও ক্রমিক তালিকা (১, ২, ৩)' : 'Bullet points & ordered numbered list'}</td>
                      <td><code>* আইটেম</code> বা <code>১. আইটেম</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Literary & Fiction Styling Cards */}
            <h3 style={{ marginTop: '28px', marginBottom: '14px' }}>
              {lang === 'bn' ? 'সাহিত্য ও উপন্যাস রচনার বিশেষ টুলস' : 'Literary & Fiction Writing Tools'}
            </h3>

            <div className="formatting-guide-grid">
              {/* Dialogue card */}
              <div className="fmt-guide-card">
                <div className="fmt-card-head">
                  <div className="fmt-icon-box"><MessageSquareQuote size={16} /></div>
                  <h4>{lang === 'bn' ? 'চরিত্রের সংলাপ (Dialogue)' : 'Character Dialogue'}</h4>
                </div>
                <p>
                  {lang === 'bn'
                    ? 'বাংলা কথাসাহিত্যে সংলাপ লেখার প্রমিত নিয়ম হলো এম-ড্যাশ (—) ও বাঁকা বাংলা উদ্ধৃতি (“ ”)।'
                    : 'The standard for Bengali fiction dialogue is an em-dash followed by curly quotes.'}
                </p>
                <div className="fmt-code-box">
                  <code>— “আপনি কাল কখন আসছেন?” সাজিদ জানতে চাইল।</code>
                  <button
                    type="button"
                    className="copy-syntax-btn"
                    onClick={() => copyCode('— “আপনি কাল কখন আসছেন?” সাজিদ জানতে চাইল।', 'diag')}
                  >
                    {copiedSyntax === 'diag' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Poem card */}
              <div className="fmt-guide-card">
                <div className="fmt-card-head">
                  <div className="fmt-icon-box"><Feather size={16} /></div>
                  <h4>{lang === 'bn' ? 'কবিতা ও স্তবক (Poem Block)' : 'Poem & Verse Block'}</h4>
                </div>
                <p>
                  {lang === 'bn'
                    ? 'উপন্যাসের মাঝে কবিতার লাইন বা স্তবক সুন্দর ছন্দময় মার্জিনে সাজাতে :::poem সিনট্যাক্স ব্যবহার করুন।'
                    : 'Wrap poems or rhyming stanzas in :::poem tags for balanced indentation and rhythm.'}
                </p>
                <div className="fmt-code-box">
                  <code>{`:::poem\nমেঘ বলেছে যাব যাব,\nরাত বলেছে যাই।\n:::`}</code>
                  <button
                    type="button"
                    className="copy-syntax-btn"
                    onClick={() => copyCode(':::poem\nমেঘ বলেছে যাব যাব,\nরাত বলেছে যাই।\n:::', 'poem')}
                  >
                    {copiedSyntax === 'poem' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Callout box */}
              <div className="fmt-guide-card">
                <div className="fmt-card-head">
                  <div className="fmt-icon-box"><Box size={16} /></div>
                  <h4>{lang === 'bn' ? 'তথ্য ও ইসলামিক বক্স (Callout)' : 'Callout & Reference Box'}</h4>
                </div>
                <p>
                  {lang === 'bn'
                    ? 'বিশেষ টিকা, কুরআনের আয়াত, হাদিসের উদ্ধৃতি বা ঐতিহাসিক তথ্যের জন্য বক্স ব্যবহার করুন।'
                    : 'Callout boxes for Islamic citations, historical facts, or special side notes.'}
                </p>
                <div className="fmt-code-box">
                  <code>{`:::box[ইসলামের আলোকে]\nকুরআনের আয়াত বা হাদিস এখানে লিখুন\n:::`}</code>
                  <button
                    type="button"
                    className="copy-syntax-btn"
                    onClick={() => copyCode(':::box[ইসলামের আলোকে]\nকুরআনের আয়াত বা হাদিস এখানে লিখুন\n:::', 'box')}
                  >
                    {copiedSyntax === 'box' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Multi-color Highlighter card */}
              <div className="fmt-guide-card">
                <div className="fmt-card-head">
                  <div className="fmt-icon-box"><Sparkles size={16} /></div>
                  <h4>{lang === 'bn' ? 'রঙিন মার্কার হাইলাইট' : 'Multi-Color Highlighter'}</h4>
                </div>
                <p>
                  {lang === 'bn'
                    ? 'প্লট, চরিত্রের তথ্য বা যাচাইয়ের জন্য ৪টি ভিন্ন রঙের মার্কার ব্যবহার করুন:'
                    : 'Highlight text with 4 semantic marker colors:'}
                </p>
                <div className="fmt-marker-pills">
                  <span className="marker-pill hl-yellow">{lang === 'bn' ? 'হলুদ: মূল কাহিনী' : 'Yellow: Plot'}</span>
                  <span className="marker-pill hl-green">{lang === 'bn' ? 'সবুজ: তথ্যসূত্র' : 'Green: Fact'}</span>
                  <span className="marker-pill hl-purple">{lang === 'bn' ? 'বেগুনি: চরিত্র' : 'Purple: Character'}</span>
                  <span className="marker-pill hl-pink">{lang === 'bn' ? 'গোলাপি: সংশোধন' : 'Pink: Revise'}</span>
                </div>
              </div>
            </div>

            {/* In-Editor Cheat Sheet reminder */}
            <div className="doc-callout info" style={{ marginTop: '24px' }}>
              <div>
                <strong>{lang === 'bn' ? 'এডিটরে যেকোনো সময় চিটশিট ওপেন করুন' : 'Open the Cheat Sheet anytime'}</strong>
                <p>
                  {lang === 'bn'
                    ? 'কীবোর্ডে Ctrl + / চাপুন অথবা এডিটরের কুইক বারে থাকা "চিটশিট" বাটনে ক্লিক করলে সম্পূর্ণ সিনট্যাক্স ও শর্টকাটের পপআপ চলে আসবে এবং ১-ক্লিকেই এডিটরে ইনসার্ট করতে পারবেন।'
                    : 'Press Ctrl + / on your keyboard or click the "Cheat Sheet" button in the editor toolbar to view all syntaxes and insert them with 1-click.'}
                </p>
              </div>
              <div className="shortcode-box">
                <code>Ctrl + /</code>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'proofread' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'বাংলা ব্যাকরণ ও প্রুফরিড' : 'Bangla grammar & style'}</h2>
            <p>
              {lang === 'bn'
                ? 'লিন্টার লোকাল ব্রাউজারেই চলে — বাংলা একাডেমির নিয়মে, নেট ছাড়া।'
                : 'The linter runs in the browser against Bangla Academy rules, with no network delay.'}
            </p>

            <div className="rules-showcase-grid">
              <div className="rule-badge-card">
                <span className="rule-dot red" />
                <h4>{lang === 'bn' ? 'বাহুল্য দোষ' : 'Redundancy'}</h4>
                <p>{lang === 'bn' ? '«সকল শিক্ষকগণ» → শিক্ষকগণ, «গতকালকে» → গতকাল, «শুধুমাত্র» → শুধু।' : 'Double plurals and tautology such as “শুধুমাত্র” → “শুধু”.'}</p>
              </div>
              <div className="rule-badge-card">
                <span className="rule-dot gold" />
                <h4>{lang === 'bn' ? 'সাধু-চলিত মিশ্রণ' : 'Sadhu–Cholit mix'}</h4>
                <p>{lang === 'bn' ? 'একই অনুচ্ছেদে সাধু ক্রিয়া (করিলেন) ও চলিত রূপ মিলিয়ে গেলে ধরে।' : 'Flags classical and contemporary verb forms mixed in one passage.'}</p>
              </div>
              <div className="rule-badge-card">
                <span className="rule-dot green" />
                <h4>{lang === 'bn' ? 'প্রমিত বানান' : 'Standard spelling'}</h4>
                <p>{lang === 'bn' ? '«বেশী» → বেশি, «শ্রেণী» → শ্রেণি, «পাখী» → পাখি।' : 'Modern Bangla Academy spellings: বেশী → বেশি, শ্রেণী → শ্রেণি.'}</p>
              </div>
              <div className="rule-badge-card">
                <span className="rule-dot blue" />
                <h4>{lang === 'bn' ? 'যতিচিহ্ন ও স্পেস' : 'Punctuation'}</h4>
                <p>{lang === 'bn' ? 'দাঁড়ি ও কমার আগে বাড়তি স্পেস সরায়, যতিচিহ্ন গোছায়।' : 'Removes stray spaces before dari (।) and tidies punctuation.'}</p>
              </div>
            </div>

            <div className="playground-box">
              <h3>{lang === 'bn' ? 'প্রুফরিড টেস্ট' : 'Proofread lab'}</h3>
              <p>{lang === 'bn' ? 'নিচে বাংলা লিখে দেখুন ইঞ্জিন কী ধরে।' : 'Edit the Bengali sample and run a check.'}</p>

              <div className="pg-sample-buttons">
                <button type="button" className="pg-sample-btn" onClick={() => setPlaygroundText('আমি গতকালকে বাজারে গিয়েছিলাম কিন্তু কোন ফল পেলাম না।')}>
                  {lang === 'bn' ? 'নমুনা ১' : 'Sample 1'}
                </button>
                <button type="button" className="pg-sample-btn" onClick={() => setPlaygroundText('সকল শিক্ষকগণ অনুষ্ঠানে উপস্থিত হইলেন এবং বক্তৃতা দিলেন।')}>
                  {lang === 'bn' ? 'নমুনা ২' : 'Sample 2'}
                </button>
                <button type="button" className="pg-sample-btn" onClick={() => setPlaygroundText('তিনি অনেকক্ষণ যাবত অপেক্ষা করছেন কিন্তু শুধুমাত্র তিনিই আসেননি ।')}>
                  {lang === 'bn' ? 'নমুনা ৩' : 'Sample 3'}
                </button>
              </div>

              <textarea
                rows={3}
                className="pg-textarea"
                value={playgroundText}
                onChange={(e) => setPlaygroundText(e.target.value)}
              />

              <div className="pg-actions">
                <button className="primary" onClick={runTest}>
                  <Sparkles size={15} /> {lang === 'bn' ? 'পরীক্ষা করুন' : 'Run check'}
                </button>
              </div>

              {testResults !== null && (
                <div className="pg-results-box">
                  {testResults.length === 0 ? (
                    <div className="pg-clean">
                      <Check size={16} /> {lang === 'bn' ? 'কোনো ভুল পাওয়া যায়নি।' : 'No issues found.'}
                    </div>
                  ) : (
                    <div className="pg-issues">
                      <strong>{lang === 'bn' ? `চিহ্নিত ত্রুটি (${testResults.length})` : `${testResults.length} suggestion(s)`}</strong>
                      <ul>
                        {testResults.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'continuity' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'ধারাবাহিকতা ও চরিত্র' : 'Continuity & characters'}</h2>
            <p>
              {lang === 'bn'
                ? 'বড় উপন্যাসে চরিত্রের বয়স, সম্পর্ক বা সময়ের অসঙ্গতি সহজেই পালিয়ে যায়। স্টুডিও সেগুলো এক জায়গায় রাখে।'
                : 'In a long novel, age, relationships, and timeline slips are easy to miss. The studio keeps those notes in one place.'}
            </p>
            <div className="feature-steps-grid two">
              <div className="feature-step-card">
                <div className="step-icon"><Users size={18} /></div>
                <h3>{lang === 'bn' ? 'চরিত্র খতিয়ান' : 'Character registry'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'প্রধান ও পার্শ্ব চরিত্রের নাম, বয়স ও বৈশিষ্ট্য সংরক্ষণ করুন।'
                    : 'Keep names, ages, and traits for main and supporting characters.'}
                </p>
              </div>
              <div className="feature-step-card">
                <div className="step-icon"><Clock size={18} /></div>
                <h3>{lang === 'bn' ? 'টাইমলাইন' : 'Timeline'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'অধ্যায়ভিত্তিক দিন ও ঘটনার ক্রম রাখুন, যাতে গল্পে ফাটল না ধরে।'
                    : 'Track days and events by chapter so the story stays in order.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="doc-pane">
            <h2>
              {lang === 'bn' ? 'এআই সাহিত্যিক সহায়ক' : 'AI editorial assistant'}
              <span className="doc-pro-badge">Pro</span>
            </h2>
            <p>
              {lang === 'bn'
                ? 'প্রোতে OpenAI GPT-4o দিয়ে শৈলী পরিমার্জন, চরিত্রের ধারাবাহিকতা এবং শুনে শুনে প্রুফ।'
                : 'Pro uses OpenAI GPT-4o for style polish, character consistency, and audio proofreading.'}
            </p>
            <div className="ai-card-grid">
              <div className="ai-feature-card">
                <div className="step-icon"><PencilLine size={18} /></div>
                <h4>{lang === 'bn' ? 'বাক্য ও শৈলী' : 'Phrasing & style'}</h4>
                <p>{lang === 'bn' ? 'কঠিন বাক্যকে সাবলীল করে, লেখকের স্বর না মুছে।' : 'Smooths dense sentences without erasing the author’s voice.'}</p>
              </div>
              <div className="ai-feature-card">
                <div className="step-icon"><Users size={18} /></div>
                <h4>{lang === 'bn' ? 'চরিত্রের ধারা' : 'Character consistency'}</h4>
                <p>{lang === 'bn' ? 'আগের স্বভাবের বিপরীতে হঠাৎ আচরণ ধরতে সাহায্য করে।' : 'Flags a character acting against earlier motivation or backstory.'}</p>
              </div>
              <div className="ai-feature-card">
                <div className="step-icon"><Volume2 size={18} /></div>
                <h4>{lang === 'bn' ? 'অডিও প্রুফ' : 'Audio proof'}</h4>
                <p>{lang === 'bn' ? 'বাক্য ধরে ধরে পড়ে শোনায়, ছন্দপতন তাড়াতাড়ি ধরা পড়ে।' : 'Reads sentence by sentence so rhythm problems surface faster.'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'এক্সপোর্ট ও প্রকাশনা' : 'Export & publishing'}</h2>
            <p>
              {lang === 'bn'
                ? 'খসড়া শেষ হলে যে ফরম্যাট দরকার, সেটা নিন।'
                : 'When the draft is ready, pick the format you need.'}
            </p>
            <div className="export-comparison-table">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>{lang === 'bn' ? 'ফরম্যাট' : 'Format'}</th>
                    <th>{lang === 'bn' ? 'স্তর' : 'Tier'}</th>
                    <th>{lang === 'bn' ? 'কাজে লাগে' : 'Best for'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>HTML</strong></td>
                    <td><span className="badge free">Free</span></td>
                    <td>{lang === 'bn' ? 'ওয়েব বা ব্লগে প্রকাশ' : 'Web or blog'}</td>
                  </tr>
                  <tr>
                    <td><strong>Text / Markdown</strong></td>
                    <td><span className="badge free">Free</span></td>
                    <td>{lang === 'bn' ? 'ব্যাকআপ ও সাধারণ এডিট' : 'Backup and plain editing'}</td>
                  </tr>
                  <tr>
                    <td><strong>Word (.docx)</strong></td>
                    <td><span className="badge pro">Pro</span></td>
                    <td>{lang === 'bn' ? 'প্রকাশক বা সম্পাদকের কাছে জমা' : 'Submission to editors'}</td>
                  </tr>
                  <tr>
                    <td><strong>PDF</strong></td>
                    <td><span className="badge pro">Pro</span></td>
                    <td>{lang === 'bn' ? 'বাংলা ফন্টসহ প্রিন্ট' : 'Print with Bengali fonts'}</td>
                  </tr>
                  <tr>
                    <td><strong>EPUB</strong></td>
                    <td><span className="badge pro">Pro</span></td>
                    <td>{lang === 'bn' ? 'কিন্ডল ও ই-বুক রিডার' : 'Kindle and e-readers'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="doc-pane">
            <h2>{lang === 'bn' ? 'সাধারণ প্রশ্ন' : 'Frequently asked questions'}</h2>
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
