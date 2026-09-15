"use client"
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, BrainCircuit } from 'lucide-react';


const PIPELINE_STAGES = [
  "Loading Models in Memory",
  "Preparing Input Data",
  "Extracting CNN Features (ResNet18)",
  "Preprocessing Weather Data",
  "Running Weather Transformer Encoder",
  "Running Cross Attention Fusion",
  "Generating Final Prediction"
];


export default function PredictPage() {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  const [validEvents, setValidEvents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.getEvents().then(res => {
      setValidEvents(res.event_ids || []);
    }).catch(console.error);
  }, []);

  const predictMutation = useMutation({
    mutationFn: api.predictExistingEvent
  });

  const runPrediction = async (eventId: string) => {
    setIsAnimating(true);
    setPredictionResult(null);
    setStageIndex(0);

    // Run animation and API call concurrently
    const animationPromise = (async () => {
      for (let i = 0; i < PIPELINE_STAGES.length; i++) {
        setStageIndex(i);
        await new Promise(r => setTimeout(r, 600));
      }
    })();

    const apiPromise = predictMutation.mutateAsync({ event_id: eventId }).catch(() => null);

    // Wait for both animation and API to finish
    const [, result] = await Promise.all([animationPromise, apiPromise]);
    setPredictionResult(result);
    setIsAnimating(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Prediction Engine</h1>
          <p className="text-muted-foreground mt-1">Run regional climate extreme predictions.</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Select Event</CardTitle>
                <CardDescription>Choose an existing historical event to demonstrate the architecture.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Search by ID</span>
                    <Badge variant="secondary">Available Events: {validEvents.length}</Badge>
                  </div>
                  <Input 
                    placeholder="e.g. FLASH_0154" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={selectedEvent} onValueChange={(val) => { if (val) setSelectedEvent(val); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select historical event ID" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {validEvents
                      .filter(ev => ev.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(ev => (
                        <SelectItem key={ev} value={ev}>{ev}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <Button 
                  disabled={!selectedEvent || isAnimating} 
                  onClick={() => runPrediction(selectedEvent)}
                  className="w-full"
                >
                  {isAnimating ? "Running Inference..." : "Predict Event"}
                </Button>
              </CardContent>
            </Card>

            <Card className="min-h-[350px] flex flex-col bg-card/50 backdrop-blur overflow-hidden relative">
              <CardHeader>
                <CardTitle>Inference Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                {!isAnimating && !predictionResult && (
                  <div className="text-center text-muted-foreground py-12">
                    <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Awaiting prediction request...</p>
                  </div>
                )}

                {isAnimating && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="space-y-6 py-8"
                  >
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-primary">{PIPELINE_STAGES[stageIndex]}</span>
                      <span>{Math.round(((stageIndex + 1) / PIPELINE_STAGES.length) * 100)}%</span>
                    </div>
                    <Progress value={((stageIndex + 1) / PIPELINE_STAGES.length) * 100} className="h-2 transition-all duration-500" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing tensors in memory...
                    </div>
                  </motion.div>
                )}

                {predictionResult && !isAnimating && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-background">Research Mode</Badge>
                        <h3 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                          {predictionResult['Predicted Class']}
                        </h3>
                      </div>
                      <Badge variant={predictionResult['Predicted Class'] === 'FLASH' ? 'destructive' : 'default'} className="text-sm px-3 py-1 shadow-sm">
                        Conf. {Math.round(predictionResult['Confidence'] * 100)}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-background/50 rounded-xl border border-border/50">
                        <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide">FLASH PROBABILITY</div>
                        <div className="text-2xl font-semibold">{(predictionResult['FLASH Probability'] * 100).toFixed(1)}%</div>
                      </div>
                      <div className="p-4 bg-background/50 rounded-xl border border-border/50">
                        <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide">HEAT PROBABILITY</div>
                        <div className="text-2xl font-semibold">{(predictionResult['HEAT Probability'] * 100).toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-4 mt-2">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Pipeline Complete
                      </div>
                      <div className="font-mono bg-muted px-2 py-1 rounded">Time: {predictionResult['Inference Time']}</div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
