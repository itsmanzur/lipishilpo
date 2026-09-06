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
