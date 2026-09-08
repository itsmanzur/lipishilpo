import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Keyboard,
  Sparkles,
  Copy,
  Check,
  Search,
  Heading2,
  Quote,
  Box,
  Feather,
  Bookmark,
  Divide,
  Type,
  Bold,
  Italic,
  Highlighter,
  MessageSquareQuote,
  List,
  ListOrdered,
} from 'lucide-react';
import { type Language } from '../i18n';

interface FormattingCheatSheetModalProps {
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
  onInsertSyntax?: (syntax: string) => void;
}

interface CheatItem {
  name: { bn: string; en: string };
  syntax: string;
  example: { bn: string; en: string };
  desc: { bn: string; en: string };
  shortcut?: string;
  category: 'text' | 'headings' | 'literary' | 'blocks' | 'shortcuts';
}

const CHEAT_ITEMS: CheatItem[] = [
  // Text Styling
  {
    name: { bn: 'গাঢ় লেখা (Bold)', en: 'Bold Text' },
    syntax: '**লেখা**',
    example: { bn: '**গুরুত্বপূর্ণ সিদ্ধান্ত**', en: '**Important decision**' },
    desc: { bn: 'যেকোনো শব্দ বা বাক্যকে জোরালো ও গাঢ় করতে', en: 'Make words strong and bold' },
    shortcut: 'Ctrl + B',
    category: 'text',
  },
  {
    name: { bn: 'বাঁকা লেখা (Italic)', en: 'Italic Text' },
    syntax: '*লেখা*',
    example: { bn: '*চরিত্রের অভ্যন্তরীণ ভাবনা*', en: '*Internal monologue*' },
    desc: { bn: 'মনের চিন্তা বা বিদেশি শব্দের জন্য', en: 'Emphasize thoughts or foreign terms' },
    shortcut: 'Ctrl + I',
    category: 'text',
  },
  {
    name: { bn: 'বাংলা কোটেশন (“ ”)', en: 'Bengali Curly Quotes (“ ”)' },
    syntax: '“লেখা”',
    example: { bn: '“চলুন একসাথে বের হই।”', en: '“Let us go together.”' },
    desc: { bn: 'প্রমিত বাংলা সাহিত্যিক উদ্ধৃতি চিহ্ন', en: 'Standard Bengali dialogue curly quotes' },
    category: 'text',
  },
  {
    name: { bn: 'রঙিন হাইলাইট (Highlight)', en: 'Color Highlight' },
    syntax: '==লেখা==',
    example: { bn: '==প্লটের মূল রহস্য==', en: '==Core mystery==' },
    desc: { bn: 'হলুদ মার্কার। সবুজ/বেগুনি/গোলাপি: ==green:লেখা==', en: 'Yellow marker. Other colors: ==green:text==, ==purple:text==, ==pink:text==' },
    category: 'text',
  },

  // Headings
  {
    name: { bn: 'উপ-শিরোনাম (Heading 2)', en: 'Subheading (H2)' },
    syntax: '## শিরোনামের নাম',
    example: { bn: '## দ্বিতীয় পরিচ্ছেদ: অন্ধকারের যাত্রী', en: '## Chapter 2: Journey into Night' },
    desc: { bn: 'অধ্যায়ের প্রধান উপ-পরিচ্ছেদ তৈরি করতে', en: 'Create major section titles within a chapter' },
    shortcut: '/h2',
    category: 'headings',
  },
  {
    name: { bn: 'ছোট শিরোনাম (Heading 3)', en: 'Section Heading (H3)' },
    syntax: '### ছোট শিরোনাম',
    example: { bn: '### সকালের প্রস্তুতি', en: '### Morning Routine' },
    desc: { bn: 'প্যারাগ্রাফ বা ছোট বিষয়ের শিরোনাম', en: 'Subsection or paragraph title' },
    shortcut: '/h3',
    category: 'headings',
  },

  // Literary & Fiction
  {
    name: { bn: 'চরিত্রের সংলাপ (Dialogue)', en: 'Dialogue Standard' },
    syntax: '— “সংলাপ” বক্তার উক্তি।',
    example: { bn: '— “আপনি কাল কখন আসছেন?” সাজিদ জানতে চাইল।', en: '— “When are you arriving tomorrow?” Sajid asked.' },
    desc: { bn: 'সাহিত্যিক ড্যাশ ও প্রমিত উদ্ধৃতিসহ সংলাপ', en: 'Standard Bangla literary dialogue' },
    shortcut: 'Ctrl + Shift + D  বা  /dialogue',
    category: 'literary',
  },
  {
    name: { bn: 'কবিতা ও স্তবক (Poem Block)', en: 'Poem & Verse' },
    syntax: ':::poem\nপ্রথম চরণ\nদ্বিতীয় চরণ\n:::',
    example: { bn: ':::poem\nমেঘ বলেছে যাব যাব,\nরাত বলেছে যাই।\n:::', en: ':::poem\nTwo roads diverged in a yellow wood,\nAnd sorry I could not travel both.\n:::' },
    desc: { bn: 'কবিতার চরণের মার্জিন ও ছন্দময় বিন্যাস', en: 'Formatted poetic stanzas and verse' },
    shortcut: '/poem',
    category: 'literary',
  },
  {
    name: { bn: 'পাদটীকা ও টীকা (Footnotes)', en: 'Footnotes' },
    syntax: 'মূল লেখা[^১]\n\n[^১]: বিস্তারিত টীকা বা ব্যাখ্যা।',
    example: { bn: 'মুঘল সাম্রাজ্য[^১]...\n\n[^১]: ১৫২৬ সালে বাবর প্রতিষ্ঠিত।', en: 'The Mughal Empire[^1]...\n\n[^1]: Established by Babur in 1526.' },
    desc: { bn: 'ইতিহাস, গবেষণা বা উপন্যাসের বিশেষ শব্দের টীকা', en: 'Scholarly citations and bottom notes' },
    shortcut: '/footnote',
    category: 'literary',
  },
  {
    name: { bn: 'অলঙ্কৃত ড্রপ ক্যাপ (Drop Cap)', en: 'Drop Cap' },
    syntax: ':::dropcap\nঅধ্যায়ের শুরুর প্রথম বাক্য...\n:::',
    example: { bn: ':::dropcap\nএকদা এক শান্ত নদীর তীরে...\n:::', en: ':::dropcap\nOnce upon a time by the quiet river...\n:::' },
    desc: { bn: 'মুদ্রিত বইয়ের মতো শুরুর অক্ষর বড় ও সুন্দর করা', en: 'Large decorative opening initial letter' },
    shortcut: '/dropcap',
    category: 'literary',
  },

  // Blocks & Dividers
  {
    name: { bn: 'উদ্ধৃতি / এপিগ্রাফ (Blockquote)', en: 'Blockquote / Epigraph' },
    syntax: '> উদ্ধৃতি বা উক্তি এখানে লিখুন',
    example: { bn: '> "মানুষ স্বপ্ন ছাড়া বাঁচতে পারে না।" — হুমায়ূন আহমেদ', en: '> "Life is what happens when you are busy making other plans."' },
    desc: { bn: 'অধ্যায়ের শুরুতে বা লেখার মাঝে উদ্ধৃতি বক্স', en: 'Highlighted quote or epigraph block' },
    shortcut: '/quote',
    category: 'blocks',
  },
  {
    name: { bn: 'তথ্য / ইসলামিক বক্স (Callout)', en: 'Callout / Islamic Box' },
    syntax: ':::box[ইসলামের আলোকে]\nকুরআনের আয়াত বা হাদিস এখানে লিখুন\n:::',
    example: { bn: ':::box[বিশেষ দ্রষ্টব্য]\nএই ঘটনাটি ঐতিহাসিক তথ্যের ওপর ভিত্তি করে লিখিত।\n:::', en: ':::box[Important Note]\nBased on verified historical accounts.\n:::' },
    desc: { bn: 'রঙিন বক্স ও বিশেষ তথ্য তুলে ধরা', en: 'Decorated callout box for notes and hadiths' },
    shortcut: '/box',
    category: 'blocks',
  },
  {
    name: { bn: 'তথ্যসূত্র (Reference / Citation)', en: 'Reference Attribution' },
    syntax: 'তথ্যসূত্র: বইয়ের নাম, পৃষ্ঠা ১২',
    example: { bn: 'তথ্যসূত্র: লালসালু — সৈয়দ ওয়ালীউল্লাহ্, পৃষ্ঠা ৩৭', en: 'Reference: The Great Gatsby, Page 42' },
    desc: { bn: 'উদ্ধৃতি বা তথ্যের প্রামাণ্য উৎস উল্লেখ করা', en: 'Source attribution and reference' },
    shortcut: '/citation',
    category: 'blocks',
  },
  {
    name: { bn: 'দৃশ্য বিভাজক মোটিফ (Scene Breaks)', en: 'Scene Break Motifs' },
    syntax: '❖ ❖ ❖  বা  ~ ❦ ~  বা  — ✦ —',
    example: { bn: '...\n\n❖ ❖ ❖\n\nপরদিন সকালে...', en: '...\n\n❖ ❖ ❖\n\nThe next morning...' },
    desc: { bn: 'উপন্যাসে সময় বা দৃশ্য পরিবর্তনের বিভাজক চিহ্ন', en: 'Artistic scene change dividers' },
    shortcut: '/divider',
    category: 'blocks',
  },
];

export const FormattingCheatSheetModal: React.FC<FormattingCheatSheetModalProps> = ({
  isOpen,
  lang,
  onClose,
  onInsertSyntax,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanSearch = searchTerm.toLowerCase().trim();
  const filtered = CHEAT_ITEMS.filter((item) => {
    const matchesCat = filter === 'all' || item.category === filter;
    if (!matchesCat) return false;
    if (!cleanSearch) return true;
    return (
      item.name[lang].toLowerCase().includes(cleanSearch) ||
      item.syntax.toLowerCase().includes(cleanSearch) ||
      item.desc[lang].toLowerCase().includes(cleanSearch) ||
      item.example[lang].toLowerCase().includes(cleanSearch)
    );
  });

  function handleCopy(syntax: string, id: string) {
    void navigator.clipboard.writeText(syntax);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="formatting-cheat-sheet-overlay" onClick={onClose}>
      <div
        className="formatting-cheat-sheet-modal"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cheat-sheet-header">
          <div className="cheat-sheet-title-group">
            <div className="cheat-icon-pill">
              <BookOpen size={18} />
            </div>
            <div>
              <h3>{lang === 'bn' ? 'ফরম্যাটিং সহায়িকা ও সাহিত্যিক চিটশিট' : 'Formatting & Literary Cheat Sheet'}</h3>
              <p>{lang === 'bn' ? 'পাণ্ডুলিপি লেখার সিনট্যাক্স, সংলাপ, কবিতা ও শর্টকাট তালিকা' : 'Complete syntax, dialogue, poetry & keyboard shortcut guide'}</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="cheat-sheet-toolbar">
          <div className="cheat-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'ফরম্যাট বা শর্টকাট খুঁজুন (যেমন: সংলাপ, কবিতা, bold...)' : 'Search formatting or shortcut...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="cheat-filter-tabs">
            <button className={`cheat-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              {lang === 'bn' ? 'সবগুলো' : 'All'}
            </button>
            <button className={`cheat-tab ${filter === 'literary' ? 'active' : ''}`} onClick={() => setFilter('literary')}>
              <Feather size={13} /> {lang === 'bn' ? 'সাহিত্য ও উপন্যাস' : 'Literary & Fiction'}
            </button>
            <button className={`cheat-tab ${filter === 'text' ? 'active' : ''}`} onClick={() => setFilter('text')}>
              <Bold size={13} /> {lang === 'bn' ? 'টেক্সট স্টাইল' : 'Text Styling'}
            </button>
            <button className={`cheat-tab ${filter === 'headings' ? 'active' : ''}`} onClick={() => setFilter('headings')}>
              <Heading2 size={13} /> {lang === 'bn' ? 'হেডিং' : 'Headings'}
            </button>
            <button className={`cheat-tab ${filter === 'blocks' ? 'active' : ''}`} onClick={() => setFilter('blocks')}>
              <Box size={13} /> {lang === 'bn' ? 'বক্স ও ডিভাইডার' : 'Blocks & Dividers'}
            </button>
          </div>
        </div>

        <div className="cheat-sheet-body">
          <div className="cheat-items-grid">
            {filtered.map((item, idx) => {
              const id = `cheat-${idx}`;
              const isCopied = copiedId === id;
              return (
                <div className="cheat-card" key={id}>
                  <div className="cheat-card-header">
                    <span className="cheat-item-name">{item.name[lang]}</span>
                    {item.shortcut && <span className="cheat-badge-shortcut">{item.shortcut}</span>}
                  </div>
                  <p className="cheat-item-desc">{item.desc[lang]}</p>

                  <div className="cheat-code-box">
                    <code>{item.syntax}</code>
                    <div className="cheat-code-actions">
                      <button
                        type="button"
                        className="cheat-action-btn"
                        onClick={() => handleCopy(item.syntax, id)}
                        title={lang === 'bn' ? 'কপি করুন' : 'Copy'}
                      >
                        {isCopied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      </button>
                      {onInsertSyntax && (
                        <button
                          type="button"
                          className="cheat-action-btn insert"
                          onClick={() => {
                            onInsertSyntax(item.syntax);
                            onClose();
                          }}
                          title={lang === 'bn' ? 'এডিটরে বসান' : 'Insert into Editor'}
                        >
                          <Sparkles size={13} /> {lang === 'bn' ? 'ইনসার্ট' : 'Insert'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="cheat-example-row">
                    <span className="example-label">{lang === 'bn' ? 'উদাহরণ:' : 'Example:'}</span>
                    <span className="example-text">{item.example[lang]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cheat-sheet-footer">
          <div className="footer-tip">
            <Sparkles size={14} />
            <span>
              {lang === 'bn'
                ? 'টিপস: লেখার লাইনে শুধু "/" চাপলে স্ল্যাশ কমান্ড মেনু ওপেন হবে।'
                : 'Tip: Type "/" on any line to open the instant Slash Commands menu.'}
            </span>
          </div>
          <button type="button" className="close-footer-btn" onClick={onClose}>
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
