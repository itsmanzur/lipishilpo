import React from 'react';
import { ChevronLeft, ChevronRight, Check, X, BookA, Sparkles, AlertCircle } from 'lucide-react';
import type { ProofMatch } from '../proofread-types';
import { type Language } from '../i18n';

interface ProofreadWalkthroughBarProps {
  lang: Language;
  issues: ProofMatch[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onAcceptFix: (issue: ProofMatch) => void;
  onAddToDictionary: (word: string) => void;
  onClose: () => void;
}

export const ProofreadWalkthroughBar: React.FC<ProofreadWalkthroughBarProps> = ({
  lang,
  issues,
  currentIndex,
  onSelectIndex,
  onAcceptFix,
  onAddToDictionary,
  onClose,
}) => {
  if (issues.length === 0) return null;

  const safeIndex = Math.max(0, Math.min(currentIndex, issues.length - 1));
  const currentIssue = issues[safeIndex];

  const handlePrev = () => {
    if (safeIndex > 0) {
      onSelectIndex(safeIndex - 1);
    } else {
      onSelectIndex(issues.length - 1);
    }
  };

  const handleNext = () => {
    if (safeIndex < issues.length - 1) {
      onSelectIndex(safeIndex + 1);
    } else {
      onSelectIndex(0);
    }
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'spelling':
        return { label: lang === 'bn' ? 'প্রমিত বানান' : 'Spelling', color: '#e03b3b', bg: '#fee2e2' };
      case 'grammar':
        return { label: lang === 'bn' ? 'ব্যাকরণ ও বাহুল্য' : 'Grammar', color: '#d97706', bg: '#fef3c7' };
      case 'punctuation':
        return { label: lang === 'bn' ? 'বিরামচিহ্ন' : 'Punctuation', color: '#7c3aed', bg: '#ede9fe' };
      default:
        return { label: lang === 'bn' ? 'শৈলী ও রূপ' : 'Style', color: '#2563eb', bg: '#dbeafe' };
    }
  };

  const cat = getCategoryBadge(currentIssue?.category);

  return (
    <div className="proofread-walkthrough-bar">
      <div className="walkthrough-left">
        <span className="walkthrough-badge" style={{ color: cat.color, background: cat.bg }}>
          <AlertCircle size={13} /> {cat.label}
        </span>
        <div className="walkthrough-counter">
          <span>
            {lang === 'bn' ? `পরামর্শ ${safeIndex + 1} / ${issues.length}` : `Issue ${safeIndex + 1} of ${issues.length}`}
          </span>
          <div className="walkthrough-nav-btns">
            <button
              type="button"
              className="walkthrough-nav-btn"
              onClick={handlePrev}
              title={lang === 'bn' ? 'পূর্ববর্তী ভুল (Shift+Tab)' : 'Previous issue'}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="walkthrough-nav-btn"
              onClick={handleNext}
              title={lang === 'bn' ? 'পরবর্তী ভুল (Tab)' : 'Next issue'}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="walkthrough-center">
        <div className="walkthrough-replacement-pill">
          <del className="walkthrough-from">{currentIssue.from}</del>
          <span className="walkthrough-arrow">➔</span>
          <strong className="walkthrough-to">{currentIssue.to}</strong>
        </div>
        {currentIssue.why && <span className="walkthrough-why" title={currentIssue.why}>💡 {currentIssue.why}</span>}
      </div>

      <div className="walkthrough-right">
        <button
          type="button"
          className="walkthrough-accept-btn"
          onClick={() => onAcceptFix(currentIssue)}
          title={lang === 'bn' ? 'সংশোধন গ্রহণ করুন (Enter)' : 'Accept Fix (Enter)'}
        >
          <Check size={14} />
          <span>{lang === 'bn' ? `"${currentIssue.to}" গ্রহণ করুন` : `Accept`}</span>
          <kbd className="key-hint">↵ Enter</kbd>
        </button>

        <button
          type="button"
          className="walkthrough-dict-btn"
          onClick={() => onAddToDictionary(currentIssue.from)}
          title={lang === 'bn' ? 'শব্দকোষে যোগ করুন' : 'Add to personal dictionary'}
        >
          <BookA size={14} />
          <span>{lang === 'bn' ? 'শব্দকোষে যোগ' : 'Dictionary'}</span>
        </button>

        <button
          type="button"
          className="walkthrough-close-btn"
          onClick={onClose}
          title={lang === 'bn' ? 'বন্ধ করুন (Esc)' : 'Close (Esc)'}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};