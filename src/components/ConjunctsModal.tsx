import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Copy, Check, Plus, X, BookA } from 'lucide-react';
import { type Language } from '../i18n';

interface ConjunctItem {
  char: string;
  breakdown: string;
  avro: string;
  example: string;
  category: string;
}

const CONJUNCTS_DATA: ConjunctItem[] = [
  // বিশেষ ও জটিল যুক্তবর্ণ
  { char: 'ক্ষ', breakdown: 'ক + ষ', avro: 'kSh / ksh', example: 'ক্ষমা, পরীক্ষা, বৃক্ষ', category: 'বিশেষ' },
  { char: 'জ্ঞ', breakdown: 'জ + ঞ', avro: 'jN / G', example: 'জ্ঞান, অজ্ঞ, বিজ্ঞান', category: 'বিশেষ' },
  { char: 'ষ্ণ', breakdown: 'ষ + ণ', avro: 'ShN', example: 'কৃষ্ণ, উষ্ণ, তৃষ্ণা', category: 'বিশেষ' },
  { char: 'হ্ন', breakdown: 'হ + ন (দন্ত্য-ন)', avro: 'hn', example: 'চিহ্ন, বহ্নি, মধ্যাহ্ন', category: 'বিশেষ' },
  { char: 'হ্ণ', breakdown: 'হ + ণ (মূর্ধন্য-ণ)', avro: 'hN', example: 'অপরাহ্ণ, সায়াহ্ণ', category: 'বিশেষ' },
  { char: 'হ্ম', breakdown: 'হ + ম', avro: 'hm', example: 'ব্রাহ্মণ, ব্রহ্মাণ্ড', category: 'বিশেষ' },
  { char: 'হ্ল', breakdown: 'হ + ল', avro: 'hl', example: 'আহ্লাদ, প্রহ্লাদ', category: 'বিশেষ' },
  { char: 'হৃ', breakdown: 'হ + ঋ-কার', avro: 'hrri / hS', example: 'হৃদয়, হৃৎপিণ্ড', category: 'বিশেষ' },
  { char: 'ঙ্ক্ষ', breakdown: 'ঙ + ক + ষ', avro: 'NgkSh', example: 'আকাঙ্ক্ষা', category: 'বিশেষ' },

  // ঙ ও ঞ বর্গ
  { char: 'ঙ্ক', breakdown: 'ঙ + ক', avro: 'Ngk / Nk', example: 'অঙ্ক, শঙ্কা, আতঙ্ক', category: 'ঙ/ঞ' },
  { char: 'ঙ্গ', breakdown: 'ঙ + গ', avro: 'Ngg / Ng', example: 'সঙ্গ, বঙ্গ, অঙ্গ', category: 'ঙ/ঞ' },
  { char: 'ঙ্ঘ', breakdown: 'ঙ + ঘ', avro: 'Nggh', example: 'সঙ্ঘ, জঙ্ঘা', category: 'ঙ/ঞ' },
  { char: 'ঞ্চ', breakdown: 'ঞ + চ', avro: 'Nc', example: 'পঞ্চ, মঞ্চ, চঞ্চল', category: 'ঙ/ঞ' },
  { char: 'ঞ্ছ', breakdown: 'ঞ + ছ', avro: 'Nch', example: 'বাঞ্ছা, বাঞ্ছনীয়', category: 'ঙ/ঞ' },
  { char: 'ঞ্জ', breakdown: 'ঞ + জ', avro: 'Nj', example: 'ব্যঞ্জন, কুঞ্জ, রঞ্জন', category: 'ঙ/ঞ' },
  { char: 'ঞ্ঝ', breakdown: 'ঞ + ঝ', avro: 'Njh', example: 'ঝঞ্ঝা, ঝঞ্ঝাট', category: 'ঙ/ঞ' },

  // ত ও ট বর্গ
  { char: 'ক্ত', breakdown: 'ক + ত', avro: 'kt', example: 'রক্ত, ভক্ত, শক্তি', category: 'ত/ট' },
  { char: 'ত্র', breakdown: 'ত + র-ফলা', avro: 'tr / tro', example: 'ছাত্র, রাত্রি, চরিত্র', category: 'ত/ট' },
  { char: 'ত্ব', breakdown: 'ত + ব-ফলা', avro: 'tw / tv', example: 'তত্ত্ব, গুরুত্ব, দাসত্ব', category: 'ত/ট' },
  { char: 'ত্ম', breakdown: 'ত + ম-ফলা', avro: 'tm', example: 'আত্মা, আত্মীয়, মহাত্মা', category: 'ত/ট' },
  { char: 'ত্ত', breakdown: 'ত + ত', avro: 'tt', example: 'উত্তম, বৃত্ত, উত্তর', category: 'ত/ট' },
  { char: 'ত্থ', breakdown: 'ত + থ', avro: 'tth', example: 'উত্থান, অশ্বত্থ', category: 'ত/ট' },
  { char: 'ট্ট', breakdown: 'ট + ট', avro: 'TT', example: 'চট্টগ্রাম, অট্টালিকা', category: 'ত/ট' },
  { char: 'ড্ড', breakdown: 'ড + ড', avro: 'DD', example: 'উড্ডীন, আড্ডা', category: 'ত/ট' },

  // ণ ও ন বর্গ
  { char: 'ণ্ট', breakdown: 'ণ + ট', avro: 'NT', example: 'ঘণ্টা, বণ্টন, লণ্ঠন', category: 'ণ/ন' },
  { char: 'ণ্ঠ', breakdown: 'ণ + ঠ', avro: 'NTh', example: 'কণ্ঠ, উৎকণ্ঠা', category: 'ণ/ন' },
  { char: 'ণ্ড', breakdown: 'ণ + ড', avro: 'ND', example: 'দণ্ড, পণ্ডিত, কাণ্ড', category: 'ণ/ন' },
  { char: 'ণ্ণ', breakdown: 'ণ + ণ', avro: 'NN', example: 'বিষণ্ণ, লাবণ্য', category: 'ণ/ন' },
  { char: 'ন্ত', breakdown: 'ন + ত', avro: 'nt', example: 'শান্ত, অন্ত, অনন্ত', category: 'ণ/ন' },
  { char: 'ন্থ', breakdown: 'ন + থ', avro: 'nth', example: 'গ্রন্থ, পন্থ, পান্থ', category: 'ণ/ন' },
  { char: 'ন্দ', breakdown: 'ন + দ', avro: 'nd', example: 'আনন্দ, ছন্দ, সুন্দর', category: 'ণ/ন' },
  { char: 'ন্ধ', breakdown: 'ন + ধ', avro: 'ndh', example: 'অন্ধ, বন্ধ, গন্ধ', category: 'ণ/ন' },
  { char: 'ন্ন', breakdown: 'ন + ন', avro: 'nn', example: 'অন্ন, প্রসন্ন, ভিন্ন', category: 'ণ/ন' },

  // ম ও প বর্গ
  { char: 'ম্প', breakdown: 'ম + প', avro: 'mp', example: 'সম্পদ, কম্পন, প্রদীপ', category: 'ম/প' },
  { char: 'ম্ফ', breakdown: 'ম + ফ', avro: 'mph', example: 'লম্ফ, গুম্ফ', category: 'ম/প' },
  { char: 'ম্ব', breakdown: 'ম + ব', avro: 'mb', example: 'অম্বল, কম্বল, সম্বরণ', category: 'ম/প' },
  { char: 'ম্ভ', breakdown: 'ম + ভ', avro: 'mbh', example: 'সম্ভব, আরম্ভ, গম্ভীর', category: 'ম/প' },
  { char: 'ম্ম', breakdown: 'ম + ম', avro: 'mm', example: 'সম্মান, সম্মতি, সম্মেলন', category: 'ম/প' },
  { char: 'প্ত', breakdown: 'প + ত', avro: 'pt', example: 'সুপ্ত, ব্যাপ্ত, প্রাপ্ত', category: 'ম/প' },

  // শ, ষ ও স বর্গ
  { char: 'শ্চ', breakdown: 'শ + চ', avro: 'Sc / shc', example: 'আশ্চর্য, নিশ্চয়, পশ্চিম', category: 'শ/ষ/স' },
  { char: 'শ্ছ', breakdown: 'শ + ছ', avro: 'Sch / shch', example: 'শিরশ্ছেদ', category: 'শ/ষ/স' },
  { char: 'শ্ন', breakdown: 'শ + ন', avro: 'Sn / shn', example: 'প্রশ্ন, বিশ্ন', category: 'শ/ষ/স' },
  { char: 'শ্ম', breakdown: 'শ + ম', avro: 'Sm / shm', example: 'শ্মশান, কাশ্মীর', category: 'শ/ষ/স' },
  { char: 'শ্র', breakdown: 'শ + র-ফলা', avro: 'Sr / shr', example: 'শ্রদ্ধা, বিশ্রাম, আশ্রয়', category: 'শ/ষ/স' },
  { char: 'ষ্ট', breakdown: 'ষ + ট', avro: 'ShT', example: 'কষ্ট, নষ্ট, সৃষ্টি', category: 'শ/ষ/স' },
  { char: 'ষ্ঠ', breakdown: 'ষ + ঠ', avro: 'ShTh', example: 'শ্রেষ্ঠ, ষষ্ঠ, অনুষ্ঠান', category: 'শ/ষ/স' },
  { char: 'ষ্ক', breakdown: 'ষ + ক', avro: 'Shk', example: 'শুষ্ক, নিষ্কর', category: 'শ/ষ/স' },
  { char: 'স্ত', breakdown: 'স + ত', avro: 'st', example: 'ব্যস্ত, সস্তা, পুস্তিকা', category: 'শ/ষ/স' },
  { char: 'স্থ', breakdown: 'স + থ', avro: 'sth', example: 'স্থান, স্বাস্থ্য, অবস্থা', category: 'শ/ষ/স' },
  { char: 'স্ন', breakdown: 'স + ন', avro: 'sn', example: 'স্নান, স্নেহ, স্নায়ু', category: 'শ/ষ/স' },
  { char: 'স্ম', breakdown: 'স + ম', avro: 'sm', example: 'স্মরণ, বিস্ময়, স্মারক', category: 'শ/ষ/স' },
  { char: 'স্প', breakdown: 'স + প', avro: 'sp', example: 'স্পষ্ট, স্পর্শ, স্পন্দন', category: 'শ/ষ/স' },
  { char: 'স্র', breakdown: 'স + র-ফলা', avro: 'sr', example: 'সহস্র, অজস্র, স্রষ্টা', category: 'শ/ষ/স' },
];

interface ConjunctsModalProps {
  lang: Language;
  onInsert: (char: string) => void;
  onClose: () => void;
}

export const ConjunctsModal: React.FC<ConjunctsModalProps> = ({ lang, onInsert, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [copiedChar, setCopiedChar] = useState<string | null>(null);

  const categories = ['all', 'বিশেষ', 'ঙ/ঞ', 'ত/ট', 'ণ/ন', 'ম/প', 'শ/ষ/স'];

  const filtered = useMemo(() => {
    return CONJUNCTS_DATA.filter((item) => {
      const matchCat = selectedCat === 'all' || item.category === selectedCat;
      const matchQuery =
        !query.trim() ||
        item.char.includes(query.trim()) ||
        item.breakdown.includes(query.trim()) ||
        item.avro.toLowerCase().includes(query.toLowerCase().trim()) ||
        item.example.includes(query.trim());
      return matchCat && matchQuery;
    });
  }, [query, selectedCat]);

  function handleCopy(char: string) {
    navigator.clipboard.writeText(char);
    setCopiedChar(char);
    setTimeout(() => setCopiedChar(null), 1500);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box conjuncts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-flex">
            <BookA size={20} color="#20644f" />
            <h3>{lang === 'bn' ? 'বাংলা যুক্তবর্ণ ও টাইপিং সহায়িকা' : 'Bangla Conjuncts Cheat Sheet'}</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Search & Filter */}
        <div className="conjuncts-toolbar">
          <div className="conjuncts-search-box">
            <Search size={15} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'যুক্তবর্ণ, ফোনেটিক কী (যেমন: kSh, jN, ষ্ণ) খুঁজুন...' : 'Search by character, breakdown or Avro key...'}
              autoFocus
            />
          </div>

          <div className="conjuncts-cat-tabs">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={'cat-tab-btn ' + (selectedCat === c ? 'active' : '')}
                onClick={() => setSelectedCat(c)}
              >
                {c === 'all' ? (lang === 'bn' ? 'সবগুলো' : 'All') : c}
              </button>
            ))}
          </div>
        </div>

        {/* Conjuncts Grid */}
        <div className="conjuncts-grid-container">
          {filtered.length === 0 ? (
            <div className="conjuncts-empty-note">
              {lang === 'bn' ? 'কোনো যুক্তবর্ণ পাওয়া যায়নি।' : 'No conjuncts match your search.'}
            </div>
          ) : (
            <div className="conjuncts-card-grid">
              {filtered.map((item) => (
                <div key={item.char} className="conjunct-card">
                  <div className="conjunct-main-char">{item.char}</div>

                  <div className="conjunct-details">
                    <div className="conjunct-breakdown">
                      <span>{item.breakdown}</span>
                    </div>
                    <div className="conjunct-avro-key">
                      <code>{item.avro}</code>
                    </div>
                    <div className="conjunct-example">{item.example}</div>
                  </div>

                  <div className="conjunct-card-actions">
                    <button
                      type="button"
                      className="conjunct-action-btn primary"
                      onClick={() => {
                        onInsert(item.char);
                      }}
                      title={lang === 'bn' ? 'এডিটরে ইনসার্ট করুন' : 'Insert into editor'}
                    >
                      <Plus size={13} /> {lang === 'bn' ? 'যুক্ত করুন' : 'Insert'}
                    </button>
                    <button
                      type="button"
                      className="conjunct-action-btn copy"
                      onClick={() => handleCopy(item.char)}
                      title="Copy"
                    >
                      {copiedChar === item.char ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
