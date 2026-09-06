import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Feather, BookOpen, Plus, FileText, Library, BarChart3,
  LayoutTemplate, ChevronRight, Download, CheckCheck,
  Sparkles, ArrowRight, ArrowLeft, LayoutDashboard, Check, X, Undo2, Loader2, Globe,
  Search, ChevronUp, ChevronDown, Trash2, FileCode, HelpCircle, Sliders, LogOut,
  Maximize2, Minimize2, Sun, Moon, Coffee, History, Target,
  MessageSquare, MessageSquarePlus, CheckCircle, Eye, Edit3,
} from 'lucide-react';
import {
  type Project, type Chapter,
  fetchProjects, createProject, updateProject, deleteProject,
} from './api';
import {
  findIssues, applyFix, applyAllFixes, calculateStats,
  formatTypography, findLongSentences,
  type ProofMatch, type ManuscriptStats, type RuleCategory,
} from './proofread';
import { AudioProofreader } from './components/AudioProofreader';
import { AIPanel } from './components/AIPanel';
import { ExportPanel } from './components/ExportPanel';
import { DocsView } from './components/DocsView';
import { SettingsView } from './components/SettingsView';
import { wpConfig } from './api';
import { translations, getSavedLanguage, saveLanguage, type Language } from './i18n';

export interface ChapterSnapshot {
  id: string;
  name: string;
  date: string;
  wordCount: number;
  text: string;
}

export interface ChapterComment {
  id: string;
  quote: string;
  comment: string;
  date: string;
  resolved: boolean;
}

export type EditorTheme = 'light' | 'sepia' | 'dark';
export type EditorMode = 'edit' | 'review';

function wordPattern(word: string) {
  return new RegExp(`(?<![\\p{L}\\p{M}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{M}])`, 'gu');
}

export default function App() {
  // ── Language State ─────────────────────────────────────────────────────────
  const [lang, setLang] = useState<Language>(getSavedLanguage());
  const t = translations[lang];

  const formatNumber = useCallback((n: number) => {
    return lang === 'bn' ? n.toLocaleString('bn-BD') : n.toLocaleString('en-US');
  }, [lang]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [pid, setPid] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [view, setView] = useState<'projects' | 'editor' | 'docs' | 'settings'>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const page = urlParams.get('page');
      const v = urlParams.get('view');
      if (v === 'docs' || page === 'lipishilpo-docs') return 'docs';
      if (v === 'settings' || page === 'lipishilpo-settings') return 'settings';
    } catch {}
    return 'projects';
  });
  const [tabKey, setTabKey] = useState<'proofread' | 'audio' | 'comments' | 'snapshots' | 'aiEdit' | 'analysis' | 'format'>('proofread');
  const [modal, setModal] = useState(false);
  const [statsModal, setStatsModal] = useState(false);

  // Focus mode & Theme & Mode (Edit vs Visual Review)
  const [focusMode, setFocusMode] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [theme, setTheme] = useState<EditorTheme>(() => {
    try {
      const saved = localStorage.getItem('lipishilpo_theme') as EditorTheme;
      if (saved === 'light' || saved === 'sepia' || saved === 'dark') return saved;
    } catch {}
    return 'light';
  });

  // Writing Goal Tracker
  const [writingGoal, setWritingGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('lipishilpo_writing_goal');
      return saved ? parseInt(saved, 10) : 500;
    } catch {
      return 500;
    }
  });
  const [showGoalInput, setShowGoalInput] = useState(false);

  // Comments State
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [selectedQuote, setSelectedQuote] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  // Active In-Text Popover for Visual Markings
  const [activePopover, setActivePopover] = useState<{ match: ProofMatch; x: number; y: number } | null>(null);

  // New project form
  const [newTitle, setNewTitle] = useState('');
  const [newGenre, setNewGenre] = useState<string>('Fiction / Novel');
  const [newLanguage, setNewLanguage] = useState<string>('English');

  // Find & Replace state
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(-1);

  // Proofreading, Category Filter & Live Auto-Check
  const [checked, setChecked] = useState(false);
  const [autoCheck, setAutoCheck] = useState<boolean>(true);
  const [issues, setIssues] = useState<ProofMatch[]>([]);
  const [proofFilter, setProofFilter] = useState<RuleCategory | 'all' | 'complexity'>('all');
  const [ignored, setIgnored] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lipishilpo_personal_dict');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [history, setHistory] = useState<string[]>([]);

  // Snapshots (Version History)
  const [snapshots, setSnapshots] = useState<ChapterSnapshot[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState('');

  // UI state
  const [notice, setNotice] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [font, setFont] = useState(20);
  const [deleting, setDeleting] = useState<string | null>(null);

  const dialog = useRef<HTMLDialogElement>(null);
  const statsDialog = useRef<HTMLDialogElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Language Switcher Handler ──────────────────────────────────────────────
  function toggleLanguage() {
    const next: Language = lang === 'en' ? 'bn' : 'en';
    setLang(next);
    saveLanguage(next);
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const project = projects.find((p) => p.id === pid) ?? projects[0] ?? null;
  const chapter = project?.chapters.find((c) => c.id === cid) ?? project?.chapters[0] ?? null;
  const text = chapter?.text ?? '';
  const stats: ManuscriptStats = calculateStats(text);

  // ── Load projects from WP API ──────────────────────────────────────────────
  useEffect(() => {
    fetchProjects()
      .then((list) => {
        setProjects(list);
        if (list.length > 0) {
          setPid(list[0].id);
          setCid(list[0].chapters[0]?.id ?? null);
        }
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Dynamic Fullscreen: ONLY active when inside Studio Editor ─────────────
  useEffect(() => {
    if (view === 'editor') {
      document.body.classList.add('lipishilpo-studio-fullscreen');
    } else {
      document.body.classList.remove('lipishilpo-studio-fullscreen');
    }
    return () => {
      document.body.classList.remove('lipishilpo-studio-fullscreen');
    };
  }, [view]);

  // ── Modals ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);

  useEffect(() => {
    if (statsModal) statsDialog.current?.showModal();
    else statsDialog.current?.close();
  }, [statsModal]);

  // ── Notice auto-hide ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // ── Autosave ───────────────────────────────────────────────────────────────
  const autosave = useCallback((updatedProjects: Project[]) => {
    if (!project) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');

    const current = updatedProjects.find((p) => p.id === project.id);
    if (!current) return;

    saveTimer.current = setTimeout(async () => {
      try {
        await updateProject(current.id, { chapters: current.chapters });
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 1500);
  }, [project]);

  // ── Snapshots Lifecycle ───────────────────────────────────────────────────
  useEffect(() => {
    if (!chapter) {
      setSnapshots([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`lipishilpo_snapshots_${chapter.id}`);
      setSnapshots(saved ? JSON.parse(saved) : []);
    } catch {
      setSnapshots([]);
    }
  }, [chapter?.id]);

  function handleSaveSnapshot(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!chapter || !text.trim()) return;
    const name = newSnapshotName.trim() || `${t.draft} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    const snap: ChapterSnapshot = {
      id: crypto.randomUUID(),
      name,
      date: new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      wordCount: stats.words,
      text,
    };
    const updated = [snap, ...snapshots];
    setSnapshots(updated);
    try {
      localStorage.setItem(`lipishilpo_snapshots_${chapter.id}`, JSON.stringify(updated));
    } catch {}
    setNewSnapshotName('');
    setNotice(lang === 'bn' ? 'স্ন্যাপশট সংরক্ষিত হয়েছে' : 'Snapshot saved');
  }

  function handleRestoreSnapshot(snap: ChapterSnapshot) {
    if (!chapter) return;
    if (!confirm(lang === 'bn' ? 'এই স্ন্যাপশট সংস্করণে ফিরে যেতে চান? বর্তমান পরিবর্তন ব্যাকআপে থাকবে।' : 'Restore this snapshot version? Current text will be pushed to undo history.')) return;
    setHistory((h) => [...h.slice(-49), text]);
    updateText(snap.text);
    setNotice(t.snapshotRestored);
  }

  function handleDeleteSnapshot(snapId: string) {
    if (!chapter) return;
    const updated = snapshots.filter((s) => s.id !== snapId);
    setSnapshots(updated);
    try {
      localStorage.setItem(`lipishilpo_snapshots_${chapter.id}`, JSON.stringify(updated));
    } catch {}
  }

  // ── Comments Lifecycle ────────────────────────────────────────────────────
  useEffect(() => {
    if (!chapter) {
      setComments([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`lipishilpo_comments_${chapter.id}`);
      setComments(saved ? JSON.parse(saved) : []);
    } catch {
      setComments([]);
    }
  }, [chapter?.id]);

  function handleAddComment(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!chapter || !newCommentText.trim()) return;
    const newComment: ChapterComment = {
      id: crypto.randomUUID(),
      quote: selectedQuote.trim(),
      comment: newCommentText.trim(),
      date: new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      resolved: false,
    };
    const updated = [newComment, ...comments];
    setComments(updated);
    try {
      localStorage.setItem(`lipishilpo_comments_${chapter.id}`, JSON.stringify(updated));
    } catch {}
    setNewCommentText('');
    setSelectedQuote('');
    setShowCommentDialog(false);
    setTabKey('comments');
    setNotice(t.noticeCommentAdded);
  }

  function handleToggleResolveComment(commentId: string) {
    if (!chapter) return;
    const updated = comments.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c));
    setComments(updated);
    try {
      localStorage.setItem(`lipishilpo_comments_${chapter.id}`, JSON.stringify(updated));
    } catch {}
  }

  function handleDeleteComment(commentId: string) {
    if (!chapter) return;
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    try {
      localStorage.setItem(`lipishilpo_comments_${chapter.id}`, JSON.stringify(updated));
    } catch {}
    setNotice(t.noticeCommentDeleted);
  }

  function handleSelectTextInEditor() {
    if (!editor.current) return;
    const start = editor.current.selectionStart;
    const end = editor.current.selectionEnd;
    if (start !== end) {
      const selected = text.slice(start, end).trim();
      if (selected.length > 0 && selected.length < 300) {
        setSelectedQuote(selected);
      }
    }
  }

  // ── Theme Switcher ─────────────────────────────────────────────────────────
  function handleSetTheme(nextTheme: EditorTheme) {
    setTheme(nextTheme);
    try {
      localStorage.setItem('lipishilpo_theme', nextTheme);
    } catch {}
  }

  // ── Writing Goal ───────────────────────────────────────────────────────────
  function handleSaveGoal(target: number) {
    const valid = Math.max(50, target);
    setWritingGoal(valid);
    setShowGoalInput(false);
    try {
      localStorage.setItem('lipishilpo_writing_goal', String(valid));
    } catch {}
  }

  // ── Force immediate save ───────────────────────────────────────────────────
  const forceSave = useCallback(async () => {
    if (!project) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    try {
      await updateProject(project.id, { chapters: project.chapters });
      setSaveState('saved');
      setNotice(t.saved);
    } catch {
      setSaveState('error');
    }
  }, [project, t.saved]);

  // ── Keyboard Shortcuts (Ctrl+S, Ctrl+F, F11, Esc) ───────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        forceSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f' && view === 'editor') {
        e.preventDefault();
        setShowSearch((prev) => {
          if (!prev) {
            setTimeout(() => searchInput.current?.focus(), 50);
          }
          return !prev;
        });
      } else if (e.key === 'F11' && view === 'editor') {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      } else if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [forceSave, view, focusMode]);

  // ── Find & Replace logic ───────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm || !text) {
      setSearchMatches([]);
      setActiveMatchIndex(-1);
      return;
    }
    const matches: number[] = [];
    let pos = 0;
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    while ((pos = lowerText.indexOf(lowerTerm, pos)) !== -1) {
      matches.push(pos);
      pos += lowerTerm.length;
    }
    setSearchMatches(matches);
    setActiveMatchIndex(matches.length > 0 ? 0 : -1);
  }, [searchTerm, text]);

  function highlightMatch(index: number) {
    if (index < 0 || index >= searchMatches.length) return;
    const start = searchMatches[index];
    editor.current?.focus();
    editor.current?.setSelectionRange(start, start + searchTerm.length);
  }

  function handleNextMatch() {
    if (searchMatches.length === 0) return;
    const next = (activeMatchIndex + 1) % searchMatches.length;
    setActiveMatchIndex(next);
    highlightMatch(next);
  }

  function handlePrevMatch() {
    if (searchMatches.length === 0) return;
    const prev = (activeMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setActiveMatchIndex(prev);
    highlightMatch(prev);
  }

  function handleReplaceOne() {
    if (activeMatchIndex < 0 || activeMatchIndex >= searchMatches.length) return;
    const start = searchMatches[activeMatchIndex];
    const newText = text.slice(0, start) + replaceTerm + text.slice(start + searchTerm.length);
    updateText(newText);
  }

  function handleReplaceAll() {
    if (!searchTerm || !text) return;
    const count = searchMatches.length;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newText = text.replace(regex, replaceTerm);
    updateText(newText);
    setNotice(t.replacedCount(count));
  }

  // ── Update helpers ─────────────────────────────────────────────────────────
  function updateText(value: string) {
    if (!project || !chapter) return;
    const updated = projects.map((p) =>
      p.id === project.id
        ? { ...p, chapters: p.chapters.map((c) => c.id === chapter.id ? { ...c, text: value } : c) }
        : p
    );
    setProjects(updated);
    autosave(updated);
  }

  function updateChapterTitle(value: string) {
    if (!project || !chapter) return;
    const updated = projects.map((p) =>
      p.id === project.id
        ? { ...p, chapters: p.chapters.map((c) => c.id === chapter.id ? { ...c, title: value } : c) }
        : p
    );
    setProjects(updated);
    autosave(updated);
  }

  function selectChapter(id: string) {
    setCid(id);
    setHistory([]);
    setChecked(false);
    setIssues([]);
    setShowSearch(false);
    setView('editor');
  }

  function addChapter() {
    if (!project) return;
    const id = crypto.randomUUID();
    const defaultTitle = `${t.chapterLabel(project.chapters.length + 1)}`;
    const updated = projects.map((p) =>
      p.id === project.id
        ? { ...p, chapters: [...p.chapters, { id, title: defaultTitle, text: '' }] }
        : p
    );
    setProjects(updated);
    autosave(updated);
    selectChapter(id);
  }

  function moveChapter(index: number, direction: 'up' | 'down') {
    if (!project) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= project.chapters.length) return;

    const newChapters = [...project.chapters];
    const [moved] = newChapters.splice(index, 1);
    newChapters.splice(newIndex, 0, moved);

    const updated = projects.map((p) =>
      p.id === project.id ? { ...p, chapters: newChapters } : p
    );
    setProjects(updated);
    autosave(updated);
  }

  function handleDeleteChapter(chapterId: string) {
    if (!project) return;
    if (project.chapters.length <= 1) return;
    if (!confirm(t.deleteChapterConfirm)) return;

    const newChapters = project.chapters.filter((c) => c.id !== chapterId);
    const updated = projects.map((p) =>
      p.id === project.id ? { ...p, chapters: newChapters } : p
    );
    setProjects(updated);
    autosave(updated);
    selectChapter(newChapters[0].id);
  }

  // ── New project ────────────────────────────────────────────────────────────
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const created = await createProject({
        title: newTitle.trim(),
        genre: newGenre,
        language: newLanguage,
      });
      setProjects((prev) => [created, ...prev]);
      setPid(created.id);
      setCid(created.chapters[0]?.id ?? null);
      setView('editor');
      setModal(false);
      setNewTitle('');
      setNotice(t.noticeProjectCreated);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : (lang === 'bn' ? 'প্রজেক্ট তৈরি হয়নি।' : 'Failed to create project.'));
    }
  }

  // ── Delete project ─────────────────────────────────────────────────────────
  async function handleDeleteProject(id: string) {
    if (!confirm(t.deleteProjectConfirm)) return;
    setDeleting(id);
    try {
      await deleteProject(id);
      const remaining = projects.filter((p) => p.id !== id);
      setProjects(remaining);
      if (pid === id) {
        setPid(remaining[0]?.id ?? null);
        setCid(remaining[0]?.chapters[0]?.id ?? null);
        setView('projects');
      }
      setNotice(t.noticeProjectDeleted);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : (lang === 'bn' ? 'মুছে ফেলা যায়নি।' : 'Failed to delete project.'));
    } finally {
      setDeleting(null);
    }
  }

  // ── TXT & Markdown Downloads ───────────────────────────────────────────────
  function downloadTxt() {
    if (!project) return;
    const content = project.title + '\n\n' + project.chapters.map((c) => c.title + '\n\n' + c.text).join('\n\n— — —\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = project.title + '.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(t.noticeDownloaded);
  }

  function downloadMarkdown() {
    if (!project) return;
    let md = `# ${project.title}\n\n`;
    project.chapters.forEach((c, i) => {
      md += `## ${c.title || `Chapter ${i + 1}`}\n\n${c.text}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = project.title + '.md';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(t.noticeDownloaded);
  }

  // ── Proofreading ───────────────────────────────────────────────────────────
  function runProofread() {
    if (!text.trim()) return;
    const found = findIssues(text, lang, project?.language || 'all', ignored);
    setIssues(found);
    setChecked(true);
    setNotice(t.noticeChecked);
  }

  // ── Live background auto-proofreading debounce ─────────────────────────────
  const autoCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!autoCheck || !text.trim()) return;
    if (autoCheckTimer.current) clearTimeout(autoCheckTimer.current);
    autoCheckTimer.current = setTimeout(() => {
      const found = findIssues(text, lang, project?.language || 'all', ignored);
      setIssues(found);
      setChecked(true);
    }, 1200);
    return () => {
      if (autoCheckTimer.current) clearTimeout(autoCheckTimer.current);
    };
  }, [text, autoCheck, lang, project?.language, ignored]);

  // ── Smart Typography Formatter ─────────────────────────────────────────────
  function handleFormatTypography() {
    if (!chapter || !text.trim()) return;
    setHistory((h) => [...h.slice(-49), text]);
    const formatted = formatTypography(text);
    updateText(formatted);
    setNotice(t.btnFixTypographyNotice);
  }

  function acceptFix(issue: ProofMatch) {
    if (!chapter) return;
    setHistory((h) => [...h.slice(-49), text]);
    const fixed = applyFix(text, issue.from, issue.to);
    updateText(fixed);
    setNotice(t.noticeFixAccepted);
  }

  function ignoreIssue(from: string) {
    setIgnored((prev) => {
      const next = [...prev, from];
      try {
        localStorage.setItem('lipishilpo_personal_dict', JSON.stringify(next));
      } catch {}
      return next;
    });
    setIssues((prev) => prev.filter((i) => i.from !== from));
    setNotice(t.noticeWordIgnored);
  }

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-loading">
        <Loader2 size={32} className="spin" />
        <p>{lang === 'bn' ? 'লিপিশিল্প লোড হচ্ছে…' : 'Loading Lipishilpo…'}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-error">
        <p>❌ {loadError}</p>
        <p><a href={window.location.href}>{lang === 'bn' ? 'পুনরায় লোড করুন' : 'Reload page'}</a></p>
      </div>
    );
  }

  const visibleIssues = issues.filter((i) => !ignored.includes(i.from));
  const filteredIssues = visibleIssues.filter((i) => proofFilter === 'all' || i.category === proofFilter);
  const longSentences = tabKey === 'proofread' || proofFilter === 'complexity' ? findLongSentences(text, 35) : [];
  const hasSpaces = checked && /[^\S\n]{2,}/.test(text) && !ignored.includes('__spaces');
  const hasDariSpace = checked && /[^\S\n]+[।]/.test(text) && !ignored.includes('__dari_space');
  const safeFixesCount = visibleIssues.filter((i) => !i.optional).length;

  function handleAcceptAllFixes() {
    if (!chapter || !text.trim()) return;
    const safeFixes = visibleIssues.filter((i) => !i.optional);
    if (safeFixes.length === 0) return;
    setHistory((h) => [...h.slice(-49), text]);
    const fixedText = applyAllFixes(text, safeFixes);
    updateText(fixedText);
    setIssues((prev) => prev.filter((i) => i.optional));
    setNotice(t.allFixedNotice);
  }

  // Tabs definitions
  const tabsList = [
    { key: 'proofread' as const, label: t.tabProofread },
    { key: 'audio' as const, label: t.tabAudio },
    { key: 'comments' as const, label: t.tabComments },
    { key: 'snapshots' as const, label: t.tabSnapshots },
    { key: 'aiEdit' as const, label: t.tabAiEdit },
    { key: 'analysis' as const, label: t.tabAnalysis },
    { key: 'format' as const, label: t.tabFormat },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`app ${focusMode ? 'in-focus-mode' : ''}`}>

      {/* ── Sidebar (hidden in Focus Mode) ── */}
      {!focusMode && (
        <aside className="sidebar">
          <div className="brand">
            <span className="brandmark"><Feather size={25} /></span>
            <span>{t.brandName}<small>{t.brandTagline}</small></span>
          </div>

          <div className="section-label first-label">{t.workspace}</div>

          <button className={'nav ' + (view === 'projects' ? 'active' : '')} onClick={() => setView('projects')}>
            <Library size={18} /> {t.allProjects} <span className="pill">{formatNumber(projects.length)}</span>
          </button>

          {project && (
            <button className={'nav ' + (view === 'editor' ? 'active' : '')} onClick={() => setView('editor')}>
              <BookOpen size={18} /> {t.manuscript}
            </button>
          )}

          <hr />

          {project && (
            <>
              <div className="section-label">
                {t.currentProject}
                <button title={t.newProject} onClick={() => setModal(true)}><Plus size={16} /></button>
              </div>

              <button className="project-name" onClick={() => setView('editor')}>
                <span className="mini-cover">{lang === 'bn' ? 'ল' : 'L'}</span>
                <span>{project.title}<small>{project.genre}</small></span>
              </button>

              <div className="chapters">
                {project.chapters.map((c, i) => (
                  <div key={c.id} className={'chapter-item ' + (c.id === chapter?.id ? 'selected' : '')}>
                    <button
                      className="chapter-btn"
                      onClick={() => selectChapter(c.id)}
                    >
                      <FileText size={15} />
                      <span>{formatNumber(i + 1)}. {c.title || t.untitledChapter}</span>
                    </button>
                    <div className="chapter-actions">
                      {i > 0 && (
                        <button title={t.moveChapterUp} onClick={() => moveChapter(i, 'up')}>
                          <ChevronUp size={13} />
                        </button>
                      )}
                      {i < project.chapters.length - 1 && (
                        <button title={t.moveChapterDown} onClick={() => moveChapter(i, 'down')}>
                          <ChevronDown size={13} />
                        </button>
                      )}
                      {project.chapters.length > 1 && (
                        <button title={t.deleteChapter} onClick={() => handleDeleteChapter(c.id)}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button className="add" onClick={addChapter}>
                  <Plus size={15} /> {t.addChapter}
                </button>
              </div>
            </>
          )}

          <hr />
          <div className="section-label">{t.nextSteps}</div>

          <button className="nav" onClick={() => { setTabKey('analysis'); setView('editor'); }}>
            <BarChart3 size={18} /> {t.textAnalysis}
          </button>
          <button className="nav" onClick={() => { setTabKey('format'); setView('editor'); }}>
            <LayoutTemplate size={18} /> {t.bookFormatting}
          </button>

          <button className={'nav ' + (view === 'docs' ? 'active' : '')} onClick={() => setView('docs')}>
            <HelpCircle size={18} /> {t.tabDocs}
          </button>

          <button className={'nav ' + (view === 'settings' ? 'active' : '')} onClick={() => setView('settings')}>
            <Sliders size={18} /> {t.tabSettings}
          </button>

          <div className="sidebar-bottom">
            <div>{t.brandName} <span>STUDIO</span></div>
            <p style={{ whiteSpace: 'pre-line' }}>{t.studioQuote}</p>
            <footer>
              <a href={wpConfig.adminUrl} className="sidebar-wp-return-link" title={t.btnExitToWpTitle}>
                <LogOut size={13} /> <span>{t.btnExitToWp}</span>
              </a>
            </footer>
          </div>
        </aside>
      )}

      {/* ── Main ── */}
      <main className={focusMode ? 'main-focus-mode' : ''}>
        {/* Floating Focus Mode Banner */}
        {focusMode && (
          <div className="focus-floating-bar">
            <span>
              <Feather size={15} />
              <strong>{project?.title}</strong> · {chapter?.title || t.untitledChapter} ({formatNumber(stats.words)} {lang === 'bn' ? 'শব্দ' : 'words'})
            </span>
            <button className="exit-focus-btn" onClick={() => setFocusMode(false)}>
              <Minimize2 size={14} /> {t.btnExitFocus} (Esc)
            </button>
          </div>
        )}

        {!focusMode && (
          <header>
            <div className="breadcrumb">
              {view === 'projects' ? (
                <>
                  <Library size={18} />
                  <span>{t.myProjects}</span>
                </>
              ) : view === 'editor' ? (
                <>
                  <button
                    className="exit-to-wp-btn"
                    title={t.btnExitToDashboardTitle}
                    onClick={() => setView('projects')}
                  >
                    <ArrowLeft size={14} />
                    <span>{t.btnExitToDashboard}</span>
                  </button>
                  <span className="breadcrumb-divider">/</span>
                  {project && <strong>{project.title}</strong>}
                </>
              ) : (
                <>
                  <button
                    className="breadcrumb-nav-link"
                    title={t.btnExitToDashboardTitle}
                    onClick={() => setView('projects')}
                  >
                    <ArrowLeft size={14} />
                    <span>{t.myProjects}</span>
                  </button>
                  <span className="breadcrumb-divider">/</span>
                  {view === 'docs' ? (
                    <>
                      <HelpCircle size={17} />
                      <span>{t.tabDocs}</span>
                    </>
                  ) : (
                    <>
                      <Sliders size={17} />
                      <span>{t.tabSettings}</span>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="header-actions">
              {/* User Guide Docs button */}
              <button
                className={'header-icon-btn ' + (view === 'docs' ? 'active' : '')}
                onClick={() => setView(view === 'docs' ? (project ? 'editor' : 'projects') : 'docs')}
                title={t.btnUserGuide}
              >
                <HelpCircle size={15} />
              </button>

              {/* Settings button */}
              <button
                className={'header-icon-btn ' + (view === 'settings' ? 'active' : '')}
                onClick={() => setView(view === 'settings' ? (project ? 'editor' : 'projects') : 'settings')}
                title={t.tabSettings}
              >
                <Sliders size={15} />
              </button>

              {/* Theme Switcher */}
              {view === 'editor' && (
                <div className="theme-switcher">
                  <button
                    className={'theme-btn ' + (theme === 'light' ? 'active' : '')}
                    onClick={() => handleSetTheme('light')}
                    title={t.themeLight}
                  >
                    <Sun size={14} />
                  </button>
                  <button
                    className={'theme-btn ' + (theme === 'sepia' ? 'active' : '')}
                    onClick={() => handleSetTheme('sepia')}
                    title={t.themeSepia}
                  >
                    <Coffee size={14} />
                  </button>
                  <button
                    className={'theme-btn ' + (theme === 'dark' ? 'active' : '')}
                    onClick={() => handleSetTheme('dark')}
                    title={t.themeDark}
                  >
                    <Moon size={14} />
                  </button>
                </div>
              )}

              {/* Focus Mode toggle */}
              {view === 'editor' && (
                <button
                  className={'header-icon-btn ' + (focusMode ? 'active' : '')}
                  onClick={() => setFocusMode((prev) => !prev)}
                  title={`${t.btnFocusMode} (F11)`}
                >
                  <Maximize2 size={15} />
                </button>
              )}

              {/* Find & Replace toggle */}
              {view === 'editor' && (
                <button
                  className={'header-icon-btn ' + (showSearch ? 'active' : '')}
                  onClick={() => setShowSearch((prev) => !prev)}
                  title={t.btnFindReplace}
                >
                  <Search size={15} />
                </button>
              )}

              {/* Detailed stats modal button */}
              {view === 'editor' && (
                <button
                  className="header-icon-btn"
                  onClick={() => setStatsModal(true)}
                  title={t.btnDetailedStats}
                >
                  <BarChart3 size={15} />
                </button>
              )}

              {/* 🌐 Language Switcher Toggle */}
              <button
                className="lang-toggle-btn"
                onClick={toggleLanguage}
                title={t.langToggleTitle}
              >
                <Globe size={15} />
                <span>{t.langToggle}</span>
              </button>

              <span className="save-state">
                {saveState === 'saving' ? <Loader2 size={16} className="spin" /> : <CheckCheck size={16} />}
                {saveState === 'saved' ? t.saved : saveState === 'saving' ? t.saving : t.saveFailed}
              </span>

              {project && (
                <>
                  <button className="export" onClick={() => { setView('editor'); setTabKey('format'); }}>
                    <Download size={16} /> {t.export}
                  </button>
                  <button className="mobile-new" onClick={() => setModal(true)} title={t.newProject}>
                    <Plus size={18} />
                  </button>
                </>
              )}
            </div>
          </header>
        )}

        {/* ── Projects View ── */}
        {view === 'projects' ? (
          <section className="projects-view">
            <div className="page-heading">
              <div>
                <div className="eyebrow">{t.projectsEyebrow}</div>
                <h1>{t.projectsTitle}</h1>
                <p>{t.projectsSubtitle}</p>
              </div>
              <button className="primary" onClick={() => setModal(true)}>
                <Plus size={18} /> {t.newProject}
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="empty">
                <Feather size={48} />
                <p>{t.emptyProjects}</p>
                <button className="primary" onClick={() => setModal(true)}>
                  <Plus size={18} /> {t.createFirstProject}
                </button>
              </div>
            ) : (
              <div className="project-grid">
                {projects.map((p) => (
                  <div key={p.id} className="project-card-wrap">
                    <button
                      className="project-card"
                      onClick={() => { setPid(p.id); selectChapter(p.chapters[0]?.id ?? ''); }}
                    >
                      <div className="book-art">
                        <Feather size={34} />
                        <span>{p.title}</span>
                        <small>{t.brandName} {t.manuscript}</small>
                      </div>
                      <h2>{p.title}</h2>
                      <p>{p.genre} · {p.language}</p>
                      <footer>
                        {t.chaptersCount(p.chapters.length)} <ArrowRight size={18} />
                      </footer>
                    </button>
                    <button
                      className="delete-project"
                      disabled={deleting === p.id}
                      onClick={() => handleDeleteProject(p.id)}
                      title={t.deleteProjectTitle}
                    >
                      {deleting === p.id ? <Loader2 size={14} className="spin" /> : <X size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        ) : project && chapter ? (
          /* ── Editor View ── */
          <>
            {!focusMode && (
              <div className="document-heading">
                <div>
                  <div className="eyebrow">{t.manuscript} <span>/</span> {project.genre}</div>
                  <h1>{project.title}</h1>
                  <p>{t.documentTagline}</p>
                </div>
                <span className="badge">{project.language} <span>•</span> {t.draft}</span>
              </div>
            )}

            {/* Mobile chapter selector */}
            {!focusMode && (
              <div className="mobile-chapters">
                <select
                  aria-label="Select Chapter"
                  value={chapter.id}
                  onChange={(e) => selectChapter(e.target.value)}
                >
                  {project.chapters.map((c, i) => (
                    <option value={c.id} key={c.id}>
                      {c.title || `${t.chapterLabel(i + 1)}`}
                    </option>
                  ))}
                </select>
                <button onClick={addChapter}><Plus size={17} /> {t.addChapter}</button>
              </div>
            )}

            <div className={`editor-layout ${focusMode ? 'focus-layout' : ''}`}>
              {/* ── Writing area ── */}
              <section className={`writing theme-${theme}`}>
                <div className="toolbar">
                  <span>
                    <FileText size={16} />
                    {t.chapterLabel(project.chapters.findIndex((c) => c.id === chapter.id) + 1)}
                  </span>

                  {/* Mode switcher: Edit vs Visual Review */}
                  <div className="mode-switcher-group">
                    <button
                      className={'mode-btn ' + (editorMode === 'edit' ? 'active' : '')}
                      onClick={() => { setEditorMode('edit'); setActivePopover(null); }}
                      title={t.btnDirectEdit}
                    >
                      <Edit3 size={13} /> {t.btnDirectEdit}
                    </button>
                    <button
                      className={'mode-btn ' + (editorMode === 'review' ? 'active' : '')}
                      onClick={() => {
                        if (!checked) runProofread();
                        setEditorMode('review');
                        setNotice(t.markClickTooltip);
                      }}
                      title={t.btnVisualReview}
                    >
                      <Eye size={13} /> {t.btnVisualReview}
                      {visibleIssues.length > 0 && (
                        <span className="mode-badge">{formatNumber(visibleIssues.length)}</span>
                      )}
                    </button>
                  </div>

                  <div>
                    {/* Add Comment button */}
                    <button
                      className={'comment-trigger-btn ' + (selectedQuote ? 'has-selection' : '')}
                      onClick={() => {
                        handleSelectTextInEditor();
                        setShowCommentDialog(true);
                      }}
                      title={t.btnAddComment}
                    >
                      <MessageSquarePlus size={15} />
                      <span className="btn-text-hide-mobile">{t.tabComments}</span>
                      {comments.length > 0 && <span className="comment-count-badge">{formatNumber(comments.length)}</span>}
                    </button>

                    <button
                      title={t.undo}
                      disabled={!history.length}
                      onClick={() => {
                        updateText(history[history.length - 1]);
                        setHistory((h) => h.slice(0, -1));
                      }}
                    >
                      <Undo2 size={17} />
                    </button>
                    <span className="divider" />
                    <label>
                      {t.fontSize}{' '}
                      <select
                        aria-label={t.fontSize}
                        value={font}
                        onChange={(e) => setFont(Number(e.target.value))}
                      >
                        <option value={18}>{formatNumber(18)}</option>
                        <option value={20}>{formatNumber(20)}</option>
                        <option value={24}>{formatNumber(24)}</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* ── Live Find & Replace Bar ── */}
                {showSearch && (
                  <div className="find-replace-bar">
                    <div className="find-row">
                      <div className="input-group">
                        <Search size={14} />
                        <input
                          ref={searchInput}
                          placeholder={t.findPlaceholder}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleNextMatch();
                            if (e.key === 'Escape') setShowSearch(false);
                          }}
                        />
                      </div>
                      <span className="match-counter">
                        {searchMatches.length > 0
                          ? t.matchCount(activeMatchIndex + 1, searchMatches.length)
                          : searchTerm
                          ? t.noMatches
                          : ''}
                      </span>
                      <button disabled={!searchMatches.length} onClick={handlePrevMatch} title={t.btnFindPrev}>
                        <ChevronUp size={15} />
                      </button>
                      <button disabled={!searchMatches.length} onClick={handleNextMatch} title={t.btnFindNext}>
                        <ChevronDown size={15} />
                      </button>
                      <button onClick={() => setShowSearch(false)}>
                        <X size={15} />
                      </button>
                    </div>
                    <div className="replace-row">
                      <input
                        placeholder={t.replacePlaceholder}
                        value={replaceTerm}
                        onChange={(e) => setReplaceTerm(e.target.value)}
                      />
                      <button disabled={!searchMatches.length} onClick={handleReplaceOne}>
                        {t.btnReplaceOne}
                      </button>
                      <button disabled={!searchMatches.length} onClick={handleReplaceAll}>
                        {t.btnReplaceAll}
                      </button>
                    </div>
                  </div>
                )}

                <div className="paper">
                  <div className="chapter-kicker">
                    {t.chapterKicker(project.chapters.findIndex((c) => c.id === chapter.id) + 1)}
                  </div>
                  <input
                    className="chapter-title"
                    aria-label={t.chapterTitlePlaceholder}
                    placeholder={t.chapterTitlePlaceholder}
                    value={chapter.title}
                    onChange={(e) => updateChapterTitle(e.target.value)}
                  />
                  <div className="paper-rule" />

                  {/* Mode 1: Direct Edit Textarea */}
                  {editorMode === 'edit' ? (
                    <textarea
                      ref={editor}
                      aria-label={t.editorPlaceholder}
                      style={{ fontSize: font }}
                      value={text}
                      placeholder={t.editorPlaceholder}
                      spellCheck={false}
                      onMouseUp={handleSelectTextInEditor}
                      onKeyUp={handleSelectTextInEditor}
                      onSelect={handleSelectTextInEditor}
                      onChange={(e) => {
                        setHistory((h) => [...h.slice(-49), text]);
                        updateText(e.target.value);
                        setChecked(false);
                      }}
                    />
                  ) : (
                    /* Mode 2: Interactive Visual Markup Review */
                    <div
                      className="paper-review-surface"
                      style={{ fontSize: font }}
                    >
                      {(() => {
                        if (!text.trim()) return <p className="empty-review">{t.editorPlaceholder}</p>;

                        interface Seg {
                          start: number;
                          end: number;
                          issue?: ProofMatch;
                          comment?: ChapterComment;
                        }
                        const segs: Seg[] = [];

                        // 1. Issues
                        for (const issue of visibleIssues) {
                          if (issue.from === '__spaces' || issue.from === ' ।') continue;
                          const regex = wordPattern(issue.from);
                          let m: RegExpExecArray | null;
                          while ((m = regex.exec(text)) !== null) {
                            segs.push({
                              start: m.index,
                              end: m.index + issue.from.length,
                              issue,
                            });
                          }
                        }

                        // 2. Comments
                        for (const c of comments) {
                          if (!c.quote || c.resolved) continue;
                          let pos = 0;
                          while ((pos = text.indexOf(c.quote, pos)) !== -1) {
                            segs.push({
                              start: pos,
                              end: pos + c.quote.length,
                              comment: c,
                            });
                            pos += c.quote.length;
                          }
                        }

                        segs.sort((a, b) => a.start - b.start);

                        const nonOverlap: Seg[] = [];
                        let lastEnd = 0;
                        for (const s of segs) {
                          if (s.start >= lastEnd) {
                            nonOverlap.push(s);
                            lastEnd = s.end;
                          }
                        }

                        const elements: React.ReactNode[] = [];
                        let cur = 0;

                        nonOverlap.forEach((s, idx) => {
                          if (s.start > cur) {
                            elements.push(<span key={`t-${idx}`}>{text.slice(cur, s.start)}</span>);
                          }
                          const chunk = text.slice(s.start, s.end);

                          if (s.issue) {
                            const issue = s.issue;
                            elements.push(
                              <mark
                                key={`iss-${idx}-${s.start}`}
                                className={`proof-mark mark-${issue.category || 'spelling'}`}
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setActivePopover({
                                    match: issue,
                                    x: rect.left + rect.width / 2,
                                    y: rect.bottom + window.scrollY,
                                  });
                                }}
                                title={t.markClickTooltip}
                              >
                                {chunk}
                              </mark>
                            );
                          } else if (s.comment) {
                            const comm = s.comment;
                            elements.push(
                              <span
                                key={`c-${idx}-${s.start}`}
                                className="comment-marked-text"
                                onClick={() => {
                                  setTabKey('comments');
                                  setNotice(`Comment: "${comm.comment}"`);
                                }}
                                title={comm.comment}
                              >
                                {chunk}
                                <span className="comment-pin-inline">💬</span>
                              </span>
                            );
                          }
                          cur = s.end;
                        });

                        if (cur < text.length) {
                          elements.push(<span key="t-tail">{text.slice(cur)}</span>);
                        }

                        return elements;
                      })()}
                    </div>
                  )}

                  {/* ── In-Text Popover for Flagged Issue ── */}
                  {activePopover && (
                    <div
                      className="intext-popover"
                      style={{
                        position: 'fixed',
                        top: Math.min(window.innerHeight - 200, activePopover.y + 8),
                        left: Math.max(10, Math.min(window.innerWidth - 300, activePopover.x - 140)),
                        zIndex: 60,
                      }}
                    >
                      <div className="intext-popover-header">
                        <span>{t.popoverRuleTitle}</span>
                        <button onClick={() => setActivePopover(null)}>
                          <X size={13} />
                        </button>
                      </div>
                      <div className="intext-popover-change">
                        <del>{activePopover.match.from}</del>
                        <ArrowRight size={14} />
                        <strong>{activePopover.match.to}</strong>
                      </div>
                      <p className="intext-popover-why">{activePopover.match.why}</p>
                      <div className="intext-popover-actions">
                        <button
                          className="primary"
                          onClick={() => {
                            acceptFix(activePopover.match);
                            setActivePopover(null);
                          }}
                        >
                          <Check size={13} /> {t.btnAccept}
                        </button>
                        <button
                          className="secondary"
                          onClick={() => {
                            ignoreIssue(activePopover.match.from);
                            setActivePopover(null);
                          }}
                        >
                          <X size={13} /> {t.btnIgnore}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <footer className="writing-footer">
                  <span onClick={() => setStatsModal(true)} style={{ cursor: 'pointer' }} title={t.btnDetailedStats}>
                    {t.wordCount(stats.words, stats.characters)}
                  </span>

                  {/* Session Target Progress Bar */}
                  <div
                    className="goal-tracker"
                    title={t.goalProgress(stats.words, writingGoal)}
                    onClick={() => setShowGoalInput(true)}
                  >
                    <Target size={13} />
                    <div className="goal-bar-bg">
                      <div
                        className="goal-bar-fill"
                        style={{ width: `${Math.min(100, Math.round((stats.words / writingGoal) * 100))}%` }}
                      />
                    </div>
                    <span>{formatNumber(stats.words)} / {formatNumber(writingGoal)}</span>
                  </div>

                  <span>{t.readingTime(stats.readingTimeMinutes)}</span>
                </footer>
              </section>

              {/* ── Inspector / Sidebar panel (hidden in focus mode) ── */}
              {!focusMode && (
                <aside className="inspector">
                  <div className="inspector-heading">
                    <span><Sparkles size={20} /></span>
                    <div><h2>{t.inspectorTitle}</h2><p>{t.inspectorSubtitle}</p></div>
                  </div>

                  <div className="tabs">
                    {tabsList.map(({ key, label }) => (
                      <button
                        key={key}
                        className={key === tabKey ? 'selected' : ''}
                        onClick={() => setTabKey(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* ── Tab 1: Proofreading (Free) ── */}
                  {tabKey === 'proofread' && (
                    <>
                      <div className="check-intro">
                        <strong>{t.proofIntroTitle}</strong>
                        <p>{t.proofIntroSubtitle}</p>
                        <div className="proof-intro-actions">
                          <button
                            className="primary full"
                            disabled={!text.trim()}
                            onClick={runProofread}
                          >
                            <Sparkles size={16} /> {t.btnCheckText} <ArrowRight size={16} />
                          </button>
                        </div>
                        <div className="proof-toolbar-row">
                          <label className="auto-check-toggle" title={t.autoCheckLabel}>
                            <input
                              type="checkbox"
                              checked={autoCheck}
                              onChange={(e) => setAutoCheck(e.target.checked)}
                            />
                            <span>{t.autoCheckLabel}</span>
                          </label>
                          <button
                            className="typography-quick-btn"
                            onClick={handleFormatTypography}
                            title={t.btnFixTypography}
                            disabled={!text.trim()}
                          >
                            <Sparkles size={13} /> {t.btnFixTypography}
                          </button>
                        </div>
                      </div>

                      {checked && (
                        <div className="filter-pills">
                          <button
                            className={'pill-btn ' + (proofFilter === 'all' ? 'active' : '')}
                            onClick={() => setProofFilter('all')}
                          >
                            {t.filterAll} ({formatNumber(visibleIssues.length + longSentences.length)})
                          </button>
                          <button
                            className={'pill-btn ' + (proofFilter === 'spelling' ? 'active' : '')}
                            onClick={() => setProofFilter('spelling')}
                          >
                            {t.filterSpelling}
                          </button>
                          <button
                            className={'pill-btn ' + (proofFilter === 'grammar' ? 'active' : '')}
                            onClick={() => setProofFilter('grammar')}
                          >
                            {t.filterGrammar}
                          </button>
                          <button
                            className={'pill-btn ' + (proofFilter === 'style' ? 'active' : '')}
                            onClick={() => setProofFilter('style')}
                          >
                            {t.filterStyle}
                          </button>
                          <button
                            className={'pill-btn ' + (proofFilter === 'punctuation' ? 'active' : '')}
                            onClick={() => setProofFilter('punctuation')}
                          >
                            {t.filterPunctuation}
                          </button>
                          {longSentences.length > 0 && (
                            <button
                              className={'pill-btn ' + (proofFilter === 'complexity' ? 'active' : '')}
                              onClick={() => setProofFilter('complexity')}
                            >
                              {t.filterComplexity} ({formatNumber(longSentences.length)})
                            </button>
                          )}
                        </div>
                      )}

                      <div className="result-label">
                        {t.suggestionsCount}{' '}
                        <span>
                          {checked
                            ? formatNumber(filteredIssues.length + (hasSpaces ? 1 : 0) + (hasDariSpace ? 1 : 0) + (proofFilter === 'all' || proofFilter === 'complexity' ? longSentences.length : 0))
                            : '—'}
                        </span>
                        <small>{t.thisChapter}</small>
                      </div>

                      {checked && safeFixesCount > 0 && (
                        <div className="batch-fix-banner">
                          <button className="primary full" onClick={handleAcceptAllFixes}>
                            <CheckCheck size={16} /> {t.btnAcceptAll} ({formatNumber(safeFixesCount)})
                          </button>
                        </div>
                      )}

                      {!checked ? (
                        <div className="empty">
                          <BookOpen size={28} />
                          <p>{t.emptyProofPrompt}</p>
                        </div>
                      ) : (
                        <>
                          {/* Long sentences / Complexity warnings */}
                          {(proofFilter === 'all' || proofFilter === 'complexity') &&
                            longSentences.map((ls, idx) => (
                              <article className="suggestion style long-sentence-card" key={`ls-${idx}`}>
                                <div className="suggestion-label">
                                  <i />
                                  <span>{t.filterComplexity}</span>
                                  <span className="count-badge">{formatNumber(ls.wordCount)} {lang === 'bn' ? 'শব্দ' : 'words'}</span>
                                  <button
                                    onClick={() => {
                                      const index = text.indexOf(ls.text);
                                      if (index >= 0) {
                                        setEditorMode('edit');
                                        setTimeout(() => {
                                          editor.current?.focus();
                                          editor.current?.setSelectionRange(index, index + ls.text.length);
                                        }, 50);
                                      }
                                    }}
                                  >
                                    {t.viewInText} <ChevronRight size={13} />
                                  </button>
                                </div>
                                <p className="long-sentence-text">“{ls.text}”</p>
                                <p className="long-sentence-hint">💡 {t.longSentenceAlert(ls.wordCount)}</p>
                              </article>
                            ))}

                          {filteredIssues.map((r) => (
                            <article
                              className={'suggestion ' + (r.category === 'spelling' ? 'spelling' : 'style')}
                              key={r.id + r.from}
                            >
                              <div className="suggestion-label">
                                <i />
                                {r.kind}
                                {r.optional && <span className="optional-badge">{t.optionalBadge}</span>}
                                <button
                                  onClick={() => {
                                    const m = wordPattern(r.from).exec(text);
                                    if (m) {
                                      setEditorMode('edit');
                                      setTimeout(() => {
                                        editor.current?.focus();
                                        editor.current?.setSelectionRange(m.index, m.index + r.from.length);
                                      }, 50);
                                    }
                                  }}
                                >
                                  {t.viewInText} <ChevronRight size={13} />
                                </button>
                              </div>
                              <div className="replacement">
                                <del>{r.from}</del>
                                <ArrowRight size={16} />
                                <strong>{r.to}</strong>
                                {r.count && r.count > 1 && <span className="count-badge">×{formatNumber(r.count)}</span>}
                              </div>
                              <p>{r.why}</p>
                              <div className="suggestion-actions">
                                <button onClick={() => acceptFix(r)}>
                                  <Check size={14} /> {t.btnAccept}
                                </button>
                                <button onClick={() => ignoreIssue(r.from)} title={t.btnAddToDictionary}>
                                  <X size={14} /> {t.btnIgnore}
                                </button>
                              </div>
                            </article>
                          ))}

                          {hasDariSpace && (proofFilter === 'all' || proofFilter === 'punctuation') && (
                            <article className="suggestion">
                              <strong>{t.dariSpaceTitle}</strong>
                              <p>{t.dariSpaceDesc}</p>
                              <button
                                className="secondary"
                                onClick={() => {
                                  setHistory((h) => [...h, text]);
                                  updateText(text.replace(/[^\S\n]+[।]/g, '।'));
                                  ignoreIssue('__dari_space');
                                }}
                              >
                                {t.btnFixSpaces}
                              </button>
                            </article>
                          )}

                          {hasSpaces && (proofFilter === 'all' || proofFilter === 'punctuation') && (
                            <article className="suggestion">
                              <strong>{t.extraSpacesTitle}</strong>
                              <p>{t.extraSpacesDesc}</p>
                              <button
                                className="secondary"
                                onClick={() => {
                                  setHistory((h) => [...h, text]);
                                  updateText(text.replace(/[^\S\n]{2,}/g, ' '));
                                  ignoreIssue('__spaces');
                                }}
                              >
                                {t.btnFixSpaces}
                              </button>
                            </article>
                          )}

                          {!filteredIssues.length && !longSentences.length && !hasSpaces && !hasDariSpace && (
                            <div className="empty">
                              <CheckCheck size={28} />
                              <p>{t.emptyProofClean}</p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="gentle-note">
                        <Feather size={17} />
                        <p>{t.gentleNote}</p>
                      </div>
                    </>
                  )}

                  {/* ── Tab: Audio Proofreading (Pro) ── */}
                  {tabKey === 'audio' && (
                    <div className="audio-tab-panel">
                      <div className="check-intro">
                        <strong>{t.audioTitle}</strong>
                        <p>{t.audioSubtitle}</p>
                      </div>
                      <AudioProofreader
                        text={text}
                        isPro={wpConfig.isPro}
                        lang={lang}
                        onSentenceHighlight={(sentence) => {
                          if (!sentence) return;
                          const pos = text.indexOf(sentence.trim());
                          if (pos >= 0 && editor.current) {
                            editor.current.focus();
                            editor.current.setSelectionRange(pos, pos + sentence.trim().length);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* ── Tab 2: Comments & Annotations (Free) ── */}
                  {tabKey === 'comments' && (
                    <div className="comments-panel">
                      <div className="check-intro">
                        <strong>{t.commentsHeading}</strong>
                        <p>{t.commentsSubtitle}</p>
                        <button
                          className="primary full"
                          onClick={() => {
                            handleSelectTextInEditor();
                            setShowCommentDialog(true);
                          }}
                        >
                          <MessageSquarePlus size={16} /> {t.btnAddComment}
                        </button>
                      </div>

                      <div className="result-label">
                        <span>{formatNumber(comments.length)}</span>
                        <small>{t.thisChapter}</small>
                      </div>

                      {comments.length === 0 ? (
                        <div className="empty">
                          <MessageSquare size={28} />
                          <p>{t.noCommentsYet}</p>
                        </div>
                      ) : (
                        <div className="comments-list">
                          {comments.map((comm) => (
                            <div
                              key={comm.id}
                              className={'comment-card ' + (comm.resolved ? 'resolved' : '')}
                            >
                              <div className="comment-header">
                                {comm.quote ? (
                                  <blockquote className="comment-quote">"{comm.quote}"</blockquote>
                                ) : (
                                  <strong>{t.tabComments}</strong>
                                )}
                                <div className="comment-actions">
                                  <button
                                    onClick={() => handleToggleResolveComment(comm.id)}
                                    title={t.btnResolveComment}
                                    className={'resolve-btn ' + (comm.resolved ? 'active' : '')}
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comm.id)}
                                    title={t.btnDeleteComment}
                                    className="delete-btn"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                              <p className="comment-body">{comm.comment}</p>
                              <footer className="comment-footer">
                                <span>{comm.date}</span>
                                {comm.resolved && (
                                  <span className="resolved-pill">{t.commentResolvedBadge}</span>
                                )}
                              </footer>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Tab 3: Snapshots & History (Free) ── */}
                  {tabKey === 'snapshots' && (
                    <div className="snapshots-panel">
                      <div className="check-intro">
                        <strong>{t.snapshotsHeading}</strong>
                        <p>{t.snapshotsSubtitle}</p>
                        <form className="snapshot-form" onSubmit={handleSaveSnapshot}>
                          <input
                            placeholder={t.snapshotNamePlaceholder}
                            value={newSnapshotName}
                            onChange={(e) => setNewSnapshotName(e.target.value)}
                          />
                          <button className="primary full" type="submit" disabled={!text.trim()}>
                            <History size={16} /> {t.btnSaveSnapshot}
                          </button>
                        </form>
                      </div>

                      <div className="result-label">
                        <span>{formatNumber(snapshots.length)}</span>
                        <small>{t.thisChapter}</small>
                      </div>

                      {snapshots.length === 0 ? (
                        <div className="empty">
                          <History size={28} />
                          <p>{t.noSnapshots}</p>
                        </div>
                      ) : (
                        <div className="snapshots-list">
                          {snapshots.map((snap) => (
                            <div key={snap.id} className="snapshot-card">
                              <div className="snapshot-header">
                                <strong>{snap.name}</strong>
                                <button
                                  className="delete-snap-btn"
                                  onClick={() => handleDeleteSnapshot(snap.id)}
                                  title="Delete snapshot"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                              <div className="snapshot-meta">
                                <span>{snap.date}</span>
                                <span>· {formatNumber(snap.wordCount)} {lang === 'bn' ? 'শব্দ' : 'words'}</span>
                              </div>
                              <button
                                className="secondary full restore-btn"
                                onClick={() => handleRestoreSnapshot(snap)}
                              >
                                <Undo2 size={13} /> {t.btnRestore}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Tab 3 & 4: AI Edit & Analysis (Pro) ── */}
                  {(tabKey === 'aiEdit' || tabKey === 'analysis') && (
                  <AIPanel
                    key={project.id + tabKey + lang}
                    project={project}
                    chapter={chapter}
                    defaultMode={tabKey === 'aiEdit' ? 'proofread' : 'chapter'}
                    isPro={wpConfig.isPro}
                    lang={lang}
                    onLocate={(id, quote) => {
                      setCid(id);
                      setHistory([]);
                      setTimeout(() => {
                        const current = project.chapters.find((c) => c.id === id);
                        const index = current?.text.indexOf(quote) ?? -1;
                        if (index >= 0) {
                          editor.current?.focus();
                          editor.current?.setSelectionRange(index, index + quote.length);
                          editor.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 0);
                    }}
                    onApply={(id, before, after) => {
                      const c = project.chapters.find((c) => c.id === id);
                      if (!c || !before || c.text.indexOf(before) < 0 || c.text.indexOf(before) !== c.text.lastIndexOf(before))
                        return false;
                      setCid(id);
                      setHistory([c.text]);
                      const updated = projects.map((p) =>
                        p.id === project.id
                          ? { ...p, chapters: p.chapters.map((ch) => ch.id === id ? { ...ch, text: ch.text.replace(before, () => after) } : ch) }
                          : p
                      );
                      setProjects(updated);
                      autosave(updated);
                      setNotice(t.noticeAiFixAccepted);
                      return true;
                    }}
                  />
                )}

                {/* ── Tab 4: Format / Export (Pro) ── */}
                {tabKey === 'format' && (
                  <ExportPanel
                    key={project.id + lang}
                    project={project}
                    isPro={wpConfig.isPro}
                    lang={lang}
                    onTxt={downloadTxt}
                  />
                )}
              </aside>
            )}
            </div>
          </>
        ) : view === 'docs' ? (
          <DocsView
            lang={lang}
            onOpenEditor={() => setView(project ? 'editor' : 'projects')}
            onOpenSettings={() => setView('settings')}
          />
        ) : view === 'settings' ? (
          <SettingsView
            isPro={wpConfig.isPro}
            lang={lang}
            onToggleLang={toggleLanguage}
            onOpenEditor={() => setView(project ? 'editor' : 'projects')}
          />
        ) : null}
      </main>

      {/* ── Toast notice ── */}
      {notice && (
        <output className="toast">
          <Check size={17} /> {notice}
        </output>
      )}

      {/* ── Manuscript Stats Modal ── */}
      <dialog ref={statsDialog} className="modal-dialog" onCancel={() => setStatsModal(false)}>
        <div className="modal">
          <button type="button" className="close" onClick={() => setStatsModal(false)}>
            <X size={20} />
          </button>
          <span className="brandmark"><BarChart3 size={24} /></span>
          <h2>{t.statsModalTitle}</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{formatNumber(stats.words)}</span>
              <span className="stat-label">{t.statsTotalWords}</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{formatNumber(stats.characters)}</span>
              <span className="stat-label">{t.statsTotalChars}</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{formatNumber(stats.charactersNoSpaces)}</span>
              <span className="stat-label">{t.statsCharsNoSpaces}</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{formatNumber(stats.paragraphs)}</span>
              <span className="stat-label">{t.statsParagraphs}</span>
            </div>
            <div className="stat-card full">
              <span className="stat-value">{t.statsMinutes(stats.readingTimeMinutes)}</span>
              <span className="stat-label">{t.statsEstReadingTime}</span>
            </div>
          </div>
          <div className="stats-export-actions">
            <button className="primary" onClick={downloadTxt}>
              <Download size={15} /> {t.btnExportTxt}
            </button>
            <button className="secondary" onClick={downloadMarkdown}>
              <FileCode size={15} /> {t.btnExportMarkdown}
            </button>
          </div>
        </div>
      </dialog>

      {/* ── New Project Modal ── */}
      <dialog ref={dialog} className="modal-dialog" aria-labelledby="new-project-title" onCancel={() => setModal(false)}>
        <form className="modal" onSubmit={handleCreateProject}>
          <button type="button" className="close" aria-label={t.btnClose} onClick={() => setModal(false)}>
            <X size={20} />
          </button>
          <span className="brandmark"><Feather size={24} /></span>
          <h2 id="new-project-title">{t.modalTitle}</h2>
          <p>{t.modalSubtitle}</p>

          <label>
            {t.modalProjectNameLabel}
            <input
              autoFocus
              required
              maxLength={120}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t.modalProjectNamePlaceholder}
            />
          </label>

          <label>
            {t.modalGenreLabel}
            <select value={newGenre} onChange={(e) => setNewGenre(e.target.value)}>
              <option value="Fiction / Novel">{t.modalGenreFiction}</option>
              <option value="Nonfiction / Essay">{t.modalGenreNonfiction}</option>
              <option value="Blog / Web Content">{t.modalGenreBlog}</option>
              <option value="News / Journalism">{t.modalGenreNews}</option>
              <option value="General Writing">{t.modalGenreGeneral}</option>
            </select>
          </label>

          <label>
            {t.modalLanguageLabel}
            <select value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)}>
              <option value="English">{t.modalLangEn}</option>
              <option value="বাংলা">{t.modalLangBn}</option>
              <option value="English + বাংলা">{t.modalLangMixed}</option>
            </select>
          </label>

          <p className="prototype-note">
            {t.modalServerNote}
          </p>

          <button className="primary full" type="submit">
            {t.btnCreateProject} <ArrowRight size={17} />
          </button>
        </form>
      </dialog>

      {/* ── Writing Goal Setting Modal ── */}
      {showGoalInput && (
        <div className="modal-backdrop" onClick={() => setShowGoalInput(false)}>
          <div className="modal goal-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close" onClick={() => setShowGoalInput(false)}>
              <X size={20} />
            </button>
            <span className="brandmark"><Target size={24} /></span>
            <h2>{t.goalLabel}</h2>
            <p>{t.projectsSubtitle}</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem('goalInput') as HTMLInputElement).value;
              handleSaveGoal(parseInt(input, 10) || 500);
            }}>
              <label>
                {t.goalLabel} ({lang === 'bn' ? 'শব্দ' : 'words'})
                <input
                  name="goalInput"
                  type="number"
                  defaultValue={writingGoal}
                  min={50}
                  step={50}
                  required
                />
              </label>
              <div className="goal-preset-btns">
                <button type="button" onClick={() => handleSaveGoal(250)}>250</button>
                <button type="button" onClick={() => handleSaveGoal(500)}>500</button>
                <button type="button" onClick={() => handleSaveGoal(1000)}>1,000</button>
                <button type="button" onClick={() => handleSaveGoal(2000)}>2,000</button>
              </div>
              <button className="primary full" type="submit" style={{ marginTop: '16px' }}>
                {t.btnSetGoal}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Comment / Annotation Modal ── */}
      {showCommentDialog && (
        <div className="modal-backdrop" onClick={() => setShowCommentDialog(false)}>
          <div className="modal comment-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close" onClick={() => setShowCommentDialog(false)}>
              <X size={20} />
            </button>
            <span className="brandmark"><MessageSquarePlus size={24} /></span>
            <h2>{t.btnAddComment}</h2>
            <p>{t.commentsSubtitle}</p>

            <form onSubmit={handleAddComment}>
              {selectedQuote ? (
                <div className="comment-quote-box">
                  <small>{t.commentQuoteLabel}</small>
                  <blockquote>"{selectedQuote}"</blockquote>
                </div>
              ) : (
                <p className="no-quote-note">
                  💡 {lang === 'bn' ? 'টেক্সট সিলেক্ট ছাড়া সাধারণ অধ্যায় নোট যুক্ত হচ্ছে।' : 'Attaching general chapter note.'}
                </p>
              )}

              <label>
                {t.tabComments}
                <textarea
                  autoFocus
                  required
                  rows={4}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={t.commentPlaceholder}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '5px',
                    border: '1px solid #dce6d1',
                    background: '#f9fbf6',
                    marginTop: '7px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </label>

              <button className="primary full" type="submit" style={{ marginTop: '16px' }}>
                <MessageSquare size={15} /> {t.btnSaveComment}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
