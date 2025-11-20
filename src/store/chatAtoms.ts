import { atom } from 'jotai';

export const showChatAtom = atom<boolean>(false);
export const chatMessagesAtom = atom<any[]>([]);
export const aiProviderAtom = atom<string>('openai'); // openai, anthropic, etc.
export const aiApiKeyAtom = atom<string>('');
export const aiModelAtom = atom<string>('gpt-4o');
export const chatContextAtom = atom<string>(''); // For selected text context
