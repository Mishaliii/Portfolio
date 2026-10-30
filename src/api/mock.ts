import {
  mockDashboard,
  mockJobs,
  mockUser,
  mockResumeSummary,
  mockAtsAnalysis,
  mockRoadmapPlan,
  mockTracker,
  mockInterviewQuestions,
  mockInterviewSessions,
  mockProfile,
  mockEasyApplyStats,
  mockEasyApplyHistory,
  type Job,
} from "../data/fixtures";



type MockResponse = { status: number; data: unknown };

function match(url: string, pattern: string) {
  return url === pattern || url.startsWith(pattern + "?");
}

function filterJobs(url: string): Job[] {
  const qs = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
  const params = new URLSearchParams(qs);
  let list = [...mockJobs];
  const q = params.get("q")?.toLowerCase();
  if (q) {
    list = list.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q),
    );
  }
  const location = params.get("location");
  if (location && location !== "all") {
    list = list.filter((j) => j.location.toLowerCase() === location.toLowerCase());
  }
  const experience = params.get("experience");
  if (experience && experience !== "all") {
    list = list.filter((j) => j.experienceLevel === experience);
  }
  const jobType = params.get("jobType");
  if (jobType && jobType !== "all") {
    list = list.filter((j) => j.jobType === jobType);
  }
  const minMatch = Number(params.get("minMatch") ?? 0);
  if (minMatch > 0) list = list.filter((j) => j.matchScore >= minMatch);
  const posted = params.get("posted");
  if (posted && posted !== "any") {
    const hours = posted === "24h" ? 24 : posted === "3d" ? 72 : 168;
    const cutoff = Date.now() - hours * 3600_000;
    list = list.filter((j) => new Date(j.postedAt).getTime() >= cutoff);
  }
  const sort = params.get("sort") ?? "match";
  if (sort === "recent") {
    list.sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
  } else if (sort === "company") {
    list.sort((a, b) => a.company.localeCompare(b.company));
  } else {
    list.sort((a, b) => b.matchScore - a.matchScore);
  }
  return list;
}

export function mockRequest(
  method: string,
  url: string,
  body?: unknown,
): MockResponse | null {
  const m = method.toUpperCase();

  if (m === "POST" && (match(url, "/auth/login") || match(url, "/api/v1/auth/login"))) {
    const b = (body ?? {}) as { email?: string };
    return {
      status: 200,
      data: {
        access_token: "mock-token-" + Date.now(),
        token: "mock-token-" + Date.now(),
        token_type: "bearer",
        user: { ...mockUser, email: b.email ?? mockUser.email },
      },
    };
  }

  if (m === "POST" && (match(url, "/auth/register") || match(url, "/api/v1/auth/register"))) {
    const b = (body ?? {}) as { name?: string; email?: string };
    return {
      status: 200,
      data: {
        access_token: "mock-token-" + Date.now(),
        token: "mock-token-" + Date.now(),
        token_type: "bearer",
        user: {
          id: "u_new",
          name: b.name ?? "New User",
          email: b.email ?? "new@example.com",
        },
      },
    };
  }

  if (m === "GET" && match(url, "/api/v1/auth/me")) {
    return {
      status: 200,
      data: mockUser,
    };
  }

  if (m === "POST" && match(url, "/api/v1/cv/process")) {
    return {
      status: 200,
      data: {
        resume_id: "res_" + Date.now(),
        filename: "resume.pdf",
        ats_score: 84,
        skills_extracted: ["React", "TypeScript", "JavaScript", "Tailwind CSS"],
        status: "completed",
      },
    };
  }

  if (m === "POST" && match(url, "/api/v1/jobs/match")) {
    const list = filterJobs("/jobs?minMatch=75");
    return {
      status: 200,
      data: { jobs: list, total: list.length },
    };
  }

  if (m === "GET" && (match(url, "/health") || match(url, "/health/ready"))) {
    return {
      status: 200,
      data: { status: "healthy", service: "careerlens-api" },
    };
  }

  if (m === "GET" && match(url, "/dashboard/summary")) {
    return { status: 200, data: mockDashboard };
  }

  if (m === "GET" && match(url, "/jobs")) {
    const results = filterJobs(url);
    return { status: 200, data: { jobs: results, total: results.length } };
  }

  if (m === "POST" && match(url, "/tracker/save")) {
    return { status: 200, data: { ok: true } };
  }

  if (m === "GET" && match(url, "/resume/summary")) {
    return { status: 200, data: mockResumeSummary };
  }

  if (m === "POST" && match(url, "/ats/analyze")) {
    // Slight variation based on body length so it feels responsive
    const b = (body ?? {}) as { resume?: string; jd?: string };
    const jdLen = (b.jd ?? "").length;
    const resumeLen = (b.resume ?? "").length;
    const bump = Math.min(20, Math.floor((jdLen + resumeLen) / 500));
    return {
      status: 200,
      data: {
        ...mockAtsAnalysis,
        overall: Math.min(94, mockAtsAnalysis.overall + bump),
      },
    };
  }

  if (m === "GET" && match(url, "/roadmap/plan")) {
    return { status: 200, data: mockRoadmapPlan };
  }

  if (m === "GET" && match(url, "/tracker/list")) {
    return { status: 200, data: { applications: mockTracker } };
  }

  if (m === "GET" && match(url, "/interview/questions")) {
    return { status: 200, data: { questions: mockInterviewQuestions } };
  }

  if (m === "GET" && match(url, "/interview/sessions")) {
    return { status: 200, data: { sessions: mockInterviewSessions } };
  }

  if (m === "POST" && match(url, "/interview/feedback")) {
    const b = (body ?? {}) as { answer?: string };
    const len = (b.answer ?? "").length;
    const score = Math.max(45, Math.min(94, 55 + Math.floor(len / 20)));
    return {
      status: 200,
      data: {
        score,
        strengths: [
          "Clear structure and pacing",
          "Concrete example anchoring your answer",
        ],
        improvements: [
          len < 120 ? "Answer is short — expand with a specific example" : "Trim filler phrases to keep answers tight",
          "Tie the answer back to business impact",
        ],
        suggestedFollowUp: "How would you approach this differently at 10x the scale?",
      },
    };
  }

  if (m === "GET" && match(url, "/profile")) {
    return { status: 200, data: mockProfile };
  }

  if (m === "PUT" && match(url, "/profile")) {
    return { status: 200, data: { ok: true } };
  }

  if (m === "GET" && url.startsWith("/jobs/")) {
    const id = url.split("/")[2];
    const job = mockJobs.find((j) => j.id === id);
    if (job) return { status: 200, data: job };
    return { status: 404, data: { error: "Not found" } };
  }

  if (m === "POST" && match(url, "/apply/submit")) {
    return { status: 200, data: { ok: true, applicationId: "app_" + Date.now() } };
  }

  if (m === "GET" && match(url, "/apply/ready")) {
    const ready = mockJobs
      .filter((j) => j.easyApply)
      .sort((a, b) => b.matchScore - a.matchScore);
    return { status: 200, data: { jobs: ready, total: ready.length } };
  }

  if (m === "GET" && match(url, "/apply/stats")) {
    return { status: 200, data: mockEasyApplyStats };
  }

  if (m === "GET" && match(url, "/apply/history")) {
    return { status: 200, data: { applications: mockEasyApplyHistory } };
  }

  return null;
}

