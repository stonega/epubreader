import { atom } from 'jotai';

export const showSearchAtom = atom<boolean>(false);
export const searchQueryAtom = atom<string>('');
export const searchResultsAtom = atom<any[]>([]);
export const isSearchingAtom = atom<boolean>(false);
