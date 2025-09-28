'use server';
/**
 * @fileOverview Recommends over-the-counter medications and dosages for a given medical condition based on symptoms.
 *
 * - recommendMedicationAndDosage - A function that recommends medication and dosage.
 * - RecommendMedicationAndDosageInput - The input type for the recommendMedicationAndDosage function.
 * - RecommendMedicationAndDosageOutput - The return type for the recommendMedicationAndDosage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { LanguageSchema } from '@/context/language-context';

const RecommendMedicationAndDosageInputSchema = z.object({
  condition: z
    .string()
    .describe('The medical condition to find medication for.'),
  symptoms: z.string().describe('The symptoms the user is experiencing.'),
  language: LanguageSchema,
});
export type RecommendMedicationAndDosageInput = z.infer<
  typeof RecommendMedicationAndDosageInputSchema
>;

const RecommendMedicationAndDosageOutputSchema = z.object({
  precautions: z.string().describe('Key precautions or warnings for the condition. If no specific precautions are needed, state "N/A".'),
  reasoning: z
    .string()
    .describe(
      'A brief, one-sentence reason for the recommended precautions.'
    ),
});
export type RecommendMedicationAndDosageOutput = z.infer<
  typeof RecommendMedicationAndDosageOutputSchema
>;

export async function recommendMedicationAndDosage(
  input: RecommendMedicationAndDosageInput
): Promise<RecommendMedicationAndDosageOutput> {
  return recommendMedicationAndDosageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendMedicationAndDosagePrompt',
  input: { schema: RecommendMedicationAndDosageInputSchema },
  output: { schema: RecommendMedicationAndDosageOutputSchema },
  prompt: `You are a helpful AI assistant that provides precautions for a medical condition with a caring and cautious tone.

  Your response must be in the following language: {{{language}}}.

  Given the following medical condition and symptoms, recommend appropriate precautions.
  
  - Your reasoning should be one sentence and easy to understand.
  - Do NOT recommend any specific medication or dosage.
  - Frame the recommendation as a helpful suggestion, not a prescription.

  Condition: {{{condition}}}
  Symptoms: {{{symptoms}}}
  `,
});

const recommendMedicationAndDosageFlow = ai.defineFlow(
  {
    name: 'recommendMedicationAndDosageFlow',
    inputSchema: RecommendMedicationAndDosageInputSchema,
    outputSchema: RecommendMedicationAndDosageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
