"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Image as ImageIcon, CloudRain, BrainCircuit, Network, Zap,
  Settings, Fingerprint, PlayCircle, Mic, CheckCircle2,
  Loader2, Sparkles, HelpCircle, Clock, Cpu, FileText,
  ChevronRight, MessageSquare, Lightbulb, RotateCcw, Square,
  ArrowRight, Layers, BookOpen
} from 'lucide-react';

/* ================================================================
   DATA: PIPELINE NODES
   ================================================================ */
const PIPELINE_NODES = [
  {
    id: 'satellite', title: 'Satellite Imagery', subtitle: 'Sentinel-2 Multispectral',
    icon: ImageIcon, dimension: '4-ch',
    purpose: 'Provide raw optical/multispectral data for visual feature extraction.',
    input: 'GeoTIFF / HDF5', inputDetail: '4 spectral channels (RGB + NIR)',
    output: 'Raw Pixel Tensor', outputDetail: '4 × 224 × 224',
    tensorShape: 'B × 4 × 224 × 224', notebook: '05C_CNN_Feature_Extraction.ipynb',
    module: 'ml_pipeline.cnn.feature_extraction', csvFile: 'image_metadata.csv',
    model: 'None (Raw Input)', whyExists: 'Satellite imagery captures spatial and geographic patterns like vegetation, terrain, and urban areas that are critical indicators of climate vulnerability.',
    description: 'Historical satellite images collected from Sentinel-2. In the production pipeline, this represents the raw data input stage.'
  },
  {
    id: 'cnn', title: 'CNN Encoder', subtitle: 'ResNet18 (Modified)',
    icon: Network, dimension: '512D',
    purpose: 'Extract high-level spatial features from raw satellite imagery.',
    input: '4-Channel Image Tensor', inputDetail: '4 × 224 × 224 pixels',
    output: '512D Image Embedding', outputDetail: 'Dense feature vector',
    tensorShape: 'B × 512', notebook: '05C_CNN_Feature_Extraction.ipynb',
    module: 'CNNFeatureExtractor', csvFile: 'cnn_features.csv',
    model: 'ResNet18 (Modified 4-channel input)', whyExists: 'CNNs excel at hierarchical spatial feature extraction. ResNet18 provides an optimal balance between depth and computational efficiency for satellite image encoding.',
    description: 'A customized ResNet18 trained via federated learning. Drops the final classifier to output a pure 512-dimensional embedding vector.'
  },
  {
    id: 'weather', title: 'Weather Features', subtitle: 'ERA5 + MODIS',
    icon: CloudRain, dimension: '8-feat',
    purpose: 'Provide temporal meteorological variables like temperature, precipitation, and land surface temperature.',
    input: 'CSV / NetCDF', inputDetail: 'ERA5 reanalysis + MODIS LST',
    output: 'Scaled Feature Vector', outputDetail: '8 weather variables',
    tensorShape: 'B × 8', notebook: '07_Data_Preprocessing.ipynb',
    module: 'PreprocessingManager', csvFile: 'era5_features.csv, modis_features.csv',
    model: 'SimpleImputer + StandardScaler', whyExists: 'Weather variables capture the temporal and atmospheric conditions that directly drive climate extremes. Preprocessing ensures consistent scale across all features.',
    description: 'Combines ERA5 climate reanalysis (temperature, pressure, wind, precipitation) and MODIS land surface data. Handles missing values with median imputation and scales all features.'
  },
  {
    id: 'transformer', title: 'Weather Transformer', subtitle: 'Transformer Encoder',
    icon: Settings, dimension: '512D',
    purpose: 'Capture complex temporal relationships between weather variables using self-attention.',
    input: '8 Weather Features', inputDetail: 'Imputed & scaled floats',
    output: '512D Weather Embedding', outputDetail: 'Contextual representation',
    tensorShape: 'B × 512', notebook: '08_Transformer_Encoder.ipynb',
    module: 'WeatherTransformerEncoder', csvFile: 'transformer_features.csv',
    model: 'nn.TransformerEncoder', whyExists: 'Transformers use self-attention to model complex inter-variable dependencies in weather data, capturing relationships that traditional methods miss.',
    description: 'Projects the 8-dimensional weather vector into a 512-dimensional embedding space matching the CNN output, using multi-head self-attention to learn inter-variable relationships.'
  },
  {
    id: 'fusion', title: 'Cross Attention Fusion', subtitle: 'MultiheadAttention',
    icon: Fingerprint, dimension: '512D',
    purpose: 'Fuse visual spatial features with meteorological temporal features through cross-modal attention.',
    input: '512D Image + 512D Weather', inputDetail: 'Two embedding vectors',
    output: '512D Fused Representation', outputDetail: 'Multimodal vector',
    tensorShape: 'B × 512', notebook: '09_Cross_Attention_Fusion_v2.ipynb',
    module: 'MultimodalPredictor', csvFile: 'None (in-memory)',
    model: 'nn.MultiheadAttention (8 heads)', whyExists: 'This is the core research contribution. Cross Attention dynamically weights the importance of weather signals based on local geography, enabling the model to learn which weather features matter most for each location.',
    description: 'The core novelty of the research. Uses image embeddings as queries and weather embeddings as keys/values to dynamically weight feature importance across modalities.'
  },
  {
    id: 'prediction', title: 'Final Classification', subtitle: 'Linear Classifier',
    icon: Zap, dimension: '2-cls',
    purpose: 'Predict the extreme climate event category with confidence scores.',
    input: '512D Fused Vector', inputDetail: 'Multimodal representation',
    output: 'FLASH or HEAT', outputDetail: 'Probabilities + confidence',
    tensorShape: 'B × 2', notebook: '11_Model_Inference.ipynb',
    module: 'MultimodalPredictor', csvFile: 'None (real-time output)',
    model: 'Linear(512→256→2) + Dropout', whyExists: 'The final classification layer maps the fused multimodal representation to event probabilities, providing both the predicted class and a calibrated confidence score.',
    description: 'Passes the fused representation through a dropout layer and a final linear layer to predict whether the event is a FLASH flood or a HEAT wave.'
  }
];

/* ================================================================
   DATA: PRESENTATION SCRIPTS
   ================================================================ */
const PRESENTATION_SCRIPTS = [
  {
    stageId: 'satellite', stageName: 'Satellite Imagery',
    whatToSay: 'Satellite imagery is first provided to the CNN encoder. The image contains four spectral channels extracted from Sentinel-2, capturing visible light and near-infrared bands that reveal terrain, vegetation, and surface characteristics.',
    keyPoints: ['Sentinel-2 multispectral data', '4 spectral channels (RGB + NIR)', 'Captures spatial geography'],
    judgeQuestion: 'Why use satellite imagery for climate prediction?',
    suggestedAnswer: 'Satellite imagery captures critical spatial indicators like vegetation density, urban heat islands, and flood-prone terrain that significantly improve prediction accuracy over weather data alone.',
    duration: 4
  },
  {
    stageId: 'cnn', stageName: 'CNN Encoder',
    whatToSay: 'The CNN extracts deep spatial representations from the satellite image and converts them into a compact 512-dimensional feature vector. We use a modified ResNet18 architecture with 4-channel input support.',
    keyPoints: ['Spatial feature extraction', 'ResNet18 backbone', '512D embedding output'],
    judgeQuestion: 'Why did you choose CNN?',
    suggestedAnswer: 'CNNs are highly effective for extracting spatial information from satellite imagery while maintaining computational efficiency. ResNet18 provides excellent feature extraction with skip connections that prevent gradient degradation.',
    duration: 5
  },
  {
    stageId: 'weather', stageName: 'Weather Features',
    whatToSay: 'ERA5 climate variables together with MODIS surface temperature features are collected and prepared for sequential encoding. The preprocessing pipeline handles missing values and normalizes all features.',
    keyPoints: ['ERA5 climate reanalysis data', 'MODIS land surface temperature', '8 weather variables preprocessed'],
    judgeQuestion: 'How do you handle missing weather data?',
    suggestedAnswer: 'We use median imputation via SimpleImputer for missing values, followed by StandardScaler normalization. This ensures robust handling of incomplete ERA5 and MODIS records.',
    duration: 4
  },
  {
    stageId: 'transformer', stageName: 'Weather Transformer',
    whatToSay: 'The Transformer learns complex relationships between weather variables using self-attention and produces a contextual 512-dimensional embedding that captures inter-variable dependencies.',
    keyPoints: ['Self-attention mechanism', 'Temporal relationship learning', '512D weather embedding'],
    judgeQuestion: 'Why not use LSTM?',
    suggestedAnswer: 'Transformers model long-range dependencies more efficiently and allow better parallel computation than LSTMs. Self-attention captures all pairwise variable interactions simultaneously.',
    duration: 5
  },
  {
    stageId: 'fusion', stageName: 'Cross Attention Fusion',
    whatToSay: 'This is the core contribution of our research. Cross Attention combines image features and weather features by allowing each modality to attend to the other, producing a unified multimodal representation.',
    keyPoints: ['Core research contribution', 'Cross-modal attention mechanism', 'Dynamic feature weighting'],
    judgeQuestion: 'What is the advantage of Cross Attention?',
    suggestedAnswer: 'Cross Attention captures complementary information between satellite imagery and weather data more effectively than simple concatenation. It dynamically weights which weather signals matter most based on local geography.',
    duration: 6
  },
  {
    stageId: 'prediction', stageName: 'Final Classification',
    whatToSay: 'The fused representation is passed through the classifier which predicts whether the event is a Heat Wave or Flash Flood. The confidence score and inference time demonstrate both prediction reliability and computational efficiency.',
    keyPoints: ['Binary classification', 'Confidence calibration', 'Sub-millisecond inference'],
    judgeQuestion: 'Can this work in real time?',
    suggestedAnswer: 'Yes. Since the models are preloaded into memory through the ModelManager singleton, inference takes only a few milliseconds on CPU, making real-time deployment feasible.',
    duration: 5
  }
];

/* ================================================================
   CONSTANTS
   ================================================================ */
const STAGE_ORDER = ['satellite', 'cnn', 'weather', 'transformer', 'fusion', 'prediction'];

const NODE_POS: Record<string, { left: number; top: number; w: number; h: number }> = {
  satellite:   { left: 115, top: 10,  w: 210, h: 85 },
  weather:     { left: 595, top: 10,  w: 210, h: 85 },
  cnn:         { left: 80,  top: 170, w: 270, h: 155 },
  transformer: { left: 570, top: 170, w: 270, h: 155 },
  fusion:      { left: 320, top: 430, w: 280, h: 140 },
  prediction:  { left: 320, top: 635, w: 280, h: 115 },
};

const SVG_CONNECTIONS = [
  { id: 'sat-cnn',  d: 'M220,95 L220,170',                        activeFrom: 1, label: '4-ch', labelPos: { x: 235, y: 133 } },
  { id: 'wth-trn',  d: 'M700,95 L700,170',                        activeFrom: 3, label: '8 feat', labelPos: { x: 715, y: 133 } },
  { id: 'cnn-fus',  d: 'M215,325 C215,378 460,378 460,430',       activeFrom: 4, label: '512D', labelPos: { x: 305, y: 370 } },
  { id: 'trn-fus',  d: 'M705,325 C705,378 460,378 460,430',       activeFrom: 4, label: '512D', labelPos: { x: 600, y: 370 } },
  { id: 'fus-pred', d: 'M460,570 L460,635',                       activeFrom: 5, label: '2 cls', labelPos: { x: 475, y: 603 } },
];

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function PipelinePage() {
  const [selectedNode, setSelectedNode] = useState<typeof PIPELINE_NODES[0] | null>(null);
  const [mode, setMode] = useState<'idle' | 'demo' | 'presentation' | 'demo-complete' | 'pres-complete'>('idle');
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());

  const isRunning = mode === 'demo' || mode === 'presentation';
  const activeNodeId = activeStageIndex >= 0 && activeStageIndex < STAGE_ORDER.length ? STAGE_ORDER[activeStageIndex] : null;
  const activeNode = activeNodeId ? PIPELINE_NODES.find(n => n.id === activeNodeId) : null;
  const activeScript = activeNodeId ? PRESENTATION_SCRIPTS.find(s => s.stageId === activeNodeId) : null;

  // Advance stages automatically
  useEffect(() => {
    if (!isRunning || activeStageIndex < 0) return;
    const delay = mode === 'demo' ? 2500 : (activeScript?.duration || 4) * 1000;
    const timer = setTimeout(() => {
      if (activeStageIndex < STAGE_ORDER.length - 1) {
        setCompletedStages(prev => new Set([...prev, activeStageIndex]));
        setActiveStageIndex(prev => prev + 1);
      } else {
        setCompletedStages(prev => new Set([...prev, activeStageIndex]));
        setMode(mode === 'demo' ? 'demo-complete' : 'pres-complete');
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [isRunning, activeStageIndex, mode, activeScript]);

  const startDemo = useCallback(() => {
    setMode('demo'); setActiveStageIndex(0); setCompletedStages(new Set());
  }, []);

  const startPresentation = useCallback(() => {
    setMode('presentation'); setActiveStageIndex(0); setCompletedStages(new Set());
  }, []);

  const stopAndReset = useCallback(() => {
    setMode('idle'); setActiveStageIndex(-1); setCompletedStages(new Set());
  }, []);

  const getNodeState = (nodeId: string) => {
    const idx = STAGE_ORDER.indexOf(nodeId);
    if (idx === activeStageIndex && isRunning) return 'active';
    if (completedStages.has(idx)) return 'completed';
    return 'idle';
  };

  const isConnectionActive = (activeFrom: number) => {
    return isRunning && activeStageIndex >= activeFrom;
  };

  return (
    <div className="max-w-[1300px] mx-auto space-y-6 pb-12">
      {/* -------- HEADER -------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Architecture Visualization</h1>
          <p className="text-muted-foreground mt-1">Interactive demonstration of the multimodal deep learning pipeline.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={stopAndReset} disabled={mode === 'idle'} variant="outline" className="gap-2 rounded-full border-white/10 hover:bg-white/5">
            <RotateCcw className="w-4 h-4" /> Reset Demo
          </Button>
          <Button onClick={startDemo} disabled={isRunning}
            className="gap-2 rounded-full shadow-lg shadow-primary/20 bg-gradient-to-r from-blue-600 to-primary hover:shadow-primary/40 transition-shadow">
            <PlayCircle className="w-4 h-4" /> Run Visual Demo
          </Button>
          <Button onClick={startPresentation} disabled={isRunning}
            className="gap-2 rounded-full shadow-lg shadow-violet-500/20 bg-gradient-to-r from-violet-600 to-purple-500 hover:shadow-violet-500/40 transition-shadow text-white">
            <Mic className="w-4 h-4" /> Presentation Mode
          </Button>
        </div>
      </div>

      {/* -------- MAIN CONTENT -------- */}
      <div className="flex gap-6">
        {/* ---- DIAGRAM ---- */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-x-auto overflow-y-hidden"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            <motion.div className="relative" 
              style={{ width: 920, height: 760, margin: '0 auto', transformOrigin: 'center' }}
              animate={mode === 'presentation' && activeNodeId ? {
                scale: 1.15,
                x: 460 - (NODE_POS[activeNodeId].left + NODE_POS[activeNodeId].w / 2),
                y: 380 - (NODE_POS[activeNodeId].top + NODE_POS[activeNodeId].h / 2),
              } : { scale: 1, x: 0, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >

              {/* SVG CONNECTIONS */}
              <svg viewBox="0 0 920 760" className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                <defs>
                  <filter id="glowFilter">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <linearGradient id="activeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="completeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                {SVG_CONNECTIONS.map(conn => {
                  const active = isConnectionActive(conn.activeFrom);
                  const completed = isRunning && activeStageIndex > conn.activeFrom;
                  const showInComplete = (mode === 'demo-complete' || mode === 'pres-complete');

                  return (
                    <g key={conn.id}>
                      {/* Base dim line */}
                      <path d={conn.d} fill="none" stroke="white" strokeWidth={1} opacity={0.08} strokeDasharray="4 4" />

                      {/* Active flowing line */}
                      {(active || showInComplete) && (
                        <>
                          <motion.path d={conn.d} fill="none"
                            stroke={completed || showInComplete ? "url(#completeGrad)" : "url(#activeGrad)"}
                            strokeWidth={3} strokeLinecap="round" strokeDasharray="10 8"
                            filter="url(#glowFilter)"
                            initial={{ opacity: 0 }} animate={{ opacity: 1, strokeDashoffset: [0, -18] }}
                            transition={{ opacity: { duration: 0.4 }, strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" } }}
                          />
                          {/* SVG Particles */}
                          <circle r="3" fill={completed || showInComplete ? "#4ade80" : "#60a5fa"} filter="url(#glowFilter)">
                            <animateMotion dur={mode === 'presentation' ? "2s" : "1.5s"} repeatCount="indefinite" path={conn.d} />
                          </circle>
                          <circle r="2" fill={completed || showInComplete ? "#4ade80" : "#60a5fa"} filter="url(#glowFilter)">
                            <animateMotion dur={mode === 'presentation' ? "2s" : "1.5s"} begin="0.75s" repeatCount="indefinite" path={conn.d} />
                          </circle>
                          {/* Dimension label */}
                          <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                            <rect x={conn.labelPos.x - 20} y={conn.labelPos.y - 10} width={40} height={20} rx={6}
                              fill="rgba(0,0,0,0.6)" stroke={completed || showInComplete ? "#22c55e" : "#3b82f6"} strokeWidth={1} />
                            <text x={conn.labelPos.x} y={conn.labelPos.y + 4} textAnchor="middle"
                              fill={completed || showInComplete ? "#4ade80" : "#60a5fa"} fontSize={10} fontFamily="monospace" fontWeight="bold">
                              {conn.label}
                            </text>
                          </motion.g>
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Convergence indicator at fusion */}
                {(isConnectionActive(4) || mode === 'demo-complete' || mode === 'pres-complete') && (
                  <motion.circle cx={460} cy={430} r={5}
                    fill={activeStageIndex > 4 || mode === 'demo-complete' || mode === 'pres-complete' ? "#22c55e" : "#3b82f6"}
                    filter="url(#glowFilter)"
                    initial={{ scale: 0 }} animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </svg>

              {/* NODE CARDS */}
              {PIPELINE_NODES.map((node, idx) => {
                const pos = NODE_POS[node.id];
                const state = getNodeState(node.id);
                const isDimmed = mode === 'presentation' && activeNodeId && activeNodeId !== node.id;

                return (
                  <motion.div key={node.id}
                    className={`absolute cursor-pointer rounded-2xl backdrop-blur-xl transition-all duration-500 border overflow-hidden
                      ${state === 'active'
                        ? 'bg-white/[0.08] border-primary/60 shadow-[0_0_40px_-8px] shadow-primary/40 z-20'
                        : state === 'completed'
                        ? 'bg-white/[0.05] border-emerald-500/40 shadow-[0_0_20px_-8px] shadow-emerald-500/20 z-10'
                        : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.06] z-10'
                      }`}
                    style={{ left: pos.left, top: pos.top, width: pos.w, height: pos.h }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: isDimmed ? 0.3 : 1, y: 0,
                      scale: state === 'active' ? 1.05 : 1,
                    }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    whileHover={!isRunning ? { scale: 1.03, y: -2 } : {}}
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Active glow ring */}
                    {state === 'active' && (
                      <motion.div className="absolute inset-0 rounded-2xl border-2 border-primary/40"
                        animate={{ opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    {/* Completed badge */}
                    {state === 'completed' && (
                      <motion.div className="absolute top-2 right-2 z-30"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </motion.div>
                    )}

                    <div className="p-4 h-full flex flex-col justify-center relative z-10">
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          state === 'active' ? 'bg-primary/20' : state === 'completed' ? 'bg-emerald-500/15' : 'bg-white/[0.06]'
                        }`}>
                          <node.icon className={`w-5 h-5 ${
                            state === 'active' ? 'text-primary' : state === 'completed' ? 'text-emerald-400' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm leading-tight">{node.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">{node.subtitle}</p>
                        </div>
                      </div>

                      {/* Show details on larger cards */}
                      {(node.id === 'cnn' || node.id === 'transformer' || node.id === 'fusion' || node.id === 'prediction') && (
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-white/[0.04] border-white/[0.1]">
                              {node.inputDetail}
                            </Badge>
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-mono font-bold
                              ${state === 'active' ? 'border-primary/40 text-primary bg-primary/10' : state === 'completed' ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'bg-white/[0.04] border-white/[0.1]'}`}>
                              {node.dimension}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                            <BookOpen className="w-3 h-3" />
                            <span className="truncate">{node.notebook}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Row labels */}
              <div className="absolute left-2 top-[38px] text-[10px] text-muted-foreground/30 font-mono uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Input</div>
              <div className="absolute left-2 top-[220px] text-[10px] text-muted-foreground/30 font-mono uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Encoders</div>
              <div className="absolute left-2 top-[470px] text-[10px] text-muted-foreground/30 font-mono uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Fusion</div>
              <div className="absolute left-2 top-[660px] text-[10px] text-muted-foreground/30 font-mono uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Output</div>
            </motion.div>
          </div>
        </div>

        {/* ---- PRESENTATION ASSISTANT (right sidebar) ---- */}
        <AnimatePresence>
          {mode === 'presentation' && activeScript && (
            <motion.div className="w-80 shrink-0 hidden lg:block"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
              <div className="sticky top-4 space-y-4">
                {/* What to say */}
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] backdrop-blur-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-violet-400">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">What to Say</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p key={activeScript.stageId} className="text-sm leading-relaxed text-muted-foreground"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      {activeScript.whatToSay}
                    </motion.p>
                  </AnimatePresence>
                  <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                    <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">Key Points</div>
                    {activeScript.keyPoints.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <ChevronRight className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />{pt}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Judge Q&A */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] backdrop-blur-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Possible Question</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={activeScript.stageId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p className="text-sm font-medium text-amber-200/80 mb-2">&ldquo;{activeScript.judgeQuestion}&rdquo;</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-1">
                        <Lightbulb className="w-3 h-3 text-emerald-400" /> Suggested Answer
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{activeScript.suggestedAnswer}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-1 border-t border-amber-500/20 pt-3">
                        <Clock className="w-3 h-3 text-amber-400" /> Duration
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{activeScript.duration} seconds</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Progress */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 space-y-2">
                  <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-2">Progress</div>
                  {STAGE_ORDER.map((stageId, i) => {
                    const node = PIPELINE_NODES.find(n => n.id === stageId)!;
                    const st = i < activeStageIndex ? 'done' : i === activeStageIndex ? 'active' : 'pending';
                    return (
                      <div key={stageId} className={`flex items-center gap-2 text-xs py-1 transition-all ${
                        st === 'active' ? 'text-primary font-medium' : st === 'done' ? 'text-emerald-400' : 'text-muted-foreground/40'
                      }`}>
                        {st === 'done' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                         st === 'active' ? <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                           <Loader2 className="w-3.5 h-3.5 animate-spin" /></motion.div> :
                         <div className="w-3.5 h-3.5 rounded-full border border-white/10" />}
                        {node.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* -------- LIVE STAGE INFO PANEL -------- */}
      <AnimatePresence mode="wait">
        {isRunning && activeNode ? (
          <motion.div key={activeNode.id}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <activeNode.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-[10px] text-primary/60 uppercase tracking-wider font-semibold">Current Stage</div>
                <h3 className="font-bold text-lg">{activeNode.title}</h3>
              </div>
              <Badge className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">{activeNode.subtitle}</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Purpose</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{activeNode.purpose}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Input → Output</div>
                <p className="text-xs font-mono text-muted-foreground">{activeNode.inputDetail}</p>
                <div className="text-primary text-xs mt-1">↓</div>
                <p className="text-xs font-mono text-primary font-bold">{activeNode.outputDetail}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Tensor Shape</div>
                <p className="text-sm font-mono font-bold text-foreground">{activeNode.tensorShape}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Module</div>
                <p className="text-xs font-mono text-emerald-400">{activeNode.module}</p>
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1 mt-2">Notebook</div>
                <p className="text-xs font-mono text-blue-400 truncate">{activeNode.notebook}</p>
              </div>
            </div>
          </motion.div>
        ) : !isRunning && mode === 'idle' ? (
          <motion.div key="idle-hint"
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <BrainCircuit className="w-8 h-8 mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground/60">Click any node to explore details, or run a visual demo to see the AI pipeline in action.</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* -------- DEMO COMPLETE SUMMARY -------- */}
      <AnimatePresence>
        {mode === 'demo-complete' && (
          <motion.div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] backdrop-blur-xl p-8 space-y-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">AI Inference Complete</h2>
                <p className="text-sm text-muted-foreground">Full pipeline executed successfully.</p>
              </div>
            </div>

            {/* Stage checkmarks */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { icon: '🛰️', name: 'Satellite Image', detail: 'Input Received' },
                { icon: '🧠', name: 'CNN Feature Extraction', detail: '512D Image Embedding' },
                { icon: '☁️', name: 'Weather Features', detail: 'ERA5 + MODIS Preprocessed' },
                { icon: '🤖', name: 'Transformer Encoder', detail: '512D Weather Embedding' },
                { icon: '🔀', name: 'Cross Attention Fusion', detail: '512D Multimodal Vector' },
                { icon: '🎯', name: 'Final Classification', detail: 'Prediction Generated' },
              ].map((s, i) => (
                <motion.div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium">{s.icon} {s.name}</div>
                    <div className="text-[10px] text-muted-foreground">{s.detail}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Prediction result */}
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <motion.div className="px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-center"
                initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.6 }}>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Prediction</div>
                <div className="text-3xl font-extrabold text-red-400">FLASH 🔴</div>
              </motion.div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3"><span className="text-muted-foreground">Confidence</span><Badge className="bg-primary/10 text-primary border-primary/20 font-mono">99.98%</Badge></div>
                <div className="flex items-center gap-3"><span className="text-muted-foreground">Inference</span><Badge variant="outline" className="font-mono">0.93 ms</Badge></div>
                <div className="flex items-center gap-3"><span className="text-muted-foreground">Device</span><Badge variant="outline" className="font-mono"><Cpu className="w-3 h-3 mr-1" />CPU</Badge></div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center text-xs">
              {['CNN Encoder (ResNet18)', 'Weather Transformer', 'Cross Attention Fusion'].map((m, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />{m}
                </div>
              ))}
            </div>

            <motion.div className="text-center pt-4 border-t border-white/[0.06]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium text-sm">
                <CheckCircle2 className="w-4 h-4" /> AI Prediction Completed Successfully
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------- PRESENTATION COMPLETE -------- */}
      <AnimatePresence>
        {mode === 'pres-complete' && (
          <motion.div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-purple-500/[0.04] backdrop-blur-xl p-10 text-center space-y-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
              <div className="text-5xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold">Presentation Completed</h2>
            </motion.div>

            <div className="flex flex-wrap gap-2 justify-center">
              {['Satellite Processing', 'Weather Processing', 'Transformer Encoding', 'Cross Attention Fusion', 'Multimodal Prediction'].map((s, i) => (
                <motion.div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-emerald-500/20 text-xs text-emerald-400"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>
                  <CheckCircle2 className="w-3 h-3" />{s}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/30">
                <div className="text-[10px] text-muted-foreground uppercase mb-1">Prediction</div>
                <div className="text-2xl font-extrabold text-red-400">FLASH 🔴</div>
              </div>
              <div className="text-sm space-y-1 text-left">
                <div className="text-muted-foreground">Confidence: <span className="text-foreground font-mono font-bold">99.98%</span></div>
                <div className="text-muted-foreground">Inference: <span className="text-foreground font-mono font-bold">0.93 ms</span></div>
              </div>
            </div>

            <motion.div className="pt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
              <motion.p className="text-3xl font-light text-muted-foreground/80 tracking-wide"
                animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}>
                Thank you. Questions?
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------- PROGRESS TIMELINE (during demo) -------- */}
      <AnimatePresence>
        {mode === 'demo' && (
          <motion.div className="flex items-center justify-center gap-2 py-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {STAGE_ORDER.map((stageId, i) => {
              const node = PIPELINE_NODES.find(n => n.id === stageId)!;
              const st = i < activeStageIndex ? 'done' : i === activeStageIndex ? 'active' : 'pending';
              return (
                <React.Fragment key={stageId}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                    st === 'active' ? 'bg-primary/15 text-primary font-medium border border-primary/30' :
                    st === 'done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-white/[0.02] text-muted-foreground/40 border border-white/[0.04]'
                  }`}>
                    {st === 'done' ? <CheckCircle2 className="w-3 h-3" /> :
                     st === 'active' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    <span className="hidden sm:inline">{node.title}</span>
                  </div>
                  {i < STAGE_ORDER.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/20" />}
                </React.Fragment>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------- NODE DETAIL SHEET -------- */}
      <Sheet open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedNode && (
            <>
              <SheetHeader className="mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <selectedNode.icon className="w-7 h-7 text-primary" />
                </div>
                <SheetTitle className="text-2xl">{selectedNode.title}</SheetTitle>
                <SheetDescription>{selectedNode.description}</SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Why This Stage Exists
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedNode.whyExists}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Purpose</h4>
                  <p className="text-sm">{selectedNode.purpose}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <h4 className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase">Input</h4>
                    <p className="text-sm font-medium">{selectedNode.input}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedNode.inputDetail}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <h4 className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase">Output</h4>
                    <p className="text-sm font-medium">{selectedNode.output}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedNode.outputDetail}</p>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl">
                  <h4 className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase">Tensor Dimensions</h4>
                  <p className="text-lg font-mono font-bold text-primary">{selectedNode.tensorShape}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-3">
                    <BrainCircuit className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase">Models / Algorithms</h4>
                      <p className="text-sm">{selectedNode.model}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase">Research Notebook</h4>
                      <p className="text-sm font-mono text-blue-400">{selectedNode.notebook}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Layers className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase">Production Module</h4>
                      <p className="text-sm font-mono text-emerald-400">{selectedNode.module}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase">Generated CSV</h4>
                      <p className="text-sm font-mono">{selectedNode.csvFile}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
