/**
 * Candidate Profile — the single conceptual source of truth every CareerLens
 * surface should eventually read from. Frontend-only for now (no backend).
 */

export type SkillStrength = "excellent" | "good" | "fair" | "missing";

export type ProfileSkill = {
  name: string;
  level: SkillStrength;
  /** 0-100 self/AI assessed proficiency */
  proficiency: number;
};

export type CandidateProfile = {
  name: string;
  targetRole: string;
  secondaryRoles: string[];
  topSkills: ProfileSkill[];
  weakSkills: ProfileSkill[];
  resumeReadiness: {
    score: number;
    delta: number;
    lastUpdated: string;
  };
  interviewConfidence: {
    score: number;
    delta: number;
    dimensions: { label: string; value: number }[];
  };
  preferredLocations: string[];
  preferredSalary: { min: number; max: number; currency: string; unit: string };
  currentResumeVersion: {
    id: string;
    label: string;
    readiness: number;
    date: string;
    targetRole: string;
  };
  education: { degree: string; year: number; eligible: boolean };
  experienceYears: number;
  roadmap: {
    currentWeek: number;
    totalWeeks: number;
    goal: string;
    progress: number;
    remaining: { lessons: number; projects: number; challenges: number };
    behindSchedule: boolean;
  };
  applications: {
    responseRate: number;
    avgMatch: number;
    thisMonth: number;
    lastAppliedDaysAgo: number;
  };
};

export const candidateProfile: CandidateProfile = {
  name: "Aditi Sharma",
  targetRole: "Frontend Engineer",
  secondaryRoles: ["Full-Stack Engineer", "UI Engineer"],
  topSkills: [
    { name: "React", level: "excellent", proficiency: 88 },
    { name: "JavaScript", level: "excellent", proficiency: 85 },
    { name: "CSS / Tailwind", level: "good", proficiency: 78 },
    { name: "Git", level: "good", proficiency: 74 },
  ],
  weakSkills: [
    { name: "TypeScript", level: "fair", proficiency: 52 },
    { name: "Docker", level: "missing", proficiency: 18 },
    { name: "System Design", level: "fair", proficiency: 44 },
  ],
  resumeReadiness: {
    score: 84,
    delta: 6,
    lastUpdated: new Date(Date.now() - 6 * 86400_000).toISOString(),
  },
  interviewConfidence: {
    score: 74,
    delta: 8,
    dimensions: [
      { label: "Communication", value: 78 },
      { label: "Technical", value: 71 },
      { label: "Problem Solving", value: 68 },
      { label: "Confidence", value: 64 },
    ],
  },
  preferredLocations: ["Bangalore", "Hyderabad", "Remote"],
  preferredSalary: { min: 18, max: 26, currency: "₹", unit: "LPA" },
  currentResumeVersion: {
    id: "v3",
    label: "v3 — Frontend focused",
    readiness: 84,
    date: new Date(Date.now() - 6 * 86400_000).toISOString(),
    targetRole: "Frontend Engineer",
  },
  education: { degree: "B.Tech, Computer Science", year: 2024, eligible: true },
  experienceYears: 2,
  roadmap: {
    currentWeek: 3,
    totalWeeks: 12,
    goal: "Become interview-ready in TypeScript.",
    progress: 63,
    remaining: { lessons: 2, projects: 1, challenges: 1 },
    behindSchedule: true,
  },
  applications: {
    responseRate: 28,
    avgMatch: 79,
    thisMonth: 11,
    lastAppliedDaysAgo: 5,
  },
};

/** Roadmap projects that will surface in Resume Center as portfolio projects. */
export type PortfolioProject = {
  id: string;
  title: string;
  week: number;
  tech: string[];
  status: "completed" | "in-progress" | "locked";
};

export const portfolioProjects: PortfolioProject[] = [
  {
    id: "p1",
    title: "Typed Component Library",
    week: 2,
    tech: ["TypeScript", "React", "Vite"],
    status: "completed",
  },
  {
    id: "p2",
    title: "Realtime Dashboard",
    week: 3,
    tech: ["React", "WebSockets", "Recharts"],
    status: "in-progress",
  },
  {
    id: "p3",
    title: "Design-System Refactor",
    week: 6,
    tech: ["Tailwind", "Storybook"],
    status: "locked",
  },
];

/** Resume version history — powers the Resume Evolution section. */
export type ResumeEvolutionEntry = {
  id: string;
  version: string;
  readiness: number;
  date: string;
  targetRole: string;
  isCurrent?: boolean;
};

export const resumeEvolution: ResumeEvolutionEntry[] = [
  {
    id: "v3",
    version: "v3",
    readiness: 84,
    date: new Date(Date.now() - 6 * 86400_000).toISOString(),
    targetRole: "Frontend Engineer",
    isCurrent: true,
  },
  {
    id: "v2",
    version: "v2",
    readiness: 78,
    date: new Date(Date.now() - 24 * 86400_000).toISOString(),
    targetRole: "Frontend Engineer",
  },
  {
    id: "v1",
    version: "v1",
    readiness: 66,
    date: new Date(Date.now() - 52 * 86400_000).toISOString(),
    targetRole: "Full-Stack Engineer",
  },
];

/** Smart, contextual notifications/insights derived from the profile. */
export type SmartInsight = {
  id: string;
  tone: "positive" | "warning" | "neutral";
  text: string;
};

export const smartInsights: SmartInsight[] = [
  { id: "i1", tone: "positive", text: "Resume readiness increased by 5 points" },
  { id: "i2", tone: "positive", text: "3 new jobs above 85% match" },
  { id: "i3", tone: "warning", text: "You haven't applied in 5 days" },
  { id: "i4", tone: "warning", text: "Current roadmap is behind schedule" },
  { id: "i5", tone: "positive", text: "Interview performance improving" },
];

export const smartNotifications: SmartInsight[] = [
  {
    id: "n1",
    tone: "positive",
    text: "A new job at Razorpay matches your profile at 92%.",
  },
  {
    id: "n2",
    tone: "warning",
    text: "Your resume hasn't been updated in 30 days.",
  },
  { id: "n3", tone: "positive", text: "Your interview score improved by 8%." },
  {
    id: "n4",
    tone: "warning",
    text: "Your response rate is dropping — 28% this month vs 36% last.",
  },
];

/** Today's Brief — morning digest. */
export const todaysBrief = {
  yesterday: [
    "Applied to 3 jobs",
    "Resume improved +2",
    "Interview completed",
  ],
  today: [
    "2 new jobs above 90% match",
    "Finish Week 2 roadmap",
    "Practice SQL interview",
  ],
};

/** Today's Focus — the daily mission checklist. */
export type FocusTask = {
  id: string;
  label: string;
  done: boolean;
  href?: string;
};

export const todaysFocus: FocusTask[] = [
  { id: "f1", label: "Apply to 3 recommended jobs", done: true, href: "/jobs" },
  { id: "f2", label: "Complete current roadmap week", done: false, href: "/roadmap" },
  {
    id: "f3",
    label: "Improve resume (+4 readiness points)",
    done: false,
    href: "/resume",
  },
  { id: "f4", label: "Finish one mock interview", done: false, href: "/interview" },
];

/** Company intelligence — UI placeholder data. */
export type CompanyIntel = {
  freshersHiring: string;
  interviewDifficulty: string;
  workMode: string;
  techStack: string[];
  avgFresherSalary: string;
  bond: string;
  hiringTrend: string;
};

export function companyIntelFor(company: string): CompanyIntel {
  const seed = company.length;
  return {
    freshersHiring: seed % 2 === 0 ? "Yes — actively" : "Occasionally",
    interviewDifficulty: ["Moderate", "Hard", "Moderate-Hard"][seed % 3],
    workMode: ["Hybrid", "On-site", "Remote-friendly"][seed % 3],
    techStack: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    avgFresherSalary: `₹${8 + (seed % 6)}–${14 + (seed % 8)} LPA`,
    bond: seed % 4 === 0 ? "12 months" : "None reported",
    hiringTrend: seed % 2 === 0 ? "Growing" : "Steady",
  };
}
