import { atom } from 'jotai';
import { Highlight } from '@/lib/db';

export const highlightsAtom = atom<Highlight[]>([]);
export const currentSelectionAtom = atom<{ cfiRange: string; text: string; x: number; y: number } | null>(null);
