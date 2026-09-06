import { useState } from 'react';
import { Download, Lock, ArrowRight } from 'lucide-react';
import type { Project } from '../api';
import { translations, type Language } from '../i18n';

type BookSettings = {
  author: string;
  pageSize: 'A4' | 'A5';
  fontSize: number;
  lineHeight: number;
  marginMm: number;
  includeToc: boolean;
};

const defaultSettings: BookSettings = {
  author: '',
  pageSize: 'A5',
  fontSize: 12,
  lineHeight: 1.5,
  marginMm: 18,
  includeToc: true,
};

export function ExportPanel({
  project, isPro, lang = 'en', onTxt,
}: {
  project: Project; isPro: boolean; lang?: Language; onTxt: () => void;
}) {
  const t = translations[lang];
  const [settings, setSettings] = useState<BookSettings>(defaultSettings);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  // Pro gate — TXT always free
  async function exportFile(format: 'docx' | 'pdf' | 'epub') {
    if (!isPro) {
      setError(
        lang === 'bn'
          ? `${format.toUpperCase()} রপ্তানি Pro সুবিধা। লাইসেন্স যুক্ত করুন।`
          : `${format.toUpperCase()} export is a Pro feature. Please activate Lipishilpo Pro.`
      );
      return;
    }
    setBusy(format); setError(''); setDone('');
    try {
      const { makeDocx, makeEpub, makePdf, loadFonts, downloadBlob } = await import('../lib/book-export');

      const source = structuredClone(project);
      const s = { ...settings };
      let blob: Blob;

      if (format === 'docx') {
        const bytes = await makeDocx(source, s);
        blob = new Blob([new Uint8Array(bytes)], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
      } else {
        const fonts = await loadFonts();
        if (format === 'pdf') blob = await makePdf(source, s, fonts);
        else blob = new Blob([new Uint8Array(makeEpub(source, s, fonts))], { type: 'application/epub+zip' });
      }

      downloadBlob(blob, `${source.title || (lang === 'bn' ? 'পাণ্ডুলিপি' : 'Manuscript')}.${format}`);
      setDone(
        lang === 'bn'
          ? `${format.toUpperCase()} ফাইল তৈরি হয়েছে।`
          : `${format.toUpperCase()} file generated successfully.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : (lang === 'bn' ? 'ফাইল তৈরি হয়নি। আবার চেষ্টা করুন।' : 'Export failed. Please try again.'));
    } finally { setBusy(''); }
  }

  const chaptersLabel = lang === 'bn'
    ? `${project.chapters.length.toLocaleString('bn-BD')} অধ্যায় · ${settings.pageSize}`
    : `${project.chapters.length} ${project.chapters.length === 1 ? 'Chapter' : 'Chapters'} · ${settings.pageSize}`;

  return (
    <div className="analysis export-panel">
      <span className="preview-label connected">{t.bookFormatting}</span>
      <h3>{t.exportHeading}</h3>
      <p>{t.exportSubtitle}</p>

      {!isPro && (
        <div className="pro-notice">
          <Lock size={16} />
          <span>{t.proExportNotice}</span>
          <a href="/wp-admin/admin.php?page=lipishilpo-settings">
            {t.proActivateLink} <ArrowRight size={14} />
          </a>
        </div>
      )}

      <label className="field-label">
        {t.authorLabel}
        <input
          value={settings.author}
          maxLength={200}
          onChange={(e) => setSettings((s) => ({ ...s, author: e.target.value }))}
          placeholder={t.authorPlaceholder}
        />
      </label>

      <div className="settings-grid">
        <label className="field-label">
          {t.pageSizeLabel}
          <select
            value={settings.pageSize}
            onChange={(e) => setSettings((s) => ({ ...s, pageSize: e.target.value as 'A4' | 'A5' }))}
          >
            <option>A5</option>
            <option>A4</option>
          </select>
        </label>
        <label className="field-label">
          {t.fontSizeLabel}
          <select
            value={settings.fontSize}
            onChange={(e) => setSettings((s) => ({ ...s, fontSize: Number(e.target.value) }))}
          >
            {[10, 11, 12, 13, 14, 16].map((n) => <option key={n} value={n}>{n} pt</option>)}
          </select>
        </label>
        <label className="field-label">
          {t.lineHeightLabel}
          <select
            value={settings.lineHeight}
            onChange={(e) => setSettings((s) => ({ ...s, lineHeight: Number(e.target.value) }))}
          >
            {[1.3, 1.5, 1.8].map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label className="field-label">
          {t.marginLabel}
          <select
            value={settings.marginMm}
            onChange={(e) => setSettings((s) => ({ ...s, marginMm: Number(e.target.value) }))}
          >
            {[12, 15, 18, 22, 25, 30].map((n) => <option key={n} value={n}>{n} mm</option>)}
          </select>
        </label>
      </div>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={settings.includeToc}
          onChange={(e) => setSettings((s) => ({ ...s, includeToc: e.target.checked }))}
        />
        {t.includeTocLabel}
      </label>

      <div className="format-preview">
        <span>{t.manuscriptCover}</span>
        <h3>{project.title}</h3>
        <p>{settings.author || (lang === 'bn' ? 'লেখকের নাম' : 'Author Name')}</p>
        <div />
        <small>{chaptersLabel}</small>
      </div>

      <div className="export-buttons">
        {(['docx', 'pdf', 'epub'] as const).map((f) => {
          const btnLabel = f === 'docx' ? t.btnExportDocx : f === 'pdf' ? t.btnExportPdf : t.btnExportEpub;
          return (
            <button
              className={'primary full' + (!isPro ? ' pro-locked' : '')}
              key={f}
              disabled={!!busy}
              onClick={() => exportFile(f)}
            >
              {isPro ? <Download size={16} /> : <Lock size={16} />}
              {busy === f ? t.generatingFile : btnLabel}
            </button>
          );
        })}
        <button className="secondary full" disabled={!!busy} onClick={onTxt}>
          {t.btnExportTxt}
        </button>
      </div>

      {busy && <p className="privacy-note">{lang === 'bn' ? 'বড় বই তৈরিতে কিছু সময় লাগতে পারে। এই পৃষ্ঠা খোলা রাখুন।' : 'Generating large manuscripts may take a few moments. Please keep this tab open.'}</p>}
      {done && <output className="export-success">{done}</output>}
      {error && <p className="error-message" role="alert">{error}</p>}

      <p className="prototype-note">
        {t.exportFontNote}
      </p>

      <a
        className="font-download"
        href="/wp-content/plugins/lipishilpo-pro/assets/fonts/NotoSerifBengali-Regular.ttf"
        download
      >
        {t.btnDownloadFont}
      </a>

      <p className="prototype-note" style={{ marginTop: '10px' }}>
        {t.clientSideExportNote}
      </p>
    </div>
  );
}
