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
  prompt: `You are a medical research expert. Your task is to correlate the provided AI analysis with established medical knowledge.

**Correlation Steps:**
1.  **Review Analysis:** Carefully read the AI's analysis summary and identified indicators.
2.  **Database Search:** Cross-reference the findings with your knowledge base of medical conditions, symptoms, and research.
3.  **Synthesize Information:** Provide detailed, relevant medical information that helps contextualize the AI's findings. Explain what the indicators might suggest, list potential (not definitive) associated conditions, and describe common next steps.
4.  **Emphasize Nuance:** Stress that correlation does not equal causation and that this information is for educational purposes only.

**IMPORTANT:** Do not provide a diagnosis. Your role is to provide context and information, not medical advice.

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
