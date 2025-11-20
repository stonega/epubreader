import { atom } from 'jotai';
import { Book } from '@/lib/db';

// Settings Atoms
export const fontSizeAtom = atom<number>(100); // Percentage
export const fontFamilyAtom = atom<string>('Inter');
export const lineHeightAtom = atom<number>(1.5);
export const themeAtom = atom<'light' | 'dark' | 'sepia'>('light');
export const showSidebarAtom = atom<boolean>(false);

// Book Data Atoms
export const booksAtom = atom<Book[]>([]);
export const currentBookAtom = atom<Book | null>(null);
export const isLoadingBooksAtom = atom<boolean>(false);

// Reader State Atoms
export const currentLocationAtom = atom<string | null>(null);
export const tocAtom = atom<any[]>([]); // Table of Contents
export const searchResultsAtom = atom<any[]>([]);
