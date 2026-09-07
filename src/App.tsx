import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Feather, BookOpen, Plus, FileText, Library, BarChart3,
  LayoutTemplate, ChevronRight, Download, CheckCheck,
  Sparkles, ArrowRight, ArrowLeft, LayoutDashboard, Check, X, Undo2, Loader2, Globe,
  Search, ChevronUp, ChevronDown, Trash2, FileCode, HelpCircle, Sliders, LogOut,
  Maximize2, Minimize2, Sun, Moon, Coffee, History, Target,
  MessageSquare, MessageSquarePlus, CheckCircle, Eye, Edit3,
  BookA, Share2, StickyNote, FileUp,
  Bold, Italic, Heading2, Quote, List, Box, Bookmark, GripVertical, Replace,
} from 'lucide-react';
import {
  type Project, type Chapter, type ChapterStatus,
  fetchProjects, createProject, updateProject, deleteProject,
  fetchPrefs, updatePrefs,
} from './api';
import {
  findIssues, applyAllFixes, calculateStats,
  formatTypography, findLongSentences,
  type ProofMatch, type ManuscriptStats, type RuleCategory,
} from './proofread';
import { DocsView } from './components/DocsView';
import { getLipishilpoPro, type ProTabKey } from './pro-bridge';
import { SettingsView } from './components/SettingsView';
import { GoalTracker } from './components/GoalTracker';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TypographyControl } from './components/TypographyControl';
import { PublishModal } from './components/PublishModal';
import { ConjunctsModal } from './components/ConjunctsModal';
import { FloatingBubbleToolbar } from './components/FloatingBubbleToolbar';
import { ProofreadWalkthroughBar } from './components/ProofreadWalkthroughBar';
import { PersonalDictionaryModal } from './components/PersonalDictionaryModal';
import { renderFormattedSpan } from './lib/render-review';
import { GlobalFindReplaceModal } from './components/GlobalFindReplaceModal';
import { CodexPanel, type ProjectCodex } from './components/CodexPanel';
import { analyzeManuscript } from './lib/analytics';
import { handleSmartKeyDown } from './lib/smart-typography';
import { exportProjectToJson } from './lib/project-backup';
import { importManuscriptFile, ManuscriptImportError } from './lib/manuscript-import';
import { createId } from './lib/id';
import { clipEditText, diffManualEdits, type ChapterEdit, type EditKind } from './lib/edit-log';
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

export type EditorTheme = 'light' | 'sepia' | 'parchment' | 'dark' | 'oled';
export type EditorMode = 'edit' | 'review';

export default function App() {
  // ── Language State ─────────────────────────────────────────────────────────
  const [lang, setLang] = useState<Language>(getSavedLanguage());
  const t = translations[lang];

  const formatNumber = useCallback((n: number) => {
    return lang === 'bn' ? n.toLocaleString('bn-BD') : n.toLocaleString('en-US');
  }, [lang]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectPages, setProjectPages] = useState(1);
  const [projectPage, setProjectPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
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
  const [tabKey, setTabKey] = useState<'proofread' | 'codex' | 'notes' | 'comments' | 'snapshots' | ProTabKey>('proofread');
  const [proApi, setProApi] = useState(() => getLipishilpoPro());
  const proSlot = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState(false);
  const [statsModal, setStatsModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showConjuncts, setShowConjuncts] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Focus mode & Theme & Mode (Edit vs Visual Review)
  const [focusMode, setFocusMode] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughIndex, setWalkthroughIndex] = useState(0);
  const [showDictModal, setShowDictModal] = useState(false);

  const [theme, setTheme] = useState<EditorTheme>(() => {
    try {
      const saved = localStorage.getItem('lipishilpo_theme') as EditorTheme;
      if (saved === 'light' || saved === 'sepia' || saved === 'parchment' || saved === 'dark' || saved === 'oled') return saved;
    } catch {}
    return 'light';
  });

  const [typewriterMode, setTypewriterMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lipishilpo_typewriter') === '1';
    } catch {
      return false;
    }
  });

  const [smartTyping, setSmartTyping] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lipishilpo_smart_typing');
      return saved !== null ? saved === '1' : true;
    } catch {
      return true;
    }
  });

  const [bubblePosition, setBubblePosition] = useState<{ top: number; left: number } | null>(null);
  const [showGlobalFindModal, setShowGlobalFindModal] = useState(false);
  const [draggedChapterIndex, setDraggedChapterIndex] = useState<number | null>(null);
  const paperContainerRef = useRef<HTMLDivElement>(null);

  const [dailyTarget, setDailyTarget] = useState(500);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [wordsToday, setWordsToday] = useState(0);
  const pendingSave = useRef<{ id: string; data: Parameters<typeof updateProject>[1] } | null>(null);

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
  const [styleHints, setStyleHints] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lipishilpo_style_hints') === '1';
    } catch {
      return false;
    }
  });
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
  const [edits, setEdits] = useState<ChapterEdit[]>([]);
  const [editFilter, setEditFilter] = useState<EditKind | 'all'>('all');
  const [customTo, setCustomTo] = useState<Record<string, string>>({});

  // UI state
  const [notice, setNotice] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [font, setFont] = useState(20);
  const [deleting, setDeleting] = useState<string | null>(null);

  const dialog = useRef<HTMLDialogElement>(null);
  const statsDialog = useRef<HTMLDialogElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackedTextRef = useRef('');
  const typedTextRef = useRef('');
  const manualLogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const detailedStats = useMemo(() => analyzeManuscript(text), [text]);
  const manuscriptWords = project
    ? project.chapters.reduce((n, c) => n + calculateStats(c.text).words, 0)
    : 0;

  const healthScore = useMemo(() => {
    if (!text.trim()) return 100;
    const words = text.trim().split(/\s+/).length;
    const issueCount = (issues || []).filter((i) => !ignored.includes(i.from) && !ignored.includes(i.id)).length;
    if (issueCount === 0) return 100;
    const deduction = Math.min(60, Math.round((issueCount / Math.max(15, words)) * 100 * 2.5));
    return Math.max(40, 100 - deduction);
  }, [text, issues, ignored]);

  useEffect(() => {
    if (window.LipishilpoPro) {
      setProApi(window.LipishilpoPro);
      return;
    }
    const onReady = () => setProApi(getLipishilpoPro());
    window.addEventListener('lipishilpo-pro-ready', onReady);
    return () => window.removeEventListener('lipishilpo-pro-ready', onReady);
  }, []);

  useEffect(() => {
    const api = proApi;
    if (!api) return;
    const isHosted = api.tabs.some((tab) => tab.key === tabKey);
    if (!isHosted || !project || !chapter || !proSlot.current) {
      if (!isHosted) api.unmount();
      return;
    }
    api.mount(proSlot.current, {
      tab: tabKey as ProTabKey,
      project,
      chapter,
      text,
      lang,
      isPro: wpConfig.isPro,
      onTxt: downloadTxt,
      onHtml: downloadHtml,
      onSentenceHighlight: (sentence) => {
        if (!sentence || !editor.current) return;
        const pos = text.indexOf(sentence.trim());
        if (pos >= 0) {
          editor.current.focus();
          editor.current.setSelectionRange(pos, pos + sentence.trim().length);
        }
      },
      onLocate: (id, quote) => {
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
      },
      onApply: (id, before, after) => {
        const c = project.chapters.find((ch) => ch.id === id);
        if (!c || !before || c.text.indexOf(before) < 0 || c.text.indexOf(before) !== c.text.lastIndexOf(before)) {
          return false;
        }
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
      },
    });
  }, [proApi, tabKey, project, chapter, text, lang, projects, t.noticeAiFixAccepted, view, focusMode]);

  // ── Load projects and user prefs from WP API ───────────────────────────────
  useEffect(() => {
    Promise.all([fetchProjects(1), fetchPrefs()])
      .then(([list, prefs]) => {
        setProjects(list.items);
        setProjectPage(1);
        setProjectPages(list.pages);
        if (list.items.length > 0) {
          setPid(list.items[0].id);
          setCid(list.items[0].chapters[0]?.id ?? null);
        }
        setDailyTarget(prefs.dailyTarget || 500);
        if (prefs.dictionary.length) {
          setIgnored(prefs.dictionary);
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

  // ── Autosave (explicit project id — no stale-closure race) ─────────────────
  const autosave = useCallback((updatedProjects: Project[]) => {
    const projectId = pid;
    if (!projectId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');

    const current = updatedProjects.find((p) => p.id === projectId);
    if (!current) return;

    pendingSave.current = {
      id: projectId,
      data: {
        chapters: current.chapters,
        snapshots: current.snapshots,
        comments: current.comments,
        edits: current.edits,
      },
    };

    saveTimer.current = setTimeout(async () => {
      const pending = pendingSave.current;
      if (!pending) return;
      try {
        await updateProject(pending.id, pending.data);
        pendingSave.current = null;
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 1500);
  }, [pid]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const pending = pendingSave.current;
      if (pending) {
        updateProject(pending.id, pending.data).catch(() => {});
        pendingSave.current = null;
      }
    };
  }, [pid]);

  // ── Snapshots Lifecycle (server first, localStorage migrate) ───────────────
  useEffect(() => {
    if (!chapter || !project) {
      setSnapshots([]);
      return;
    }
    const server = (project.snapshots?.[chapter.id] as ChapterSnapshot[] | undefined) ?? [];
    if (server.length > 0) {
      setSnapshots(server);
      return;
    }
    try {
      const saved = localStorage.getItem(`lipishilpo_snapshots_${chapter.id}`);
      setSnapshots(saved ? JSON.parse(saved) : []);
    } catch {
      setSnapshots([]);
    }
  }, [chapter?.id, project?.id]);

  function handleSaveSnapshot(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!chapter || !text.trim()) return;
    const name = newSnapshotName.trim() || `${t.draft} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    const snap: ChapterSnapshot = {
      id: createId(),
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
    persistChapterMeta('snapshots', chapter.id, updated);
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
    persistChapterMeta('snapshots', chapter.id, updated);
  }

  // ── Comments Lifecycle (server first, localStorage migrate) ────────────────
  useEffect(() => {
    if (!chapter || !project) {
      setComments([]);
      return;
    }
    const server = (project.comments?.[chapter.id] as ChapterComment[] | undefined) ?? [];
    if (server.length > 0) {
      setComments(server);
      return;
    }
    try {
      const saved = localStorage.getItem(`lipishilpo_comments_${chapter.id}`);
      setComments(saved ? JSON.parse(saved) : []);
    } catch {
      setComments([]);
    }
  }, [chapter?.id, project?.id]);

  useEffect(() => {
    if (!chapter || !project) {
      setEdits([]);
      setCustomTo({});
      trackedTextRef.current = '';
      typedTextRef.current = '';
      return;
    }
    trackedTextRef.current = chapter.text;
    typedTextRef.current = chapter.text;
    const server = project.edits?.[chapter.id] as ChapterEdit[] | undefined;
    if (Array.isArray(server)) {
      setEdits(server);
      return;
    }
    try {
      const saved = localStorage.getItem(`lipishilpo_edits_${chapter.id}`);
      setEdits(saved ? JSON.parse(saved) : []);
    } catch {
      setEdits([]);
    }
  }, [chapter?.id, project?.id]);

  function editStamp() {
    return new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function recordEdits(items: Omit<ChapterEdit, 'id' | 'date'>[]) {
    if (!chapter || items.length === 0) return;
    const date = editStamp();
    const next = [
      ...items.map((item) => ({
        ...item,
        id: createId(),
        date,
        from: clipEditText(item.from),
        to: clipEditText(item.to),
        why: item.why ? clipEditText(item.why, 240) : '',
      })),
      ...edits,
    ].slice(0, 200);
    setEdits(next);
    persistChapterMeta('edits', chapter.id, next);
    try {
      localStorage.setItem(`lipishilpo_edits_${chapter.id}`, JSON.stringify(next));
    } catch {}
  }

  function flushManualEdits() {
    if (manualLogTimer.current) {
      clearTimeout(manualLogTimer.current);
      manualLogTimer.current = null;
    }
    const before = trackedTextRef.current;
    const after = typedTextRef.current;
    const items = diffManualEdits(before, after, t.manualEditWhy);
    trackedTextRef.current = after;
    if (items.length) recordEdits(items);
  }

  function scheduleManualLog() {
    if (manualLogTimer.current) clearTimeout(manualLogTimer.current);
    manualLogTimer.current = setTimeout(flushManualEdits, 900);
  }

  function kindFromIssue(issue: ProofMatch): EditKind {
    if (issue.id === '__spaces' || issue.id === '__dari_space' || issue.category === 'punctuation' || issue.category === 'typography') {
      return 'punctuation';
    }
    if (issue.category === 'grammar') return 'grammar';
    if (issue.category === 'style') return 'style';
    return 'spelling';
  }

  function resolvedTo(issue: ProofMatch): { to: string; customized: boolean } {
    const typed = (customTo[issue.id] ?? '').trim();
    if (typed && typed !== issue.to) return { to: typed, customized: true };
    return { to: issue.to, customized: false };
  }

  function handleAddComment(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!chapter || !newCommentText.trim()) return;
    const newComment: ChapterComment = {
      id: createId(),
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
    persistChapterMeta('comments', chapter.id, updated);
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
    persistChapterMeta('comments', chapter.id, updated);
  }

  function handleDeleteComment(commentId: string) {
    if (!chapter) return;
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    persistChapterMeta('comments', chapter.id, updated);
    setNotice(t.noticeCommentDeleted);
  }

  function adjustTypewriterScroll() {
    if (!typewriterMode || !editor.current || !paperContainerRef.current) return;
    const textarea = editor.current;
    const container = paperContainerRef.current;
    
    // Calculate approximate line position
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    const lineCount = textBeforeCursor.split('\n').length;
    const computed = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computed.lineHeight) || (parseFloat(computed.fontSize) * 1.8) || 28;
    
    const cursorTopInTextarea = lineCount * lineHeight;
    const textareaOffsetTop = textarea.offsetTop;
    const targetScrollTop = textareaOffsetTop + cursorTopInTextarea - (container.clientHeight / 2);
    
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });
  }

  function handleSelectTextInEditor() {
    if (!editor.current) return;
    const textarea = editor.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const selected = text.slice(start, end).trim();
      if (selected.length > 0 && selected.length < 300) {
        setSelectedQuote(selected);
      }

      // Calculate coordinates for floating bubble
      const rect = textarea.getBoundingClientRect();
      const textBefore = textarea.value.substring(0, start);
      const lines = textBefore.split('\n');
      const lineIndex = lines.length;
      const computed = window.getComputedStyle(textarea);
      const lineHeight = parseFloat(computed.lineHeight) || 28;
      
      const topPos = rect.top + Math.min(lineIndex * lineHeight, rect.height) + window.scrollY;
      const leftPos = rect.left + (rect.width / 2);
      setBubblePosition({ top: Math.max(80, topPos - 12), left: leftPos });
    } else {
      setBubblePosition(null);
    }

    if (typewriterMode) {
      adjustTypewriterScroll();
    }
  }

  function handleBubbleFormat(format: 'bold' | 'italic' | 'quote' | 'single-quote' | 'h2' | 'h3' | 'emdash' | 'scene-break' | 'mark' | 'comment') {
    if (format === 'comment') {
      handleSelectTextInEditor();
      setShowCommentDialog(true);
      setBubblePosition(null);
      return;
    }
    
    if (!editor.current) return;
    const textarea = editor.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);
    let replacement = '';
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        replacement = `**${selected || (lang === 'bn' ? 'গাঢ় লেখা' : 'bold text')}**`;
        newCursorPos = selected ? end + 4 : start + 2;
        break;
      case 'italic':
        replacement = `*${selected || (lang === 'bn' ? 'বাঁকা লেখা' : 'italic text')}*`;
        newCursorPos = selected ? end + 2 : start + 1;
        break;
      case 'quote':
        replacement = `“${selected || (lang === 'bn' ? 'উদ্ধৃতি' : 'quote')}”`;
        newCursorPos = selected ? end + 2 : start + 1;
        break;
      case 'single-quote':
        replacement = `‘${selected || (lang === 'bn' ? 'একক উদ্ধৃতি' : 'quote')}’`;
        newCursorPos = selected ? end + 2 : start + 1;
        break;
      case 'h2':
        replacement = `\n## ${selected || (lang === 'bn' ? 'উপ-শিরোনাম' : 'Subheading')}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'h3':
        replacement = `\n### ${selected || (lang === 'bn' ? 'অনুচ্ছেদ শিরোনাম' : 'Section Heading')}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'emdash':
        replacement = `—`;
        newCursorPos = start + 1;
        break;
      case 'scene-break':
        replacement = `\n\n❖ ❖ ❖\n\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'mark':
        replacement = `<mark>${selected || (lang === 'bn' ? 'হাইলাইট' : 'highlight')}</mark>`;
        newCursorPos = selected ? end + 15 : start + 6;
        break;
    }

    const nextText = text.substring(0, start) + replacement + text.substring(end);
    setHistory((h) => [...h.slice(-49), text]);
    typedTextRef.current = nextText;
    updateText(nextText, 'type');
    scheduleManualLog();
    setChecked(false);
    setBubblePosition(null);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  }

  // ── Theme Switcher ─────────────────────────────────────────────────────────
  function handleSetTheme(nextTheme: EditorTheme) {
    setTheme(nextTheme);
    try {
      localStorage.setItem('lipishilpo_theme', nextTheme);
    } catch {}
  }

  function toggleTypewriterMode() {
    setTypewriterMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lipishilpo_typewriter', next ? '1' : '0');
      } catch {}
      return next;
    });
  }

  function toggleSmartTyping() {
    setSmartTyping((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lipishilpo_smart_typing', next ? '1' : '0');
      } catch {}
      return next;
    });
  }

  function persistChapterMeta(
    kind: 'snapshots' | 'comments' | 'edits',
    chapterId: string,
    items: ChapterSnapshot[] | ChapterComment[] | ChapterEdit[]
  ) {
    if (!pid) return;
    const updated = projects.map((p) =>
      p.id === pid
        ? { ...p, [kind]: { ...(p[kind] ?? {}), [chapterId]: items } }
        : p
    );
    setProjects(updated);
    autosave(updated);
  }

  function handleSaveGoal(target: number) {
    const valid = Math.max(50, target);
    setDailyTarget(valid);
    setGoalModalOpen(false);
    try {
      localStorage.setItem('lipishilpo_daily_target', String(valid));
      localStorage.setItem('lipishilpo_writing_goal', String(valid));
    } catch {}
    updatePrefs({ dailyTarget: valid }).catch(() => {});
  }

  // ── Force immediate save ───────────────────────────────────────────────────
  const forceSave = useCallback(async () => {
    if (!pid) return;
    const current = projects.find((p) => p.id === pid);
    if (!current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    try {
      await updateProject(pid, {
        chapters: current.chapters,
        snapshots: current.snapshots,
        comments: current.comments,
        edits: current.edits,
      });
      pendingSave.current = null;
      setSaveState('saved');
      setNotice(t.saved);
    } catch {
      setSaveState('error');
    }
  }, [pid, projects, t.saved]);

  // ── Keyboard Shortcuts (Ctrl+S, Ctrl+F, F11, Esc) ───────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        forceSave();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f') && view === 'editor') {
        e.preventDefault();
        setShowGlobalFindModal(true);
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
    
    const handleWalkthroughKeys = (e: KeyboardEvent) => {
      if (!showWalkthrough || visibleIssues.length === 0) return;
      if (e.key === 'Escape') {
        setShowWalkthrough(false);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setWalkthroughIndex((prev) => (e.shiftKey ? (prev - 1 + visibleIssues.length) % visibleIssues.length : (prev + 1) % visibleIssues.length));
      } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const safeIdx = Math.max(0, Math.min(walkthroughIndex, visibleIssues.length - 1));
        const activeIssue = visibleIssues[safeIdx];
        if (activeIssue) {
          e.preventDefault();
          acceptFix(activeIssue);
        }
      }
    };
    if (showWalkthrough) {
      window.addEventListener('keydown', handleWalkthroughKeys);
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
    const found = text.slice(start, start + searchTerm.length);
    const newText = text.slice(0, start) + replaceTerm + text.slice(start + searchTerm.length);
    updateText(newText);
    recordEdits([{
      kind: 'replace',
      from: found || searchTerm,
      to: replaceTerm,
      count: 1,
    }]);
  }

  function handleReplaceAll() {
    if (!searchTerm || !text) return;
    const count = searchMatches.length;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newText = text.replace(regex, replaceTerm);
    updateText(newText);
    if (count > 0) {
      recordEdits([{
        kind: 'replace',
        from: searchTerm,
        to: replaceTerm,
        count,
      }]);
    }
    setNotice(t.replacedCount(count));
  }

  // ── Update helpers ─────────────────────────────────────────────────────────
  function updateText(value: string, source: 'type' | 'tool' = 'tool') {
    if (!project || !chapter) return;
    if (source === 'tool') {
      trackedTextRef.current = value;
      typedTextRef.current = value;
      if (manualLogTimer.current) {
        clearTimeout(manualLogTimer.current);
        manualLogTimer.current = null;
      }
    }
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

  function applyFormatting(format: 'bold' | 'italic' | 'heading' | 'quote' | 'callout' | 'citation' | 'list' | 'divider') {
    if (!editor.current) return;
    const textarea = editor.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);
    let replacement = '';
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        replacement = `**${selected || (lang === 'bn' ? 'গাঢ় লেখা' : 'bold text')}**`;
        newCursorPos = selected ? end + 4 : start + 2;
        break;
      case 'italic':
        replacement = `*${selected || (lang === 'bn' ? 'বাঁকা লেখা' : 'italic text')}*`;
        newCursorPos = selected ? end + 2 : start + 1;
        break;
      case 'heading':
        replacement = `\n## ${selected || (lang === 'bn' ? 'উপ-শিরোনাম' : 'Subheading')}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'quote':
        replacement = `\n> ${selected || (lang === 'bn' ? 'উদ্ধৃতি বা উক্তি এখানে লিখুন...' : 'Quote or epigraph here...')}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'callout':
        replacement = `\n:::box[${lang === 'bn' ? 'ইসলামের আলোকে' : 'Special Note'}]\n${selected || (lang === 'bn' ? 'বক্সের বিষয়বস্তু বা তথ্য এখানে লিখুন...' : 'Box content goes here...')}\n:::\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'citation':
        replacement = `\n${lang === 'bn' ? 'তথ্যসূত্র' : 'Reference'}: ${selected || (lang === 'bn' ? 'উৎস বা রেফারেন্সের বিবরণ' : 'Citation details')}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'list':
        replacement = `\n* ${selected || (lang === 'bn' ? 'প্রথম পয়েন্ট' : 'First item')}\n* ${lang === 'bn' ? 'দ্বিতীয় পয়েন্ট' : 'Second item'}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'divider':
        replacement = `\n---\n`;
        newCursorPos = start + replacement.length;
        break;
    }

    const nextText = text.substring(0, start) + replacement + text.substring(end);
    setHistory((h) => [...h.slice(-49), text]);
    typedTextRef.current = nextText;
    updateText(nextText, 'type');
    scheduleManualLog();
    setChecked(false);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  }

  function selectChapter(id: string) {
    flushManualEdits();
    setCid(id);
    setHistory([]);
    setChecked(false);
    setIssues([]);
    setCustomTo({});
    setShowSearch(false);
    setView('editor');
  }

  function addChapter() {
    if (!project) return;
    const id = createId();
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

  function reorderChapters(fromIndex: number, toIndex: number) {
    if (!project || fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= project.chapters.length || toIndex < 0 || toIndex >= project.chapters.length) return;

    const newChapters = [...project.chapters];
    const [moved] = newChapters.splice(fromIndex, 1);
    newChapters.splice(toIndex, 0, moved);

    const updated = projects.map((p) =>
      p.id === project.id ? { ...p, chapters: newChapters } : p
    );
    setProjects(updated);
    autosave(updated);
  }

  function updateChapterStatus(chapterId: string, status: ChapterStatus) {
    if (!project) return;
    const newChapters = project.chapters.map((c) =>
      c.id === chapterId ? { ...c, status } : c
    );
    const updated = projects.map((p) =>
      p.id === project.id ? { ...p, chapters: newChapters } : p
    );
    setProjects(updated);
    autosave(updated);
  }

  function handleGlobalReplaceAll(updatedChapters: Chapter[], replaceCount: number) {
    if (!project) return;
    const updated = projects.map((p) =>
      p.id === project.id ? { ...p, chapters: updatedChapters } : p
    );
    setProjects(updated);
    autosave(updated);

    // If current chapter was updated, update local text state too
    const currentUpdated = updatedChapters.find((c) => c.id === cid);
    if (currentUpdated) {
      typedTextRef.current = currentUpdated.text;
      updateText(currentUpdated.text, 'tool');
    }
    setNotice(
      lang === 'bn'
        ? `সমগ্র বইয়ের ${replaceCount} টি জায়গায় প্রতিস্থাপন সম্পন্ন হয়েছে!`
        : `Replaced ${replaceCount} instance(s) across entire book!`
    );
  }

  function handleUpdateCodex(nextCodex: ProjectCodex) {
    if (!project) return;
    const updated = projects.map((p) =>
      p.id === project.id ? { ...p, codex: nextCodex } : p
    );
    setProjects(updated);
    autosave(updated);
  }

  function handleInsertTextFromCodex(charOrLoreName: string) {
    if (!editor.current) return;
    const textarea = editor.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + charOrLoreName + text.substring(end);
    setHistory((h) => [...h.slice(-49), text]);
    typedTextRef.current = newText;
    updateText(newText, 'type');
    scheduleManualLog();
    setChecked(false);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + charOrLoreName.length, start + charOrLoreName.length);
    }, 50);
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

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function downloadHtml() {
    if (!project) return;
    const chaptersHtml = project.chapters.map((c) => {
      const paras = (c.text || '')
        .split(/\n{2,}/)
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
        .join('\n');
      return `<section>\n<h2>${escapeHtml(c.title || '')}</h2>\n${paras}\n</section>`;
    }).join('\n');
    const html = `<!DOCTYPE html>
<html lang="${project.language === 'English' ? 'en' : 'bn'}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(project.title)}</title>
<style>
  body { max-width: 42rem; margin: 2rem auto; padding: 0 1.25rem; font: 1.05rem/1.7 Georgia, "Noto Serif Bengali", serif; color: #1c1917; }
  h1 { font-size: 2rem; margin-bottom: 2rem; }
  h2 { font-size: 1.35rem; margin-top: 2.5rem; }
</style>
</head>
<body>
<h1>${escapeHtml(project.title)}</h1>
${chaptersHtml}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = project.title + '.html';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(t.noticeDownloaded);
  }

  function handleInsertConjunct(char: string) {
    if (!editor.current) return;
    const el = editor.current;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const updated = text.slice(0, start) + char + text.slice(end);
    updateText(updated);
    setNotice(lang === 'bn' ? `"${char}" যুক্ত করা হয়েছে` : `Inserted "${char}"`);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + char.length, start + char.length);
    }, 50);
  }

  function importErrorMessage(err: unknown): string {
    if (err instanceof ManuscriptImportError) {
      const map = {
        too_large: t.importErrTooLarge,
        legacy_doc: t.importErrLegacyDoc,
        unsupported: t.importErrUnsupported,
        empty: t.importErrEmpty,
        invalid_json: t.importErrInvalidJson,
        parse_failed: t.importErrParse,
        too_long: t.importErrTooLong,
      } as const;
      return map[err.code];
    }
    return err instanceof Error ? err.message : t.importBackupError;
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const parsed = await importManuscriptFile(file);
      const created = await createProject({
        title: parsed.title,
        genre: parsed.genre,
        language: parsed.language,
      });
      if (parsed.chapters.length > 0) {
        await updateProject(created.id, { chapters: parsed.chapters });
      }
      const updatedList = await fetchProjects(1);
      setProjects(updatedList.items);
      setProjectPages(updatedList.pages);
      setProjectPage(1);
      setPid(created.id);
      setCid(parsed.chapters[0]?.id || null);
      setView('editor');
      setNotice(
        parsed.source === 'docx'
          ? t.importDocxSuccess(parsed.chapters.length)
          : t.importBackupSuccess
      );
    } catch (err: unknown) {
      alert(importErrorMessage(err));
    } finally {
      setImporting(false);
      if (e.target) e.target.value = '';
    }
  }

  // ── Proofreading ───────────────────────────────────────────────────────────
  async function runProofread() {
    if (!text.trim()) return;
    const found = await findIssues(text, lang, project?.language || 'all', ignored, {
      includeOptionalStyle: styleHints,
    });
    setIssues(found);
    setChecked(true);
    setNotice(t.noticeChecked);
  }

  // ── Live background auto-proofreading debounce ─────────────────────────────
  const autoCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!autoCheck || !text.trim()) return;
    if (autoCheckTimer.current) clearTimeout(autoCheckTimer.current);
    let cancelled = false;
    autoCheckTimer.current = setTimeout(() => {
      void findIssues(text, lang, project?.language || 'all', ignored, {
        includeOptionalStyle: styleHints,
      }).then((found) => {
        if (cancelled) return;
        setIssues(found);
        setChecked(true);
      });
    }, 1200);
    return () => {
      cancelled = true;
      if (autoCheckTimer.current) clearTimeout(autoCheckTimer.current);
    };
  }, [text, autoCheck, lang, project?.language, ignored, styleHints]);

  // ── Smart Typography Formatter ─────────────────────────────────────────────
  function handleFormatTypography() {
    if (!chapter || !text.trim()) return;
    setHistory((h) => [...h.slice(-49), text]);
    const formatted = formatTypography(text);
    updateText(formatted);
    if (formatted !== text) {
      recordEdits([{
        kind: 'punctuation',
        from: t.typographyLogFrom,
        to: t.typographyLogTo,
        count: 1,
      }]);
    }
    setNotice(t.btnFixTypographyNotice);
  }

  function acceptFix(issue: ProofMatch) {
    if (!chapter) return;
    const { to, customized } = resolvedTo(issue);
    setHistory((h) => [...h.slice(-49), text]);
    const match: ProofMatch = {
      ...issue,
      to,
      optional: false,
      occurrences: (issue.occurrences || []).map((o) => ({ ...o, to })),
    };
    const fixed = applyAllFixes(text, [match]);
    updateText(fixed);
    recordEdits([{
      kind: customized ? 'custom' : kindFromIssue(issue),
      from: issue.from,
      to,
      why: issue.why,
      count: issue.count || issue.occurrences?.length || 1,
      customized,
    }]);
    setNotice(customized ? t.noticeFixCustomized : t.noticeFixAccepted);
  }

  function ignoreIssue(from: string, id?: string) {
    const extra = [from, ...(id ? [id] : [])];
    setIgnored((prev) => {
      const next = [...prev, ...extra].filter((v, i, arr) => arr.indexOf(v) === i);
      try {
        localStorage.setItem('lipishilpo_personal_dict', JSON.stringify(next));
      } catch {}
      updatePrefs({ dictionary: next }).catch(() => {});
      return next;
    });
    setIssues((prev) => prev.filter((i) => !extra.includes(i.from) && !extra.includes(i.id)));
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

  const visibleIssues = issues.filter((i) => !ignored.includes(i.from) && !ignored.includes(i.id));
  const filteredIssues = visibleIssues.filter((i) =>
    i.id !== '__spaces' &&
    i.id !== '__dari_space' &&
    (proofFilter === 'all' || i.category === proofFilter)
  );
  const longSentences = tabKey === 'proofread' || proofFilter === 'complexity' ? findLongSentences(text, 35) : [];
  const hasSpaces = visibleIssues.some((i) => i.id === '__spaces');
  const hasDariSpace = visibleIssues.some((i) => i.id === '__dari_space');
  const safeFixesCount = visibleIssues.filter((i) => !i.optional && i.id !== '__guruchandali').length;

    function handleQuickAddDictionary(word: string) {
    const clean = word.trim();
    if (!clean) return;
    const nextDict = Array.from(new Set([...ignored, clean]));
    setIgnored(nextDict);
    try {
      localStorage.setItem('lipishilpo_personal_dict', JSON.stringify(nextDict));
    } catch {}
    setNotice(lang === 'bn' ? `"${clean}" ব্যক্তিগত শব্দকোষে যোগ করা হয়েছে` : `"${clean}" added to personal dictionary`);
  }

  function handleFixCategory(category: 'spelling' | 'grammar' | 'punctuation') {
    if (!chapter || !text.trim()) return;
    const catIssues = visibleIssues.filter((i) => i.category === category && !i.optional);
    if (catIssues.length === 0) return;

    const prepared = catIssues.map((issue) => {
      const { to, customized } = resolvedTo(issue);
      return {
        issue: {
          ...issue,
          to,
          optional: false,
          occurrences: (issue.occurrences || []).map((o) => ({ ...o, to })),
        } as ProofMatch,
        customized,
      };
    });

    setHistory((h) => [...h.slice(-49), text]);
    const fixedText = applyAllFixes(text, prepared.map((p) => p.issue));
    updateText(fixedText);
    recordEdits(prepared.map(({ issue, customized }) => ({
      kind: customized ? 'custom' : kindFromIssue(issue),
      from: issue.from,
      to: issue.to,
      why: issue.why,
      count: issue.count || issue.occurrences?.length || 1,
      customized,
    })));

    setIssues((prev) => prev.filter((i) => i.category !== category || i.optional));
    setNotice(lang === 'bn' ? `${catIssues.length}টি সংশোধন সফলভাবে প্রয়োগ করা হয়েছে!` : `${catIssues.length} fixes applied successfully!`);
  }

  function handleAcceptAllFixes() {
    if (!chapter || !text.trim()) return;
    const safeFixes = visibleIssues.filter((i) => !i.optional);
    if (safeFixes.length === 0) return;
    const prepared = safeFixes.map((issue) => {
      const { to, customized } = resolvedTo(issue);
      return {
        issue: {
          ...issue,
          to,
          optional: false,
          occurrences: (issue.occurrences || []).map((o) => ({ ...o, to })),
        } as ProofMatch,
        customized,
      };
    });
    setHistory((h) => [...h.slice(-49), text]);
    const fixedText = applyAllFixes(text, prepared.map((p) => p.issue));
    updateText(fixedText);
    recordEdits(prepared.map(({ issue, customized }) => ({
      kind: customized ? 'custom' : kindFromIssue(issue),
      from: issue.from,
      to: issue.to,
      why: issue.why,
      count: issue.count || issue.occurrences?.length || 1,
      customized,
    })));
    setIssues((prev) => prev.filter((i) => i.optional));
    setNotice(t.allFixedNotice);
  }

  const freeTabs = [
    { key: 'proofread' as const, label: t.tabProofread, pro: false },
    { key: 'codex' as const, label: lang === 'bn' ? 'কডেক্স' : 'Codex', pro: false },
    { key: 'notes' as const, label: t.tabNotes, pro: false },
    { key: 'comments' as const, label: t.tabComments, pro: false },
    { key: 'snapshots' as const, label: t.tabSnapshots, pro: false },
  ];
  const tabsList = [
    ...freeTabs,
    ...(proApi?.tabs.map((tab) => ({ key: tab.key, label: tab.label[lang], pro: true })) ?? []),
  ];
  const isProTab = !!proApi?.tabs.some((tab) => tab.key === tabKey);

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
                {project.chapters.map((c, i) => {
                  const status = c.status || 'draft';
                  const nextStatusMap: Record<ChapterStatus, ChapterStatus> = {
                    draft: 'in_progress',
                    in_progress: 'revised',
                    revised: 'final',
                    final: 'draft',
                  };
                  const statusLabel = status === 'in_progress' ? t.statusInProgress : status === 'revised' ? t.statusRevised : status === 'final' ? t.statusFinal : t.statusDraft;

                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDraggedChapterIndex(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedChapterIndex !== null && draggedChapterIndex !== i) {
                          reorderChapters(draggedChapterIndex, i);
                          setDraggedChapterIndex(null);
                        }
                      }}
                      onDragEnd={() => setDraggedChapterIndex(null)}
                      className={'chapter-item ' + (c.id === chapter?.id ? 'selected ' : '') + (draggedChapterIndex === i ? 'dragging ' : '')}
                    >
                      <span className="drag-handle" title={lang === 'bn' ? 'টেনে অধ্যায় সাজান' : 'Drag to reorder'}>
                        <GripVertical size={13} />
                      </span>
                      <button
                        className="chapter-btn"
                        onClick={() => selectChapter(c.id)}
                        title={c.title || t.untitledChapter}
                      >
                        <FileText size={15} />
                        <span>{formatNumber(i + 1)}. {c.title || t.untitledChapter}</span>
                      </button>

                      {/* Status indicator dot */}
                      <button
                        type="button"
                        className={`chapter-status-dot status-${status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateChapterStatus(c.id, nextStatusMap[status]);
                        }}
                        title={`${lang === 'bn' ? 'স্ট্যাটাস পরিবর্তন করুন' : 'Change Status'}: ${statusLabel}`}
                      />

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
                  );
                })}
                <button className="add" onClick={addChapter}>
                  <Plus size={15} /> {t.addChapter}
                </button>
              </div>
            </>
          )}

          <hr />
          <div className="section-label">{t.nextSteps}</div>

          {proApi?.sidebar.map((item) => (
            <button
              key={item.key}
              className="nav"
              onClick={() => { setTabKey(item.key); setView('editor'); }}
            >
              {item.key === 'format' ? <LayoutTemplate size={18} /> : <BarChart3 size={18} />}
              {item.label[lang]}
            </button>
          ))}

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

              {/* Goal Tracker */}
              {view === 'editor' && (
                <GoalTracker
                  currentWords={manuscriptWords}
                  lang={lang}
                  target={dailyTarget}
                  onTargetChange={handleSaveGoal}
                  isOpen={goalModalOpen}
                  onOpenChange={setGoalModalOpen}
                  onProgress={setWordsToday}
                />
              )}

              {/* Pomodoro Timer */}
              {view === 'editor' && (
                <PomodoroTimer lang={lang} />
              )}

              {/* Typography Suite */}
              {view === 'editor' && (
                <TypographyControl lang={lang} />
              )}

              {/* Bangla Conjuncts Cheat Sheet */}
              {view === 'editor' && (
                <button
                  type="button"
                  className={'header-icon-btn ' + (showConjuncts ? 'active' : '')}
                  onClick={() => setShowConjuncts(true)}
                  title={t.btnConjunctsTitle}
                >
                  <BookA size={16} />
                </button>
              )}

              {/* 1-Click Publish to WordPress */}
              {view === 'editor' && (
                <button
                  type="button"
                  className="header-publish-wp-btn"
                  onClick={() => setShowPublishModal(true)}
                  title={t.btnPublishWpTitle}
                >
                  <Share2 size={14} />
                  <span className="btn-text-hide-mobile">{t.btnPublishWp}</span>
                </button>
              )}

              {/* Typewriter Scrolling Toggle */}
              {view === 'editor' && (
                <button
                  type="button"
                  className={'header-icon-btn typewriter-indicator-btn ' + (typewriterMode ? 'active' : '')}
                  onClick={toggleTypewriterMode}
                  title={t.typewriterMode}
                >
                  <Edit3 size={15} />
                </button>
              )}

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
                    className={'theme-btn ' + (theme === 'parchment' ? 'active' : '')}
                    onClick={() => handleSetTheme('parchment')}
                    title={t.themeParchment}
                  >
                    <Bookmark size={14} />
                  </button>
                  <button
                    className={'theme-btn ' + (theme === 'dark' ? 'active' : '')}
                    onClick={() => handleSetTheme('dark')}
                    title={t.themeDark}
                  >
                    <Moon size={14} />
                  </button>
                  <button
                    className={'theme-btn ' + (theme === 'oled' ? 'active' : '')}
                    onClick={() => handleSetTheme('oled')}
                    title={t.themeOled}
                  >
                    <Box size={14} />
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

              {/* Find & Replace toggle (Chapter) */}
              {view === 'editor' && (
                <button
                  className={'header-icon-btn ' + (showSearch ? 'active' : '')}
                  onClick={() => setShowSearch((prev) => !prev)}
                  title={t.btnFindReplace}
                >
                  <Search size={15} />
                </button>
              )}

              {/* Global Project-Wide Search & Replace */}
              {view === 'editor' && (
                <button
                  className={'header-icon-btn ' + (showGlobalFindModal ? 'active' : '')}
                  onClick={() => setShowGlobalFindModal(true)}
                  title={t.btnGlobalSearch}
                >
                  <Replace size={15} />
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
                  <button className="export" onClick={() => {
                    if (proApi) {
                      setView('editor');
                      setTabKey('format');
                    } else {
                      downloadTxt();
                    }
                  }}>
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
              <div className="page-heading-actions">
                <input
                  type="file"
                  ref={importFileRef}
                  style={{ display: 'none' }}
                  accept=".json,.lipishilpo.json,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleImportBackup}
                />
                <button
                  className="secondary-outline-btn import-btn"
                  onClick={() => importFileRef.current?.click()}
                  title={t.btnImportBackupTitle}
                  disabled={importing}
                >
                  {importing ? <Loader2 size={16} className="spin" /> : <FileUp size={16} />}
                  <span className="import-btn-copy">
                    <strong>{t.btnImportBackup}</strong>
                    <small>JSON · Word (.docx)</small>
                  </span>
                </button>
                <button className="primary" onClick={() => setModal(true)}>
                  <Plus size={18} /> {t.newProject}
                </button>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="empty">
                <Feather size={48} />
                <p>{t.emptyProjects}</p>
                <div className="page-heading-actions">
                  <button
                    className="secondary-outline-btn import-btn"
                    onClick={() => importFileRef.current?.click()}
                    title={t.btnImportBackupTitle}
                    disabled={importing}
                  >
                    {importing ? <Loader2 size={16} className="spin" /> : <FileUp size={16} />}
                    <span className="import-btn-copy">
                      <strong>{t.btnImportBackup}</strong>
                      <small>JSON · Word (.docx)</small>
                    </span>
                  </button>
                  <button className="primary" onClick={() => setModal(true)}>
                    <Plus size={18} /> {t.createFirstProject}
                  </button>
                </div>
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
                    <div className="card-top-actions">
                      <button
                        type="button"
                        className="backup-project-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportProjectToJson(p);
                          setNotice(t.btnExportBackup);
                        }}
                        title={t.btnExportBackup}
                      >
                        <Download size={13} />
                      </button>
                      <button
                        className="delete-project"
                        disabled={deleting === p.id}
                        onClick={() => handleDeleteProject(p.id)}
                        title={t.deleteProjectTitle}
                      >
                        {deleting === p.id ? <Loader2 size={13} className="spin" /> : <X size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {projectPage < projectPages && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <button
                  className="secondary"
                  disabled={loadingMore}
                  onClick={async () => {
                    setLoadingMore(true);
                    try {
                      const next = projectPage + 1;
                      const list = await fetchProjects(next);
                      setProjects((prev) => {
                        const seen = new Set(prev.map((p) => p.id));
                        return [...prev, ...list.items.filter((p) => !seen.has(p.id))];
                      });
                      setProjectPage(next);
                      setProjectPages(list.pages);
                    } catch (e) {
                      setNotice(e instanceof Error ? e.message : t.saveFailed);
                    } finally {
                      setLoadingMore(false);
                    }
                  }}
                >
                  {loadingMore ? <Loader2 size={16} className="spin" /> : null}
                  {t.loadMoreProjects}
                </button>
              </div>
            )}
          </section>

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
        ) : project && chapter ? (
          /* ── Editor View ── */
          <>
            {!focusMode && (
              <div className="document-heading">
                <div className="document-heading-copy">
                  <div className="eyebrow">{t.manuscript} <span>/</span> {project.genre}</div>
                  <div className="document-heading-title-row">
                    <h1>{project.title}</h1>
                    <p>{t.documentTagline}</p>
                  </div>
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
              <section ref={paperContainerRef} className={`writing theme-${theme}`}>
                {showWalkthrough && visibleIssues.length > 0 && (
                  <ProofreadWalkthroughBar
                    lang={lang}
                    issues={visibleIssues}
                    currentIndex={walkthroughIndex}
                    onSelectIndex={(idx) => {
                      setWalkthroughIndex(idx);
                      const issue = visibleIssues[idx];
                      if (issue?.occurrences?.[0]) {
                        const occ = issue.occurrences[0];
                        if (editorMode === 'edit') {
                          editor.current?.focus();
                          editor.current?.setSelectionRange(occ.start, occ.end);
                        }
                      }
                    }}
                    onAcceptFix={(issue) => acceptFix(issue)}
                    onAddToDictionary={(word) => handleQuickAddDictionary(word)}
                    onClose={() => setShowWalkthrough(false)}
                  />
                )}
                {/* Floating Bubble Toolbar for selected text */}
                <FloatingBubbleToolbar
                  position={bubblePosition}
                  lang={lang}
                  onFormat={handleBubbleFormat}
                />

                <div className="toolbar">
                  <div className="chapter-label-group">
                    <span>
                      <FileText size={16} />
                      {t.chapterLabel(project.chapters.findIndex((c) => c.id === chapter.id) + 1)}
                    </span>

                    <select
                      value={chapter.status || 'draft'}
                      onChange={(e) => updateChapterStatus(chapter.id, e.target.value as ChapterStatus)}
                      className={`chapter-status-select status-${chapter.status || 'draft'}`}
                      title={lang === 'bn' ? 'অধ্যায়ের অবস্থা' : 'Chapter Status'}
                    >
                      <option value="draft">{t.statusDraft}</option>
                      <option value="in_progress">{t.statusInProgress}</option>
                      <option value="revised">{t.statusRevised}</option>
                      <option value="final">{t.statusFinal}</option>
                    </select>
                  </div>

                  {/* Mode switcher: Edit vs Visual Review */}
                  <button
                      type="button"
                      className={`manuscript-health-pill score-${healthScore >= 95 ? 'excellent' : healthScore >= 80 ? 'good' : 'warning'}`}
                      onClick={() => {
                        setTabKey('proofread');
                        if (!checked) void runProofread();
                        setShowWalkthrough((prev) => !prev);
                      }}
                      title={lang === 'bn' ? 'পাণ্ডুলিপির নির্ভুলতা স্কোর (ক্লিক করে ওয়াকথ্রু শুরু করুন)' : 'Manuscript Health Score (Click to toggle walkthrough)'}
                    >
                      <Sparkles size={13} />
                      <span>{lang === 'bn' ? `স্বাস্থ্য: ${formatNumber(healthScore)}%` : `Health: ${healthScore}%`}</span>
                      {healthScore === 100 && <span className="perfect-badge">✨</span>}
                    </button>

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

                {/* Quick Book & Text Formatting Action Bar */}
                {editorMode === 'edit' && (
                  <div className="editor-quick-format-bar">
                    <div className="format-btn-group">
                      <button
                        type="button"
                        className="format-action-btn"
                        onClick={() => applyFormatting('bold')}
                        title={lang === 'bn' ? 'গাঢ় করুন (Bold) **লেখা**' : 'Bold **text**'}
                      >
                        <Bold size={13} />
                      </button>
                      <button
                        type="button"
                        className="format-action-btn"
                        onClick={() => applyFormatting('italic')}
                        title={lang === 'bn' ? 'বাঁকা করুন (Italic) *লেখা*' : 'Italic *text*'}
                      >
                        <Italic size={13} />
                      </button>
                    </div>

                    <span className="format-divider" />

                    <div className="format-btn-group">
                      <button
                        type="button"
                        className="format-action-btn"
                        onClick={() => applyFormatting('heading')}
                        title={lang === 'bn' ? 'উপ-শিরোনাম (Subheading) ## সেকশন' : 'Subheading ## Section'}
                      >
                        <Heading2 size={13} />
                        <span>H2</span>
                      </button>
                      <button
                        type="button"
                        className="format-action-btn"
                        onClick={() => applyFormatting('quote')}
                        title={lang === 'bn' ? 'উদ্ধৃতি বা এপিগ্রাফ (Quote) > উক্তি' : 'Quote > Text'}
                      >
                        <Quote size={13} />
                        <span>{lang === 'bn' ? 'উদ্ধৃতি' : 'Quote'}</span>
                      </button>
                      <button
                        type="button"
                        className="format-action-btn highlight-box"
                        onClick={() => applyFormatting('callout')}
                        title={lang === 'bn' ? 'ইসলামের আলোকে / তথ্য বক্স :::box' : 'Callout Box :::box'}
                      >
                        <Box size={13} />
                        <span>{lang === 'bn' ? 'তথ্য/ইসলামিক বক্স' : 'Box'}</span>
                      </button>
                      <button
                        type="button"
                        className="format-action-btn"
                        onClick={() => applyFormatting('citation')}
                        title={lang === 'bn' ? 'তথ্যসূত্র বা সাইটেশন তথ্যসূত্র:' : 'Citation / Source'}
                      >
                        <Bookmark size={13} />
                        <span>{lang === 'bn' ? 'তথ্যসূত্র' : 'Citation'}</span>
                      </button>
                      <button
                        type="button"
                        className="format-action-btn"
                        onClick={() => applyFormatting('list')}
                        title={lang === 'bn' ? 'তালিকা বা পয়েন্ট * পয়েন্ট' : 'Bullet List * item'}
                      >
                        <List size={13} />
                      </button>
                      <button
                        type="button"
                        className="format-action-btn"
                        onClick={() => applyFormatting('divider')}
                        title={lang === 'bn' ? 'অধ্যায় ডিভাইডার প্রতীক ---' : 'Divider ---'}
                      >
                        <span>❖</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className={`paper ${typewriterMode ? 'typewriter-mode' : ''}`}>
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
                      onKeyDown={(e) => {
                        if (smartTyping) {
                          const smart = handleSmartKeyDown(e, text);
                          if (smart) {
                            setHistory((h) => [...h.slice(-49), text]);
                            typedTextRef.current = smart.newText;
                            updateText(smart.newText, 'type');
                            scheduleManualLog();
                            setChecked(false);
                            setTimeout(() => {
                              if (editor.current) {
                                editor.current.focus();
                                editor.current.setSelectionRange(smart.newCursor, smart.newCursor);
                              }
                            }, 10);
                            return;
                          }
                        }
                      }}
                      onChange={(e) => {
                        const next = e.target.value;
                        setHistory((h) => [...h.slice(-49), text]);
                        typedTextRef.current = next;
                        updateText(next, 'type');
                        scheduleManualLog();
                        setChecked(false);
                        if (typewriterMode) {
                          adjustTypewriterScroll();
                        }
                      }}
                      onBlur={flushManualEdits}
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
                          if (issue.id === '__spaces' || issue.id === '__dari_space' || issue.id === '__guruchandali') continue;
                          for (const occ of issue.occurrences || []) {
                            segs.push({
                              start: occ.start,
                              end: occ.end,
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
                            elements.push(renderFormattedSpan(text.slice(cur, s.start), `t-${idx}`));
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
                          elements.push(renderFormattedSpan(text.slice(cur), 't-tail'));
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
                        <input
                          className="custom-fix-input"
                          aria-label={t.customizeFixLabel}
                          title={t.customizeFixHint}
                          value={customTo[activePopover.match.id] ?? activePopover.match.to}
                          onChange={(e) => {
                            const id = activePopover.match.id;
                            const value = e.target.value;
                            setCustomTo((prev) => ({ ...prev, [id]: value }));
                          }}
                        />
                      </div>
                      <p className="intext-popover-why">💡 {activePopover.match.why}</p>
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
                          className="secondary dict-popover-btn"
                          onClick={() => {
                            handleQuickAddDictionary(activePopover.match.from);
                            setActivePopover(null);
                          }}
                          title={lang === 'bn' ? 'ব্যক্তিগত শব্দকোষে যোগ করুন' : 'Add to personal dictionary'}
                        >
                          <BookA size={13} /> {lang === 'bn' ? 'শব্দকোষে' : 'Dictionary'}
                        </button>
                        <button
                          className="secondary"
                          onClick={() => {
                            ignoreIssue(activePopover.match.from, activePopover.match.id);
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
                    title={t.goalProgress(wordsToday, dailyTarget)}
                    onClick={() => setGoalModalOpen(true)}
                  >
                    <Target size={13} />
                    <div className="goal-bar-bg">
                      <div
                        className="goal-bar-fill"
                        style={{ width: `${Math.min(100, Math.round((wordsToday / dailyTarget) * 100))}%` }}
                      />
                    </div>
                    <span>{formatNumber(wordsToday)} / {formatNumber(dailyTarget)}</span>
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
                    {tabsList.map(({ key, label, pro }) => (
                      <button
                        key={key}
                        className={(key === tabKey ? 'selected' : '') + (pro ? ' pro-tab' : '')}
                        onClick={() => {
                          if (key === 'snapshots') flushManualEdits();
                          setTabKey(key);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="inspector-body">

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
                          {edits.length > 0 && (
                            <button
                              className="secondary full"
                              onClick={() => {
                                flushManualEdits();
                                setTabKey('snapshots');
                              }}
                            >
                              <History size={15} /> {t.editLogView} ({formatNumber(edits.length)})
                            </button>
                          )}
                        </div>
                        <div className="proof-options-card">
                          <div className="proof-toggles-grid">
                            <label className="auto-check-toggle" title={t.autoCheckLabel}>
                              <input
                                type="checkbox"
                                checked={autoCheck}
                                onChange={(e) => setAutoCheck(e.target.checked)}
                              />
                              <span>{lang === 'bn' ? 'স্বয়ংক্রিয় ব্যাকরণ' : t.autoCheckLabel}</span>
                            </label>
                            <label className="auto-check-toggle" title={t.styleHintsLabel}>
                              <input
                                type="checkbox"
                                checked={styleHints}
                                onChange={(e) => {
                                  const on = e.target.checked;
                                  setStyleHints(on);
                                  try {
                                    localStorage.setItem('lipishilpo_style_hints', on ? '1' : '0');
                                  } catch {}
                                }}
                              />
                              <span>{lang === 'bn' ? 'ঐচ্ছিক শৈলী' : t.styleHintsLabel}</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            className="typography-quick-btn"
                            onClick={handleFormatTypography}
                            title={t.btnFixTypography}
                            disabled={!text.trim()}
                          >
                            <Sparkles size={14} />
                            <span>{lang === 'bn' ? 'টাইপোগ্রাফিক ফাঁকা ও দাড়ি ফিক্স' : t.btnFixTypography}</span>
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

                      {checked && (
                        <div className="proofread-batch-suite">
                          {safeFixesCount > 0 && (
                            <button className="primary full batch-main-btn" onClick={handleAcceptAllFixes}>
                              <CheckCheck size={16} /> {t.btnAcceptAll} ({formatNumber(safeFixesCount)})
                            </button>
                          )}

                          <div className="category-batch-grid">
                            {visibleIssues.some((i) => i.category === 'spelling' && !i.optional) && (
                              <button
                                type="button"
                                className="cat-batch-btn spelling"
                                onClick={() => handleFixCategory('spelling')}
                                title={lang === 'bn' ? 'সব প্রমিত বানান এক ক্লিকে ঠিক করুন' : 'Fix all spelling issues'}
                              >
                                🔴 {lang === 'bn' ? 'সব বানান ঠিক করুন' : 'Fix All Spelling'} ({formatNumber(visibleIssues.filter((i) => i.category === 'spelling' && !i.optional).length)})
                              </button>
                            )}

                            {(hasSpaces || hasDariSpace || visibleIssues.some((i) => i.category === 'punctuation')) && (
                              <button
                                type="button"
                                className="cat-batch-btn punctuation"
                                onClick={() => {
                                  if (hasSpaces || hasDariSpace) handleFormatTypography();
                                  handleFixCategory('punctuation');
                                }}
                                title={lang === 'bn' ? 'সব বিরামচিহ্ন ও স্পেস ঠিক করুন' : 'Fix all punctuation & spaces'}
                              >
                                🟣 {lang === 'bn' ? 'বিরামচিহ্ন ও স্পেস' : 'Fix Punctuation'}
                              </button>
                            )}
                          </div>

                          <div className="proof-tools-row">
                            <button
                              type="button"
                              className="proof-tool-btn walkthrough-trigger"
                              onClick={() => setShowWalkthrough(true)}
                              title={lang === 'bn' ? 'কীবোর্ড চালিত জেন প্রুফরিডিং শুরু করুন' : 'Start Zen Keyboard Walkthrough'}
                            >
                              <Sparkles size={14} /> {lang === 'bn' ? 'জেন ওয়াকথ্রু' : 'Zen Walkthrough'}
                            </button>

                            <button
                              type="button"
                              className="proof-tool-btn dict-trigger"
                              onClick={() => setShowDictModal(true)}
                              title={lang === 'bn' ? 'আমার শব্দকোষ ও চরিত্র তালিকা' : 'Personal Dictionary'}
                            >
                              <BookA size={14} /> {lang === 'bn' ? `শব্দকোষ (${formatNumber(ignored.length)})` : `Dictionary (${ignored.length})`}
                            </button>
                          </div>
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
                                    const occ = r.occurrences?.[0];
                                    if (occ) {
                                      setEditorMode('edit');
                                      setTimeout(() => {
                                        editor.current?.focus();
                                        editor.current?.setSelectionRange(occ.start, occ.end);
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
                                <input
                                  className="custom-fix-input"
                                  aria-label={t.customizeFixLabel}
                                  title={t.customizeFixHint}
                                  value={customTo[r.id] ?? r.to}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setCustomTo((prev) => ({ ...prev, [r.id]: value }));
                                  }}
                                />
                                {r.count && r.count > 1 && <span className="count-badge">×{formatNumber(r.count)}</span>}
                              </div>
                              <p>{r.why}</p>
                              <div className="suggestion-actions">
                                <button onClick={() => acceptFix(r)}>
                                  <Check size={14} /> {t.btnAccept}
                                </button>
                                <button onClick={() => ignoreIssue(r.from, r.id)} title={t.btnAddToDictionary}>
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
                                  recordEdits([{
                                    kind: 'punctuation',
                                    from: t.dariLogFrom,
                                    to: '।',
                                    count: 1,
                                  }]);
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
                                  recordEdits([{
                                    kind: 'punctuation',
                                    from: t.spacesLogFrom,
                                    to: ' ',
                                    count: 1,
                                  }]);
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

                  {/* ── Tab: Character & World Codex (Free) ── */}
                  {tabKey === 'codex' && (
                    <CodexPanel
                      codex={project.codex as ProjectCodex}
                      lang={lang}
                      onUpdateCodex={handleUpdateCodex}
                      onInsertText={handleInsertTextFromCodex}
                    />
                  )}

                  {/* ── Tab: Scratchpad / Research Notes (Free) ── */}
                  {tabKey === 'notes' && (
                    <div className="scratchpad-panel">
                      <div className="check-intro">
                        <div className="scratchpad-header-row">
                          <StickyNote size={18} color="#20644f" />
                          <div>
                            <strong>{t.tabNotes}</strong>
                            <p>{t.scratchpadSaved}</p>
                          </div>
                        </div>
                      </div>

                      <textarea
                        className="scratchpad-textarea"
                        placeholder={t.scratchpadPlaceholder}
                        value={chapter?.notes || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!chapter) return;
                          setProjects((prev) => {
                            const updated = prev.map((p) => {
                              if (p.id !== project?.id) return p;
                              return {
                                ...p,
                                chapters: p.chapters.map((c) =>
                                  c.id === chapter.id ? { ...c, notes: val } : c
                                ),
                              };
                            });
                            autosave(updated);
                            return updated;
                          });
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
                        <strong>{t.editLogHeading}</strong>
                        <p>{t.editLogSubtitle}</p>
                        {edits.length > 0 && (
                          <button
                            className="secondary full"
                            onClick={() => {
                              if (!chapter) return;
                              if (!confirm(t.editLogClearConfirm)) return;
                              setEdits([]);
                              persistChapterMeta('edits', chapter.id, []);
                              try {
                                localStorage.removeItem(`lipishilpo_edits_${chapter.id}`);
                              } catch {}
                            }}
                          >
                            <Trash2 size={14} /> {t.editLogClear}
                          </button>
                        )}
                      </div>

                      {edits.length > 0 && (
                        <div className="filter-pills edit-log-filters">
                          {([
                            ['all', t.filterAll] as const,
                            ['spelling', t.editKindSpelling] as const,
                            ['punctuation', t.editKindPunctuation] as const,
                            ['replace', t.editKindReplace] as const,
                            ['custom', t.editKindCustom] as const,
                          ]).map(([key, label]) => (
                            <button
                              key={key}
                              className={'pill-btn ' + (editFilter === key ? 'active' : '')}
                              onClick={() => setEditFilter(key)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="result-label">
                        <span>{formatNumber(edits.length)}</span>
                        <small>{t.thisChapter}</small>
                      </div>

                      {edits.length === 0 ? (
                        <div className="empty">
                          <History size={28} />
                          <p>{t.editLogEmpty}</p>
                        </div>
                      ) : (
                        <div className="edit-log-list">
                          {edits
                            .filter((item) => editFilter === 'all' || item.kind === editFilter)
                            .map((item) => (
                              <article key={item.id} className={'edit-log-card kind-' + item.kind}>
                                <div className="edit-log-top">
                                  <span className={'edit-kind-pill kind-' + item.kind}>
                                    {item.kind === 'spelling' && t.editKindSpelling}
                                    {item.kind === 'grammar' && t.editKindGrammar}
                                    {item.kind === 'style' && t.editKindStyle}
                                    {item.kind === 'punctuation' && t.editKindPunctuation}
                                    {item.kind === 'replace' && t.editKindReplace}
                                    {item.kind === 'custom' && t.editKindCustom}
                                  </span>
                                  {item.customized && <span className="optional-badge">{t.editCustomBadge}</span>}
                                  {item.count > 1 && <span className="count-badge">{t.editCount(item.count)}</span>}
                                  <button
                                    className="delete-snap-btn"
                                    onClick={() => {
                                      if (!chapter) return;
                                      const next = edits.filter((e) => e.id !== item.id);
                                      setEdits(next);
                                      persistChapterMeta('edits', chapter.id, next);
                                      try {
                                        localStorage.setItem(`lipishilpo_edits_${chapter.id}`, JSON.stringify(next));
                                      } catch {}
                                    }}
                                    title={t.btnDeleteComment}
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                                <div className="replacement">
                                  <del>{item.from || '—'}</del>
                                  <ArrowRight size={14} />
                                  <strong>{item.to || '—'}</strong>
                                </div>
                                {item.why ? <p>{item.why}</p> : null}
                                <footer className="edit-log-meta">
                                  <span>{item.date}</span>
                                  <button
                                    onClick={() => {
                                      const needle = item.to.trim();
                                      if (!needle) return;
                                      const index = text.indexOf(needle);
                                      if (index < 0) return;
                                      setEditorMode('edit');
                                      setTimeout(() => {
                                        editor.current?.focus();
                                        editor.current?.setSelectionRange(index, index + needle.length);
                                      }, 50);
                                    }}
                                  >
                                    {t.viewInText} <ChevronRight size={13} />
                                  </button>
                                </footer>
                              </article>
                            ))}
                        </div>
                      )}

                      <div className="check-intro snapshot-split">
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

                  {isProTab && <div ref={proSlot} className="pro-studio-slot" />}
                  </div>
              </aside>
            )}
            </div>
          </>
        ) : null}
      </main>

      {/* ── Toast notice ── */}
      {notice && (
        <output className="toast">
          <Check size={17} /> {notice}
        </output>
      )}

      {/* ── Manuscript Stats Modal ── */}
      <dialog ref={statsDialog} className="modal-dialog stats-dialog-expanded" onCancel={() => setStatsModal(false)}>
        <div className="modal stats-modal-content">
          <button type="button" className="close" onClick={() => setStatsModal(false)}>
            <X size={20} />
          </button>
          <span className="brandmark"><BarChart3 size={24} /></span>
          <h2>{t.statsModalTitle}</h2>

          {/* Core Metrics Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{formatNumber(detailedStats.words)}</span>
              <span className="stat-label">{t.statsTotalWords}</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{formatNumber(detailedStats.chars)}</span>
              <span className="stat-label">{t.statsTotalChars}</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{formatNumber(detailedStats.sentences)}</span>
              <span className="stat-label">{lang === 'bn' ? 'মোট বাক্য' : 'Sentences'}</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{formatNumber(detailedStats.paragraphs)}</span>
              <span className="stat-label">{t.statsParagraphs}</span>
            </div>
          </div>

          {/* Dialogue vs Narrative Ratio Bar */}
          <div className="analytics-section-card">
            <div className="analytics-header-row">
              <strong>{lang === 'bn' ? 'সংলাপ বনাম বর্ণনা অনুপাত' : 'Dialogue vs. Narrative Ratio'}</strong>
              <span>
                {lang === 'bn'
                  ? `সংলাপ: ${detailedStats.dialogueRatio}% | বর্ণনা: ${100 - detailedStats.dialogueRatio}%`
                  : `Dialogue: ${detailedStats.dialogueRatio}% | Narrative: ${100 - detailedStats.dialogueRatio}%`}
              </span>
            </div>
            <div className="dialogue-ratio-bar">
              <div
                className="ratio-fill-dialogue"
                style={{ width: `${detailedStats.dialogueRatio}%` }}
                title={lang === 'bn' ? `সংলাপ (${detailedStats.dialogueWords} শব্দ)` : `Dialogue (${detailedStats.dialogueWords} words)`}
              />
              <div
                className="ratio-fill-narrative"
                style={{ width: `${100 - detailedStats.dialogueRatio}%` }}
                title={lang === 'bn' ? `বর্ণনা (${detailedStats.narrativeWords} শব্দ)` : `Narrative (${detailedStats.narrativeWords} words)`}
              />
            </div>
            <div className="dialogue-ratio-legend">
              <span className="legend-item"><span className="dot dialogue-dot" /> {lang === 'bn' ? `সংলাপ (${formatNumber(detailedStats.dialogueWords)} শব্দ)` : `Dialogue (${formatNumber(detailedStats.dialogueWords)} words)`}</span>
              <span className="legend-item"><span className="dot narrative-dot" /> {lang === 'bn' ? `বর্ণনা (${formatNumber(detailedStats.narrativeWords)} শব্দ)` : `Narrative (${formatNumber(detailedStats.narrativeWords)} words)`}</span>
            </div>
          </div>

          {/* Sentence Cadence (Rhythm) */}
          <div className="analytics-section-card">
            <div className="analytics-header-row">
              <strong>{lang === 'bn' ? 'বাক্যের ছন্দ ও দৈর্ঘ্য বিশ্লেষণ' : 'Sentence Cadence & Rhythm'}</strong>
            </div>
            <div className="cadence-grid">
              <div className="cadence-pill short">
                <strong>{formatNumber(detailedStats.sentenceCadence.short)}</strong>
                <small>{lang === 'bn' ? 'ছোট বাক্য (< ১০ শব্দ)' : 'Short (< 10 words)'}</small>
              </div>
              <div className="cadence-pill medium">
                <strong>{formatNumber(detailedStats.sentenceCadence.medium)}</strong>
                <small>{lang === 'bn' ? 'মাঝারি (১০ - ২৫ শব্দ)' : 'Medium (10 - 25)'}</small>
              </div>
              <div className="cadence-pill long">
                <strong>{formatNumber(detailedStats.sentenceCadence.long)}</strong>
                <small>{lang === 'bn' ? 'দীর্ঘ বাক্য (> ২৫ শব্দ)' : 'Long (> 25 words)'}</small>
              </div>
            </div>
          </div>

          {/* Overused Words Detector */}
          {detailedStats.overusedWords.length > 0 && (
            <div className="analytics-section-card">
              <div className="analytics-header-row">
                <strong>{lang === 'bn' ? 'পুনরাবৃত্তি শব্দ ট্র্যাকার (Overused Words)' : 'Frequently Repeated Words'}</strong>
                <small>{lang === 'bn' ? 'বিকল্প শব্দ প্রয়োগ করে লেখার মান বাড়ান' : 'Consider synonyms for variety'}</small>
              </div>
              <div className="overused-words-list">
                {detailedStats.overusedWords.map((ow: { word: string; count: number; percentage: number; alternatives: string[] }, idx: number) => (
                  <div key={idx} className="overused-word-item">
                    <div className="ow-meta">
                      <span className="ow-word">"{ow.word}"</span>
                      <span className="ow-count">{lang === 'bn' ? `${formatNumber(ow.count)} বার (${ow.percentage}%)` : `${ow.count} times (${ow.percentage}%)`}</span>
                    </div>
                    {ow.alternatives.length > 0 && (
                      <div className="ow-alts">
                        <small>{lang === 'bn' ? 'বিকল্প:' : 'Synonyms:'}</small>
                        {ow.alternatives.map((alt: string, aIdx: number) => (
                          <span key={aIdx} className="alt-tag">{alt}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="stats-export-actions">
            <button className="primary" onClick={downloadTxt}>
              <Download size={15} /> {t.btnExportTxt}
            </button>
            <button className="secondary" onClick={downloadMarkdown}>
              <FileCode size={15} /> {t.btnExportMarkdown}
            </button>
            <button className="secondary" onClick={downloadHtml}>
              <FileCode size={15} /> {t.btnExportHtml}
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

      {/* ── 1-Click Publish to WordPress Modal ── */}
      {showPublishModal && (
        <PublishModal
          project={project}
          currentChapter={chapter}
          lang={lang}
          onClose={() => setShowPublishModal(false)}
        />
      )}

      {/* ── Bangla Conjuncts Cheat Sheet Modal ── */}
      {showConjuncts && (
        <ConjunctsModal
          lang={lang}
          onInsert={handleInsertConjunct}
          onClose={() => setShowConjuncts(false)}
        />
      )}

      {/* ── Global Project Find & Replace Modal ── */}
      {showGlobalFindModal && project && (
        <GlobalFindReplaceModal
          isOpen={showGlobalFindModal}
          onClose={() => setShowGlobalFindModal(false)}
          chapters={project.chapters}
          currentChapterId={cid}
          lang={lang}
          onReplaceAll={handleGlobalReplaceAll}
          onSelectChapter={selectChapter}
        />
      )}
    </div>
  );
}
