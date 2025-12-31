import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function useAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, options }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze video');
      }

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      setData(result.data);
      return result.data;
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    analyze,
    reset,
  };
}

export default useAnalytics;
