import { Pinecone } from '@pinecone-database/pinecone';
import { PINECONE_TOP_K, PINECONE_INDEX_NAME } from '@/config';
import { searchResultsToChunks, getSourcesFromChunks, getContextFromSources } from '@/lib/sources';

function getPineconeClient() {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
        throw new Error('PINECONE_API_KEY is not set. Add it to .env.local to enable vector search.');
    }
    return new Pinecone({ apiKey });
}

export async function searchPinecone(
    query: string,
): Promise<string> {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
        console.error('PINECONE_API_KEY is not set. Add it to .env.local to enable vector search.');
        return '< results > Vector search is not configured. PINECONE_API_KEY is missing.</results>';
    }

    const pinecone = getPineconeClient();
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    try {
        const results = await index.namespace('default').searchRecords({
            query: {
                inputs: {
                    text: query,
                },
                topK: PINECONE_TOP_K,
            },
            fields: ['text', 'pre_context', 'post_context', 'source_url', 'source_description', 'source_type', 'order'],
        });

        const chunks = searchResultsToChunks(results);
        const sources = getSourcesFromChunks(chunks);
        const context = getContextFromSources(sources);
        return `< results > ${context} </results>`;
    } catch (error) {
        console.error('Pinecone search error:', error);
        return `< results > Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}.</results>`;
    }
}