import React, { useState, useMemo } from 'react';
import { Search, Replace, X, Check, FileText, ArrowRight, CheckCheck } from 'lucide-react';
import { type Chapter } from '../api';
import { type Language } from '../i18n';

interface GlobalFindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  currentChapterId: string | null;
  lang: Language;
  onReplaceAll: (updatedChapters: Chapter[], replaceCount: number) => void;
  onSelectChapter: (chapterId: string) => void;
}

interface ChapterMatch {
  chapterId: string;
  chapterTitle: string;
  matchCount: number;
  snippets: { before: string; match: string; after: string; index: number }[];
}

export const GlobalFindReplaceModal: React.FC<GlobalFindReplaceModalProps> = ({
  isOpen,
  onClose,
  chapters,
  currentChapterId,
  lang,
  onReplaceAll,
  onSelectChapter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const results = useMemo((): ChapterMatch[] => {
    if (!searchTerm.trim()) return [];

    const query = matchCase ? searchTerm : searchTerm.toLowerCase();
    const matches: ChapterMatch[] = [];

    for (const c of chapters) {
      const text = c.text || '';
      const targetText = matchCase ? text : text.toLowerCase();
      let pos = 0;
      let count = 0;
      const snippets: { before: string; match: string; after: string; index: number }[] = [];

      while ((pos = targetText.indexOf(query, pos)) !== -1) {
        count++;
        const snippetStart = Math.max(0, pos - 35);
        const snippetEnd = Math.min(text.length, pos + query.length + 35);
        const before = text.substring(snippetStart, pos);
        const match = text.substring(pos, pos + query.length);
        const after = text.substring(pos + query.length, snippetEnd);

        if (snippets.length < 5) {
          snippets.push({ before, match, after, index: pos });
        }
        pos += Math.max(1, query.length);
      }

      if (count > 0) {
        matches.push({
          chapterId: c.id,
          chapterTitle: c.title || (lang === 'bn' ? 'শিরোনামহীন অধ্যায়' : 'Untitled Chapter'),
          matchCount: count,
          snippets,
        });
      }
    }

    return matches;
  }, [searchTerm, matchCase, chapters, lang]);

  const totalMatches = useMemo(() => {
    return results.reduce((acc, r) => acc + r.matchCount, 0);
  }, [results]);

  function handleExecuteReplaceAll() {
    if (!searchTerm.trim() || totalMatches === 0) return;

    let totalReplaced = 0;
    const query = searchTerm;
    const regexFlags = matchCase ? 'g' : 'gi';
    // Escape regex special chars
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, regexFlags);

    const updated = chapters.map((c) => {
      const oldText = c.text || '';
      const matches = oldText.match(regex);
      if (matches) {
        totalReplaced += matches.length;
        return {
          ...c,
          text: oldText.replace(regex, replaceTerm),
        };
      }
      return c;
    });

    onReplaceAll(updated, totalReplaced);
    setFeedback(
      lang === 'bn'
        ? `সমগ্র বইয়ের ${totalReplaced} টি জায়গায় সফলভাবে প্রতিস্থাপন করা হয়েছে!`
        : `Successfully replaced ${totalReplaced} instance(s) across entire book!`
    );

    setTimeout(() => {
      onClose();
    }, 1200);
  }

  if (!isOpen) return null;

  return (
    <div className="global-search-modal-overlay" onClick={onClose}>
      <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-header">
          <div className="title-area">
            <Search size={18} className="icon-search-brand" />
            <div>
              <h3>{lang === 'bn' ? 'গ্লোবাল প্রজেক্ট সার্চ ও রিপ্লেস' : 'Global Project Find & Replace'}</h3>
              <p>{lang === 'bn' ? 'সমগ্র বইয়ের সব অধ্যায়ে একসাথে শব্দ খুঁজুন ও প্রতিস্থাপন করুন' : 'Search and replace text across all chapters of this book'}</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="global-search-inputs">
          <div className="search-field-row">
            <div className="input-with-icon">
              <Search size={15} />
              <input
                type="text"
                autoFocus
                placeholder={lang === 'bn' ? 'কী শব্দ খুঁজতে চান... (উদা: চরিত্রের নাম)' : 'Find in all chapters... (e.g. character name)'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFeedback(null);
                }}
              />
            </div>

            <label className="match-case-toggle">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
              />
              <span>{lang === 'bn' ? 'হুবহু কেস (Aa)' : 'Match Case (Aa)'}</span>
            </label>
          </div>

          <div className="search-field-row">
            <div className="input-with-icon">
              <Replace size={15} />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'নতুন প্রতিস্থাপিত শব্দ লিখুন...' : 'Replace with...'}
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-replace-all-global"
              disabled={!searchTerm.trim() || totalMatches === 0}
              onClick={handleExecuteReplaceAll}
            >
              <CheckCheck size={14} />
              <span>
                {lang === 'bn'
                  ? `সব অধ্যায়ে প্রতিস্থাপন (${totalMatches})`
                  : `Replace All (${totalMatches})`}
              </span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="global-search-feedback">
            <Check size={16} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Results Stream */}
        <div className="global-search-results-pane">
          {searchTerm.trim() && (
            <div className="results-summary-bar">
              <span>
                {lang === 'bn'
                  ? `মোট ${results.length}টি অধ্যায়ে ${totalMatches}টি ফলাফল পাওয়া গেছে`
                  : `Found ${totalMatches} match(es) across ${results.length} chapter(s)`}
              </span>
            </div>
          )}

          {results.length === 0 && searchTerm.trim() && (
            <div className="no-results-state">
              <p>{lang === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি।' : 'No matches found.'}</p>
            </div>
          )}

          {results.map((r) => (
            <div key={r.chapterId} className="chapter-result-card">
              <div className="chapter-result-header">
                <div className="chapter-meta-info">
                  <FileText size={14} />
                  <strong>{r.chapterTitle}</strong>
                  {r.chapterId === currentChapterId && (
                    <span className="current-chapter-pill">
                      {lang === 'bn' ? 'বর্তমান অধ্যায়' : 'Current'}
                    </span>
                  )}
                </div>
                <div className="chapter-match-count">
                  {lang === 'bn' ? `${r.matchCount}টি মিল` : `${r.matchCount} matches`}
                </div>
              </div>

              <div className="snippets-list">
                {r.snippets.map((snip, sIdx) => (
                  <div
                    key={sIdx}
                    className="snippet-row"
                    onClick={() => {
                      onSelectChapter(r.chapterId);
                      onClose();
                    }}
                    title={lang === 'bn' ? 'এই অধ্যায়ে যান' : 'Jump to this chapter'}
                  >
                    <span>...{snip.before}</span>
                    <mark className="match-highlight">{snip.match}</mark>
                    <span>{snip.after}...</span>
                    <ArrowRight size={12} className="jump-arrow" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
