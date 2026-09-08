import { useState, useRef } from 'react';
import { FileUp, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import {
  importManuscriptFile,
  type ImportedManuscript,
  ManuscriptImportError,
} from '../lib/manuscript-import';
import { type Language } from '../i18n';

interface ImportManuscriptModalProps {
  lang: Language;
  currentProjectTitle?: string | null;
  onImportNew: (data: ImportedManuscript) => void;
  onAppendToCurrent?: (chapters: ImportedManuscript['chapters']) => void;
  onClose: () => void;
}

export function ImportManuscriptModal({
  lang,
  currentProjectTitle,
  onImportNew,
  onAppendToCurrent,
  onClose,
}: ImportManuscriptModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ImportedManuscript | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [importMode, setImportMode] = useState<'new' | 'append'>('new');

  async function processFile(file: File) {
    setLoading(true);
    setError(null);
    setParsed(null);
    try {
      const res = await importManuscriptFile(file);
      setParsed(res);
      setProjectTitle(res.title);
    } catch (err: unknown) {
      if (err instanceof ManuscriptImportError) {
        if (err.code === 'too_large') {
          setError(lang === 'bn' ? 'ফাইলের আকার ১২ মেগাবাইটের বেশি হতে পারবে না।' : 'File size exceeds 12MB limit.');
        } else if (err.code === 'legacy_doc') {
          setError(lang === 'bn' ? 'পুরনো .doc ফাইল সমর্থিত নয়। অনুগ্রহ করে .docx হিসেবে সেভ করে আপলোড করুন।' : 'Legacy .doc files are not supported. Please save as .docx.');
        } else if (err.code === 'invalid_json') {
          setError(lang === 'bn' ? 'অকার্যকর ব্যাকআপ ফাইল।' : 'Invalid LipiShilpo JSON backup file.');
        } else if (err.code === 'empty') {
          setError(lang === 'bn' ? 'ফাইলে কোনো পাঠ্য বা অধ্যায় পাওয়া যায়নি।' : 'No text or chapters found in file.');
        } else {
          setError(lang === 'bn' ? 'ফাইলটি প্রসেস করা সম্ভব হয়নি।' : 'Failed to parse file.');
        }
      } else {
        setError(lang === 'bn' ? 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।' : 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleConfirm() {
    if (!parsed) return;
    if (importMode === 'append' && onAppendToCurrent) {
      onAppendToCurrent(parsed.chapters);
    } else {
      onImportNew({
        ...parsed,
        title: projectTitle.trim() || parsed.title,
      });
    }
    onClose();
  }

  const totalWords = parsed
    ? parsed.chapters.reduce((acc, c) => acc + (c.text ? c.text.trim().split(/\s+/).length : 0), 0)
    : 0;

  return (
    <div className="shortcuts-backdrop" role="presentation" onClick={onClose}>
      <div
        className="snapshot-diff-panel"
        style={{ maxWidth: '680px' }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileUp size={20} style={{ color: 'var(--lp-accent, #3b82f6)' }} />
            <h2 id="import-modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
              {lang === 'bn' ? 'পাণ্ডুলিপি ইমপোর্ট করুন' : 'Import Manuscript'}
            </h2>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {!parsed ? (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--lp-accent, #3b82f6)' : '#d1d5db'}`,
                  borderRadius: '12px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: dragOver ? 'rgba(59, 130, 246, 0.05)' : '#f9fafb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.md,.markdown,.txt,.json,.lipishilpo.json"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Loader2 size={36} className="animate-spin" style={{ color: 'var(--lp-accent, #3b82f6)' }} />
                    <p style={{ margin: 0, color: '#4b5563', fontSize: '0.95rem' }}>
                      {lang === 'bn' ? 'পাণ্ডুলিপি প্রসেস করা হচ্ছে...' : 'Processing manuscript...'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#e0e7ff',
                        color: '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}
                    >
                      <FileUp size={28} />
                    </div>
                    <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '1.05rem', color: '#1f2937' }}>
                      {lang === 'bn' ? 'ফাইল ড্রপ করুন অথবা ব্রাউজ করতে ক্লিক করুন' : 'Drop your file here, or click to browse'}
                    </p>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>
                      {lang === 'bn'
                        ? 'সমর্থিত ফরম্যাট: Word (.docx), Markdown (.md), Text (.txt), LipiShilpo Backup (.json)'
                        : 'Supported formats: Word (.docx), Markdown (.md), Text (.txt), LipiShilpo Backup (.json)'}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '8px',
                    color: '#b91c1c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.9rem',
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Preview Information */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: '#e0e7ff',
                      color: '#4338ca',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {parsed.source.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {parsed.language} · {parsed.chapters.length} {lang === 'bn' ? 'টি অধ্যায়' : 'chapters'} · ~{totalWords.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')} {lang === 'bn' ? 'শব্দ' : 'words'}
                  </span>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'বই বা পাণ্ডুলিপির নাম:' : 'Manuscript Title:'}
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      fontWeight: 500,
                    }}
                  />
                </div>

                {/* Chapters Preview List */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    {lang === 'bn' ? 'সনাক্তকৃত অধ্যায়সমূহ:' : 'Detected Chapters:'}
                  </label>
                  <div
                    style={{
                      maxHeight: '160px',
                      overflowY: 'auto',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#fff',
                    }}
                  >
                    {parsed.chapters.map((ch, idx) => {
                      const words = ch.text ? ch.text.trim().split(/\s+/).length : 0;
                      return (
                        <div
                          key={ch.id || idx}
                          style={{
                            padding: '8px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: idx < parsed.chapters.length - 1 ? '1px solid #f1f5f9' : 'none',
                            fontSize: '0.88rem',
                          }}
                        >
                          <span style={{ color: '#1e293b', fontWeight: 500 }}>
                            {idx + 1}. {ch.title}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            {words.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')} {lang === 'bn' ? 'শব্দ' : 'words'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Import Mode Options (if inside a project) */}
              {currentProjectTitle && onAppendToCurrent && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    {lang === 'bn' ? 'ইমপোর্ট করার ধরন:' : 'Import Destination:'}
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: `1.5px solid ${importMode === 'new' ? 'var(--lp-accent, #3b82f6)' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: importMode === 'new' ? 'rgba(59, 130, 246, 0.04)' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem',
                      }}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'new'}
                        onChange={() => setImportMode('new')}
                      />
                      <span style={{ fontWeight: 500 }}>
                        {lang === 'bn' ? 'নতুন প্রজেক্ট হিসেবে তৈরি করুন' : 'Create New Project'}
                      </span>
                    </label>

                    <label
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: `1.5px solid ${importMode === 'append' ? 'var(--lp-accent, #3b82f6)' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: importMode === 'append' ? 'rgba(59, 130, 246, 0.04)' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem',
                      }}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                      />
                      <span style={{ fontWeight: 500 }}>
                        {lang === 'bn' ? `চলমান বইতে অধ্যায় যোগ করুন (${currentProjectTitle})` : `Append to Current (${currentProjectTitle})`}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setParsed(null); setError(null); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'bn' ? 'অন্য ফাইল নির্বাচন' : 'Choose Another File'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--lp-accent, #3b82f6)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Check size={16} />
                  {lang === 'bn' ? 'ইমপোর্ট সম্পন্ন করুন' : 'Confirm Import'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
