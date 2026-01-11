'use server';
/**
 * @fileOverview This file defines a Genkit flow that correlates AI analysis with medical databases.
 *
 * It includes:
 * - `correlateWithMedicalDb`: The main function to trigger the correlation process.
 * - `CorrelationInput`: The input type for the correlation process.
 * - `CorrelationOutput`: The output type for the correlation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrelationInputSchema = z.object({
  analysisResults: z
    .string()
    .describe("The AI's analysis results from the scan, in text format."),
});
export type CorrelationInput = z.infer<typeof CorrelationInputSchema>;

const CorrelationOutputSchema = z.object({
  medicalInformation: z
    .string()
    .describe(
      'Relevant medical information correlated with the analysis results.'
    ),
});
export type CorrelationOutput = z.infer<typeof CorrelationOutputSchema>;

export async function correlateWithMedicalDb(
  input: CorrelationInput
): Promise<CorrelationOutput> {
  return correlateWithMedicalDbFlow(input);
}

const correlateWithMedicalDbPrompt = ai.definePrompt({
  name: 'correlateWithMedicalDbPrompt',
  input: {schema: CorrelationInputSchema},
  output: {schema: CorrelationOutputSchema},
  prompt: `You are a medical expert. Correlate the following AI analysis results with your knowledge and medical databases to provide relevant medical information. Be as detailed as possible.

Analysis Results: {{{analysisResults}}}`,
});

const correlateWithMedicalDbFlow = ai.defineFlow(
  {
    name: 'correlateWithMedicalDbFlow',
    inputSchema: CorrelationInputSchema,
    outputSchema: CorrelationOutputSchema,
  },
  async input => {
    const {output} = await correlateWithMedicalDbPrompt(input);
    return output!;
  }
);
