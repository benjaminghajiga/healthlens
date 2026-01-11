
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
        // Ensure the data URI is correctly formatted. It should be 'data:image/jpeg;base64,....'
        // The error indicates we are sometimes just getting 'data:,' or similar.
        // Let's grab only the base64 part.
        const base64Data = photoDataUri.split(',')[1];
        if (!base64Data) {
            throw new Error("Invalid image data provided.");
        }

        const correctedPhotoDataUri = `data:image/jpeg;base64,${base64Data}`;
        
        const analysis = await analyzeScanData({ photoDataUri: correctedPhotoDataUri, scanDescription });
        
        if (!analysis || !analysis.summary) {
            throw new Error('AI analysis failed to produce a summary.');
        }

        const correlation = await correlateWithMedicalDb({
            analysisResults: analysis.summary,
        });

        return { analysis, correlation };
    } catch (error: any) {
        console.error("Error in performFullAnalysis:", error);
        throw new Error(error.message || "Failed to perform full analysis. The AI model may be unavailable or experienced an issue. Please try again.");
    }
}
