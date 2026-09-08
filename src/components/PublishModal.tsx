import React, { useState } from 'react';
import { Share2, ExternalLink, Edit3, CheckCircle2, Loader2, X, FileText, BookOpen } from 'lucide-react';
import { type Chapter, type Project, publishToWordPress, type PublishResult } from '../api';
import { markupToHtml } from '../lib/highlight-markup';
import { type Language } from '../i18n';

interface PublishModalProps {
  project: Project | null;
  currentChapter: Chapter | null;
  lang: Language;
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  project,
  currentChapter,
  lang,
  onClose,
}) => {
  const [scope, setScope] = useState<'chapter' | 'book'>('chapter');
  const [title, setTitle] = useState(
    currentChapter?.title || project?.title || (lang === 'bn' ? 'নতুন খসড়া পোস্ট' : 'New Draft Post')
  );
  const [postType, setPostType] = useState<'post' | 'page'>('post');
  const [status, setStatus] = useState<'draft' | 'publish'>('draft');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function getFormattedHtml(): string {
    if (scope === 'chapter' && currentChapter) {
      return markupToHtml(currentChapter.text || '');
    }

    if (project) {
      return project.chapters
        .map((c, i) => {
          const heading = `<h2>${i + 1}. ${c.title || (lang === 'bn' ? 'অধ্যায়' : 'Chapter')}</h2>`;
          return `${heading}\n${markupToHtml(c.text || '')}`;
        })
        .join('\n\n<hr/>\n\n');
    }

    return '';
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const htmlContent = getFormattedHtml();
    if (!htmlContent.trim()) {
      setError(lang === 'bn' ? 'পোস্টে প্রকাশ করার মতো কোনো লেখা পাওয়া যায়নি।' : 'No text content available to publish.');
      setLoading(false);
      return;
    }

    try {
      const res = await publishToWordPress({
        title: title.trim() || (lang === 'bn' ? 'শিরোনামহীন খসড়া' : 'Untitled Draft'),
        content: htmlContent,
        status,
        post_type: postType,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || (lang === 'bn' ? 'পোস্ট তৈরি করতে সমস্যা হয়েছে।' : 'Failed to publish post.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box publish-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-flex">
            <Share2 size={20} color="#20644f" />
            <h3>{lang === 'bn' ? '১-ক্লিকে ওয়ার্ডপ্রেস পোস্টে প্রকাশ' : '1-Click Publish to WordPress'}</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {result ? (
          <div className="publish-success-card">
            <CheckCircle2 size={36} color="#10b981" />
            <h4>{lang === 'bn' ? 'সফলভাবে ওয়ার্ডপ্রেসে পোস্ট তৈরি হয়েছে!' : 'Post successfully created in WordPress!'}</h4>
            <p>
              {lang === 'bn'
                ? `পোস্টটি ${result.status === 'publish' ? 'পাবলিশড' : 'ড্রাফট (Draft)'} হিসেবে সংরক্ষিত হয়েছে।`
                : `Saved as a ${result.status === 'publish' ? 'published post' : 'draft post'}.`}
            </p>

            <div className="publish-success-actions">
              <a
                href={result.editUrl}
                target="_blank"
                rel="noreferrer"
                className="primary-action-btn"
              >
                <Edit3 size={15} /> {lang === 'bn' ? 'ওয়ার্ডপ্রেসে এডিট করুন' : 'Edit in WordPress'}
              </a>
              <a
                href={result.viewUrl}
                target="_blank"
                rel="noreferrer"
                className="secondary-action-btn"
              >
                <ExternalLink size={15} /> {lang === 'bn' ? 'পোস্টটি প্রিভিউ দেখুন' : 'Preview Post'}
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="publish-form">
            {error && <div className="modal-error-banner">{error}</div>}

            {/* Scope Selection */}
            <div className="publish-field">
              <label>{lang === 'bn' ? 'কোন লেখা প্রকাশ করতে চান?' : 'Select publishing content:'}</label>
              <div className="scope-radio-grid">
                <button
                  type="button"
                  className={'scope-btn ' + (scope === 'chapter' ? 'selected' : '')}
                  onClick={() => {
                    setScope('chapter');
                    if (currentChapter?.title) setTitle(currentChapter.title);
                  }}
                >
                  <FileText size={15} />
                  <span>{lang === 'bn' ? 'বর্তমান অধ্যায়' : 'Current Chapter'}</span>
                </button>
                <button
                  type="button"
                  className={'scope-btn ' + (scope === 'book' ? 'selected' : '')}
                  onClick={() => {
                    setScope('book');
                    if (project?.title) setTitle(project.title);
                  }}
                >
                  <BookOpen size={15} />
                  <span>{lang === 'bn' ? 'সম্পূর্ণ পাণ্ডুলিপি (সব অধ্যায়)' : 'Entire Manuscript (All Chapters)'}</span>
                </button>
              </div>
            </div>

            {/* Post Title */}
            <div className="publish-field">
              <label>{lang === 'bn' ? 'ওয়ার্ডপ্রেস পোস্ট শিরোনাম:' : 'WordPress Post Title:'}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="publish-input"
              />
            </div>

            {/* Type & Status Grid */}
            <div className="publish-options-row">
              <div className="publish-field half">
                <label>{lang === 'bn' ? 'টাইপ:' : 'Post Type:'}</label>
                <select value={postType} onChange={(e) => setPostType(e.target.value as any)} className="publish-select">
                  <option value="post">{lang === 'bn' ? 'ব্লগ পোস্ট (Post)' : 'Blog Post'}</option>
                  <option value="page">{lang === 'bn' ? 'পেজ (Page)' : 'Page'}</option>
                </select>
              </div>

              <div className="publish-field half">
                <label>{lang === 'bn' ? 'স্ট্যাটাস:' : 'Initial Status:'}</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="publish-select">
                  <option value="draft">{lang === 'bn' ? 'খসড়া (Draft - নিরাপদ)' : 'Draft (Recommended)'}</option>
                  <option value="publish">{lang === 'bn' ? 'সরাসরি প্রকাশ (Publish)' : 'Publish immediately'}</option>
                </select>
              </div>
            </div>

            <div className="publish-modal-actions">
              <button type="button" className="secondary" onClick={onClose} disabled={loading}>
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? <Loader2 size={15} className="spin" /> : <Share2 size={15} />}
                <span>{loading ? (lang === 'bn' ? 'প্রকাশ হচ্ছে...' : 'Publishing...') : (lang === 'bn' ? 'পোস্ট তৈরি করুন' : 'Create Post')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
