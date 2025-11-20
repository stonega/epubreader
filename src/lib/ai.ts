import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// This is a mock server-side handler since we are in a client-side only app mostly.
// However, standard AI SDK requires a server endpoint to secure keys (usually).
// But the requirement says "User need to setup own ai model" and "absolutely no server-side persistence".
// And "use vercel ai sdk".
// Since this is a SPA (Vite), we can't really hide the key if we process on client,
// OR we must call the provider directly from client.
// Vercel AI SDK `useChat` expects an endpoint.
//
// We can create a "client-side" route handler if we were using Next.js or similar.
// Since we are using Vite, we don't have API routes out of the box unless we proxy or use a service.
//
// HOWEVER, the user requested "no server-side persistence".
// To make `useChat` work in a pure client-side Vite app with user-provided keys,
// we might need to customize the fetcher or use the `generateText` / `streamText` directly in the component
// BUT `useChat` is very convenient for UI.
//
// ACTUALLY, we can't easily run `streamText` in the browser with standard imports because of Node dependencies usually.
// BUT `ai` package recently supports edge/browser environments more.
//
// Strategy:
// We will implement a custom `fetch` for `useChat` or simply implement the chat logic manually using `streamText` if possible,
// or even simpler: just use `useChat` but point it to a non-existent endpoint and intercept the request? No.
//
// The standard way for client-only apps with user keys is calling the API directly.
// Vercel AI SDK is designed for server-client split.
//
// Let's try to implement a basic handler that runs in the browser if possible?
// No, `streamText` from `@ai-sdk/openai` calls OpenAI API.
// It can run in Edge Runtime.
//
// Let's try to use `CoreMessage` and `streamText` directly in the component?
// No, `useChat` manages state nicely.
//
// Let's stick to the plan but we need to solve the "API route" issue in Vite.
// Since we don't have a backend, we can't strictly use `useChat`'s default behavior which calls `/api/chat`.
//
// WE WILL REWRITE `ChatSidebar` to use `streamText` directly if possible, OR emulate `useChat`.
// actually, `useChat` supports `fetch` customization.
//
// Wait, `ai-elements` was requested.
//
// Let's look at `ChatSidebar.tsx` again. I used `useChat`.
// I need to make it work without a real backend.
//
// I will modify `ChatSidebar` to handle the API call client-side using the user's key.
// I will use `createOpenAI` with the user's key.

export async function sendMessageToOpenAI(messages: any[], apiKey: string, model: string, context?: string) {
    // @ts-ignore
    const openai = createOpenAI({
        apiKey: apiKey,
        // @ts-ignore
        dangerouslyAllowBrowser: true // Required for client-side usage
    });

    const systemMessage = {
        role: 'system',
        content: `You are a helpful reading assistant. The user is reading a book.
        Here is the text from the current page/section they are reading:

        "${context || 'No context available.'}"

        Answer the user's questions based on this context if applicable, or general knowledge.
        Keep answers concise and helpful.`
    };

    const allMessages = [systemMessage, ...messages];

    const result = await streamText({
        model: openai(model),
        messages: allMessages,
    });

    return result;
}
