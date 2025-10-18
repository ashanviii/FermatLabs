// Remove edge runtime for localhost compatibility
// export const runtime = 'edge';

interface RedditRAGRequest {
  query: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { query } = (await req.json()) as RedditRAGRequest;

    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    // Your Reddit RAG API configuration
    const REDDIT_RAG_API_URL = 'http://localhost:8000';
    const endpoint = '/query';
    
    // Make request to your Reddit RAG API with the correct parameter name 'q'
    const response = await fetch(`${REDDIT_RAG_API_URL}${endpoint}?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit RAG API error: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Reddit RAG API Error:', error);
    return new Response('Error processing Reddit RAG request', { status: 500 });
  }
}

export async function GET(req: Request): Promise<Response> {
  try {
    console.log('Reddit RAG API route called');
    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    console.log('Query parameter received:', query);

    if (!query) {
      return new Response('Query parameter is required', { status: 400 });
    }

    // Your Reddit RAG API configuration
    const REDDIT_RAG_API_URL = 'http://localhost:8000';
    const endpoint = '/query';
    const fullUrl = `${REDDIT_RAG_API_URL}${endpoint}?q=${encodeURIComponent(query)}`;
    
    console.log('Making request to:', fullUrl);
    
    // Make request to your Reddit RAG API with the correct parameter name 'q'
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      throw new Error(`Reddit RAG API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Backend response data:', data);
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Reddit RAG API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}