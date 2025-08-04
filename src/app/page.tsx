'use client';

import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CornerDownLeft, Bot, User, CircleDashed } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CyberMindIcon } from '@/components/icons';
import { SourceCard } from '@/components/source-card';
import { processQuery } from './actions';
import type { ChatMessage, SearchResult } from '@/lib/types';
import { useTypewriter } from '@/hooks/use-typewriter';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const assistantMessage = messages.findLast((msg) => msg.role === 'assistant');
  const thinkingText = useTypewriter(assistantMessage?.thinking ?? '', 10);
  const contentText = useTypewriter(assistantMessage?.content ?? '', 20);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollableView = scrollAreaRef.current.querySelector('div');
      if (scrollableView) {
        scrollableView.scrollTop = scrollableView.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinkingText, contentText, assistantMessage?.sources]);

  const handleStream = async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let incompleteJson = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const potentialJsons = (incompleteJson + chunk).split(/(?<=})\s*(?={)/);

      for (const str of potentialJsons) {
        if (!str) continue;
        try {
          const parsed = JSON.parse(str);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === parsed.id
                ? {
                    ...msg,
                    thinking: parsed.thinking ?? msg.thinking,
                    sources: parsed.sources ?? msg.sources,
                    content: parsed.content ?? msg.content,
                  }
                : msg
            )
          );
          incompleteJson = '';
        } catch (e) {
          incompleteJson = str;
        }
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput: ChatMessage = { id: uuidv4(), role: 'user', content: input };
    const assistantId = uuidv4();
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      thinking: 'Analyzing query...',
      sources: [],
    };

    setMessages((prev) => [...prev, userInput, assistantPlaceholder]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await processQuery(input, assistantId);
      await handleStream(stream);
    } catch (error) {
      console.error('Error processing query:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: 'An error occurred. Please try again.', thinking: 'Error' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const exampleQueries = [
    "What's the latest news about AI breakthroughs in 2024?",
    "When is the next SpaceX launch and what's the mission?",
    "Explain quantum computing and its recent developments",
    "What's the weather forecast for New York this week?",
  ];

  const handleExampleQuery = (query: string) => {
    setInput(query);
    const form = document.querySelector('form');
    if (form) {
      // We need to submit the form programmatically
      // A simple click on a submit button is not possible as it is not rendered
      // We can create a synthetic event
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  return (
    <div className="flex h-screen w-full flex-col lg:flex-row bg-background overflow-hidden">
      <main className="flex-1 flex flex-col p-4 md:p-6 h-full">
        <div className="flex items-center gap-2 pb-4 border-b">
          <CyberMindIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tighter text-foreground">CyberMind AI</h1>
        </div>

        <ScrollArea className="flex-1 my-4" ref={scrollAreaRef}>
          <div className="pr-4 space-y-6">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                  <Bot size={48} className="mb-4 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">Welcome to CyberMind AI</h2>
                  <p className="mt-2 max-w-md">Your intelligent search companion. Ask me anything, and I'll scour the web to give you a synthesized, up-to-date answer.</p>
                  <div className="mt-8 w-full max-w-md">
                    <p className="text-sm font-medium mb-4">Try an example:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {exampleQueries.map((q) => (
                        <Button key={q} variant="outline" size="sm" className="h-auto py-2 text-left justify-start" onClick={() => handleExampleQuery(q)}>
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex items-start gap-4">
                  <Avatar className="w-8 h-8 border-2 border-primary/50">
                     <AvatarFallback>
                      {m.role === 'user' ? <User className="w-4 h-4 text-accent" /> : <Bot className="w-4 h-4 text-primary" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                     <p className="font-semibold text-sm">
                      {m.role === 'user' ? 'You' : 'CyberMind AI'}
                    </p>
                    <div className="prose prose-sm prose-invert max-w-none text-foreground/90">
                      {m.role === 'assistant' ? contentText : m.content}
                      {m.role === 'assistant' && isLoading && m.id === assistantMessage?.id && !contentText ? (
                        <span className="animate-pulse">|</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="relative mt-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="pr-16 h-12 text-base bg-card border-2 border-border focus:border-primary focus:ring-primary/50"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? <CircleDashed className="h-5 w-5 animate-spin" /> : <CornerDownLeft className="h-5 w-5" />}
          </Button>
        </form>
      </main>

      <aside className="w-full lg:w-[400px] lg:h-screen flex flex-col bg-card border-l p-4 md:p-6 space-y-6">
        <Card className="flex-1 flex flex-col bg-background/50 border-dashed border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              <CircleDashed className={isLoading ? "animate-spin" : ""} />
              AI Thinking Process
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="font-mono text-sm text-muted-foreground whitespace-pre-wrap">
              {assistantMessage ? thinkingText : "Standing by for instructions..."}
              {isLoading && assistantMessage && !thinkingText.endsWith('...') ? <span className="animate-pulse">|</span> : null}
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 flex flex-col bg-background/50 border-dashed border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg text-accent">Sources & References</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
             <CardContent>
              {assistantMessage?.sources && assistantMessage.sources.length > 0 ? (
                <div className="space-y-4">
                  {assistantMessage.sources.map((source, index) => (
                    <SourceCard key={index} source={source} index={index + 1} />
                  ))}
                </div>
              ) : (
                 <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Searching the web...' : 'No sources referenced yet.'}
                 </p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </aside>
    </div>
  );
}
