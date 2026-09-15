"use client"
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Target, Crosshair, BarChart, Loader2, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/services/api';
import { MetricsResponse } from '@/types/api';

export default function MetricsPage() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await api.getMetrics();
        setData(response);
      } catch (err) {
        setError("Failed to fetch metrics from backend.");
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
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

  const metricsList = [
    { name: "Accuracy", value: data.accuracy, icon: Target, desc: "Overall correct predictions" },
    { name: "F1 Score", value: data.f1_score, icon: Activity, desc: "Harmonic mean of precision/recall" },
    { name: "Precision", value: data.precision, icon: Crosshair, desc: "True positives over predicted positives" },
    { name: "Recall", value: data.recall, icon: BarChart, desc: "True positives over actual positives" }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Metrics</h1>
        <p className="text-muted-foreground mt-1">Validation metrics from the multimodal training phase.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsList.map((m, idx) => (
          <motion.div 
            key={m.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{m.name}</CardTitle>
                <m.icon className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-extrabold tracking-tight">
                  {(m.value * 100).toFixed(1)}%
                </div>
                <Progress value={m.value * 100} className="h-2 bg-muted/50" />
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="bg-card/50 backdrop-blur border-dashed border-2 border-border min-h-[300px] flex flex-col items-center justify-center text-muted-foreground opacity-70">
          <BarChart className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-medium">ROC Curve</p>
          <p className="text-sm mt-1">Not available from current backend</p>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-dashed border-2 border-border min-h-[300px] flex flex-col items-center justify-center text-muted-foreground opacity-70">
          <Activity className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-medium">Confusion Matrix</p>
          <p className="text-sm mt-1">Not available from current backend</p>
        </Card>
      </div>
    </div>
  );
}
