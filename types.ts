export type TranslationType = 'dialogue' | 'thought' | 'narration' | 'sfx';

export interface TranslationBlock {
  type: TranslationType;
  text: string;
  original?: string;
}

export interface NewTerm {
  original: string;
  translation: string;
  category: string; // #Names, #Places, #Skills
}

export interface TranslationResult {
  blocks: TranslationBlock[];
  detectedTerms: NewTerm[];
}

export interface ManhwaImage {
  id: string;
  url: string; 
  base64?: string;
  file?: File;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'waiting'; // Added 'waiting'
  selected: boolean; // New field for selection step
  blocks?: TranslationBlock[];
  rawText?: string;
  width?: number;
  height?: number;
}

export interface GlossaryItem {
  id: string;
  term: string;
  translation: string;
  category: string; // e.g., Names, Places, Skills
  project: string; // To categorize by Manhwa
}

export type Genre = 'wuxia' | 'system' | 'romance' | 'school' | 'fantasy' | 'general';

export enum AppStep {
  INPUT = 'INPUT',
  SELECTION = 'SELECTION', // New Step
  DASHBOARD = 'DASHBOARD'
}

export interface ProcessingStats {
  total: number;
  processed: number;
  success: number;
  failed: number;
}