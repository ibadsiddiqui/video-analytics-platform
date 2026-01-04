"use client";

import { useState, useCallback } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import type {
  ApiKey,
  AddKeyRequest,
  UpdateKeyRequest,
  TestResult,
} from "@/types/apiKey";

const API_URL = "/api";

interface UseApiKeysReturn {
  keys: ApiKey[];
  loading: boolean;
  error: string | null;
  addKey: (data: AddKeyRequest) => Promise<void>;
  updateKey: (id: string, data: UpdateKeyRequest) => Promise<void>;
  deleteKey: (id: string) => Promise<void>;
  testKey: (id: string) => Promise<TestResult | null>;
  refetch: () => Promise<void>;
}

export function useApiKeys(): UseApiKeysReturn {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  /**
   * Fetch all API keys for the current user
   */
  const refetch = useCallback(async (): Promise<void> => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/keys`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        setKeys(response.data.data);
      } else {
        setKeys([]);
      }
    } catch (err: any) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.status === 401
          ? "Unauthorized. Please sign in again."
          : err.response?.data?.error ||
            err.message ||
            "Failed to fetch API keys"
        : err.message || "Failed to fetch API keys";

      setError(errorMessage);
      toast.error(errorMessage);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/sign-in");
      }
    } finally {
      setLoading(false);
    }
  }, [user, router, getToken]);

  /**
   * Add a new API key
   */
  const addKey = useCallback(
    async (data: AddKeyRequest): Promise<void> => {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      try {
        const token = await getToken();
        const response = await axios.post(`${API_URL}/keys`, data, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.data.success) {
          setKeys((prev) => [response.data.data, ...prev]);
          toast.success("API key added successfully");
          return;
        }

        throw new Error(response.data.error || "Failed to add API key");
      } catch (err: any) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.error || err.message || "Failed to add API key"
          : err.message || "Failed to add API key";

        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user, router, getToken],
  );

  /**
   * Update an existing API key
   */
  const updateKey = useCallback(
    async (id: string, data: UpdateKeyRequest): Promise<void> => {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      try {
        const token = await getToken();
        const response = await axios.put(`${API_URL}/keys/${id}`, data, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.data.success) {
          setKeys((prev) =>
            prev.map((key) => (key.id === id ? response.data.data : key)),
          );
          toast.success("API key updated successfully");
          return;
        }

        throw new Error(response.data.error || "Failed to update API key");
      } catch (err: any) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.error ||
            err.message ||
            "Failed to update API key"
          : err.message || "Failed to update API key";

        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user, router, getToken],
  );

  /**
   * Delete an API key
   */
  const deleteKey = useCallback(
    async (id: string): Promise<void> => {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      try {
        const token = await getToken();
        const response = await axios.delete(`${API_URL}/keys/${id}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.data.success) {
          setKeys((prev) => prev.filter((key) => key.id !== id));
          toast.success("API key deleted successfully");
          return;
        }

        throw new Error(response.data.error || "Failed to delete API key");
      } catch (err: any) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.error ||
            err.message ||
            "Failed to delete API key"
          : err.message || "Failed to delete API key";

        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user, router, getToken],
  );

  /**
   * Test an API key for validity and quota remaining
   */
  const testKey = useCallback(
    async (id: string): Promise<TestResult | null> => {
      if (!user) {
        router.push("/sign-in");
        return null;
      }

      try {
        const token = await getToken();
        const response = await axios.post(
          `${API_URL}/keys/${id}/test`,
          {},
          {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          },
        );

        if (response.data.success) {
          if (response.data.data.valid) {
            toast.success("API key is valid");
          } else {
            toast.error(
              `Invalid API key: ${response.data.data.error || "Unknown error"}`,
            );
          }
          return response.data.data;
        }

        throw new Error(response.data.error || "Failed to test API key");
      } catch (err: any) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.error || err.message || "Failed to test API key"
          : err.message || "Failed to test API key";

        toast.error(errorMessage);
        return null;
      }
    },
    [user, router, getToken],
  );

  return {
    keys,
    loading,
    error,
    addKey,
    updateKey,
    deleteKey,
    testKey,
    refetch,
  };
}

export default useApiKeys;
