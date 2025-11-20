import React from 'react';
import { useAtom } from 'jotai';
import { currentSelectionAtom, highlightsAtom } from '@/store/highlightsAtoms';
import { showChatAtom, chatContextAtom } from '@/store/chatAtoms';
import { addHighlight, Highlight } from '@/lib/db';
import { currentBookAtom } from '@/store/atoms';
import { Button } from '@/components/ui/button';
import { MessageSquare, Highlighter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectionMenuProps {
    onHighlight: (highlight: Highlight) => void;
}

export function SelectionMenu({ onHighlight }: SelectionMenuProps) {
    const [selection, setSelection] = useAtom(currentSelectionAtom);
    const [book] = useAtom(currentBookAtom);
    const [showChat, setShowChat] = useAtom(showChatAtom);
    const [, setContextText] = React.useState(""); // Used via chat component normally

    if (!selection || !book) return null;

    const handleHighlight = async (color: string) => {
        const newHighlight: Highlight = {
            id: crypto.randomUUID(),
            bookId: book.id,
            cfiRange: selection.cfiRange,
            text: selection.text,
            color,
            createdAt: Date.now()
        };

        await addHighlight(newHighlight);
        onHighlight(newHighlight);
        setSelection(null);
    };

    const [, setChatContext] = useAtom(chatContextAtom);

    const handleAddToChat = () => {
        setChatContext(selection.text);
        setShowChat(true);
        setSelection(null);
    };

    return (
        <AnimatePresence>
             <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                    position: 'absolute',
                    left: selection.x,
                    top: selection.y - 60,
                    zIndex: 100
                }}
                className="bg-popover text-popover-foreground shadow-lg rounded-lg p-1 flex gap-1 border border-border"
            >
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-600" onClick={() => handleHighlight('#fef08a')}>
                    <Highlighter className="h-4 w-4" />
                </Button>
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-500 hover:text-green-600" onClick={() => handleHighlight('#86efac')}>
                    <Highlighter className="h-4 w-4" />
                </Button>
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600" onClick={() => handleHighlight('#93c5fd')}>
                    <Highlighter className="h-4 w-4" />
                </Button>
                 <div className="w-px bg-border my-1" />
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={handleAddToChat}>
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat
                </Button>
                <div className="w-px bg-border my-1" />
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelection(null)}>
                    <X className="h-3 w-3" />
                </Button>
            </motion.div>
        </AnimatePresence>
    );
}
