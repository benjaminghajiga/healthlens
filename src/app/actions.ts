
'use server';

import { analyzeScanData, AnalyzeScanDataOutput } from '@/ai/flows/analyze-scan-data';
import { correlateWithMedicalDb, CorrelationOutput } from '@/ai/flows/correlate-with-medical-db';

export type FullAnalysisResult = {
    analysis: AnalyzeScanDataOutput;
    correlation: CorrelationOutput;
};

export async function performFullAnalysis(
    photoDataUri: string,
    scanDescription: string
): Promise<FullAnalysisResult> {
    if (!photoDataUri || !scanDescription) {
        throw new Error("Photo data and description are required.");
    }

    try {
        const analysis = await analyzeScanData({ photoDataUri, scanDescription });
        
        if (!analysis || !analysis.summary) {
            throw new Error('AI analysis failed to produce a summary.');
        }

        const correlation = await correlateWithMedicalDb({
            analysisResults: analysis.summary,
        });

        return { analysis, correlation };
    } catch (error) {
        console.error("Error in performFullAnalysis:", error);
        throw new Error("Failed to perform full analysis. The AI model may be unavailable or experienced an issue. Please try again.");
    }
}
