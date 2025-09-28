'use server';

/**
 * @fileOverview Analyzes user-provided symptoms and generates follow-up questions.
 *
 * - analyzeSymptomsAndSuggestConditions - A function that analyzes symptoms and generates questions.
 * - AnalyzeSymptomsAndSuggestConditionsInput - The input type for the function.
 * - AnalyzeSymptomsAndSuggestConditionsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { LanguageSchema } from '@/context/language-context';

const AnalyzeSymptomsAndSuggestConditionsInputSchema = z.object({
  symptoms: z
    .string()
    .describe('A description of the symptoms experienced by the user.'),
  photoDataUri: z.string().optional().describe(
    "A photo of the user's symptoms, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),  
  language: LanguageSchema,
});
export type AnalyzeSymptomsAndSuggestConditionsInput = z.infer<
  typeof AnalyzeSymptomsAndSuggestConditionsInputSchema
>;

const AnalyzeSymptomsAndSuggestConditionsOutputSchema = z.object({
    followUpQuestions: z.array(z.string()).describe('A list of follow-up questions to ask the user to refine the diagnosis.')
});
export type AnalyzeSymptomsAndSuggestConditionsOutput = z.infer<
  typeof AnalyzeSymptomsAndSuggestConditionsOutputSchema
>;

export async function analyzeSymptomsAndSuggestConditions(
  input: AnalyzeSymptomsAndSuggestConditionsInput
): Promise<AnalyzeSymptomsAndSuggestConditionsOutput> {
  return analyzeSymptomsAndSuggestConditionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSymptomsAndSuggestConditionsPrompt',
  input: { schema: AnalyzeSymptomsAndSuggestConditionsInputSchema },
  output: { schema: AnalyzeSymptomsAndSuggestConditionsOutputSchema },
  prompt: `You are a caring and empathetic AI medical assistant. A user is feeling unwell and will describe their symptoms. Your primary goal is to show you understand and to help them figure things out.

Your response must be in the following language: {{{language}}}.

Start by acknowledging their symptoms with a caring tone (e.g., "I'm sorry to hear you're feeling this way."). Then, your task is to generate a list of 3-4 simple, gentle, and logical follow-up questions to ask the user. These questions should help differentiate between potential causes for the given symptoms. For example, if the user says "shortness of breath", you might ask if it occurred after exercise or at rest. 

Do NOT suggest any medical conditions or provide any diagnosis at this stage. Only ask caring questions.

Symptoms: {{{symptoms}}}
{{#if photoDataUri}}
Photo: {{media url=photoDataUri}}
{{/if}}
`,
});

const analyzeSymptomsAndSuggestConditionsFlow = ai.defineFlow(
  {
    name: 'analyzeSymptomsAndSuggestConditionsFlow',
    inputSchema: AnalyzeSymptomsAndSuggestConditionsInputSchema,
    outputSchema: AnalyzeSymptomsAndSuggestConditionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
