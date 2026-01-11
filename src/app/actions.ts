
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
        // Ensure the data URI has the correct MIME type prefix
        const correctedPhotoDataUri = photoDataUri.startsWith('data:image/jpeg;base64,')
            ? photoDataUri
            : `data:image/jpeg;base64,${photoDataUri.split(',')[1] || photoDataUri}`;
        
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
