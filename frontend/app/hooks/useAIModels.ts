import { useState, useEffect } from 'react';

interface Category {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  models: Model[];
}

interface Model {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  masterPrompt: string;
  featureIds: string[];
  isActive: boolean;
}

interface SidebarData {
  _id: string;
  title: string;
  children: Model[];
}

export function useAIModels() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sidebarData, setSidebarData] = useState<SidebarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
       
        const response = await fetch(`${API_BASE}/ai-models/categories`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();        
        if (data.success) {
          setCategories(data.data);
          
          // Transform data for sidebar
          const transformedData: SidebarData[] = data.data.map((category: Category) => {
            return {
              _id: category._id,
              title: category.name,
              children: category.models || []
            };
          });
          
          setSidebarData(transformedData);
        } else {
          throw new Error(data.error || 'Failed to fetch categories');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [API_BASE]);

  return {
    categories,
    sidebarData,
    loading,
    error
  };
} 