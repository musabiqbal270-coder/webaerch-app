'use server';

/**
 * @fileOverview This file contains the implementation of the shouldSearchFlow,
 * which determines whether a web search is necessary to answer a given user query.
 *
 * - shouldSearchFlow: A Genkit flow that analyzes the user's query and decides
 *   if a web search is required, providing a suitable search query if so.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShouldSearchInputSchema = z.object({
  query: z.string().describe('The user query to analyze.'),
});

const ShouldSearchOutputSchema = z.object({
  needsSearch: z
    .boolean()
    .describe('Whether the query requires a web search.'),
  searchQuery: z
    .string()
    .describe('The search query to use if a search is needed.'),
  thinking: z
    .string()
    .describe('The AI reasoning behind the search decision.'),
});

const prompt = ai.definePrompt({
  name: 'shouldSearchPrompt',
  input: {schema: ShouldSearchInputSchema},
  output: {schema: ShouldSearchOutputSchema},
  prompt: `Analyze this user query: "{{query}}"

You need to determine if a web search is necessary to provide a comprehensive and up-to-date answer.

Consider the following:
- Is the query about a recent event or breaking news?
- Does the query ask for specific, real-time information (e.g., weather, stock prices, flight status)?
- Is the query about a topic where information changes frequently?
- Could the answer be significantly improved with the latest information from the web?

Based on your analysis, decide whether a search is needed.

- If a search is needed, set \`needsSearch\` to true and provide a concise, effective search query in \`searchQuery\`.
- If a search is not needed (e.g., it's a general knowledge question, a creative request, or a simple conversation), set \`needsSearch\` to false.
- In the \`thinking\` field, briefly explain your reasoning for your decision.`,
});

export const shouldSearchFlow = ai.defineFlow(
  {
    name: 'shouldSearchFlow',
    inputSchema: ShouldSearchInputSchema,
    outputSchema: ShouldSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
