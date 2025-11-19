export const runtime = 'edge';

interface WebSearchRequest {
  query: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { query } = (await req.json()) as WebSearchRequest;

    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    // TODO: Implement web search functionality
    return new Response(
      JSON.stringify({ results: [], message: 'Web search not implemented yet' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Web Search API Error:', error);
    return new Response('Error processing web search request', { status: 500 });
  }
}

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query');

    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    // TODO: Implement web search functionality
    return new Response(
      JSON.stringify({ results: [], message: 'Web search not implemented yet' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Web Search API Error:', error);
    return new Response('Error processing web search request', { status: 500 });
  }
}
