import { tool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';

export const webSearch = tool({
  description: 'Search the web for up-to-date information',
  inputSchema: z.object({
    query: z.string().min(1).describe('The search query'),
  }),
  execute: async ({ query }) => {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      console.error('EXA_API_KEY is not set. Add it to .env.local to enable web search.');
      return { error: 'Web search is not configured. EXA_API_KEY is missing.' };
    }

    try {
      const exa = new Exa(apiKey);
      const { results } = await exa.search(query, {
        contents: {
          text: true,
        },
        numResults: 3,
      });

      return results.map(result => ({
        title: result.title,
        url: result.url,
        content: result.text?.slice(0, 1000) || '',
        publishedDate: result.publishedDate,
      }));
    } catch (error) {
      console.error('Error searching the web:', error);
      return { error: error instanceof Error ? error.message : 'Web search failed.' };
    }
  },
});