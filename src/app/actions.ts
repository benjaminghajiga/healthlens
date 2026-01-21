
'use server';

import { analyzeScanData, AnalyzeScanDataOutput } from '@/ai/flows/analyze-scan-data';
import { correlateWithMedicalDb, CorrelationOutput } from '@/ai/flows/correlate-with-medical-db';

export type FullAnalysisResult = {
    analysis: AnalyzeScanDataOutput;
    correlation: CorrelationOutput;
};

export type AnalysisResponse = {
    data?: FullAnalysisResult;
    error?: string;
};

export async function performFullAnalysis(
    photoDataUri: string,
    scanDescription: string
): Promise<AnalysisResponse> {
    if (!photoDataUri || !scanDescription) {
        return { error: "Photo data and description are required." };
    }

    try {
        const analysis = await analyzeScanData({ photoDataUri, scanDescription });
        
        if (!analysis || !analysis.summary) {
            return { error: 'AI analysis failed to produce a summary.'};
        }

        const correlation = await correlateWithMedicalDb({
            analysisResults: analysis.summary,
        });

        return { data: { analysis, correlation } };
    } catch (error: any) {
        if (error.message && (error.message.includes('API key') || error.message.toLowerCase().includes('permission denied'))) {
            return { error: "The AI service is not configured correctly. Please ensure your API key is set up correctly in your deployment environment." };
        }
        if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) {
            return { error: "The AI service is temporarily overloaded. Please wait a moment and try your scan again." };
        }
        if (error.message && error.message.includes('429')) {
             return { error: "You've exceeded the usage quota for the AI service. Please check your plan details and try again later." };
        }
        return { error: "Failed to perform full analysis. The AI model may be unavailable or experienced an issue. Please try again." };
    }
}
