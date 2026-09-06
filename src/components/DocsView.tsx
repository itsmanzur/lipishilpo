import React, { useState } from 'react';
import {
  BookOpen, Sparkles, Wand2, ShieldAlert, FileDown, CheckCircle,
  HelpCircle, ChevronDown, ChevronRight, Play, Check, Copy, Sliders
} from 'lucide-react';
import { type Language } from '../i18n';
import { findIssues, type ProofMatch } from '../proofread';

interface DocsViewProps {
  lang: Language;
  onOpenEditor: () => void;
  onOpenSettings?: () => void;
}

export const DocsView: React.FC<DocsViewProps> = ({ lang, onOpenEditor, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'intro' | 'proofread' | 'continuity' | 'ai' | 'export' | 'faq'>('intro');
  const [playgroundText, setPlaygroundText] = useState<string>(
    'আমি গতকালকে বাজারে গিয়েছিলাম কিন্তু কোন ফল পেলাম না। তিনি অনেকক্ষণ যাবত অপেক্ষা করছিলেন।'
  );
  const [testResults, setTestResults] = useState<string[] | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  function runTest() {
    const issues = findIssues(playgroundText, 'bn', lang, []);
    const msgs = issues.map((iss: ProofMatch) => {
      const fromDisplay = iss.from === '__spaces' ? (lang === 'bn' ? 'অতিরিক্ত স্পেস' : 'Extra space') : iss.from;
      return `${fromDisplay} ➔ ${iss.to} (${iss.why})`;
    });
    setTestResults(msgs);
  }

  const faqs = [
    {
      q: lang === 'bn' ? 'লিপিশিল্প (Lipishilpo) কী এবং এটি কাদের জন্য?' : 'What is Lipishilpo and who is it for?',
      a: lang === 'bn'
        ? 'লিপিশিল্প হলো বাংলা ও বহুভাষিক উপন্যাসিক, গল্পকার, কবি, সাংবাদিক এবং কন্টেন্ট নির্মাতাদের জন্য একটি পূর্ণাঙ্গ পান্ডুলিপি রচনা ও সম্পাদনা স্টুডিও। এতে ব্যাকরণগত শুদ্ধতা, বাহুল্য দোষ পরিহার, প্রমিত বানান ও চরিত্র ধারাবাহিকতা পর্যবেক্ষণ করা যায় সহজে।'
        : 'Lipishilpo is a comprehensive manuscript writing & editorial studio for Bengali and multilingual novel writers, storytellers, poets, journalists, and content creators. It provides deep grammatical proofreading, style linting, and character continuity tracking.'
    },
    {
      q: lang === 'bn' ? 'আমি কি কোনো সাইন-আপ বা থার্ড পার্টি অ্যাকাউন্ট ছাড়া এটি ফ্রি ব্যবহার করতে পারব?' : 'Can I use this for free without signing up for third-party services?',
      a: lang === 'bn'
        ? 'হ্যাঁ, লিপিশিলপোর মূল পান্ডুলিপি এডিটর, অধ্যায়ভিত্তিক লেখার ব্যবস্থাপনা, অফলাইন বাংলা ব্যাকরণ পরীক্ষণ এবং HTML/TXT এক্সপোর্ট সম্পূর্ণ ফ্রি এবং লোকাল ব্রাউজারে সংরক্ষিত থাকে।'
        : 'Yes! Lipishilpo core studio, chapter management, offline Bangla Academy proofreading engine, and HTML/TXT exports are completely free and work entirely locally.'
    },
    {
      q: lang === 'bn' ? 'প্রুফরিডিং ইঞ্জিন কীভাবে কাজ করে?' : 'How does the offline proofreading engine work?',
      a: lang === 'bn'
        ? 'লিপিশিলপো বাংলা একাডেমির প্রমিত বানানরীতি, বাহুল্য দোষ, সাধু ও চলিত ভাষার মিশ্রণ (গুরুচণ্ডালী দোষ), অপ্রয়োজনীয় ইংরেজি স্পেস ও যতিচিহ্নের নিয়মাবলি মেনে রিয়েল-টাইমে লেখা বিশ্লেষণ করে পরামর্শ দেয়।'
        : 'Lipishilpo analyzes text in real-time according to standard Bangla Academy orthography, redundancy linting (বাহুল্য দোষ), Sadhu-Cholit mixing checks, and proper Bengali punctuation.'
    },
    {
      q: lang === 'bn' ? 'আমার পান্ডুলিপির গোপনীয়তা কতটা সুরক্ষিত?' : 'How secure is my manuscript privacy?',
      a: lang === 'bn'
        ? 'আপনার সমস্ত লেখা সম্পূর্ণ নিরাপদ। ফ্রি ভার্সনে কোনো লেখা কোনো সার্ভারে পাঠানো হয় না, সবকিছু সরাসরি আপনার নিজস্ব ওয়ার্ডপ্রেস ডেটাবেস ও লোকাল স্টোরেজে থাকে।'
        : 'Your manuscript is 100% private. In the free version, no content is sent to external servers; everything resides strictly inside your WordPress database and local storage.'
    },
    {
      q: lang === 'bn' ? 'লিপিশিল্প প্রো (Pro) ভার্সনে কী কী অতিরিক্ত সুবিধা রয়েছে?' : 'What additional features are available in Lipishilpo Pro?',
      a: lang === 'bn'
        ? 'প্রো ভার্সনে রয়েছে OpenAI GPT-4o ভিত্তিক ডিপ সাহিত্যিক এডিটিং, পুরো বইয়ের চরিত্র ও বয়স ধারাবাহিকতা পরীক্ষণ, ভয়েস সিন্থেসিস সহ অডিও প্রুফরিডিং (শুনে শুনে প্রুফরিডিং), এবং প্রফেশনাল DOCX, প্রিন্ট-রেডি বাংলা ফন্টসহ PDF এবং EPUB ই-বুক এক্সপোর্ট।'
        : 'Lipishilpo Pro unlocks OpenAI GPT-4o deep literary polishing, whole-manuscript character continuity tracking, text-to-speech Audio Proofreading, and print-ready DOCX, PDF, and EPUB eBook publishing.'
    }
  ];

  return (
    <div className="docs-container">
      {/* Hero Header */}
      <div className="docs-hero-card">
        <div className="docs-hero-content">
          <span className="docs-hero-badge">
            <BookOpen size={14} /> {lang === 'bn' ? 'ব্যবহারকারী নির্দেশিকা ও ডকুমেন্টেশন' : 'User Guide & Documentation'}
          </span>
          <h1>{lang === 'bn' ? 'লিপিশিল্পে স্বাগতম: আপনার ডিজিটাল পান্ডুলিপি স্টুডিও' : 'Welcome to Lipishilpo: Your Digital Manuscript Studio'}</h1>
          <p>
            {lang === 'bn'
              ? 'বাংলা সাহিত্য ও পেশাদার লেখার জন্য তৈরি একটি অত্যাধুনিক রচনার পরিবেশ। সহজে অধ্যায় সাজান, প্রমিত বানান ও শুদ্ধ ব্যাকরণ নিশ্চিত করুন এবং বই আকারে প্রকাশ করুন।'
              : 'A dedicated writing studio built for Bengali literature and multilingual authors. Organize chapters, verify grammar and style, and publish clean books.'}
          </p>
        </div>
        <div className="docs-hero-actions">
          <button className="primary hero-action-btn" onClick={onOpenEditor}>
            <BookOpen size={16} /> {lang === 'bn' ? 'পান্ডুলিপি স্টুডিও খুলুন' : 'Open Manuscript Studio'}
          </button>
          {onOpenSettings && (
            <button className="secondary hero-action-btn" onClick={onOpenSettings}>
              <Sliders size={16} /> {lang === 'bn' ? 'সেটিংস ও শর্টকোড' : 'Settings & Shortcodes'}
            </button>
          )}
        </div>
      </div>

      {/* Docs Navigation Tabs */}
      <div className="docs-nav-tabs">
        <button
          className={'doc-tab-btn ' + (activeTab === 'intro' ? 'active' : '')}
          onClick={() => setActiveTab('intro')}
        >
          <BookOpen size={16} /> {lang === 'bn' ? '১. পরিচিতি ও ব্যবহার' : '1. Overview & Setup'}
        </button>
        <button
          className={'doc-tab-btn ' + (activeTab === 'proofread' ? 'active' : '')}
          onClick={() => setActiveTab('proofread')}
        >
          <Sparkles size={16} /> {lang === 'bn' ? '২. প্রুফরিডিং লিন্টার' : '2. Proofreading Linter'}
        </button>
        <button
          className={'doc-tab-btn ' + (activeTab === 'continuity' ? 'active' : '')}
          onClick={() => setActiveTab('continuity')}
        >
          <ShieldAlert size={16} /> {lang === 'bn' ? '৩. ধারাবাহিকতা পরীক্ষণ' : '3. Continuity Engine'}
        </button>
        <button
          className={'doc-tab-btn ' + (activeTab === 'ai' ? 'active' : '')}
          onClick={() => setActiveTab('ai')}
        >
          <Wand2 size={16} /> {lang === 'bn' ? '৪. এআই সহায়ক (Pro)' : '4. AI Editorial (Pro)'}
        </button>
        <button
          className={'doc-tab-btn ' + (activeTab === 'export' ? 'active' : '')}
          onClick={() => setActiveTab('export')}
        >
          <FileDown size={16} /> {lang === 'bn' ? '৫. এক্সপোর্ট ও পাবলিশিং' : '5. Export & Publishing'}
        </button>
        <button
          className={'doc-tab-btn ' + (activeTab === 'faq' ? 'active' : '')}
          onClick={() => setActiveTab('faq')}
        >
          <HelpCircle size={16} /> {lang === 'bn' ? '৬. সাধারণ প্রশ্নোত্তর (FAQ)' : '6. FAQ'}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="docs-content-area">
        {/* Section 1: Introduction */}
        {activeTab === 'intro' && (
          <div className="doc-pane">
            <h2>📖 {lang === 'bn' ? 'লিপিশিল্প কীভাবে কাজ করে?' : 'How Lipishilpo Works'}</h2>
            <p>
              {lang === 'bn'
                ? 'লিপিশিল্প লেখকদের একটি বিভ্রান্তিমুক্ত (distraction-free) এবং শক্তিশালী লেখার পরিবেশ উপহার দেয়। আপনি কোনো উপন্যাস, ছোটগল্পের সংকলন, গবেষণাপত্র বা বই লিখলে এটি আপনার সর্বোত্তম সঙ্গী।'
                : 'Lipishilpo delivers a clean, distraction-free environment paired with deep linguistic tools tailored for authors.'}
            </p>

            <div className="feature-steps-grid">
              <div className="feature-step-card">
                <div className="step-num">১</div>
                <h3>{lang === 'bn' ? 'পান্ডুলিপি ও অধ্যায় সংগঠন' : 'Manuscripts & Chapters'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'আপনার বইটিকে বিভিন্ন অধ্যায়ে ভাগ করে লিখুন। ড্র্যাগ-এন্ড-ড্রপ বা সহজেই অধ্যায় পুনর্বিন্যাস এবং প্রতিটি অধ্যায়ের শব্দসংখ্যা হিসাব করুন।'
                    : 'Split your story into clear chapters, reorder smoothly, and keep track of live word and character counts.'}
                </p>
              </div>

              <div className="feature-step-card">
                <div className="step-num">২</div>
                <h3>{lang === 'bn' ? 'স্মার্ট বাংলা প্রুফরিডিং' : 'Smart Bangla Proofreading'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'লেখা চলাকালীন প্রমিত বানান, বাহুল্য দোষ এবং ব্যাকরণগত ভুল স্বয়ংক্রিয়ভাবে হাইলাইট হয়। এক ক্লিকে সঠিক পরামর্শ গ্রহণ করুন।'
                    : 'Real-time highlight for spelling rules, redundancy linting, and grammatical suggestions directly within the editor.'}
                </p>
              </div>

              <div className="feature-step-card">
                <div className="step-num">৩</div>
                <h3>{lang === 'bn' ? 'পাবলিকেশন এক্সপোর্ট' : 'Publication Ready Export'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'আপনার সম্পন্ন পান্ডুলিপি নিমিষেই সুন্দর এইচটিএমএল, টেক্সট, অথবা প্রো ফিচারের মাধ্যমে প্রিন্ট-রেডি DOCX, PDF ও EPUB ফরম্যাটে ডাউনলোড করুন।'
                    : 'Export your manuscript instantly to HTML/TXT, or use Pro to produce professional DOCX, styled PDF, and EPUB eBooks.'}
                </p>
              </div>
            </div>

            <div className="doc-callout info">
              <strong>💡 {lang === 'bn' ? 'ওয়ার্ডপ্রেস ফ্রন্টএন্ডে প্রদর্শন:' : 'Frontend WordPress Embed:'}</strong>
              <p>
                {lang === 'bn'
                  ? 'আপনার সাইটের যেকোনো পোস্ট বা পেজে [lipishilpo] শর্টকোডটি বসিয়ে সরাসরি ভিজিটর বা পাঠকদের জন্য স্টুডিওটি উন্মুক্ত করতে পারেন।'
                  : 'Simply place the [lipishilpo] shortcode on any WordPress page or post to embed the studio for front-end access.'}
              </p>
            </div>
          </div>
        )}

        {/* Section 2: Proofreading Rules */}
        {activeTab === 'proofread' && (
          <div className="doc-pane">
            <h2>✨ {lang === 'bn' ? 'বাংলা ব্যাকরণ ও প্রুফরিডিং লিন্টার' : 'Bangla Grammar & Style Linter'}</h2>
            <p>
              {lang === 'bn'
                ? 'লিপিশিল্পে রয়েছে অত্যন্ত সমৃদ্ধ বাংলা ব্যাকরণ ইঞ্জিন যা লোকাল ব্রাউজারেই কার্যকর হয় (জিরো-লেটেন্সি)।'
                : 'Lipishilpo includes an offline, zero-latency rule engine based on Bangla Academy standards.'}
            </p>

            <div className="rules-showcase-grid">
              <div className="rule-badge-card">
                <h4>🔴 {lang === 'bn' ? 'বাহুল্য দোষ (Redundancy)' : 'Redundancy Errors'}</h4>
                <p>{lang === 'bn' ? 'যেমন: "সকল শিক্ষকগণ" ➔ "সব শিক্ষক" বা "শিক্ষকগণ", "গতকালকে" ➔ "গতকাল", "শুধুমাত্র" ➔ "শুধু" বা "মাত্র"।' : 'Detects and flags double plurals and tautological phrasing.'}</p>
              </div>
              <div className="rule-badge-card">
                <h4>🟡 {lang === 'bn' ? 'সাধু-চলিত মিশ্রণ (Guru-Chandali)' : 'Sadhu-Cholit Mixing'}</h4>
                <p>{lang === 'bn' ? 'একই অনুচ্ছেদে সাধু ক্রিয়া (যাইতেছে, করিলেন) এবং চলিত ক্রিয়ার মিশ্রণ চিহ্নিত করে।' : 'Prevents inconsistent mixing of classical and contemporary verb inflections.'}</p>
              </div>
              <div className="rule-badge-card">
                <h4>🟢 {lang === 'bn' ? 'প্রমিত বানানরীতি' : 'Standard Spelling'}</h4>
                <p>{lang === 'bn' ? 'বাংলা একাডেমির আধুনিক নিয়ম অনুযায়ী "বেশী" ➔ "বেশি", "শ্রেণী" ➔ "শ্রেণি", "পাখী" ➔ "পাখি" ইত্যাদি রূপান্তর।' : 'Modern Bangla Academy vowel harmony and simplified spellings.'}</p>
              </div>
              <div className="rule-badge-card">
                <h4>🔵 {lang === 'bn' ? 'যতিচিহ্ন ও স্পেসিং' : 'Punctuation & Spacing'}</h4>
                <p>{lang === 'bn' ? 'দাঁড়ি (।), কমা (,) এর পূর্বে অতিরিক্ত স্পেস অপসারণ এবং সঠিক যতিচিহ্ন প্রয়োগ।' : 'Cleans up double spaces, stray spaces before Bengali Dari (|), and punctuation.'}</p>
              </div>
            </div>

            {/* Interactive Playground */}
            <div className="playground-box">
              <h3>🧪 {lang === 'bn' ? 'ইন্টারেক্টিভ প্রুফরিডিং টেস্ট ল্যাব' : 'Interactive Proofreading Test Lab'}</h3>
              <p>{lang === 'bn' ? 'নিচের বক্সে বাংলা টেক্সট লিখে পরীক্ষা করে দেখুন ইঞ্জিনটি কীভাবে ভুল চিহ্নিত করে:' : 'Type or edit Bengali text below and click the button to see the engine in action:'}</p>

              <div className="pg-sample-buttons">
                <button
                  type="button"
                  className="pg-sample-btn"
                  onClick={() => setPlaygroundText('আমি গতকালকে বাজারে গিয়েছিলাম কিন্তু কোন ফল পেলাম না।')}
                >
                  {lang === 'bn' ? 'নমুনা ১ (গতকালকে/কোন)' : 'Sample 1'}
                </button>
                <button
                  type="button"
                  className="pg-sample-btn"
                  onClick={() => setPlaygroundText('সকল শিক্ষকগণ অনুষ্ঠানে উপস্থিত হইলেন এবং বক্তৃতা দিলেন।')}
                >
                  {lang === 'bn' ? 'নমুনা ২ (সকল শিক্ষকগণ/সাধু-চলিত)' : 'Sample 2'}
                </button>
                <button
                  type="button"
                  className="pg-sample-btn"
                  onClick={() => setPlaygroundText('তিনি অনেকক্ষণ যাবত অপেক্ষা করছেন কিন্তু শুধুমাত্র তিনিই আসেননি ।')}
                >
                  {lang === 'bn' ? 'নমুনা ৩ (যাবত/শুধুমাত্র/স্পেস)' : 'Sample 3'}
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
                  <Sparkles size={15} /> {lang === 'bn' ? 'পরীক্ষা করুন' : 'Run Proofread Check'}
                </button>
              </div>

              {testResults !== null && (
                <div className="pg-results-box">
                  {testResults.length === 0 ? (
                    <div className="pg-clean">
                      <Check size={16} /> {lang === 'bn' ? 'কোনো ভুল পাওয়া যায়নি! লেখাটি সম্পূর্ণ প্রমিত।' : 'No issues found! Text looks completely clean.'}
                    </div>
                  ) : (
                    <div className="pg-issues">
                      <strong>{lang === 'bn' ? ('চিহ্নিত ত্রুটিসমূহ (' + testResults.length + 'টি):') : ('Detected ' + testResults.length + ' suggestion(s):')}</strong>
                      <ul>
                        {testResults.map((r, i) => (
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

        {/* Section 3: Continuity */}
        {activeTab === 'continuity' && (
          <div className="doc-pane">
            <h2>🛡️ {lang === 'bn' ? 'ধারাবাহিকতা পরীক্ষণ ও ক্যারেক্টার ট্র্যাকিং' : 'Continuity & Character Consistency'}</h2>
            <p>
              {lang === 'bn'
                ? 'বড় উপন্যাস বা সংকলনে বিভিন্ন অধ্যায়ে চরিত্রের বয়স, চোখের রঙ, সম্পর্কের টানাপোড়েন বা স্থানিক অসঙ্গতি লেখকদের অন্যতম বড় চ্যালেঞ্জ।'
                : 'Tracking character details, eye color, timeline consistency, and recurring places across chapters is crucial for novelists.'}
            </p>

            <div className="feature-steps-grid">
              <div className="feature-step-card">
                <h3>👥 {lang === 'bn' ? 'চরিত্র খতিয়ান (Dramatis Personae)' : 'Character Registry'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'আপনার গল্প বা উপন্যাসের প্রতিটি প্রধান ও পার্শ্ব চরিত্রের নাম, বয়স ও বৈশিষ্ট্য সংরক্ষণ করুন।'
                    : 'Register protagonist, antagonist, and supporting characters with traits and initial status.'}
                </p>
              </div>
              <div className="feature-step-card">
                <h3>⏳ {lang === 'bn' ? 'টাইমলাইন ট্র্যাকার' : 'Timeline Tracker'}</h3>
                <p>
                  {lang === 'bn'
                    ? 'অধ্যায়ভিত্তিক দিন, সময় এবং ঘটনার কালানুক্রমিক মিল বজায় রাখুন যাতে গল্পের ভেতরে অসঙ্গতি না ঘটে।'
                    : 'Maintain logical progression of days, flash-forwards, and flashbacks across the book.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: AI Pro */}
        {activeTab === 'ai' && (
          <div className="doc-pane">
            <h2>🤖 {lang === 'bn' ? 'এআই সাহিত্যিক সহায়ক ও বিশ্লেষণ (Pro)' : 'AI Editorial Assistant (Pro)'}</h2>
            <p>
              {lang === 'bn'
                ? 'লিপিশিল্প Pro ভার্সনে সংযুক্ত রয়েছে OpenAI GPT-4o চালিত গভীর সাহিত্যিক বিশ্লেষণ, যা আপনার লেখার মান ও সুরকে সমৃদ্ধ করে।'
                : 'Lipishilpo Pro unlocks deep literary intelligence powered by OpenAI GPT-4o to refine prose and track story consistency.'}
            </p>

            <div className="ai-card-grid">
              <div className="ai-feature-card">
                <h4>✨ {lang === 'bn' ? 'বাক্য ও শৈলী পরিমার্জন' : 'Phrasing & Stylistic Polish'}</h4>
                <p>{lang === 'bn' ? 'কঠিন বা দুর্বোধ্য বাক্যগঠনকে সাবলীল রূপান্তরের পরামর্শ প্রদান করে।' : 'Simplifies complex clauses and improves prose flow without rewriting author voice.'}</p>
              </div>
              <div className="ai-feature-card">
                <h4>🎭 {lang === 'bn' ? 'চরিত্রের মনস্তাত্ত্বিক ধারাবাহিকতা' : 'Character Consistency Check'}</h4>
                <p>{lang === 'bn' ? 'কোনো চরিত্র পূর্বের স্বভাবের বিপরীতে হঠাৎ কোনো আচরণ করলে তা শনাক্ত করে।' : 'Alerts if a character contradicts earlier motivations or established backstory.'}</p>
              </div>
              <div className="ai-feature-card">
                <h4>🔊 {lang === 'bn' ? 'শুনে শুনে প্রুফরিডিং (Audio Proofreader)' : 'Audio Proofreading (TTS)'}</h4>
                <p>{lang === 'bn' ? 'ন্যাচারাল ভয়েস সিন্থেসিসের সাহায্যে আপনার লেখা বাক্য ধরে ধরে পড়ে শোনাবে, যাতে পড়ার গতিতে ছন্দপতন দ্রুত ধরা পড়ে।' : 'Listens to your prose sentence-by-sentence with synchronized highlighting.'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Export */}
        {activeTab === 'export' && (
          <div className="doc-pane">
            <h2>📥 {lang === 'bn' ? 'এক্সপোর্ট ও প্রকাশনা ব্যবস্থা' : 'Export & Publishing Pipeline'}</h2>
            <p>
              {lang === 'bn'
                ? 'আপনার পান্ডুলিপি তৈরি হওয়ার পর বিভিন্ন ফরম্যাটে প্রকাশ করার সম্পূর্ণ সুযোগ রয়েছে:'
                : 'Ready to share or publish? Lipishilpo supports multiple export standards:'}
            </p>

            <div className="export-comparison-table">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>{lang === 'bn' ? 'ফরম্যাট' : 'Format'}</th>
                    <th>{lang === 'bn' ? 'ভার্সন' : 'Tier'}</th>
                    <th>{lang === 'bn' ? 'উপযোগিতা' : 'Best Used For'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>HTML (.html)</strong></td>
                    <td><span className="badge free">Free</span></td>
                    <td>{lang === 'bn' ? 'ওয়েবসাইটে বা ব্লগে সরাসরি প্রকাশের জন্য' : 'Direct web publication or blogging'}</td>
                  </tr>
                  <tr>
                    <td><strong>Text (.txt) / Markdown (.md)</strong></td>
                    <td><span className="badge free">Free</span></td>
                    <td>{lang === 'bn' ? 'সহজ ব্যাকআপ ও প্লেইন টেক্সট এডিটর ব্যবহারের জন্য' : 'Universal backup and lightweight editing'}</td>
                  </tr>
                  <tr>
                    <td><strong>Microsoft Word (.docx)</strong></td>
                    <td><span className="badge pro">Pro</span></td>
                    <td>{lang === 'bn' ? 'মুদ্রণালয় বা প্রকাশকের কাছে জমা দেওয়ার জন্য' : 'Submission to publishing houses and editors'}</td>
                  </tr>
                  <tr>
                    <td><strong>Print-Ready PDF (.pdf)</strong></td>
                    <td><span className="badge pro">Pro</span></td>
                    <td>{lang === 'bn' ? 'প্রমিত বাংলা ফন্ট ও মার্জিনসহ সরাসরি প্রিন্ট করার জন্য' : 'Direct book printing with embedded Bengali typography'}</td>
                  </tr>
                  <tr>
                    <td><strong>EPUB eBook (.epub)</strong></td>
                    <td><span className="badge pro">Pro</span></td>
                    <td>{lang === 'bn' ? 'Amazon Kindle, Apple Books ও ডিজিটাল রিডারে পড়ার জন্য' : 'Digital distribution on Kindle and Apple Books'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 6: FAQ */}
        {activeTab === 'faq' && (
          <div className="doc-pane">
            <h2>❓ {lang === 'bn' ? 'সাধারণ জিজ্ঞাসিত প্রশ্নাবলী' : 'Frequently Asked Questions'}</h2>
            <div className="faq-accordion">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className={'faq-item ' + (expandedFaq === idx ? 'expanded' : '')}
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                >
                  <div className="faq-question">
                    <span>{faq.q}</span>
                    {expandedFaq === idx ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                  {expandedFaq === idx && <div className="faq-answer">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
