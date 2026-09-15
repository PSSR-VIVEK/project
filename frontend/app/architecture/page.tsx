"use client"
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, ArrowDown, Database, BrainCircuit, Activity, Eye, PlayCircle, Loader2, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { api } from '@/services/api';
import { PipelineResponse, ArchitectureResponse } from '@/types/api';

export default function ArchitecturePage() {
  const [arch, setArch] = useState<ArchitectureResponse | null>(null);
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [a, p] = await Promise.all([
          api.getArchitecture(),
          api.getPipeline()
        ]);
        setArch(a);
        setPipeline(p);
      } catch (err) {
        setError("Failed to fetch architecture data from backend.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !pipeline || !arch) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        <XCircle className="w-6 h-6 mr-2" /> {error || "No data available"}
      </div>
    );
  }

  const icons = [Eye, BrainCircuit, Database, Activity, GitBranch, PlayCircle];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight">System Architecture</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{arch.project}</p>
        <p className="text-xs text-primary mt-2 font-mono">{arch.execution_order}</p>
      </div>

      <div className="flex flex-col items-center space-y-2 relative">
        {pipeline.pipeline_stages.map((stage, idx) => {
          const Icon = icons[idx % icons.length];
          return (
            <motion.div 
              key={stage}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="w-full max-w-lg"
            >
              <Card className="bg-card/80 backdrop-blur border-primary/20 shadow-md shadow-primary/5 hover:border-primary/60 transition-colors z-10 relative">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{stage}</h3>
                    <p className="text-sm text-muted-foreground">
                      {idx === 0 && "Sentinel-2 & MODIS GeoTIFF"}
                      {idx === 1 && "ResNet18 Feature Extractor"}
                      {idx === 2 && "ERA5 Preprocessing (Standardization)"}
                      {idx === 3 && "Transformer Encoder"}
                      {idx === 4 && "Multihead Attention Fusion"}
                      {idx === 5 && "Final Linear Layer (Flash/Heat)"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {idx < pipeline.pipeline_stages.length - 1 && (
                <div className="flex justify-center my-2">
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: idx * 0.2 + 0.1, duration: 0.3 }}
                  >
                    <ArrowDown className="w-6 h-6 text-primary/50 animate-pulse" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
