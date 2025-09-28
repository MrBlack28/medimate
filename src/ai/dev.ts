'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/recommend-medication-and-dosage.ts';
import '@/ai/flows/analyze-symptoms-and-suggest-conditions.ts';
import '@/ai/flows/refine-conditions.ts';
import '@/ai/flows/generate-greeting.ts';
import '@/ai/tools/find-nearby-hospitals';
