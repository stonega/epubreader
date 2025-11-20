import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import {
    currentBookAtom,
    currentLocationAtom,
    tocAtom,
    fontSizeAtom,
    fontFamilyAtom,
    lineHeightAtom,
    themeAtom,
    showSidebarAtom
} from '@/store/atoms';
import { getBook, updateBookProgress, addBookmark, Bookmark } from '@/lib/db';
import ePub, { Book as EpubBook, Rendition } from 'epubjs';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Menu, ArrowLeft, MessageSquare, Search, Bookmark as BookmarkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TOCSidebar } from '@/components/TOCSidebar';
import { SettingsMenu } from '@/components/SettingsMenu';
import { SearchModal } from '@/components/SearchModal';
import { ChatSidebar } from '@/components/ChatSidebar';
import { SelectionMenu } from '@/components/SelectionMenu';
import { showSearchAtom } from '@/store/searchAtoms';
import { showChatAtom } from '@/store/chatAtoms';
import { currentSelectionAtom } from '@/store/highlightsAtoms';
import { toast } from 'sonner';

export default function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useAtom(currentBookAtom);
  const [, setLocation] = useAtom(currentLocationAtom);
  const [toc, setToc] = useAtom(tocAtom);
  const [fontSize] = useAtom(fontSizeAtom);
  const [fontFamily] = useAtom(fontFamilyAtom);
  const [lineHeight] = useAtom(lineHeightAtom);
  const [theme] = useAtom(themeAtom);
  const [showSidebar, setShowSidebar] = useAtom(showSidebarAtom);
  const [, setShowSearch] = useAtom(showSearchAtom);
  const [showChat, setShowChat] = useAtom(showChatAtom);
  const [, setSelection] = useAtom(currentSelectionAtom);

  const [rendition, setRendition] = useState<Rendition | null>(null);
  const [epubInstance, setEpubInstance] = useState<EpubBook | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!bookId) return;

    const loadBook = async () => {
        try {
            const loadedBook = await getBook(bookId);
            if (!loadedBook) {
                navigate('/');
                return;
            }
            setBook(loadedBook);
            initializeReader(loadedBook.content, loadedBook.lastReadPosition);
        } catch (error) {
            console.error("Error loading book:", error);
        }
    };

    loadBook();

    return () => {
        if (epubInstance) {
            epubInstance.destroy();
        }
    };
  }, [bookId]);

  const initializeReader = (content: ArrayBuffer, initialLocation?: string) => {
    if (!viewerRef.current) return;

    const bookInstance = ePub(content);
    setEpubInstance(bookInstance);

    const rend = bookInstance.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        flow: 'paginated',
        manager: 'default',
    });

    setRendition(rend);

    // Load navigation
    bookInstance.loaded.navigation.then((nav) => {
        setToc(nav.toc);
    });

    // Display
    const displayPromise = initialLocation ? rend.display(initialLocation) : rend.display();

    displayPromise.then(() => {
        setIsReady(true);
        applyStyles(rend);
    });

    // Event listeners
    rend.on('relocated', (location: any) => {
        setLocation(location.start.cfi);
        if (bookId) {
            updateBookProgress(bookId, location.start.cfi);
        }
    });

    rend.on('selected', (cfiRange: string, _contents: any) => {
        setSelection({
            cfiRange,
            text: rend.getRange(cfiRange).toString(),
            x: 0,
            y: 0
        });
        // We need to calculate coordinates.
        // Epubjs puts the selection in an iframe.
        // We can get the bounding client rect of the selection in the iframe,
        // then offset by the iframe position.
        // However, getting exact coordinates from the event might differ.
        // contents is the Contents object.

        // @ts-ignore
        const iframe = viewerRef.current?.querySelector('iframe');
        if(iframe) {
            // @ts-ignore
            const range = rend.getRange(cfiRange);
            const rect = range.getBoundingClientRect();
            const iframeRect = iframe.getBoundingClientRect();

            setSelection({
                cfiRange,
                text: range.toString(),
                x: rect.left + iframeRect.left + (rect.width / 2) - 50, // Center menu
                y: rect.top + iframeRect.top
            });
        }
    });

    rend.on('markClicked', (cfiRange: string, data: any) => {
        console.log("Mark clicked", cfiRange, data);
    });

    // Clear selection on click elsewhere
    rend.on('click', () => {
        setSelection(null);
    });
  };

  // Apply styles when settings change
  useEffect(() => {
    if (rendition) {
        applyStyles(rendition);
    }
  }, [fontSize, fontFamily, lineHeight, theme, rendition]);

  const applyStyles = (rend: Rendition) => {
    rend.themes.fontSize(`${fontSize}%`);
    rend.themes.font(fontFamily);

    // Apply line height through CSS injection since epubjs themes might not handle it robustly for all elements
    // But epubjs themes interface usually supports common CSS properties.
    // Let's try standard theme registration first.

    const themeStyles = {
        'body': {
            'line-height': `${lineHeight} !important`,
            'padding-top': '20px !important',
            'padding-bottom': '20px !important',
        },
        'p': {
             'line-height': `${lineHeight} !important`,
             'font-family': `${fontFamily} !important`
        }
    };

    // Theme handling
    if (theme === 'dark') {
        rend.themes.register('dark', {
            ...themeStyles,
            body: { ...themeStyles.body, color: '#fafafa', background: '#1a1a1a' },
            p: { ...themeStyles.p, color: '#fafafa' },
            h1: { color: '#fafafa' },
            h2: { color: '#fafafa' },
            h3: { color: '#fafafa' },
            h4: { color: '#fafafa' },
            h5: { color: '#fafafa' },
            h6: { color: '#fafafa' },
            span: { color: '#fafafa' }
        });
        rend.themes.select('dark');
    } else if (theme === 'sepia') {
        rend.themes.register('sepia', {
             ...themeStyles,
            body: { ...themeStyles.body, color: '#5f4b32', background: '#f6f1d1' },
            p: { ...themeStyles.p, color: '#5f4b32' }
        });
        rend.themes.select('sepia');
    } else {
         rend.themes.register('light', {
             ...themeStyles,
            body: { ...themeStyles.body, color: '#000000', background: '#ffffff' }
        });
        rend.themes.select('light');
    }
  };

  const prevPage = () => rendition?.prev();
  const nextPage = () => rendition?.next();

  const handleAddBookmark = async () => {
      if(!book || !rendition) return;

      const location = rendition.currentLocation();
      // @ts-ignore
      const cfi = location.start?.cfi;

      // Try to get a label (chapter name)
      // @ts-ignore
      let label = `Page ${location.start?.displayed?.page}`;
      // @ts-ignore
      const item = epubInstance?.spine.get(cfi);
      if(item) {
           // find toc item
           // @ts-ignore
           const tocItem = toc.find(t => t.href.includes(item.href));
           if(tocItem) label = tocItem.label;
      }

      const bookmark: Bookmark = {
          id: crypto.randomUUID(),
          bookId: book.id,
          cfi: cfi,
          label: label,
          createdAt: Date.now()
      };

      await addBookmark(bookmark);
      toast.success("Bookmark added!");
  };

  return (
    <div className={cn(
        "flex flex-col h-screen overflow-hidden transition-colors duration-300",
        theme === 'dark' ? 'bg-neutral-900 text-white' : theme === 'sepia' ? 'bg-[#f6f1d1] text-[#5f4b32]' : 'bg-white text-black'
    )}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border/20 z-10 relative bg-inherit backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
        </Button>

        <h1 className="font-serif font-medium text-sm md:text-base truncate max-w-[50%] opacity-80">
            {book?.title}
        </h1>

        <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" onClick={handleAddBookmark}>
                <BookmarkIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
                <Search className="h-5 w-5" />
            </Button>
            <SettingsMenu />
            <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
                <Menu className="h-5 w-5" />
            </Button>
             <Button variant="ghost" size="icon" onClick={() => setShowChat(!showChat)}>
                <MessageSquare className="h-5 w-5" />
            </Button>
        </div>
      </div>

      <TOCSidebar onNavigate={(href) => rendition?.display(href)} />
      <SearchModal book={epubInstance} onNavigate={(cfi) => rendition?.display(cfi)} />
      <ChatSidebar book={epubInstance} rendition={rendition} />
      <SelectionMenu onHighlight={(h) => {
          rendition?.annotations.add('highlight', h.cfiRange, {}, (e: any) => {
              console.log("Highlight clicked", e);
          }, "hl-default", { "fill": h.color, "fill-opacity": "0.3", "mix-blend-mode": "multiply" });
      }} />

      {/* Reader Area */}
      <div className="flex-1 relative flex overflow-hidden">
         {/* Page Turn Areas */}
         <div className="absolute inset-y-0 left-0 w-16 z-10 cursor-pointer hover:bg-black/5 transition-colors flex items-center justify-center" onClick={prevPage}>
            <ChevronLeft className="opacity-0 hover:opacity-50 transition-opacity h-8 w-8" />
         </div>
         <div className="absolute inset-y-0 right-0 w-16 z-10 cursor-pointer hover:bg-black/5 transition-colors flex items-center justify-center" onClick={nextPage}>
            <ChevronRight className="opacity-0 hover:opacity-50 transition-opacity h-8 w-8" />
         </div>

         {/* Epub Container */}
         <div className="flex-1 h-full w-full px-12 py-8">
            <div ref={viewerRef} className="h-full w-full" />
         </div>
      </div>

      {!isReady && (
         <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
         </div>
      )}
    </div>
  );
}
