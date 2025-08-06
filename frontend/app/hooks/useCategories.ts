import { useState, useEffect } from 'react';

interface Category {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`${API_BASE}/ai-models/categories`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();        
        if (data.success) {
          setCategories(data.data);
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
    loading,
    error
  };
} 