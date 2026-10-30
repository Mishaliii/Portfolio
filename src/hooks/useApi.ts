import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "../api/client";

type Method = "GET" | "POST" | "PUT" | "DELETE";

export function useApi<T>(
  url: string | null,
  method: Method = "GET",
  body?: unknown,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<Error | null>(null);
  const bodyRef = useRef(body);
  bodyRef.current = body;

  const fetcher = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      let result: T;
      switch (method) {
        case "GET":
          result = await apiClient.get<T>(url);
          break;
        case "POST":
          result = await apiClient.post<T>(url, bodyRef.current);
          break;
        case "PUT":
          result = await apiClient.put<T>(url, bodyRef.current);
          break;
        case "DELETE":
          result = await apiClient.del<T>(url);
          break;
      }
      setData(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [url, method]);

  useEffect(() => {
    fetcher();
  }, [fetcher]);

  return { data, loading, error, refetch: fetcher };
}
