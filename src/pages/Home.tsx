import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { booksAtom, isLoadingBooksAtom } from '@/store/atoms';
import { addBook, getAllBooks, Book } from '@/lib/db';
import ePub from 'epubjs';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deleteBook } from '@/lib/db';
import { motion } from 'framer-motion';

export default function Home() {
  const [books, setBooks] = useAtom(booksAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingBooksAtom);
  const navigate = useNavigate();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const loadedBooks = await getAllBooks();
      // Sort by addedAt desc
      loadedBooks.sort((a, b) => b.addedAt - a.addedAt);
      setBooks(loadedBooks);
    } catch (error) {
      console.error("Failed to load books:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an epub
    if (file.type !== 'application/epub+zip' && !file.name.endsWith('.epub')) {
      alert('Please select a valid EPUB file.');
      return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const book = ePub(arrayBuffer);
        const metadata = await book.loaded.metadata;

        // Get cover
        let coverUrl = '';
        try {
            const coverUrlResult = await book.coverUrl();
            if (coverUrlResult) {
                // Convert blob URL to base64 or store as is?
                // epubjs gives a blob url that might revoke.
                // Better to extract the image data.
                // For simplicity in V1, we'll try to get the cover image file and convert to base64
                // Actually, book.coverUrl() creates a blob url from internal resources.
                // We need to get the archive item.
                // @ts-ignore
                const coverPath = await book.cover();
                if(coverPath) {
                    // @ts-ignore
                    const coverImage = await book.archive.createUrl(coverPath, { base64: true });
                    coverUrl = coverImage;
                }
            }
        } catch (e) {
            console.warn("Could not load cover", e);
        }

        const newBook: Book = {
            id: crypto.randomUUID(),
            title: metadata.title,
            author: metadata.creator,
            cover: coverUrl,
            content: arrayBuffer,
            addedAt: Date.now(),
        };

        await addBook(newBook);
        await loadBooks(); // Reload list
    } catch (error) {
        console.error("Error parsing EPUB:", error);
        alert("Failed to parse EPUB file.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm('Are you sure you want to delete this book?')) {
        await deleteBook(id);
        await loadBooks();
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <BookOpen size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Epubreader</h1>
        </div>

        <div className="relative">
            <input
                type="file"
                id="epub-upload"
                accept=".epub"
                className="hidden"
                onChange={handleFileUpload}
            />
            <Button asChild size="lg" className="cursor-pointer shadow-lg hover:shadow-xl transition-all">
                <label htmlFor="epub-upload">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Book
                </label>
            </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-muted rounded-full mb-4"></div>
                <div className="h-4 w-48 bg-muted rounded"></div>
            </div>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">No books yet</h2>
          <p className="text-muted-foreground mb-6">Upload an EPUB file to start reading.</p>
          <Button asChild variant="outline" className="cursor-pointer">
                <label htmlFor="epub-upload">
                    Select File
                </label>
            </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {books.map((book) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="group relative flex flex-col bg-card rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border hover:border-primary/20 overflow-hidden cursor-pointer"
              onClick={() => navigate(`/reader/${book.id}`)}
            >
              <div className="aspect-[2/3] w-full bg-muted relative overflow-hidden">
                {book.cover ? (
                  <img
                    src={book.cover}
                    alt={`Cover of ${book.title}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-accent">
                    <span className="text-4xl font-serif font-bold text-muted-foreground/30 opacity-50 select-none">
                        {book.title.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                <button
                    onClick={(e) => handleDelete(e, book.id)}
                    className="absolute top-2 right-2 p-2 bg-destructive/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive shadow-sm"
                    title="Delete book"
                >
                    <Trash2 size={16} />
                </button>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-1 text-card-foreground" title={book.title}>
                    {book.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-4">
                    {book.author || "Unknown Author"}
                </p>

                {book.lastReadPosition && (
                    <div className="mt-auto pt-2 border-t border-border/50">
                         <span className="text-xs font-medium text-primary flex items-center">
                            Continue Reading
                         </span>
                    </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
