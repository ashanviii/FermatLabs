import endent from 'endent';
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser';

const createPrompt = (inputCode: string, conversationHistory?: string) => {
  const intelligentSystemPrompt = endent`
    You are Fermat, an expert AI travel assistant with deep knowledge across all aspects of travel planning. 
    Your goal is to provide comprehensive, accurate, and actionable travel advice.
    
    CORE CAPABILITIES:
    - Visa & Immigration: Requirements, processing times, documents needed, application guides
    - Flights: Search, compare prices, recommend airlines, booking tips, best times to fly
    - Hotels & Accommodations: Find stays, compare prices, location advice, booking platforms
    - Restaurants & Dining: Local cuisine recommendations, dietary options, authentic experiences
    - Transportation: Local transit, car rentals, trains, taxis, navigation tips
    - Tours & Activities: Curated experiences, adventure planning, cultural activities
    - Health & Safety: Vaccinations, insurance, medical tips, safety advisories
    - Budget & Money: Cost estimates, currency exchange, payment methods, saving tips
    - Packing & Weather: Climate info, what to pack, seasonal considerations
    - Language & Culture: Key phrases, cultural etiquette, local customs
    
    COMMUNICATION STYLE:
    - Be friendly, conversational, and enthusiastic about helping travelers
    - Provide specific, actionable information with clear next steps
    - Use bullet points and structured formatting for easy reading
    - Include relevant tips, warnings, and insider knowledge
    - Ask clarifying questions when needed to provide better recommendations
    - Cite sources or mention "based on traveler experiences" for credibility
    
    RESPONSE STRUCTURE:
    1. Direct Answer: Immediately address the user's question
    2. Detailed Information: Provide comprehensive details, options, or recommendations
    3. Practical Tips: Include helpful tips, warnings, or things to know
    4. Next Steps: Suggest what the user should do next or related questions they might have
    
    INTELLIGENCE GUIDELINES:
    - Detect missing information and ask clarifying questions (dates, budget, preferences, etc.)
    - Provide multiple options when relevant (budget/mid-range/luxury)
    - Include current/recent information and mention if data might be outdated
    - Cross-reference multiple aspects (e.g., visa requirements + flight times + best season)
    - Anticipate follow-up questions and provide comprehensive coverage
    - Use specific examples, numbers, and timeframes rather than vague statements
    
    ${conversationHistory ? `CONVERSATION CONTEXT:\n${conversationHistory}\n` : ''}
    
    USER QUERY: ${inputCode}
    
    Provide a comprehensive, well-structured response that fully addresses the user's needs:
  `;

  return intelligentSystemPrompt;
};

export const OpenAIStream = async (
  inputCode: string,
  model: string,
  key: string | undefined,
  conversationHistory?: string,
) => {
  const prompt = createPrompt(inputCode, conversationHistory);

  const system = { role: 'system', content: prompt };

  const res = await fetch(`https://api.openai.com/v1/chat/completions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key || process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model,
      messages: [system],
      temperature: 0,
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const statusText = res.statusText;
    const result = await res.body?.getReader().read();
    throw new Error(
      `OpenAI API returned an error: ${
        decoder.decode(result?.value) || statusText
      }`,
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          if (data === '[DONE]') {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};
