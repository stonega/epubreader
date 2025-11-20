import React from 'react';
import { useAtom } from 'jotai';
import { showSearchAtom, searchQueryAtom, searchResultsAtom, isSearchingAtom } from '@/store/searchAtoms';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Book as EpubBook } from 'epubjs';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { Button } from './ui/button';

interface SearchModalProps {
    book: EpubBook | null;
    onNavigate: (cfi: string) => void;
}

export function SearchModal({ book, onNavigate }: SearchModalProps) {
    const [showSearch, setShowSearch] = useAtom(showSearchAtom);
    const [query, setQuery] = useAtom(searchQueryAtom);
    const [results, setResults] = useAtom(searchResultsAtom);
    const [isSearching, setIsSearching] = useAtom(isSearchingAtom);

    const handleSearch = async () => {
        if (!book || !query.trim()) return;

        setIsSearching(true);
        setResults([]);

        try {
            // EpubJS search is a bit heavy, we run it.
            // Note: This searches the whole book which might be slow for large books.
            await Promise.all(
                // @ts-ignore
                book.spine.spineItems.map(item =>
                    // @ts-ignore
                    item.load(book.load.bind(book))
                        // @ts-ignore
                        .then(doc => {
                            const text = doc.textContent || "";
                            const regex = new RegExp(query, 'gi');
                            while (regex.exec(text) !== null) {
                                // Logic to handle matches would go here if we were using this manual implementation
                            }
                            return [];
                        })
                )
            );
            // Flatten
            // Ideally we use book.find(query) but it relies on the older search algorithm which is sometimes buggy or requires the full text index.
            // Let's try using the built-in find if available, or a simplified version.
             // Actually, let's use the `book.find` method if it works reliably.
             // const found = await book.find(query);
             // `book.find` is not always available in types, but it exists in the instance.
             // However, generating CFIs for every match is complex.

             // For this MVP, let's use the built-in implementation if possible, otherwise fallback to a simpler one.
             // Because `book.find` might freeze the UI, we should be careful.

             // Let's rely on the standard `book.find(query)` which returns `Promise<SearchResult[]>`.

             // @ts-ignore
             const found = await book.find(query);
             setResults(found);

        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    return (
        <Dialog open={showSearch} onOpenChange={setShowSearch}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Search in Book</DialogTitle>
                </DialogHeader>
                <div className="flex gap-2 my-4">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search term..."
                        onKeyDown={handleKeyDown}
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <SearchIcon className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto -mx-4 px-4">
                    {results.length === 0 && !isSearching && query && (
                        <div className="text-center text-muted-foreground py-8">
                            No results found.
                        </div>
                    )}

                    <div className="space-y-2">
                        {results.map((result, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    onNavigate(result.cfi);
                                    setShowSearch(false);
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
                            >
                                <p className="text-sm font-serif text-foreground" dangerouslySetInnerHTML={{
                                    __html: result.excerpt.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>')
                                }} />
                            </button>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
