import React, { useEffect, useRef } from 'react';
import {
  Heading2,
  Heading3,
  MessageSquareQuote,
  Quote,
  Box,
  Feather,
  Bookmark,
  Sparkles,
  List,
  ListOrdered,
  Divide,
  Type,
  PenTool,
} from 'lucide-react';
import { type Language } from '../i18n';

export interface SlashCommandItem {
  id: string;
  format: string;
  icon: React.ReactNode;
  label: { bn: string; en: string };
  desc: { bn: string; en: string };
  keywords: string[];
  shortcut?: string;
  category: 'headings' | 'literary' | 'blocks' | 'lists';
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    id: 'h2',
    format: 'h2',
    icon: <Heading2 size={16} className="cmd-icon-heading" />,
    label: { bn: 'উপ-শিরোনাম (H2)', en: 'Subheading (H2)' },
    desc: { bn: 'অধ্যায়ের প্রধান পরিচ্ছেদ বা সেকশন', en: 'Main chapter section heading' },
    keywords: ['h2', 'heading', 'title', 'subheading', 'শিরোনাম', 'উপশিরোনাম'],
    shortcut: '## ',
    category: 'headings',
  },
  {
    id: 'h3',
    format: 'h3',
    icon: <Heading3 size={16} className="cmd-icon-heading" />,
    label: { bn: 'ছোট শিরোনাম (H3)', en: 'Minor Heading (H3)' },
    desc: { bn: 'অনুচ্ছেদ বা উপ-পরিচ্ছেদ শিরোনাম', en: 'Paragraph or subsection heading' },
    keywords: ['h3', 'section', 'subtitle', 'অনুচ্ছেদ', 'সেকশন'],
    shortcut: '### ',
    category: 'headings',
  },
  {
    id: 'dialogue',
    format: 'dialogue',
    icon: <MessageSquareQuote size={16} className="cmd-icon-dialogue" />,
    label: { bn: 'চরিত্রের সংলাপ (Dialogue)', en: 'Character Dialogue' },
    desc: { bn: 'উপন্যাসের প্রমিত সংলাপ: — “উক্তি”', en: 'Standard novel dialogue: — “Quote”' },
    keywords: ['dialogue', 'speech', 'quote', 'conversation', 'সংলাপ', 'উক্তি', 'কথোপকথন'],
    shortcut: 'Ctrl+Shift+D',
    category: 'literary',
  },
  {
    id: 'quote',
    format: 'quote',
    icon: <Quote size={16} className="cmd-icon-quote" />,
    label: { bn: 'উদ্ধৃতি / এপিগ্রাফ (Quote)', en: 'Blockquote / Epigraph' },
    desc: { bn: 'সাহিত্যিক উক্তি বা রেফারেন্স বয়ান', en: 'Literary quotation or epigraph' },
    keywords: ['quote', 'epigraph', 'উদ্ধৃতি', 'উক্তি', 'বয়ান'],
    shortcut: '> ',
    category: 'literary',
  },
  {
    id: 'poem',
    format: 'poem',
    icon: <Feather size={16} className="cmd-icon-poem" />,
    label: { bn: 'কবিতা / স্তবক (Poem / Stanza)', en: 'Poem & Verse Stanza' },
    desc: { bn: 'কবিতার চরণ ও ছন্দবদ্ধ স্তবক', en: 'Indented poetic lines & verse' },
    keywords: ['poem', 'verse', 'stanza', 'কবিতা', 'ছড়া', 'পদ্য', 'স্তবক'],
    category: 'literary',
  },
  {
    id: 'box',
    format: 'callout',
    icon: <Box size={16} className="cmd-icon-box" />,
    label: { bn: 'তথ্য / ইসলামিক বক্স (Callout)', en: 'Callout Box (Note / Hadith)' },
    desc: { bn: 'বিশেষ নোট, কুরআনের আয়াত বা হাদিস বক্স', en: 'Highlighted callout note or Islamic reference' },
    keywords: ['box', 'callout', 'note', 'islamic', 'বক্স', 'তথ্যবক্স', 'হাদিস', 'আয়াত', 'নোট'],
    category: 'blocks',
  },
  {
    id: 'citation',
    format: 'citation',
    icon: <Bookmark size={16} className="cmd-icon-citation" />,
    label: { bn: 'তথ্যসূত্র / সাইটেশন (Reference)', en: 'Source / Citation' },
    desc: { bn: 'বইয়ের উৎস বা প্রামাণ্য দলিলের রেফারেন্স', en: 'Source attribution or book reference' },
    keywords: ['citation', 'reference', 'source', 'তথ্যসূত্র', 'রেফারেন্স', 'উৎস'],
    category: 'blocks',
  },
  {
    id: 'footnote',
    format: 'footnote',
    icon: <PenTool size={16} className="cmd-icon-footnote" />,
    label: { bn: 'পাদটীকা (Footnote [^১])', en: 'Footnote Reference [^1]' },
    desc: { bn: 'পাতার নিচে বিস্তারিত টীকা ও ব্যাখ্যা', en: 'Numbered footnote reference & note' },
    keywords: ['footnote', 'note', 'পাদটীকা', 'টীকা'],
    category: 'literary',
  },
  {
    id: 'divider-diamond',
    format: 'divider-diamond',
    icon: <Divide size={16} className="cmd-icon-divider" />,
    label: { bn: 'দৃশ্য বিভাজক (❖ ❖ ❖)', en: 'Diamond Scene Divider (❖ ❖ ❖)' },
    desc: { bn: 'অধ্যায়ের দৃশ্য পরিবর্তনের ক্লাসিক্যাল প্রতীক', en: 'Classic diamond scene break' },
    keywords: ['divider', 'break', 'scene', 'বিভাজক', 'দৃশ্য'],
    category: 'blocks',
  },
  {
    id: 'divider-floral',
    format: 'divider-floral',
    icon: <Sparkles size={16} className="cmd-icon-divider" />,
    label: { bn: 'ফ্লোরাল বিভাজক (~ ❦ ~)', en: 'Floral Scene Divider (~ ❦ ~)' },
    desc: { bn: 'রোমান্টিক বা ঐতিহাসিক উপন্যাসের অলঙ্করণ', en: 'Floral motif scene break' },
    keywords: ['divider', 'floral', 'heart', 'ফুল', 'ফ্লোরাল'],
    category: 'blocks',
  },
  {
    id: 'list',
    format: 'list',
    icon: <List size={16} className="cmd-icon-list" />,
    label: { bn: 'বুলেট তালিকা (Bullet List)', en: 'Bullet List' },
    desc: { bn: 'চিহ্নিত পয়েন্ট বা তালিকার লাইন', en: 'Bullet pointed items' },
    keywords: ['list', 'bullet', 'তালিকা', 'পয়েন্ট'],
    shortcut: '* ',
    category: 'lists',
  },
  {
    id: 'number',
    format: 'number',
    icon: <ListOrdered size={16} className="cmd-icon-list" />,
    label: { bn: 'ক্রমিক তালিকা (Numbered List)', en: 'Numbered List' },
    desc: { bn: '১, ২, ৩ ক্রমিক নম্বরযুক্ত তালিকা', en: 'Ordered sequential list' },
    keywords: ['number', 'ordered', 'ক্রমিক', 'নম্বর'],
    shortcut: '1. ',
    category: 'lists',
  },
  {
    id: 'dropcap',
    format: 'dropcap',
    icon: <Type size={16} className="cmd-icon-dropcap" />,
    label: { bn: 'অলঙ্কৃত ড্রপ ক্যাপ (Drop Cap)', en: 'Drop Cap (Large Initial)' },
    desc: { bn: 'অধ্যায়ের প্রথম অক্ষরকে বড় ও শৈল্পিক করা', en: 'Large decorative initial capital letter' },
    keywords: ['dropcap', 'initial', 'বড়অক্ষর', 'ড্রপক্যাপ'],
    category: 'literary',
  },
];

interface SlashCommandMenuProps {
  isOpen: boolean;
  query: string;
  position: { top: number; left: number } | null;
  lang: Language;
  onSelect: (command: SlashCommandItem) => void;
  onClose: () => void;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  isOpen,
  query,
  position,
  lang,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const cleanQuery = query.toLowerCase().trim();
  const filtered = SLASH_COMMANDS.filter((cmd) => {
    if (!cleanQuery) return true;
    return (
      cmd.label[lang].toLowerCase().includes(cleanQuery) ||
      cmd.label.en.toLowerCase().includes(cleanQuery) ||
      cmd.label.bn.toLowerCase().includes(cleanQuery) ||
      cmd.desc[lang].toLowerCase().includes(cleanQuery) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(cleanQuery))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        if (filtered.length > 0) {
          e.preventDefault();
          onSelect(filtered[selectedIndex] || filtered[0]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, filtered, selectedIndex, onSelect, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen || !position || filtered.length === 0) return null;

  return (
    <div
      className="slash-command-menu"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="slash-menu-header">
        <span className="slash-menu-title">
          {lang === 'bn' ? 'স্ল্যাশ কমান্ড' : 'Slash Commands'}
        </span>
        <span className="slash-menu-hint">
          {lang === 'bn' ? '↑↓ নেভিগেশন · ↵ নির্বাচন' : '↑↓ Navigate · ↵ Select'}
        </span>
      </div>

      <div className="slash-menu-list" ref={listRef}>
        {filtered.map((cmd, idx) => {
          const isActive = idx === selectedIndex;
          return (
            <button
              type="button"
              key={cmd.id}
              className={`slash-menu-item ${isActive ? 'active' : ''}`}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => onSelect(cmd)}
            >
              <div className="cmd-icon-box">{cmd.icon}</div>
              <div className="cmd-content">
                <div className="cmd-label-row">
                  <span className="cmd-label">{cmd.label[lang]}</span>
                  {cmd.shortcut && <span className="cmd-shortcut">{cmd.shortcut}</span>}
                </div>
                <span className="cmd-desc">{cmd.desc[lang]}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
