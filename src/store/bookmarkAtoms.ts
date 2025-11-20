import { atom } from 'jotai';
import { Bookmark } from '@/lib/db';

export const bookmarksAtom = atom<Bookmark[]>([]);
