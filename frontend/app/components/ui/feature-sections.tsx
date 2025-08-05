"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Edit3, RefreshCw, MessageSquare } from "lucide-react";
import { Button } from "./button";

interface Feature {
  _id: string;
  name: string;
  description: string;
  prompt: string;
  order: number;
  isOptional: boolean;
}

interface FeatureSectionsProps {
  features: Feature[];
  structuredResponse: { [key: string]: string };
  onRegenerateFeature: (featureName: string, feedback: string) => Promise<void>;
  isRegenerating?: boolean;
}

export default function FeatureSections({
  features,
  structuredResponse,
  onRegenerateFeature,
  isRegenerating = false
}: FeatureSectionsProps) {
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [regeneratingFeature, setRegeneratingFeature] = useState<string | null>(null);

  const handleEditFeature = (featureName: string) => {
    setEditingFeature(featureName);
    setFeedback("");
  };

  const handleCancelEdit = () => {
    setEditingFeature(null);
    setFeedback("");
  };

  const handleRegenerateFeature = async (featureName: string) => {
    if (!feedback.trim()) return;
    
    setRegeneratingFeature(featureName);
    try {
      await onRegenerateFeature(featureName, feedback);
      setEditingFeature(null);
      setFeedback("");
    } catch (error) {
      console.error('Error regenerating feature:', error);
    } finally {
      setRegeneratingFeature(null);
    }
  };

  // Sort features by order
  const sortedFeatures = features.sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
        <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">AI</span>
        </div>
        <span className="text-sm font-medium text-foreground">Generated Content</span>
      </div>

      <div className="space-y-3">
        {sortedFeatures.map((feature) => {
          const content = structuredResponse[feature.name] || "No content generated";
          const isEditing = editingFeature === feature.name;
          const isRegeneratingThis = regeneratingFeature === feature.name;

          return (
            <motion.div
              key={feature._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative"
            >
              <div className="bg-background border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                {/* Feature Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {feature.name}
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {feature.description}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditFeature(feature.name)}
                      disabled={isRegenerating || isRegeneratingThis}
                      className="h-8 w-8 p-0 cursor-pointer "
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="relative">
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={`What would you like to change about the ${feature.name.toLowerCase()}?`}
                        className="w-full p-3 border border-border rounded-md bg-background text-foreground resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleRegenerateFeature(feature.name)}
                          disabled={!feedback.trim() || isRegeneratingThis}
                          size="sm"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {isRegeneratingThis ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 cursor-pointer" />
                          )}
                          Regenerate
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isRegeneratingThis}
                          size="sm"
                          className="cursor-pointer border border-border"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                        {content.replace(/\\n/g, '\n').trim()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Loading overlay */}
                {isRegeneratingThis && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin cursor-pointer" />
                      <span className="text-sm">Regenerating...</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>


    </div>
  );
} 