'use server';
/**
 * @fileOverview A tool to find nearby hospitals using a user's location.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { LanguageSchema } from '@/context/language-context';

const HospitalSchema = z.object({
  name: z.string().describe('The name of the hospital.'),
  address: z.string().describe('The full address of the hospital.'),
  phone: z.string().optional().describe('The contact phone number of the hospital.'),
});

export type NearbyHospital = z.infer<typeof HospitalSchema>;

const FindNearbyHospitalsInputSchema = z.object({
  latitude: z.number().describe("The user's current latitude."),
  longitude: z.number().describe("The user's current longitude."),
  language: LanguageSchema,
});

const FindNearbyHospitalsOutputSchema = z.array(HospitalSchema);


export async function findNearbyHospitals(input: z.infer<typeof FindNearbyHospitalsInputSchema>): Promise<NearbyHospital[]> {
    // In a real application, you would use an API like Google Maps Platform's Places API.
    // For this prototype, we will use a powerful model to search for this data.
    const { text } = await ai.generate({
      prompt: `Find 3 real hospitals near latitude ${input.latitude} and longitude ${input.longitude}. Provide their name, full address, and phone number. Your response must be in ${input.language}.`,
      output: {
        format: 'json',
        schema: FindNearbyHospitalsOutputSchema,
      },
      model: 'googleai/gemini-2.5-pro',
    });
    
    try {
        const parsedOutput = JSON.parse(text) as NearbyHospital[];
        return parsedOutput || [];
    } catch(e) {
        console.error("Could not parse hospital data from model", e);
        return [];
    }
}
