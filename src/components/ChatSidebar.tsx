import React, { useEffect, useState, useRef } from 'react';
import { useAtom } from 'jotai';
import { showChatAtom, aiApiKeyAtom, aiModelAtom, chatContextAtom } from '@/store/chatAtoms';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useChat } from '@ai-sdk/react';
import { Book as EpubBook, Rendition } from 'epubjs';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

interface ChatSidebarProps {
    book: EpubBook | null;
    rendition: Rendition | null;
}

export function ChatSidebar({ book, rendition }: ChatSidebarProps) {
    const [showChat, setShowChat] = useAtom(showChatAtom);
    const [apiKey, setApiKey] = useAtom(aiApiKeyAtom);
    const [model, setModel] = useAtom(aiModelAtom);
    const [contextText, setContextText] = useState<string>('');
    const [selectedContext, setSelectedContext] = useAtom(chatContextAtom);

    // Custom fetcher to run client-side
    // @ts-ignore
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        // @ts-ignore
        api: '/api/chat', // This won't be used because we override fetch, but needed for types
        // @ts-ignore
        fetch: async (url, { body }: any) => {
             if (!apiKey) {
                throw new Error("API Key missing");
            }

            const { messages: chatMessages } = JSON.parse(body);

            // @ts-ignore
            const openai = createOpenAI({
                apiKey: apiKey,
                // @ts-ignore
                dangerouslyAllowBrowser: true
            });

            const systemMessage = {
                role: 'system',
                content: `You are a helpful reading assistant. The user is reading a book.
                ${selectedContext ? `The user selected this specific text to discuss: "${selectedContext}"` : ''}

                Here is the text from the current page/section they are reading:

                "${contextText || 'No context available.'}"

                Answer the user's questions based on this context if applicable, or general knowledge.
                Keep answers concise and helpful.`
            };

            try {
                const result = await streamText({
                    model: openai(model),
                    messages: [systemMessage, ...chatMessages],
                });

                // @ts-ignore
                return result.toDataStreamResponse();
            } catch (error) {
                console.error("AI Error:", error);
                throw error;
            }
        },
        onError: (err) => {
            console.error("Chat error", err);
            alert("Failed to send message. Check your API Key.");
        }
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Context extraction
    useEffect(() => {
        if (!showChat || !rendition) return;

        const updateContext = async () => {
            try {
                 // Get current visible text
                 // Rendition has a location
                 const location = rendition.currentLocation();
                 // @ts-ignore
                 if (location && location.start) {
                     // This is tricky in epubjs.
                     // We can get the range of the current page.
                     // Let's try getting the text from the visible range.
                     // range = rendition.getRange(location.start.cfi);
                     // text = range.toString();

                     // Actually, simpler method for now: get the current chapter text.
                     // Or just the textContent of the visible area if we can grab it from DOM.
                     // But DOM is in an iframe.

                     // @ts-ignore
                     const range = rendition.getRange(location.start.cfi);
                     if(range) {
                         // @ts-ignore
                         setContextText(range.toString());
                     }
                 }
            } catch (e) {
                console.warn("Could not get context", e);
            }
        };

        updateContext();
        rendition.on('relocated', updateContext);

        return () => {
            rendition.off('relocated', updateContext);
        }
    }, [showChat, rendition]);


    return (
        <AnimatePresence>
            {showChat && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/10 z-40 backdrop-blur-[1px]"
                        onClick={() => setShowChat(false)}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-96 bg-background border-l border-border z-50 shadow-2xl flex flex-col"
                    >
                        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                            <h2 className="font-semibold flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                AI Assistant
                            </h2>
                             <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => {
                                    const key = prompt("Enter your OpenAI API Key:", apiKey);
                                    if(key !== null) setApiKey(key);
                                }}>
                                    <Settings className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                             </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-muted-foreground text-sm py-8 px-4">
                                    <p>Ask questions about the book!</p>
                                    <p className="mt-2 text-xs opacity-70">Context from the current page will be sent automatically.</p>
                                    {!apiKey && <p className="mt-4 text-destructive font-medium">Please set your API Key in settings.</p>}
                                </div>
                            )}

                            {messages.map(m => (
                                // @ts-ignore
                                <div key={m.id} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                                        // @ts-ignore
                                        m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        {/* @ts-ignore */}
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                             {isLoading && (
                                <div className="flex justify-start">
                                     <div className="bg-muted max-w-[85%] rounded-lg px-3 py-2 text-sm">
                                        <span className="animate-pulse">Thinking...</span>
                                     </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-border bg-background">
                             {selectedContext ? (
                                <div className="mb-2 px-2 py-1 bg-primary/10 rounded text-xs text-primary flex justify-between items-center">
                                    <span className="truncate">Selection: {selectedContext.substring(0, 30)}...</span>
                                    <button onClick={() => setSelectedContext('')} className="ml-2 hover:text-destructive"><X className="h-3 w-3" /></button>
                                </div>
                             ) : contextText && (
                                <div className="mb-2 px-2 py-1 bg-accent/50 rounded text-[10px] text-muted-foreground truncate">
                                    Context: {contextText.substring(0, 50)}...
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Ask about this page..."
                                    disabled={!apiKey || isLoading}
                                />
                                <Button type="submit" size="icon" disabled={!apiKey || isLoading}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
