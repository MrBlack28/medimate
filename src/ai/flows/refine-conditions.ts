'use server';

/**
 * @fileOverview Refines the list of possible medical conditions based on user answers to follow-up questions.
 *
 * - refineConditions - A function that refines the diagnosis.
 * - RefineConditionsInput - The input type for the refineConditions function.
 * - RefineConditionsOutput - The return type for the refineConditions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { recommendMedicationAndDosage, RecommendMedicationAndDosageOutput } from './recommend-medication-and-dosage';
import { LanguageSchema } from '@/context/language-context';
import { findNearbyHospitals, type NearbyHospital } from '../tools/find-nearby-hospitals';

const RefineConditionsInputSchema = z.object({
  symptoms: z.string().describe('The original symptoms provided by the user.'),
  photoDataUri: z.string().optional().describe(
    "A photo of the user's symptoms, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  followUpAnswers: z
    .string()
    .describe("The user's answers to the follow-up questions."),
  language: LanguageSchema,
  latitude: z.number().optional().describe("The user's latitude for location-based searches."),
  longitude: z.number().optional().describe("The user's longitude for location-based searches."),
});
export type RefineConditionsInput = z.infer<typeof RefineConditionsInputSchema>;

const HospitalSchema = z.object({
  name: z.string().describe('The name of the hospital.'),
  address: z.string().describe('The full address of the hospital.'),
  phone: z.string().optional().describe('The contact phone number of the hospital.'),
});

const PossibleConditionSchema = z.object({
  conditionName: z
    .string()
    .describe('The name of the possible medical condition.'),
  description: z
    .string()
    .describe('A brief, one-line description of the medical condition.'),
  isEmergency: z
    .boolean()
    .describe(
      'A boolean value indicating whether the condition requires immediate medical attention.'
    ),
  medication: z.custom<RecommendMedicationAndDosageOutput>().nullable(),
  nearbyHospitals: z.array(HospitalSchema).optional().describe('A list of nearby hospitals if the condition is an emergency.'),
});

const RefineConditionsOutputSchema = z.array(PossibleConditionSchema);
export type RefineConditionsOutput = z.infer<
  typeof RefineConditionsOutputSchema
>;

export async function refineConditions(
  input: RefineConditionsInput
): Promise<RefineConditionsOutput> {
  return refineConditionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineConditionsPrompt',
  input: { schema: RefineConditionsInputSchema },
  output: { schema: z.array(PossibleConditionSchema.omit({ medication: true, nearbyHospitals: true })) },
  prompt: `You are a caring and empathetic AI medical assistant. A user has provided symptoms and answered some follow-up questions. Your goal is to provide helpful, cautious, and easy-to-understand information.

Your response must be in the following language: {{{language}}}.

Based on the original symptoms and the answers to the follow-up questions, provide a refined, small list (2-3) of the most likely medical conditions. 
- For each condition, provide a simple, one-line description and clearly state if it's an emergency.
- Be cautious. Conditions like COVID-19 or any illness involving significant breathing difficulty should be treated as a potential emergency.
- If the answers strongly suggest an emergency, prioritize that. For example, if a user with a headache mentions the "worst pain of my life," that is a key indicator of an emergency.
- Phrase your response gently. Start with something like "Thank you for sharing that. Based on what you've told me, here are a couple of possibilities..."

Original Symptoms: {{{symptoms}}}
{{#if photoDataUri}}
Photo: {{media url=photoDataUri}}
{{/if}}
Follow-up Answers: {{{followUpAnswers}}}
`,
});

const refineConditionsFlow = ai.defineFlow(
  {
    name: 'refineConditionsFlow',
    inputSchema: RefineConditionsInputSchema,
    outputSchema: RefineConditionsOutputSchema,
  },
  async (input) => {
    const { output: conditions } = await prompt(input);
    if (!conditions) return [];

    const isEmergency = conditions.some((condition) => condition.isEmergency);
    let hospitals: NearbyHospital[] | undefined = undefined;

    if (isEmergency && input.latitude && input.longitude) {
      try {
        hospitals = await findNearbyHospitals({ latitude: input.latitude, longitude: input.longitude, language: input.language });
      } catch (error) {
        console.error('Error finding nearby hospitals:', error);
      }
    }

    const conditionsWithDetails = await Promise.all(
      conditions.map(async (condition) => {
        let medication: RecommendMedicationAndDosageOutput | null = null;
        try {
          medication = await recommendMedicationAndDosage({
            condition: condition.conditionName,
            symptoms: input.symptoms || 'Visual symptoms',
            language: input.language,
          });
        } catch (error) {
          console.error(
            `Error getting medication for ${condition.conditionName}:`,
            error
          );
        }
        
        return { 
          ...condition, 
          medication,
          nearbyHospitals: condition.isEmergency ? hospitals : undefined,
        };
      })
    );
      return conditionsWithDetails;
  }
);
