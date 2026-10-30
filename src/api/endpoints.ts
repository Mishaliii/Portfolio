/**
 * CareerLens FastAPI Backend Integration Contracts
 *
 * Intended Architecture:
 *   Frontend (React 19 / TanStack Router) -> FastAPI -> SQLAlchemy -> SQLite / PostgreSQL
 *
 * Backend Endpoints:
 *   - Authentication:
 *       POST /api/v1/auth/register
 *       POST /api/v1/auth/login
 *       GET  /api/v1/auth/me
 *   - Resume:
 *       POST /api/v1/cv/process
 *   - Resume Intelligence:
 *       POST   /api/v1/agent/resume/query
 *       GET    /api/v1/agent/resume/{resume_id}/status
 *       DELETE /api/v1/agent/resume/{resume_id}
 *   - Job Intelligence:
 *       POST /api/v1/jobs/match
 *   - Health:
 *       GET /health
 *       GET /health/ready
 */

import { apiClient } from "./client";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token?: string;
  token?: string;
  token_type?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    targetRole?: string;
  };
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  targetRole?: string;
  secondaryRoles?: string[];
  experienceYears?: number;
  education?: string;
  location?: string;
};

export type CvProcessResponse = {
  resume_id: string;
  filename: string;
  ats_score?: number;
  skills_extracted?: string[];
  status: "processing" | "completed" | "failed";
};

export type ResumeQueryRequest = {
  resume_id: string;
  query: string;
};

export type ResumeQueryResponse = {
  answer: string;
  sources?: string[];
};

export type ResumeStatusResponse = {
  resume_id: string;
  status: "queued" | "processing" | "ready" | "failed";
  progress?: number;
  error?: string;
};

export type JobMatchRequest = {
  resume_id?: string;
  limit?: number;
  min_match?: number;
};

export type HealthResponse = {
  status: string;
  version?: string;
};

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>("/api/v1/auth/login", data),
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>("/api/v1/auth/register", data),
  me: () => apiClient.get<UserProfile>("/api/v1/auth/me"),
};

export const resumeApi = {
  processCv: (formData: FormData) =>
    apiClient.postFormData<CvProcessResponse>("/api/v1/cv/process", formData),
};

export const resumeIntelligenceApi = {
  query: (data: ResumeQueryRequest) =>
    apiClient.post<ResumeQueryResponse>("/api/v1/agent/resume/query", data),
  getStatus: (resumeId: string) =>
    apiClient.get<ResumeStatusResponse>(
      `/api/v1/agent/resume/${encodeURIComponent(resumeId)}/status`,
    ),
  deleteResume: (resumeId: string) =>
    apiClient.del<{ ok: boolean }>(
      `/api/v1/agent/resume/${encodeURIComponent(resumeId)}`,
    ),
};

export const jobsApi = {
  match: (data?: JobMatchRequest) =>
    apiClient.post<{ jobs: unknown[]; total: number }>("/api/v1/jobs/match", data),
};

export const healthApi = {
  health: () => apiClient.get<HealthResponse>("/health"),
  ready: () => apiClient.get<HealthResponse>("/health/ready"),
};

