import type { Chapter, Project } from './api';
import type { Language } from './i18n';

export type ProTabKey = 'audio' | 'aiEdit' | 'analysis' | 'format';

export type ProPanelProps = {
  tab: ProTabKey;
  project: Project;
  chapter: Chapter;
  text: string;
  lang: Language;
  isPro: boolean;
  onTxt: () => void;
  onHtml?: () => void;
  onSentenceHighlight: (sentence: string) => void;
  onLocate: (id: string, quote: string) => void;
  onApply: (id: string, before: string, after: string) => boolean;
};

export type LipishilpoProAPI = {
  tabs: { key: ProTabKey; label: Record<Language, string> }[];
  sidebar: { key: ProTabKey; label: Record<Language, string> }[];
  mount: (el: HTMLElement, props: ProPanelProps) => void;
  update: (props: ProPanelProps) => void;
  unmount: () => void;
};

declare global {
  interface Window {
    LipishilpoPro?: LipishilpoProAPI;
  }
}

export function getLipishilpoPro(): LipishilpoProAPI | undefined {
  return typeof window === 'undefined' ? undefined : window.LipishilpoPro;
}
