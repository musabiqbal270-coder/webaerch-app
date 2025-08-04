// This file uses server-side execution, so it must begin with the 'use server' directive.
'use server';

/**
 * @fileOverview Determines if a search is needed to answer a query using Gemini.
 *
 * - shouldSearch - Determines if a search is needed for the given query.
 * - ShouldSearchInput - The input type for the shouldSearch function.
 * - ShouldSearchOutput - The return type for the shouldSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShouldSearchInputSchema = z.object({
  query: z.string().describe('The user query to analyze.'),
});
export type ShouldSearchInput = z.infer<typeof ShouldSearchInputSchema>;

const ShouldSearchOutputSchema = z.object({
  needsSearch: z.boolean().describe('Whether the query requires a web search.'),
  searchQuery: z.string().describe('The search query to use if a search is needed.'),
  thinking: z.string().describe('The AI reasoning behind the search decision.'),
});
export type ShouldSearchOutput = z.infer<typeof ShouldSearchOutputSchema>;

export async function shouldSearch(input: ShouldSearchInput): Promise<ShouldSearchOutput> {
  return shouldSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'shouldSearchPrompt',
  input: {schema: ShouldSearchInputSchema},
  output: {schema: ShouldSearchOutputSchema},
  prompt: `Analyze this user query: "{{query}}\