'use server';

/**
 * @fileOverview Generates a conversational greeting.
 * - generateGreeting - A function that returns a greeting.
 * - GenerateGreetingInput - The input type for the generateGreeting function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { LanguageSchema } from '@/context/language-context';

const GreetingInputSchema = z.object({
  userInput: z.string().describe('The user\'s input text.'),
  language: LanguageSchema,
});
export type GenerateGreetingInput = z.infer<typeof GreetingInputSchema>;

const GreetingResponseSchema = z.object({
  isGreeting: z
    .boolean()
    .describe('Whether the user input is a greeting.'),
  response: z
    .string()
    .describe('The response to the greeting.'),
});

export async function generateGreeting(
  input: GenerateGreetingInput
): Promise<string | null> {
  const { output } = await greetingPrompt(input);
  if (output?.isGreeting) {
    return output.response;
  }
  return null;
}

const greetingPrompt = ai.definePrompt({
  name: 'greetingPrompt',
  input: { schema: GreetingInputSchema },
  output: { schema: GreetingResponseSchema },
  prompt: `You are a friendly, caring, and empathetic AI medical assistant. Your goal is to make the user feel comfortable.

  Your response must be in the following language: {{{language}}}.
  
  Determine if the user's input is a simple greeting (like "hello", "hi", etc.).

  If it is a greeting, set isGreeting to true and provide a warm, friendly, one-sentence response that feels human. Also, gently ask how you can help them today.

  If it is not a greeting, set isGreeting to false and response to an empty string.

  User Input: {{{userInput}}}`,
});
