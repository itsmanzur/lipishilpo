import React, { useState } from 'react';
import { BookA, Plus, Trash2, X, Search, Check, Sparkles } from 'lucide-react';
import { type Language } from '../i18n';

interface PersonalDictionaryModalProps {
  isOpen: boolean;
  lang: Language;
  dictionary: string[];
  onSaveDictionary: (newDict: string[]) => void;
  onClose: () => void;
}

export const PersonalDictionaryModal: React.FC<PersonalDictionaryModalProps> = ({
  isOpen,
  lang,
  dictionary,
  onSaveDictionary,
  onClose,
}) => {
  const [newWordsInput, setNewWordsInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const filteredWords = dictionary.filter((w) =>
    w.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleAddWords = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordsInput.trim()) return;

    // Split by comma, newline or spaces
    const added = newWordsInput
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1);

    if (added.length === 0) return;

    const merged = Array.from(new Set([...dictionary, ...added]));
    onSaveDictionary(merged);
    setNewWordsInput('');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleRemoveWord = (wordToRemove: string) => {
    const updated = dictionary.filter((w) => w !== wordToRemove);
    onSaveDictionary(updated);
  };

  const handleClearAll = () => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে সকল শব্দ মুছে ফেলতে চান?' : 'Are you sure you want to clear all custom words?')) {
      onSaveDictionary([]);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content personal-dict-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">
              <BookA size={18} />
            </span>
            <div>
              <h3>{lang === 'bn' ? 'আমার সাহিত্যিক শব্দকোষ ও চরিত্র তালিকা' : 'Personal Dictionary & Character Lore'}</h3>
              <p className="modal-subtitle">
                {lang === 'bn'
                  ? 'উপন্যাসের চরিত্রের নাম, কাল্পনিক স্থান বা আঞ্চলিক শব্দ যোগ করুন যেন প্রুফরিডিংয়ে ভুল না ধরে।'
                  : 'Add custom character names, fantasy places, or dialects to exclude from spell-checking.'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Add words input box */}
          <form onSubmit={handleAddWords} className="dict-add-box">
            <label>
              {lang === 'bn' ? 'নতুন শব্দ বা চরিত্রের নাম লিখুন (কমা বা নতুন লাইনে একাধিক দিতে পারেন):' : 'Add new words or names (comma/newline separated):'}
            </label>
            <div className="dict-input-row">
              <textarea
                value={newWordsInput}
                onChange={(e) => setNewWordsInput(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: নীলাঞ্জনা, মায়াবতী, সুধারাম, ছদ্মবেশী' : 'e.g. Aethelgard, Xylar, Shadhin'}
                rows={2}
              />
              <button type="submit" className="primary dict-add-submit" disabled={!newWordsInput.trim()}>
                <Plus size={16} /> {lang === 'bn' ? 'যুক্ত করুন' : 'Add Words'}
              </button>
            </div>
            {savedNotice && (
              <span className="dict-saved-toast">
                <Check size={14} /> {lang === 'bn' ? 'শব্দকোষ সফলভাবে সংরক্ষিত হয়েছে!' : 'Words saved to dictionary!'}
              </span>
            )}
          </form>

          <hr className="modal-divider" />

          {/* Search & List */}
          <div className="dict-list-header">
            <div className="dict-search-wrap">
              <Search size={14} />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'শব্দ খুঁজুন...' : 'Search words...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="dict-meta-count">
              <span>{lang === 'bn' ? `মোট শব্দ: ${dictionary.length}` : `Total Words: ${dictionary.length}`}</span>
              {dictionary.length > 0 && (
                <button type="button" className="dict-clear-all" onClick={handleClearAll}>
                  {lang === 'bn' ? 'সব মুছুন' : 'Clear All'}
                </button>
              )}
            </div>
          </div>

          <div className="dict-tags-cloud">
            {filteredWords.length === 0 ? (
              <div className="dict-empty-state">
                <Sparkles size={24} />
                <p>
                  {searchQuery
                    ? (lang === 'bn' ? 'কোনো শব্দ পাওয়া যায়নি।' : 'No matching words found.')
                    : (lang === 'bn' ? 'আপনার ব্যক্তিগত শব্দকোষ এখনও খালি। উপরে নতুন শব্দ যোগ করুন।' : 'Your personal dictionary is empty.')}
                </p>
              </div>
            ) : (
              filteredWords.map((word) => (
                <span key={word} className="dict-chip">
                  <span className="dict-chip-text">{word}</span>
                  <button
                    type="button"
                    className="dict-chip-remove"
                    onClick={() => handleRemoveWord(word)}
                    title={lang === 'bn' ? 'মুছে ফেলুন' : 'Remove word'}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="primary full" onClick={onClose}>
            {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};