import React from 'react';
import { useAtom } from 'jotai';
import { tocAtom, showSidebarAtom, currentBookAtom } from '@/store/atoms';
import { bookmarksAtom } from '@/store/bookmarkAtoms';
import { deleteBookmark, getBookBookmarks } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark as BookmarkIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect } from 'react';

interface TOCSidebarProps {
    onNavigate: (href: string) => void;
}

export function TOCSidebar({ onNavigate }: TOCSidebarProps) {
    const [showSidebar, setShowSidebar] = useAtom(showSidebarAtom);
    const [toc] = useAtom(tocAtom);
    const [book] = useAtom(currentBookAtom);
    const [bookmarks, setBookmarks] = useAtom(bookmarksAtom);

    useEffect(() => {
        if (book && showSidebar) {
            getBookBookmarks(book.id).then(setBookmarks);
        }
    }, [book, showSidebar, setBookmarks]);

    const handleDeleteBookmark = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (book) {
             await deleteBookmark(id);
             const updated = await getBookBookmarks(book.id);
             setBookmarks(updated);
        }
    };

    return (
        <AnimatePresence>
            {showSidebar && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
                        onClick={() => setShowSidebar(false)}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-80 bg-background border-l border-border z-50 shadow-2xl flex flex-col"
                    >
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h2 className="font-semibold flex items-center gap-2">
                                Menu
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowSidebar(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <Tabs defaultValue="toc" className="flex-1 flex flex-col">
                            <div className="px-4 pt-4">
                                <TabsList className="w-full">
                                    <TabsTrigger value="toc" className="flex-1">Contents</TabsTrigger>
                                    <TabsTrigger value="bookmarks" className="flex-1">Bookmarks</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="toc" className="flex-1 overflow-y-auto p-4">
                                {toc.length === 0 ? (
                                    <p className="text-muted-foreground text-sm text-center py-4">No table of contents available.</p>
                                ) : (
                                    <ul className="space-y-1">
                                        {toc.map((chapter, index) => (
                                            <li key={index}>
                                                <button
                                                    onClick={() => {
                                                        onNavigate(chapter.href);
                                                        setShowSidebar(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors truncate"
                                                    title={chapter.label}
                                                >
                                                    {chapter.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </TabsContent>

                            <TabsContent value="bookmarks" className="flex-1 overflow-y-auto p-4">
                                {bookmarks.length === 0 ? (
                                     <div className="text-center py-8 text-muted-foreground">
                                        <BookmarkIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p className="text-sm">No bookmarks yet.</p>
                                        <p className="text-xs mt-1">Click the bookmark icon while reading to save a page.</p>
                                     </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {bookmarks.sort((a,b) => b.createdAt - a.createdAt).map((bookmark) => (
                                            <li key={bookmark.id} className="group relative">
                                                <button
                                                    onClick={() => {
                                                        onNavigate(bookmark.cfi);
                                                        setShowSidebar(false);
                                                    }}
                                                    className="w-full text-left p-3 text-sm rounded-md border border-border bg-card hover:border-primary/50 transition-all"
                                                >
                                                    <div className="font-medium truncate pr-6">{bookmark.label || "Bookmark"}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {new Date(bookmark.createdAt).toLocaleDateString()}
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteBookmark(bookmark.id, e)}
                                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
