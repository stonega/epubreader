import { openDB, DBSchema } from 'idb';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string; // Base64 or Blob URL
  content: ArrayBuffer; // The actual EPUB file
  addedAt: number;
  lastReadPosition?: string; // CFI or other location string
}

export interface Highlight {
  id: string;
  bookId: string;
  cfiRange: string;
  text: string;
  color: string;
  note?: string;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  bookId: string;
  cfi: string;
  label?: string; // Chapter title or snippet
  createdAt: number;
}

interface EpubReaderDB extends DBSchema {
  books: {
    key: string;
    value: Book;
    indexes: { 'by-added': number };
  };
  highlights: {
    key: string;
    value: Highlight;
    indexes: { 'by-book': string };
  };
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: { 'by-book': string };
  };
}

const DB_NAME = 'epubreader-db';
const DB_VERSION = 2;

export const dbPromise = openDB<EpubReaderDB>(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion, newVersion, transaction) {
    if (oldVersion < 1) {
      const bookStore = db.createObjectStore('books', { keyPath: 'id' });
      bookStore.createIndex('by-added', 'addedAt');

      const highlightStore = db.createObjectStore('highlights', { keyPath: 'id' });
      highlightStore.createIndex('by-book', 'bookId');
    }
    if (oldVersion < 2) {
        const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
        bookmarkStore.createIndex('by-book', 'bookId');
    }
  },
});

// Helper functions
export const addBook = async (book: Book) => {
  return (await dbPromise).put('books', book);
};

export const getBook = async (id: string) => {
  return (await dbPromise).get('books', id);
};

export const getAllBooks = async () => {
  return (await dbPromise).getAllFromIndex('books', 'by-added');
};

export const deleteBook = async (id: string) => {
  return (await dbPromise).delete('books', id);
};

export const updateBookProgress = async (id: string, position: string) => {
  const db = await dbPromise;
  const book = await db.get('books', id);
  if (book) {
    book.lastReadPosition = position;
    await db.put('books', book);
  }
};

export const addHighlight = async (highlight: Highlight) => {
  return (await dbPromise).put('highlights', highlight);
};

export const getBookHighlights = async (bookId: string) => {
  return (await dbPromise).getAllFromIndex('highlights', 'by-book', bookId);
};

export const deleteHighlight = async (id: string) => {
  return (await dbPromise).delete('highlights', id);
};

export const addBookmark = async (bookmark: Bookmark) => {
  return (await dbPromise).put('bookmarks', bookmark);
};

export const getBookBookmarks = async (bookId: string) => {
  return (await dbPromise).getAllFromIndex('bookmarks', 'by-book', bookId);
};

export const deleteBookmark = async (id: string) => {
  return (await dbPromise).delete('bookmarks', id);
};
