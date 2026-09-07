import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Compass, Shield, Heart, Sparkles, BookOpen, ChevronRight, X, Check } from 'lucide-react';
import { type Language } from '../i18n';

export interface CodexCharacter {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  age?: string;
  traits?: string;
  goal?: string;
  notes?: string;
  color?: string;
}

export interface CodexLore {
  id: string;
  title: string;
  category: 'location' | 'faction' | 'history' | 'rule' | 'other';
  summary: string;
}

export interface ProjectCodex {
  characters: CodexCharacter[];
  lore: CodexLore[];
}

interface CodexPanelProps {
  codex?: ProjectCodex;
  lang: Language;
  onUpdateCodex: (codex: ProjectCodex) => void;
  onInsertText: (text: string) => void;
}

const ROLE_COLORS: Record<CodexCharacter['role'], { bg: string; text: string; labelEn: string; labelBn: string }> = {
  protagonist: { bg: '#dcfce7', text: '#15803d', labelEn: 'Protagonist', labelBn: 'প্রধান চরিত্র' },
  antagonist: { bg: '#fee2e2', text: '#b91c1c', labelEn: 'Antagonist', labelBn: 'খল চরিত্র' },
  supporting: { bg: '#e0f2fe', text: '#0369a1', labelEn: 'Supporting', labelBn: 'সহকারী চরিত্র' },
  minor: { bg: '#f1f5f9', text: '#475569', labelEn: 'Minor', labelBn: 'পার্শ্ব চরিত্র' },
};

export const CodexPanel: React.FC<CodexPanelProps> = ({
  codex = { characters: [], lore: [] },
  lang,
  onUpdateCodex,
  onInsertText,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'characters' | 'lore'>('characters');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);

  // Form state for new/edit character
  const [charName, setCharName] = useState('');
  const [charRole, setCharRole] = useState<CodexCharacter['role']>('protagonist');
  const [charAge, setCharAge] = useState('');
  const [charTraits, setCharTraits] = useState('');
  const [charGoal, setCharGoal] = useState('');
  const [charNotes, setCharNotes] = useState('');

  // Form state for Lore
  const [loreTitle, setLoreTitle] = useState('');
  const [loreCategory, setLoreCategory] = useState<CodexLore['category']>('location');
  const [loreSummary, setLoreSummary] = useState('');

  const characters = codex.characters || [];
  const loreList = codex.lore || [];

  function handleSaveCharacter(e: React.FormEvent) {
    e.preventDefault();
    if (!charName.trim()) return;

    let updatedChars: CodexCharacter[];
    if (editingCharacterId) {
      updatedChars = characters.map((c) =>
        c.id === editingCharacterId
          ? {
              ...c,
              name: charName.trim(),
              role: charRole,
              age: charAge.trim(),
              traits: charTraits.trim(),
              goal: charGoal.trim(),
              notes: charNotes.trim(),
            }
          : c
      );
    } else {
      const newChar: CodexCharacter = {
        id: 'char_' + Date.now(),
        name: charName.trim(),
        role: charRole,
        age: charAge.trim(),
        traits: charTraits.trim(),
        goal: charGoal.trim(),
        notes: charNotes.trim(),
      };
      updatedChars = [...characters, newChar];
    }

    onUpdateCodex({ ...codex, characters: updatedChars });
    resetCharForm();
  }

  function handleSaveLore(e: React.FormEvent) {
    e.preventDefault();
    if (!loreTitle.trim()) return;

    const newLore: CodexLore = {
      id: 'lore_' + Date.now(),
      title: loreTitle.trim(),
      category: loreCategory,
      summary: loreSummary.trim(),
    };

    onUpdateCodex({ ...codex, lore: [...loreList, newLore] });
    setLoreTitle('');
    setLoreSummary('');
    setShowAddModal(false);
  }

  function handleDeleteCharacter(id: string) {
    const updated = characters.filter((c) => c.id !== id);
    onUpdateCodex({ ...codex, characters: updated });
  }

  function handleDeleteLore(id: string) {
    const updated = loreList.filter((l) => l.id !== id);
    onUpdateCodex({ ...codex, lore: updated });
  }

  function resetCharForm() {
    setCharName('');
    setCharRole('protagonist');
    setCharAge('');
    setCharTraits('');
    setCharGoal('');
    setCharNotes('');
    setEditingCharacterId(null);
    setShowAddModal(false);
  }

  function openEditCharacter(c: CodexCharacter) {
    setEditingCharacterId(c.id);
    setCharName(c.name);
    setCharRole(c.role);
    setCharAge(c.age || '');
    setCharTraits(c.traits || '');
    setCharGoal(c.goal || '');
    setCharNotes(c.notes || '');
    setShowAddModal(true);
  }

  return (
    <div className="codex-panel">
      <div className="check-intro">
        <div className="codex-header-row">
          <Users size={18} color="#0f766e" />
          <div>
            <strong>{lang === 'bn' ? 'চরিত্র ও বিশ্ব কডেক্স' : 'Character & World Codex'}</strong>
            <p>{lang === 'bn' ? 'উপন্যাসের চরিত্র, সম্পর্ক ও প্রেক্ষাপটের নোট' : 'Story characters, relationship & lore memo'}</p>
          </div>
        </div>

        <div className="codex-subtabs-row">
          <button
            type="button"
            className={'codex-subtab-btn ' + (activeSubTab === 'characters' ? 'active' : '')}
            onClick={() => setActiveSubTab('characters')}
          >
            <Users size={13} />
            <span>{lang === 'bn' ? `চরিত্রসমূহ (${characters.length})` : `Characters (${characters.length})`}</span>
          </button>
          <button
            type="button"
            className={'codex-subtab-btn ' + (activeSubTab === 'lore' ? 'active' : '')}
            onClick={() => setActiveSubTab('lore')}
          >
            <Compass size={13} />
            <span>{lang === 'bn' ? `বিশ্ব ও প্রেক্ষাপট (${loreList.length})` : `World & Lore (${loreList.length})`}</span>
          </button>
        </div>

        <button
          type="button"
          className="primary full add-codex-btn"
          onClick={() => {
            resetCharForm();
            setShowAddModal(true);
          }}
        >
          <Plus size={15} />
          <span>
            {activeSubTab === 'characters'
              ? lang === 'bn' ? 'নতুন চরিত্র যোগ করুন' : 'Add Character'
              : lang === 'bn' ? 'নতুন স্থান/নোট যোগ করুন' : 'Add Location / Lore'}
          </span>
        </button>
      </div>

      {/* Characters List */}
      {activeSubTab === 'characters' && (
        <div className="codex-cards-list">
          {characters.length === 0 && (
            <div className="empty-codex-state">
              <Users size={28} className="empty-icon" />
              <p>{lang === 'bn' ? 'এখনো কোনো চরিত্র যোগ করা হয়নি।' : 'No characters added yet.'}</p>
            </div>
          )}

          {characters.map((c) => {
            const roleInfo = ROLE_COLORS[c.role] || ROLE_COLORS.minor;
            return (
              <div key={c.id} className="codex-card">
                <div className="codex-card-header">
                  <div className="char-name-group">
                    <span className="char-avatar-badge">{c.name.charAt(0).toUpperCase()}</span>
                    <strong>{c.name}</strong>
                  </div>
                  <span
                    className="char-role-badge"
                    style={{ backgroundColor: roleInfo.bg, color: roleInfo.text }}
                  >
                    {lang === 'bn' ? roleInfo.labelBn : roleInfo.labelEn}
                  </span>
                </div>

                {(c.age || c.traits) && (
                  <div className="codex-card-meta">
                    {c.age && <span className="meta-pill">{lang === 'bn' ? `বয়স: ${c.age}` : `Age: ${c.age}`}</span>}
                    {c.traits && <span className="meta-pill traits">{c.traits}</span>}
                  </div>
                )}

                {c.goal && (
                  <p className="char-goal-text">
                    <strong>{lang === 'bn' ? 'লক্ষ্য:' : 'Goal:'}</strong> {c.goal}
                  </p>
                )}

                {c.notes && <p className="char-notes-text">{c.notes}</p>}

                <div className="codex-card-actions">
                  <button
                    type="button"
                    className="card-action-btn"
                    onClick={() => onInsertText(c.name)}
                    title={lang === 'bn' ? 'নামটি লেখায় যোগ করুন' : 'Insert name into manuscript'}
                  >
                    <Plus size={12} /> <span>{lang === 'bn' ? 'নাম বসান' : 'Insert'}</span>
                  </button>
                  <button
                    type="button"
                    className="card-action-btn"
                    onClick={() => openEditCharacter(c)}
                    title="Edit"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    className="card-action-btn delete"
                    onClick={() => handleDeleteCharacter(c.id)}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lore List */}
      {activeSubTab === 'lore' && (
        <div className="codex-cards-list">
          {loreList.length === 0 && (
            <div className="empty-codex-state">
              <Compass size={28} className="empty-icon" />
              <p>{lang === 'bn' ? 'কোনো স্থান বা প্রেক্ষাপটের নোট নেই।' : 'No world lore added yet.'}</p>
            </div>
          )}

          {loreList.map((l) => (
            <div key={l.id} className="codex-card">
              <div className="codex-card-header">
                <strong>{l.title}</strong>
                <span className="char-role-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                  {l.category}
                </span>
              </div>
              <p className="char-notes-text">{l.summary}</p>
              <div className="codex-card-actions">
                <button
                  type="button"
                  className="card-action-btn"
                  onClick={() => onInsertText(l.title)}
                >
                  <Plus size={12} /> <span>{lang === 'bn' ? 'নাম বসান' : 'Insert'}</span>
                </button>
                <button
                  type="button"
                  className="card-action-btn delete"
                  onClick={() => handleDeleteLore(l.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog for Adding/Editing */}
      {showAddModal && (
        <div className="codex-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="codex-modal" onClick={(e) => e.stopPropagation()}>
            <div className="codex-modal-header">
              <h4>
                {activeSubTab === 'characters'
                  ? editingCharacterId
                    ? lang === 'bn' ? 'চরিত্র সম্পাদনা' : 'Edit Character'
                    : lang === 'bn' ? 'নতুন চরিত্র তৈরি' : 'Create Character'
                  : lang === 'bn' ? 'নতুন প্রেক্ষাপট / স্থান' : 'Add Lore / Setting'}
              </h4>
              <button type="button" onClick={() => setShowAddModal(false)} className="close-btn">
                <X size={16} />
              </button>
            </div>

            {activeSubTab === 'characters' ? (
              <form onSubmit={handleSaveCharacter} className="codex-form">
                <div className="form-group">
                  <label>{lang === 'bn' ? 'চরিত্রের নাম:' : 'Character Name:'}</label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'bn' ? 'উদা: অর্ণব / নীলিমা' : 'e.g. Arnab / Neelima'}
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>{lang === 'bn' ? 'ভূমিকা (Role):' : 'Role:'}</label>
                    <select
                      value={charRole}
                      onChange={(e) => setCharRole(e.target.value as CodexCharacter['role'])}
                    >
                      <option value="protagonist">{lang === 'bn' ? 'প্রধান চরিত্র (Protagonist)' : 'Protagonist'}</option>
                      <option value="antagonist">{lang === 'bn' ? 'খল চরিত্র (Antagonist)' : 'Antagonist'}</option>
                      <option value="supporting">{lang === 'bn' ? 'সহকারী চরিত্র (Supporting)' : 'Supporting'}</option>
                      <option value="minor">{lang === 'bn' ? 'পার্শ্ব চরিত্র (Minor)' : 'Minor'}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{lang === 'bn' ? 'বয়স:' : 'Age:'}</label>
                    <input
                      type="text"
                      placeholder={lang === 'bn' ? 'উদা: ২৮ বছর' : 'e.g. 28 yrs'}
                      value={charAge}
                      onChange={(e) => setCharAge(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'চারিত্রিক বৈশিষ্ট্য (Traits):' : 'Traits / Appearance:'}</label>
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'উদা: শান্ত স্বভাব, তীক্ষ্ণ দৃষ্টি, চশমা পরে' : 'e.g. Calm, observant, wears glasses'}
                    value={charTraits}
                    onChange={(e) => setCharTraits(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'মূল লক্ষ্য বা মোটিভেশন (Goal):' : 'Goal / Motivation:'}</label>
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'চরিত্রটি কী চায় বা কী নিয়ে দ্বন্দ্ব' : 'What drives this character?'}
                    value={charGoal}
                    onChange={(e) => setCharGoal(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'সংক্ষিপ্ত জীবনী বা রেফারেন্স নোট:' : 'Bio / Narrative Notes:'}</label>
                  <textarea
                    rows={3}
                    placeholder={lang === 'bn' ? 'সম্পর্ক, অতীতের ঘটনা বা দরকারি তথ্য...' : 'Background notes, relationships...'}
                    value={charNotes}
                    onChange={(e) => setCharNotes(e.target.value)}
                  />
                </div>

                <div className="codex-form-actions">
                  <button type="button" className="secondary" onClick={() => setShowAddModal(false)}>
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button type="submit" className="primary">
                    <Check size={14} /> {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Character'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveLore} className="codex-form">
                <div className="form-group">
                  <label>{lang === 'bn' ? 'স্থান বা বিষয়:' : 'Setting / Lore Name:'}</label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'bn' ? 'উদা: ধানমন্ডি লেক / ছায়ানগরী' : 'e.g. Shadow City / Riverbank'}
                    value={loreTitle}
                    onChange={(e) => setLoreTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'ক্যাটাগরি:' : 'Category:'}</label>
                  <select
                    value={loreCategory}
                    onChange={(e) => setLoreCategory(e.target.value as CodexLore['category'])}
                  >
                    <option value="location">{lang === 'bn' ? 'স্থান / শহর (Location)' : 'Location'}</option>
                    <option value="faction">{lang === 'bn' ? 'গোষ্ঠী / পরিবার (Faction)' : 'Faction'}</option>
                    <option value="history">{lang === 'bn' ? 'ইতিহাস / ঘটনা (History)' : 'History'}</option>
                    <option value="rule">{lang === 'bn' ? 'নিয়ম / আইন (Rule)' : 'Rule'}</option>
                    <option value="other">{lang === 'bn' ? 'অন্যান্য (Other)' : 'Other'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'বিবরণ ও বিবরণী:' : 'Description:'}</label>
                  <textarea
                    rows={4}
                    required
                    placeholder={lang === 'bn' ? 'স্থানটির পরিবেশ, আবহাওয়া বা বিস্তারিত...' : 'Environment, atmosphere, notes...'}
                    value={loreSummary}
                    onChange={(e) => setLoreSummary(e.target.value)}
                  />
                </div>

                <div className="codex-form-actions">
                  <button type="button" className="secondary" onClick={() => setShowAddModal(false)}>
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button type="submit" className="primary">
                    <Check size={14} /> {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Lore'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
