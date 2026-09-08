import React from 'react';
import { Bold, Italic, Heading2, Heading3, Quote, Bookmark, Sparkles, MessageSquarePlus, Divide, Minus } from 'lucide-react';
import { type Language } from '../i18n';

interface FloatingBubbleToolbarProps {
  position: { top: number; left: number } | null;
  lang: Language;
  onFormat: (format: 'bold' | 'italic' | 'quote' | 'single-quote' | 'h2' | 'h3' | 'emdash' | 'scene-break' | 'mark' | 'comment') => void;
}

export const FloatingBubbleToolbar: React.FC<FloatingBubbleToolbarProps> = ({
  position,
  lang,
  onFormat,
}) => {
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
      <button
        type="button"
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('bold')}
        title={lang === 'bn' ? 'গাঢ় (Bold) **লেখা**' : 'Bold **text**'}
      >
        <Bold size={13} />
      </button>

      <button
        type="button"
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('italic')}
        title={lang === 'bn' ? 'বাঁকা (Italic) *লেখা*' : 'Italic *text*'}
      >
        <Italic size={13} />
      </button>

      <button
        type="button"
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('quote')}
        title={lang === 'bn' ? 'বাংলা উদ্ধৃতি (“ ”)' : 'Bengali Curly Quotes (“ ”)'}
      >
        <Quote size={13} />
      </button>

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

      <button
        type="button"
        className="bubble-btn text-icon"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('h2')}
        title={lang === 'bn' ? 'উপ-শিরোনাম (H2)' : 'Subheading (H2)'}
      >
        H2
      </button>

      <button
        type="button"
        className="bubble-btn text-icon"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('h3')}
        title={lang === 'bn' ? 'ছোট শিরোনাম (H3)' : 'Minor Heading (H3)'}
      >
        H3
      </button>

      <button
        type="button"
        className="bubble-btn text-icon"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('emdash')}
        title={lang === 'bn' ? 'সাহিত্যিক ড্যাশ (—)' : 'Em Dash (—)'}
      >
        —
      </button>

      <button
        type="button"
        className="bubble-btn text-icon"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('scene-break')}
        title={lang === 'bn' ? 'দৃশ্য বিভাজক (❖ ❖ ❖)' : 'Scene Divider (❖ ❖ ❖)'}
      >
        ❖
      </button>

      <span className="bubble-divider" />

      <button
        type="button"
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('mark')}
        title={lang === 'bn' ? 'হাইলাইট রঙ' : 'Highlight Tag'}
      >
        <Sparkles size={13} />
      </button>

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
