'use server';

import {
  analyzeSymptomsAndSuggestConditions,
  type AnalyzeSymptomsAndSuggestConditionsOutput,
  type AnalyzeSymptomsAndSuggestConditionsInput,
} from '@/ai/flows/analyze-symptoms-and-suggest-conditions';
import { generateGreeting } from '@/ai/flows/generate-greeting';
import {
  recommendMedicationAndDosage,
  type RecommendMedicationAndDosageOutput,
} from '@/ai/flows/recommend-medication-and-dosage';
import {
  refineConditions,
  type RefineConditionsInput,
  type RefineConditionsOutput,
} from '@/ai/flows/refine-conditions';
import { type Language } from '@/context/language-context';

export async function getSuggestedConditions(
  input: Omit<AnalyzeSymptomsAndSuggestConditionsInput, 'language'>,
  language: Language
): Promise<AnalyzeSymptomsAndSuggestConditionsOutput> {
  if (!input.symptoms && !input.photoDataUri) {
    throw new Error('Please provide a description or a photo of your symptoms.');
  }
  
  try {
    const result = await analyzeSymptomsAndSuggestConditions({
      ...input,
      language,
    });
    return result;
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    throw new Error(
      'Failed to analyze symptoms due to a server error. Please try again.'
    );
  }
}

export async function getRefinedConditions(
  input: Omit<RefineConditionsInput, 'language'>,
  language: Language
): Promise<RefineConditionsOutput> {
  if (!input.symptoms || !input.followUpAnswers) {
    throw new Error('Missing original symptoms or follow-up answers.');
  }

  try {
    const conditions = await refineConditions({ ...input, language });
    return conditions;
  } catch (error) {
    console.error('Error refining conditions:', error);
    throw new Error(
      'Failed to refine conditions due to a server error. Please try again.'
    );
  }
}

export async function getGreeting(userInput: string, language: Language): Promise<string | null> {
    try {
        return await generateGreeting({ userInput, language });
    } catch (error) {
        console.error('Error generating greeting:', error);
        // Don't throw, just return null so it falls back to symptom analysis
        return null;
    }
}


// This function is no longer called from the UI, but we keep it for now.
export async function getMedicationSuggestion(
  condition: string,
  symptoms: string,
  language: Language
): Promise<RecommendMedicationAndDosageOutput> {
  if (!condition || !symptoms) {
    throw new Error('Condition and symptoms are required to suggest medication.');
  }
  try {
    const medication = await recommendMedicationAndDosage({
      condition,
      symptoms,
      language
    });
    return medication;
  } catch (error) {
    console.error('Error recommending medication:', error);
    throw new Error(
      'Failed to get a medication suggestion due to a server error. Please try again.'
    );
  }
}