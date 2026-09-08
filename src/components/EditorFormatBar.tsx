import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Box,
  Bookmark,
  Keyboard,
  MessageSquareQuote,
  Feather,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
  Type,
} from 'lucide-react';
import { type Language } from '../i18n';

type Props = {
  lang: Language;
  onFormat: (format: string) => void;
  onOpenCheatSheet: () => void;
};

export function EditorFormatBar({ lang, onFormat, onOpenCheatSheet }: Props) {
  const bn = lang === 'bn';
  const [moreOpen, setMoreOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [motifsOpen, setMotifsOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen && !colorsOpen) return;
    function onDoc(e: MouseEvent) {
      const node = moreRef.current;
      if (node && e.target instanceof Node && !node.contains(e.target)) {
        setMoreOpen(false);
        setColorsOpen(false);
        setMotifsOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [moreOpen, colorsOpen]);

  function run(format: string) {
    onFormat(format);
    setMoreOpen(false);
    setColorsOpen(false);
    setMotifsOpen(false);
  }

  return (
    <div className="editor-quick-format-bar" onMouseDown={(e) => e.preventDefault()}>
      <div className="format-btn-group">
        <button
          type="button"
          className="format-action-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run('bold')}
          title={bn ? 'গাঢ় করুন (Bold) **লেখা** [Ctrl+B]' : 'Bold **text** [Ctrl+B]'}
        >
          <Bold size={13} />
        </button>
        <button
          type="button"
          className="format-action-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run('italic')}
          title={bn ? 'বাঁকা করুন (Italic) *লেখা* [Ctrl+I]' : 'Italic *text* [Ctrl+I]'}
        >
          <Italic size={13} />
        </button>
      </div>

      <span className="format-divider" />

      <div className="format-btn-group">
        <button
          type="button"
          className="format-action-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run('dialogue')}
          title={bn ? 'সংলাপ — “উক্তি” [Ctrl+Shift+D]' : 'Dialogue — “Quote” [Ctrl+Shift+D]'}
        >
          <MessageSquareQuote size={13} />
          <span>{bn ? 'সংলাপ' : 'Dialogue'}</span>
        </button>
        <button
          type="button"
          className="format-action-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run('heading')}
          title={bn ? 'উপ-শিরোনাম (Subheading) ## সেকশন' : 'Subheading ## Section'}
        >
          <Heading2 size={13} />
          <span>H2</span>
        </button>
        <button
          type="button"
          className="format-action-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run('quote')}
          title={bn ? 'উদ্ধৃতি বা এপিগ্রাফ (Quote) > উক্তি' : 'Quote > Text'}
        >
          <Quote size={13} />
          <span>{bn ? 'উদ্ধৃতি' : 'Quote'}</span>
        </button>
      </div>

      <span className="format-divider" />

      <div className="format-btn-group format-overflow-host" ref={moreRef}>
        <div className="format-dropdown-wrap">
          <button
            type="button"
            className="format-action-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setColorsOpen((v) => !v);
              setMoreOpen(false);
              setMotifsOpen(false);
            }}
            title={bn ? 'রঙিন মার্কার হাইলাইট' : 'Color highlighter'}
          >
            <Sparkles size={13} />
            <span>{bn ? 'হাইলাইট' : 'Highlight'}</span>
            <ChevronDown size={11} />
          </button>
          {colorsOpen && (
            <div className="format-more-menu format-colors-menu" onMouseDown={(e) => e.preventDefault()}>
              <button type="button" className="color-dot yellow" onClick={() => run('mark-yellow')} title={bn ? 'হলুদ' : 'Yellow'} />
              <button type="button" className="color-dot green" onClick={() => run('mark-green')} title={bn ? 'সবুজ' : 'Green'} />
              <button type="button" className="color-dot purple" onClick={() => run('mark-purple')} title={bn ? 'বেগুনি' : 'Purple'} />
              <button type="button" className="color-dot pink" onClick={() => run('mark-pink')} title={bn ? 'গোলাপি' : 'Pink'} />
            </div>
          )}
        </div>

        <div className="format-dropdown-wrap">
          <button
            type="button"
            className={'format-action-btn' + (moreOpen ? ' is-open' : '')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setMoreOpen((v) => !v);
              setColorsOpen(false);
              setMotifsOpen(false);
            }}
            title={bn ? 'আরও ফরম্যাট' : 'More formatting'}
            aria-expanded={moreOpen}
          >
            <MoreHorizontal size={13} />
            <span>{bn ? 'আরও' : 'More'}</span>
          </button>
          {moreOpen && (
            <div className="format-more-menu" role="menu" onMouseDown={(e) => e.preventDefault()}>
              <button type="button" className="format-more-item" onClick={() => run('h3')}>
                <Heading3 size={13} />
                <span>{bn ? 'ছোট শিরোনাম (H3)' : 'Heading (H3)'}</span>
              </button>
              <button type="button" className="format-more-item" onClick={() => run('poem')}>
                <Feather size={13} />
                <span>{bn ? 'কবিতা ও স্তবক' : 'Poem'}</span>
              </button>
              <button type="button" className="format-more-item" onClick={() => run('callout')}>
                <Box size={13} />
                <span>{bn ? 'তথ্য / ইসলামিক বক্স' : 'Callout box'}</span>
              </button>
              <button type="button" className="format-more-item" onClick={() => run('citation')}>
                <Bookmark size={13} />
                <span>{bn ? 'তথ্যসূত্র' : 'Citation'}</span>
              </button>
              <button type="button" className="format-more-item" onClick={() => run('footnote')}>
                <span className="format-more-glyph">[^১]</span>
                <span>{bn ? 'পাদটীকা' : 'Footnote'}</span>
              </button>
              <button type="button" className="format-more-item" onClick={() => run('dropcap')}>
                <Type size={13} />
                <span>{bn ? 'ড্রপ ক্যাপ' : 'Drop cap'}</span>
              </button>
              <button type="button" className="format-more-item" onClick={() => run('list')}>
                <List size={13} />
                <span>{bn ? 'বুলেট তালিকা' : 'Bullet list'}</span>
              </button>
              <button type="button" className="format-more-item" onClick={() => run('number')}>
                <ListOrdered size={13} />
                <span>{bn ? 'ক্রমিক তালিকা' : 'Numbered list'}</span>
              </button>
              <div className="format-more-split">
                <button
                  type="button"
                  className="format-more-item"
                  onClick={() => setMotifsOpen((v) => !v)}
                >
                  <span className="format-more-glyph">❖</span>
                  <span>{bn ? 'দৃশ্য বিভাজক' : 'Scene break'}</span>
                  <ChevronDown size={11} />
                </button>
                {motifsOpen && (
                  <div className="format-motif-list">
                    <button type="button" className="format-more-item" onClick={() => run('divider-diamond')}>
                      ❖ ❖ ❖ <span className="format-more-hint">{bn ? 'ডায়মন্ড' : 'Diamonds'}</span>
                    </button>
                    <button type="button" className="format-more-item" onClick={() => run('divider-floral')}>
                      ~ ❦ ~ <span className="format-more-hint">{bn ? 'ফ্লোরাল' : 'Floral'}</span>
                    </button>
                    <button type="button" className="format-more-item" onClick={() => run('divider-sparkle')}>
                      — ✦ — <span className="format-more-hint">{bn ? 'স্পার্কল' : 'Sparkle'}</span>
                    </button>
                    <button type="button" className="format-more-item" onClick={() => run('divider-asterisk')}>
                      * * * <span className="format-more-hint">{bn ? 'অ্যাস্টেরিস্ক' : 'Asterisks'}</span>
                    </button>
                    <button type="button" className="format-more-item" onClick={() => run('divider-leaf')}>
                      ❧ ❧ ❧ <span className="format-more-hint">{bn ? 'আইভি' : 'Ivy'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <span className="format-divider" />

      <div className="format-btn-group">
        <button
          type="button"
          className="format-action-btn cheatsheet-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onOpenCheatSheet}
          title={bn ? 'ফরম্যাটিং চিটশিট সহায়িকা [Ctrl+/]' : 'Formatting Cheat Sheet [Ctrl+/]'}
        >
          <Keyboard size={13} />
          <span>{bn ? 'চিটশিট' : 'Cheat Sheet'}</span>
        </button>
      </div>
    </div>
  );
}
