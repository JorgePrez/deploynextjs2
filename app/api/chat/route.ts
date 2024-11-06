import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 60;
//anteriormente 300 segundos, pero vercel gratuito solo permita maximo 60 segundos
type LanguageModelV1 = any; 



export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o-mini") as unknown as LanguageModelV1,
    messages,
  });

  console.log(messages);

  return result.toAIStreamResponse();
}
