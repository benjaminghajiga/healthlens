
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
    } catch (error: any) {
        console.error("Error in performFullAnalysis:", error);
        if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) {
            throw new Error("The AI service is temporarily overloaded. Please wait a moment and try your scan again.");
        }
        if (error.message && error.message.includes('429')) {
             throw new Error("You've exceeded the usage quota for the AI service. Please check your plan details and try again later.");
        }
        throw new Error("Failed to perform full analysis. The AI model may be unavailable or experienced an issue. Please try again.");
    }
}
