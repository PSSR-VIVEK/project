"use client"
import { motion } from 'framer-motion';
import { Book, FileText, Code2, Link as LinkIcon, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DocsPage() {
  const sections = [
    {
      title: "Abstract",
      icon: Book,
      content: "This project introduces a multimodal deep learning framework designed to predict regional climate extremes, specifically flash floods and heat waves. By fusing satellite imagery (Sentinel-2, MODIS) with tabular climate data (ERA5), the system achieves higher predictive accuracy than unimodal approaches."
    },
    {
      title: "Data Sources",
      icon: Database,
      content: "1. Google Earth Engine (GEE): Used for extracting MODIS Land Surface Temperature (LST) and Sentinel-2 optical imagery.\n2. Copernicus Climate Data Store: Used for extracting ERA5 reanalysis data, including temperature, wind, and precipitation metrics."
    },
    {
      title: "Model Architecture",
      icon: Code2,
      content: "The framework utilizes a ResNet18 backbone for spatial feature extraction from GeoTIFF images, and a customized Transformer Encoder for processing tabular climate data. A Cross-Attention Fusion layer combines these representations to generate the final classification logits."
    },
    {
      title: "API Integration",
      icon: LinkIcon,
      content: "The backend is powered by FastAPI, exposing endpoints for inference (/predict-existing-event), model status (/models), and system health (/health). The Next.js frontend consumes these APIs to provide this real-time dashboard."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Documentation</h1>
        <p className="text-muted-foreground mt-1">Research context and technical specifications.</p>
      </div>

      <div className="grid gap-6">
        {sections.map((sec, idx) => (
          <motion.div 
            key={sec.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <sec.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{sec.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {sec.content}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <Card className="bg-primary/5 border-primary/20 mt-8">
        <CardContent className="p-6 flex items-start gap-4">
          <FileText className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h3 className="font-semibold text-lg mb-2">IEEE Research Paper</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The full methodology, hyperparameter configurations, and comparative analysis are detailed in the accompanying research paper.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
