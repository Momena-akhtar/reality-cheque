import { useState, useEffect } from 'react';

interface Model {
  _id: string;
  name: string;
  description: string;
  categoryId: {
    _id: string;
    name: string;
    description: string;
    tierAccess: "tier1" | "tier2" | "tier3";
  };
  masterPrompt: string;
  featureIds: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        
        // Use the admin endpoint to get all models without tier filtering
        const response = await fetch(`${API_BASE}/ai-models/models`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();        
        if (data.success) {
          setModels(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch models');
        }
      } catch (err) {
        console.error('Error fetching models:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [API_BASE]);

  return {
    models,
    loading,
    error
  };
} 