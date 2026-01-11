'use server';

/**
 * @fileOverview AI flow to analyze scanned image data and identify potential health indicators.
 *
 * - analyzeScanData - Analyzes scanned image data to identify health indicators.
 * - AnalyzeScanDataInput - Input type for the analyzeScanData function.
 * - AnalyzeScanDataOutput - Output type for the analyzeScanData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeScanDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of the scanned area, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
  scanDescription: z
    .string()
    .describe('A description of the scan and any specific areas of concern.'),
});
export type AnalyzeScanDataInput = z.infer<typeof AnalyzeScanDataInputSchema>;

const HealthIndicatorSchema = z.object({
  indicator: z.string().describe('The name of the health indicator.'),
  confidence: z
    .number()
    .describe(
      'A numerical value between 0 and 1 indicating the confidence level of the identified indicator.'
    ),
  details: z.string().optional().describe('Additional details about the indicator.'),
});

const AnalyzeScanDataOutputSchema = z.object({
  healthIndicators: z
    .array(HealthIndicatorSchema)
    .describe('An array of identified health indicators and their confidence levels.'),
  summary: z.string().describe('A summary of the analysis results.'),
});
export type AnalyzeScanDataOutput = z.infer<typeof AnalyzeScanDataOutputSchema>;

export async function analyzeScanData(
  input: AnalyzeScanDataInput
): Promise<AnalyzeScanDataOutput> {
  return analyzeScanDataFlow(input);
}

const analyzeScanDataPrompt = ai.definePrompt({
  name: 'analyzeScanDataPrompt',
  input: {schema: AnalyzeScanDataInputSchema},
  output: {schema: AnalyzeScanDataOutputSchema},
  prompt: `You are an AI health analysis assistant. Analyze the provided scan data and description to identify potential health indicators. Correlate the information with medical knowledge to provide a preliminary health assessment.

Scan Description: {{{scanDescription}}}
Scanned Image: {{media url=photoDataUri}}

Based on the image and description, identify any potential health indicators and provide a confidence level for each. Provide a summary of your analysis.

Output the health indicators as a JSON array, where each object has "indicator", "confidence", and optional "details" fields.
`,
});

const analyzeScanDataFlow = ai.defineFlow(
  {
    name: 'analyzeScanDataFlow',
    inputSchema: AnalyzeScanDataInputSchema,
    outputSchema: AnalyzeScanDataOutputSchema,
  },
  async input => {
    const {output} = await analyzeScanDataPrompt(input);
    return output!;
  }
);
