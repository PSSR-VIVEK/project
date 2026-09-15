"use client"
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Cpu, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { ModelsResponse } from '@/types/api';

export default function ModelsPage() {
  const [data, setData] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await api.getModels();
        setData(response);
      } catch (err) {
        setError("Failed to fetch models from backend.");
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        <XCircle className="w-6 h-6 mr-2" /> {error || "No data available"}
      </div>
    );
  }

  const models = [
    { name: "CNN Feature Extractor", file: data.loaded_models.find(m => m.includes("cnn")) || "Unknown", desc: "ResNet18 architecture extracting spatial features from Sentinel-2 & MODIS imagery." },
    { name: "Weather Transformer", file: data.loaded_models.find(m => m.includes("transformer")) || "Unknown", desc: "Transformer Encoder processing sequential ERA5 climate data." },
    { name: "Cross-Attention Fusion", file: data.loaded_models.find(m => m.includes("multimodal")) || "Unknown", desc: "Fuses image features and weather features to output probabilities." },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Loaded Models</h1>
        <p className="text-muted-foreground mt-1">Status of inference components in memory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur md:col-span-3 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">System Status</CardTitle>
              <CardDescription>Overall model manager health</CardDescription>
            </div>
            <Cpu className="w-6 h-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                {data.status}
              </Badge>
              <Badge variant="outline" className="bg-muted px-3 py-1">
                Device: {data.device.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {models.map((model, idx) => (
          <motion.div 
            key={model.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur h-full flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader>
                <BrainCircuit className="w-8 h-8 text-primary mb-2 opacity-80" />
                <CardTitle className="text-xl">{model.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {model.desc}
                </p>
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Checkpoint</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded truncate max-w-[150px]">{model.file}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="flex items-center text-emerald-500 font-medium text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Loaded
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
