
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, ScanLine, FileWarning, RotateCcw, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { performFullAnalysis, type FullAnalysisResult } from '@/app/actions';

type AppState = 'idle' | 'scanning' | 'analyzing' | 'results' | 'error';

const formSchema = z.object({
  scanDescription: z.string().min(10, 'Please provide a more detailed description (at least 10 characters).'),
});

export function HealthLensApp() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [analysisResult, setAnalysisResult] = useState<FullAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { scanDescription: '' },
  });

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Camera access is required to perform a scan. Please enable camera permissions in your browser settings.');
      setAppState('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    if (appState === 'scanning' && !stream) {
      startCamera();
    } else if (appState !== 'scanning' && stream) {
      stopCamera();
    }

    return () => {
      if (stream) {
        stopCamera();
      }
    };
  }, [appState, stream, startCamera, stopCamera]);

  const handleStartScan = () => {
    setAppState('scanning');
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Camera component not ready. Please try again.',
      });
      return;
    }

    setAppState('analyzing');
    stopCamera();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if(context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoDataUri = canvas.toDataURL('image/jpeg');

        try {
            const result = await performFullAnalysis(photoDataUri, values.scanDescription);
            setAnalysisResult(result);
            setAppState('results');
        } catch (e: any) {
            console.error('Analysis failed:', e);
            setError(e.message || 'An unknown error occurred during analysis.');
            setAppState('error');
        }
    }
  };

  const handleReset = () => {
    stopCamera();
    setAnalysisResult(null);
    setError(null);
    form.reset();
    setAppState('idle');
  };

  const renderContent = () => {
    switch (appState) {
      case 'idle':
        return (
          <Card className="w-full max-w-2xl text-center shadow-2xl">
            <CardHeader>
              <div className="mx-auto mb-4">
                <Logo />
              </div>
              <CardTitle className="text-3xl font-bold">Your Personal Health Scanner</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Use your camera to scan for potential health indicators.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={handleStartScan}>
                <Camera className="mr-2 h-5 w-5" />
                Start Scan
              </Button>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p>This is not a medical device. Consult a healthcare professional for advice.</p>
                </div>
            </CardFooter>
          </Card>
        );

      case 'scanning':
        return (
          <Card className="w-full max-w-4xl shadow-2xl">
            <CardHeader>
              <CardTitle>Live Scan</CardTitle>
              <CardDescription>Position the area you want to scan in front of the camera.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-lg border bg-secondary">
                <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="scanDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What are we scanning?</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., 'A mole on my left arm that seems to have changed shape.'" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleReset}>Cancel</Button>
                    <Button type="submit" variant="accent">
                        <ScanLine className="mr-2 h-5 w-5" />
                        Analyze
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        );

      case 'analyzing':
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="relative h-24 w-24">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20"></div>
                    <div className="absolute inset-2 animate-pulse rounded-full bg-primary/40 [animation-delay:0.2s]"></div>
                    <div className="absolute inset-4 flex items-center justify-center rounded-full bg-primary">
                        <ScanLine className="h-10 w-10 text-primary-foreground" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">Analyzing...</h2>
                <p className="text-muted-foreground">Our AI is analyzing your scan. This may take a moment.</p>
            </div>
        );

      case 'results':
        return (
          <div className="w-full max-w-4xl space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold">Analysis Complete</h1>
              <p className="text-muted-foreground">Here are the results from your scan.</p>
            </div>
            {analysisResult?.analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{analysisResult.analysis.summary}</p>
                </CardContent>
              </Card>
            )}
            {analysisResult?.analysis?.healthIndicators && analysisResult.analysis.healthIndicators.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Potential Health Indicators</CardTitle>
                  <CardDescription>These are potential indicators identified by the AI. Confidence levels are shown below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisResult.analysis.healthIndicators.map((item, index) => (
                    <div key={index}>
                      <div className="mb-1 flex justify-between">
                        <h3 className="font-semibold">{item.indicator}</h3>
                        <span className="text-sm font-medium text-muted-foreground">
                          {Math.round(item.confidence * 100)}% Confidence
                        </span>
                      </div>
                      <Progress value={item.confidence * 100} />
                      {item.details && <p className="mt-2 text-sm text-muted-foreground">{item.details}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {analysisResult?.correlation && (
                <Card>
                    <CardHeader>
                        <CardTitle>Correlated Medical Information</CardTitle>
                        <CardDescription>This information is for educational purposes only.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{analysisResult.correlation.medicalInformation}</p>
                    </CardContent>
                </Card>
            )}
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <AlertTriangle className="h-6 w-6 flex-shrink-0 text-amber-500" />
                <div className="flex flex-col">
                    <CardTitle className="text-amber-700 dark:text-amber-400">Important Disclaimer</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-amber-800 dark:text-amber-300">
                <p>HealthLens provides AI-generated information for educational purposes and is not a substitute for professional medical diagnosis or advice. Always consult with a qualified healthcare provider for any health concerns.</p>
              </CardContent>
            </Card>
            <div className="text-center">
              <Button size="lg" onClick={handleReset}>
                <RotateCcw className="mr-2 h-5 w-5" />
                Scan Again
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <FileWarning className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>An Error Occurred</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleReset}>
                <RotateCcw className="mr-2 h-5 w-5" />
                Try Again
              </Button>
            </CardFooter>
          </Card>
        );
    }
  };

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center">
        {renderContent()}
    </div>
  );
}
