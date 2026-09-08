import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  Sparkles,
  MessageSquarePlus,
  MessageSquareQuote,
  Feather,
  ChevronDown,
} from 'lucide-react';
import { type Language } from '../i18n';

interface FloatingBubbleToolbarProps {
  position: { top: number; left: number } | null;
  lang: Language;
  onFormat: (format: string) => void;
}

export const FloatingBubbleToolbar: React.FC<FloatingBubbleToolbarProps> = ({
  position,
  lang,
  onFormat,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMotifsPicker, setShowMotifsPicker] = useState(false);

  if (!position) return null;

  return (
    <div
      className="floating-bubble-toolbar"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => {
        // Prevent losing selection focus in textarea
        e.preventDefault();
      }}
    >
      {/* Bold */}
      <button
        type="button"
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('bold')}
        title={lang === 'bn' ? 'গাঢ় (Bold) **লেখা** [Ctrl+B]' : 'Bold **text** [Ctrl+B]'}
      >
        <Bold size={13} />
      </button>

      {/* Italic */}
      <button
        type="button"
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('italic')}
        title={lang === 'bn' ? 'বাঁকা (Italic) *লেখা* [Ctrl+I]' : 'Italic *text* [Ctrl+I]'}
      >
        <Italic size={13} />
      </button>

      {/* Bengali Dialogue */}
      <button
        type="button"
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('dialogue')}
        title={lang === 'bn' ? 'বাংলা সাহিত্যিক সংলাপ — “উক্তি” [Ctrl+Shift+D]' : 'Bengali Dialogue — “Quote” [Ctrl+Shift+D]'}
      >
        <MessageSquareQuote size={13} />
      </button>

      {/* Quotes */}
      <button
        type="button"
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('quote')}
        title={lang === 'bn' ? 'বাংলা উদ্ধৃতি (“ ”)' : 'Bengali Curly Quotes (“ ”)'}
      >
        <Quote size={13} />
      </button>

      {/* Single Quotes */}
      <button
        type="button"
        className="bubble-btn text-icon"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('single-quote')}
        title={lang === 'bn' ? 'একক উদ্ধৃতি (‘ ’)' : 'Single Quotes (‘ ’)'}
      >
        ‘ ’
      </button>

      <span className="bubble-divider" />

      {/* H2 */}
      <button
        type="button"
        className="bubble-btn text-icon"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('h2')}
        title={lang === 'bn' ? 'উপ-শিরোনাম (H2)' : 'Subheading (H2)'}
      >
        H2
      </button>

      {/* H3 */}
      <button
        type="button"
        className="bubble-btn text-icon"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('h3')}
        title={lang === 'bn' ? 'ছোট শিরোনাম (H3)' : 'Minor Heading (H3)'}
      >
        H3
      </button>

      {/* Em Dash */}
      <button
        type="button"
        className="bubble-btn text-icon"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('emdash')}
        title={lang === 'bn' ? 'সাহিত্যিক ড্যাশ (—)' : 'Em Dash (—)'}
      >
        —
      </button>

      {/* Scene Break with Motifs Dropdown */}
      <div className="bubble-dropdown-container">
        <button
          type="button"
          className="bubble-btn text-icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowMotifsPicker((prev) => !prev)}
          title={lang === 'bn' ? 'দৃশ্য বিভাজক মোটিফ (❖, ❦, ✦)' : 'Scene Break Motifs'}
        >
          ❖ <ChevronDown size={9} style={{ marginLeft: 2 }} />
        </button>

        {showMotifsPicker && (
          <div className="bubble-popover-menu motifs-menu" onMouseDown={(e) => e.preventDefault()}>
            <button
              type="button"
              className="popover-item"
              onClick={() => {
                onFormat('divider-diamond');
                setShowMotifsPicker(false);
              }}
            >
              ❖ ❖ ❖ <span className="item-label">{lang === 'bn' ? 'ডায়মন্ড স্টার' : 'Diamonds'}</span>
            </button>
            <button
              type="button"
              className="popover-item"
              onClick={() => {
                onFormat('divider-floral');
                setShowMotifsPicker(false);
              }}
            >
              ~ ❦ ~ <span className="item-label">{lang === 'bn' ? 'ফ্লোরাল হার্ট' : 'Floral'}</span>
            </button>
            <button
              type="button"
              className="popover-item"
              onClick={() => {
                onFormat('divider-sparkle');
                setShowMotifsPicker(false);
              }}
            >
              — ✦ — <span className="item-label">{lang === 'bn' ? 'স্পার্কল' : 'Sparkle'}</span>
            </button>
            <button
              type="button"
              className="popover-item"
              onClick={() => {
                onFormat('divider-asterisk');
                setShowMotifsPicker(false);
              }}
            >
              * * * <span className="item-label">{lang === 'bn' ? 'অ্যাস্টেরিস্ক' : 'Asterisks'}</span>
            </button>
            <button
              type="button"
              className="popover-item"
              onClick={() => {
                onFormat('divider-leaf');
                setShowMotifsPicker(false);
              }}
            >
              ❧ ❧ ❧ <span className="item-label">{lang === 'bn' ? 'আইভি লিফ' : 'Ivy Leaf'}</span>
            </button>
          </div>
        )}
      </div>

      <span className="bubble-divider" />

      {/* Multi-Color Highlighter */}
      <div className="bubble-dropdown-container">
        <button
          type="button"
          className="bubble-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowColorPicker((prev) => !prev)}
          title={lang === 'bn' ? 'রঙিন মার্কার হাইলাইট' : 'Color Highlighter'}
        >
          <Sparkles size={13} />
        </button>

        {showColorPicker && (
          <div className="bubble-popover-menu colors-menu" onMouseDown={(e) => e.preventDefault()}>
            <button
              type="button"
              className="color-dot yellow"
              onClick={() => {
                onFormat('mark-yellow');
                setShowColorPicker(false);
              }}
              title={lang === 'bn' ? 'হলুদ (মূল প্লট / গুরুত্বপূর্ণ)' : 'Yellow (Plot/Core)'}
            />
            <button
              type="button"
              className="color-dot green"
              onClick={() => {
                onFormat('mark-green');
                setShowColorPicker(false);
              }}
              title={lang === 'bn' ? 'সবুজ (তথ্যসূত্র / সত্যতা)' : 'Green (Fact/Source)'}
            />
            <button
              type="button"
              className="color-dot purple"
              onClick={() => {
                onFormat('mark-purple');
                setShowColorPicker(false);
              }}
              title={lang === 'bn' ? 'বেগুনি (চরিত্রের বৈশিষ্ট্য)' : 'Purple (Character)'}
            />
            <button
              type="button"
              className="color-dot pink"
              onClick={() => {
                onFormat('mark-pink');
                setShowColorPicker(false);
              }}
              title={lang === 'bn' ? 'গোলাপি (পরিমার্জন প্রয়োজন)' : 'Pink (Revise)'}
            />
          </div>
        )}
      </div>

      {/* Add Comment */}
      <button
        type="button"
        className="bubble-btn comment-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('comment')}
        title={lang === 'bn' ? 'মন্তব্য বা নোট যোগ করুন' : 'Add Comment / Annotation'}
      >
        <MessageSquarePlus size={13} />
      </button>
    </div>
  );
};
