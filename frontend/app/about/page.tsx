import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, GitBranch, Target, Layers } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">About Project</h1>
        <p className="text-muted-foreground mt-1">Research context and architectural objectives.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Problem Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Climate extremes, particularly flash floods and heat waves, are occurring with increasing frequency and severity. Traditional physics-based weather forecasting models often struggle to capture localized, rapid-onset events with high precision. This project addresses the gap by leveraging a multimodal deep learning approach that combines the spatial awareness of satellite imagery with the temporal sequence modeling of meteorological variables.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <Target className="w-6 h-6 text-primary mb-2" />
            <CardTitle>Core Objectives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {["Enhance regional prediction accuracy", "Fuse visual and temporal datasets", "Maintain <100ms inference time", "Deploy as an enterprise AI platform"].map((obj, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {obj}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <Layers className="w-6 h-6 text-primary mb-2" />
            <CardTitle>Research Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The primary contribution is the introduction of a <strong>Cross Attention Fusion</strong> mechanism, where spatial CNN embeddings query temporal Transformer features, dynamically weighting meteorological signals based on local geography.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <GitBranch className="w-6 h-6 text-primary mb-2" />
          <CardTitle>Future Scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>Expanding the dataset coverage beyond the current regional bounding box.</li>
            <li>Integrating Vision Transformers (ViT) in place of ResNet18 for spatial extraction.</li>
            <li>Deploying federated learning nodes to edge devices for privacy-preserving localized training.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
