'use server';

import { shouldSearch } from '@/ai/flows/intelligent-query-analysis';
import { generateResponse } from '@/ai/flows/ai-response-generation';
import type { SearchResult } from '@/lib/types';

async function searchWeb(query: string): Promise<SearchResult[]> {
  console.log(`Searching web for: ${query}`);
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        include_answer: false,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      console.error('Tavily API error:', response.status, response.statusText);
      const errorBody = await response.text();
      console.error('Tavily error body:', errorBody);
      return []; // Return empty array on error
    }

    const data = await response.json();
    // The Tavily API returns results in a `results` property.
    // Each result has `title`, `url`, and `content`.
    if (data.results && Array.isArray(data.results)) {
       return data.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content, // 'content' from Tavily is the snippet
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch from Tavily API:', error);
    return [];
  }
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
