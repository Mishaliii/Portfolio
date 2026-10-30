import { getToken, removeToken } from "../utils/auth";
import { mockRequest } from "./mock";

const RAW_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");
const USE_MOCKS =
  (import.meta.env.VITE_USE_MOCKS as string | undefined) === "true";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  isFormData = false,
): Promise<T> {
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;

  // Development mock fallback
  if (USE_MOCKS) {
    const mocked = mockRequest(method, normalizedUrl, body);
    if (mocked) {
      await new Promise((r) => setTimeout(r, 200));
      if (mocked.status >= 400) {
        throw new ApiError(
          mocked.status,
          (mocked.data as { message?: string })?.message ?? "Request failed",
          mocked.data,
        );
      }
      return mocked.data as T;
    }
  }

  const token = getToken();
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let requestBody: BodyInit | undefined = undefined;
  if (body !== undefined) {
    if (isFormData && body instanceof FormData) {
      requestBody = body;
    } else {
      requestBody = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE_URL}${normalizedUrl}`, {
    method,
    headers,
    body: requestBody,
  });

  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized");
  }

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { message?: string } | null)?.message ?? res.statusText,
      data,
    );
  }
  return data as T;
}

export const apiClient = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, body),
  postFormData: <T>(url: string, formData: FormData) =>
    request<T>("POST", url, formData, true),
  put: <T>(url: string, body?: unknown) => request<T>("PUT", url, body),
  del: <T>(url: string) => request<T>("DELETE", url),
};
