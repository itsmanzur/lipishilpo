export type RuleCategory = 'spelling' | 'grammar' | 'style' | 'punctuation' | 'typography';

export interface ProofRule {
  id: string;
  lang: 'bn' | 'en' | 'all';
  from: string;
  to: string;
  why: { en: string; bn: string };
  kind: RuleCategory;
  optional?: boolean;
}

export interface ProofOccurrence {
  start: number;
  end: number;
  from: string;
  to: string;
}

export interface ProofMatch {
  id: string;
  from: string;
  to: string;
  why: string;
  kind: string;
  category: RuleCategory;
  optional?: boolean;
  count: number;
  occurrences: ProofOccurrence[];
}


