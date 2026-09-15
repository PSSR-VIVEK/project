"use client"
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Server } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { HealthResponse } from '@/types/api';

export default function LandingPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const h = await api.checkHealth().catch(() => null);
        setHealth(h);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center space-y-6 pt-12 pb-8"
      >
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-primary/20 bg-primary/10 text-primary">
          <Server className="w-3 h-3 mr-2" />
          {health?.status === 'healthy' ? 'System Online & Ready' : 'Connecting to Backend...'}
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Multimodal Deep Learning <br />
          <span className="bg-gradient-to-r from-blue-500 to-primary bg-clip-text text-transparent">
            for Climate Extremes
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          An enterprise-grade AI prediction platform orchestrating CNNs, Transformers, and Cross-Attention Fusion to predict regional heat waves and flash floods.
        </p>
        
        <div className="flex gap-4 pt-4">
          <Link href="/predict" className="inline-flex items-center justify-center rounded-full shadow-lg h-10 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">
            Start Prediction <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link href="/architecture" className="inline-flex items-center justify-center rounded-full shadow-sm h-10 px-6 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
            Explore Architecture
          </Link>
        </div>
      </motion.section>


    </div>
  );
}
