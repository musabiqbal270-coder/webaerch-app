'use server';

import { shouldSearch } from '@/ai/flows/intelligent-query-analysis';
import { generateResponse } from '@/ai/flows/ai-response-generation';
import type { SearchResult } from '@/lib/types';

// Mocked Tavily search function
async function searchWeb(query: string): Promise<SearchResult[]> {
  console.log(`Searching web for: ${query}`);
  // In a real app, this would call the Tavily API.
  // For this mock, we return some dummy data.
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  return [
    {
      title: "Breakthrough in AI: 2024 Year in Review",
      url: "https://example.com/ai-breakthrough-2024",
      content: "A comprehensive look at the major advancements in artificial intelligence throughout 2024, including new model architectures and their real-world applications."
    },
    {
      title: "The Next Generation of AI - What to Expect",
      url: "https://example.com/next-gen-ai",
      content: "Experts predict that 2024's AI breakthroughs are just the beginning. The focus is shifting towards more efficient, multi-modal models that can reason and interact more naturally."
    },
    {
      title: "AI Ethics and Safety Report 2024",
      url: "https://example.com/ai-ethics-2024",
      content: "As AI capabilities grew in 2024, so did the conversation around ethics and safety. This report outlines new frameworks for responsible AI development and deployment."
    }
  ];
}

export async function processQuery(query: string, assistantId: string) {
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: any) => {
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ ...data, id: assistantId })));
      };

      try {
        // 1. Analyze if search is needed
        const analysis = await shouldSearch({ query });
        enqueue({ thinking: analysis.thinking });

        let searchResults: SearchResult[] = [];
        if (analysis.needsSearch) {
          enqueue({ thinking: `${analysis.thinking}\n\n🌐 Searching the web for: \`${analysis.searchQuery}\`` });
          searchResults = await searchWeb(analysis.searchQuery);
          
          if (searchResults.length > 0) {
            enqueue({
              thinking: `${analysis.thinking}\n\n✅ Found ${searchResults.length} high-quality sources.`,
              sources: searchResults,
            });
          } else {
             enqueue({ thinking: `${analysis.thinking}\n\n❌ No relevant sources found. Answering from general knowledge.` });
          }
        }
        
        enqueue({ thinking: `${analysis.thinking}\n\n✍️ Generating response...` });

        // 2. Generate the final response
        const finalResponse = await generateResponse({
          query,
          searchResults,
        });
        
        enqueue({ 
            content: finalResponse.response,
            thinking: `${analysis.thinking}\n\n✅ Response complete.`
        });

      } catch (error) {
        console.error("Error in processQuery stream:", error);
        enqueue({
          content: 'Sorry, an error occurred while processing your request.',
          thinking: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}
