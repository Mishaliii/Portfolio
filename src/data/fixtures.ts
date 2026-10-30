export type ExperienceLevel = "fresher" | "junior" | "mid" | "senior";
export type JobType = "full-time" | "contract" | "internship";

export type JobIntel = {
  techStack?: string[];
  hiresFreshers?: boolean;
  interviewDifficulty?: "Easy" | "Medium" | "Hard";
  bondPeriod?: string;
  placementLikelihood?: "Low" | "Medium" | "High" | "Very High";
  competitiveness?: string; // e.g. "Medium — ~200 applicants"
  strengths?: string[];
  gaps?: string[];
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  postedAt: string; // ISO
  matchScore: number;
  source: string;
  experienceLevel: ExperienceLevel;
  jobType: JobType;
  redirectUrl?: string;
  easyApply?: boolean;
  salaryRange?: string;
  description?: string;
  skills?: string[];
  intel?: JobIntel;
};

export type SkillGap = {
  skill: string;
  jobsCount: number;
};

export type Activity = {
  id: string;
  type: "applied" | "interview" | "resume" | "roadmap";
  text: string;
  at: string; // ISO
};

export type ResumeBreakdown = {
  formatting: number;
  keywords: number;
  skills: number;
  experience: number;
};

export type ResumeIssue = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  hint: string;
};

export type ResumeVersion = {
  id: string;
  name: string;
  updatedAt: string;
  atsScore: number;
  isCurrent?: boolean;
};

export type ResumeSummary = {
  current: {
    fileName: string;
    updatedAt: string;
    atsScore: number;
    trend: number;
    breakdown: ResumeBreakdown;
    strongPoints: string[];
    issues: ResumeIssue[];
    keywordsPresent: string[];
    keywordsMissing: string[];
  } | null;
  versions: ResumeVersion[];
};

export type AtsAnalysis = {
  overall: number;
  breakdown: ResumeBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: {
    id: string;
    severity: "high" | "medium" | "low";
    title: string;
    detail: string;
  }[];
  sections: { name: string; present: boolean; note?: string }[];
};

export type RoadmapTask = {
  id: string;
  text: string;
  kind: "learn" | "build" | "apply" | "interview";
  estHours: number;
};

export type RoadmapResourceKind =
  | "video"
  | "documentation"
  | "practice"
  | "challenge"
  | "certificate"
  | "article"
  | "course";

export type RoadmapResource = {
  kind: RoadmapResourceKind;
  title: string;
  duration: string;
  url: string;
};

export type RoadmapProject = {
  name: string;
  description: string;
  outcome: string;
  resumeValue: 1 | 2 | 3 | 4 | 5;
  interviewFrequency: "Low" | "Medium" | "High";
  difficulty: "Easy" | "Medium" | "Hard";
  technologies: string[];
  estimatedTime: string;
  whyItMatters: string;
};

export type RoadmapWeek = {
  week: number;
  focus: string;
  goal: string;
  skills: string[];
  project: RoadmapProject;
  resources: RoadmapResource[];
  completionCriteria: string;
  tasks: RoadmapTask[];
};

export type RoadmapPlan = {
  targetRole: string;
  startedAt: string;
  totalWeeks: number;
  currentWeek: number;
  overallProgress: number;
  weeks: RoadmapWeek[];
};


export type DashboardSummary = {
  user: {
    name?: string;
    targetRole?: string;
    secondaryRoles?: string[];
    experienceYears?: number;
    education?: string;
    location?: string;
  };
  newJobsToday: number;
  alert:
    | { kind: "interview"; message: string; actionText: string; href: string }
    | { kind: "ats"; message: string; actionText: string; href: string }
    | { kind: "resume"; message: string; actionText: string; href: string }
    | null;
  metrics: {
    resumeReadiness: {
      score: number;
      trend: number;
      filename?: string;
      label?: string;
      lastUpdated?: string;
    } | null;
    applications: { total: number; interviews: number; rejected: number };
    avgMatch: { score: number; trend: number };
    interviewScore: { score: number; trend: number } | null;
  };
  verifiedSkills?: { name: string; proficiency: number }[];
  roadmap?: {
    currentWeek: number;
    totalWeeks: number;
    goal: string;
    progress: number;
    remainingLessons: number;
  } | null;
  interviewConfidence?: {
    score: number;
    delta: number;
    dimensions: { label: string; value: number }[];
  } | null;
  topMatches: Job[];
  skillGaps: SkillGap[];
  activity: Activity[];
  snapshot: {
    interviews: number;
    pending: number;
    rejected: number;
    total: number;
    responseRate: number;
    industryAvg: number;
  };
};

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86400_000).toISOString();

export const mockUser = {
  id: "u_dev",
  name: "Demo Candidate",
  email: "candidate@careerlens.internal",
  targetRole: "Frontend Engineer",
};

export const mockJobs: Job[] = [
  {
    id: "j1",
    title: "Frontend Engineer",
    company: "Zerodha",
    location: "Bangalore",
    postedAt: hoursAgo(3),
    matchScore: 88,
    source: "LinkedIn",
    experienceLevel: "junior",
    jobType: "full-time",
    redirectUrl: "https://example.com/apply/j1",
    easyApply: true,
    salaryRange: "₹18–28 LPA",
    description:
      "Build performant trading dashboards in React and TypeScript. Own component architecture across web and mobile web experiences used by millions.",
    skills: ["React", "TypeScript", "Redux", "CSS", "Testing"],
    intel: {
      techStack: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      hiresFreshers: false,
      interviewDifficulty: "Hard",
      bondPeriod: "None",
      placementLikelihood: "High",
      competitiveness: "Medium — ~200 applicants",
      strengths: ["React", "TypeScript", "Testing"],
      gaps: ["Docker", "AWS"],
    },
  },
  {
    id: "j2",
    title: "React Developer (Fresher)",
    company: "Freshworks",
    location: "Chennai",
    postedAt: hoursAgo(8),
    matchScore: 82,
    source: "Company site",
    experienceLevel: "fresher",
    jobType: "full-time",
    easyApply: true,
    salaryRange: "₹9–12 LPA",
    description:
      "Join the CRM UI team to ship features across the Freshworks suite. Great mentorship, structured onboarding, and clear growth path for new grads.",
    skills: ["React", "JavaScript", "HTML/CSS", "Git"],
  },
  {
    id: "j3",
    title: "Full-Stack Engineer",
    company: "Razorpay",
    location: "Remote",
    postedAt: hoursAgo(20),
    matchScore: 76,
    source: "Wellfound",
    experienceLevel: "mid",
    jobType: "full-time",
    salaryRange: "₹28–42 LPA",
    description:
      "Design and ship end-to-end payment flows across Node.js services and React apps. Work closely with product on merchant-facing tooling.",
    skills: ["Node.js", "React", "PostgreSQL", "AWS", "TypeScript"],
  },
  {
    id: "j4",
    title: "Software Engineer Intern",
    company: "Postman",
    location: "Bangalore",
    postedAt: daysAgo(1),
    matchScore: 74,
    source: "LinkedIn",
    experienceLevel: "fresher",
    jobType: "internship",
    easyApply: true,
    salaryRange: "₹80k–1L / month",
    description:
      "6-month internship on the API platform team. Contribute to production features with real code reviews from senior engineers.",
    skills: ["JavaScript", "React", "REST APIs", "Git"],
  },
  {
    id: "j5",
    title: "Node.js Backend Engineer",
    company: "CRED",
    location: "Bangalore",
    postedAt: daysAgo(1),
    matchScore: 69,
    source: "Instahyre",
    experienceLevel: "junior",
    jobType: "full-time",
    description:
      "Own high-throughput services powering rewards and payments. Strong focus on reliability, observability, and clean domain modeling.",
    skills: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Kafka"],
  },
  {
    id: "j6",
    title: "Senior Frontend Engineer",
    company: "Swiggy",
    location: "Hyderabad",
    postedAt: daysAgo(2),
    matchScore: 58,
    source: "LinkedIn",
    experienceLevel: "senior",
    jobType: "full-time",
    salaryRange: "₹45–70 LPA",
    description:
      "Lead frontend architecture for consumer app. Mentor engineers, drive perf budgets, and partner with design on a new design system.",
    skills: ["React", "TypeScript", "Next.js", "Performance", "System Design"],
  },
  {
    id: "j7",
    title: "Frontend Developer",
    company: "Zoho",
    location: "Kochi",
    postedAt: daysAgo(2),
    matchScore: 71,
    source: "Company site",
    experienceLevel: "junior",
    jobType: "full-time",
    easyApply: true,
    salaryRange: "₹10–16 LPA",
    description:
      "Build UI for Zoho's productivity suite. Strong emphasis on cross-browser support and accessibility across enterprise customers.",
    skills: ["JavaScript", "React", "HTML/CSS", "Accessibility"],
  },
  {
    id: "j8",
    title: "React Native Engineer",
    company: "Meesho",
    location: "Remote",
    postedAt: daysAgo(3),
    matchScore: 64,
    source: "LinkedIn",
    experienceLevel: "mid",
    jobType: "contract",
    salaryRange: "₹1.2–1.8L / month",
    description:
      "6-month contract to help ship a new seller app. Own the app end-to-end from architecture to release management on iOS and Android.",
    skills: ["React Native", "TypeScript", "iOS", "Android", "REST APIs"],
  },
  {
    id: "j9",
    title: "UI Engineer",
    company: "Groww",
    location: "Bangalore",
    postedAt: daysAgo(4),
    matchScore: 80,
    source: "LinkedIn",
    experienceLevel: "junior",
    jobType: "full-time",
    easyApply: true,
    salaryRange: "₹16–24 LPA",
    description:
      "Craft delightful investing experiences in React. Partner with design to build a polished, high-performance charting and portfolio UI.",
    skills: ["React", "TypeScript", "CSS", "D3", "Testing"],
  },
  {
    id: "j10",
    title: "Software Engineer, New Grad",
    company: "Uber",
    location: "Bangalore",
    postedAt: daysAgo(4),
    matchScore: 78,
    source: "Company site",
    experienceLevel: "fresher",
    jobType: "full-time",
    salaryRange: "₹22–30 LPA",
    description:
      "Rotational new-grad program across rider, driver, and platform teams. Structured mentorship and exposure to large-scale distributed systems.",
    skills: ["Java", "Go", "Distributed Systems", "SQL"],
  },
];

export const mockDashboard: DashboardSummary = {
  user: {
    name: mockUser.name,
    targetRole: "Frontend Engineer",
    secondaryRoles: ["Full-Stack Engineer", "UI Engineer"],
    experienceYears: 2,
    education: "B.Tech, Computer Science (2024)",
    location: "Bangalore, Hyderabad, Remote",
  },
  newJobsToday: 3,
  alert: {
    kind: "interview",
    message: "Technical assessment module scheduled with Stripe practice track",
    actionText: "Practice now",
    href: "/interview",
  },
  metrics: {
    resumeReadiness: {
      score: 84,
      trend: 6,
      filename: "Candidate_Resume_Frontend.pdf",
      label: "v3 — Frontend focused",
      lastUpdated: daysAgo(6),
    },
    applications: { total: 13, interviews: 3, rejected: 2 },
    avgMatch: { score: 82, trend: 4 },
    interviewScore: { score: 74, trend: 8 },
  },
  verifiedSkills: [
    { name: "React", proficiency: 88 },
    { name: "JavaScript", proficiency: 85 },
    { name: "CSS / Tailwind", proficiency: 78 },
    { name: "Git", proficiency: 74 },
  ],
  roadmap: {
    currentWeek: 3,
    totalWeeks: 12,
    goal: "Become interview-ready in TypeScript.",
    progress: 63,
    remainingLessons: 2,
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
  topMatches: mockJobs.slice(0, 3),
  skillGaps: [
    { skill: "TypeScript", jobsCount: 14 },
    { skill: "System Design", jobsCount: 9 },
    { skill: "Docker", jobsCount: 6 },
  ],
  activity: [
    { id: "a1", type: "applied", text: "Submitted application for Senior Frontend Engineer at Stripe", at: hoursAgo(2) },
    { id: "a2", type: "resume", text: "Uploaded and indexed resume version v3", at: daysAgo(1) },
    { id: "a3", type: "interview", text: "Completed mock interview: Technical Communication", at: daysAgo(2) },
    { id: "a4", type: "roadmap", text: "Completed Week 2 Milestone: Typed Component Library", at: daysAgo(3) },
  ],
  snapshot: {
    interviews: 3,
    pending: 8,
    rejected: 2,
    total: 13,
    responseRate: 28,
    industryAvg: 18,
  },
};

export const mockResumeSummary: ResumeSummary = {
  current: {
    fileName: "Aditi_Sharma_Frontend.pdf",
    updatedAt: daysAgo(6),
    atsScore: 72,
    trend: 4,
    breakdown: {
      formatting: 84,
      keywords: 62,
      skills: 75,
      experience: 68,
    },
    strongPoints: [
      "Clean single-column layout — parses well in most ATS",
      "Contact info and role title in top 15% of page",
      "Quantified impact in 4 of 6 experience bullets",
    ],
    issues: [
      {
        id: "i1",
        severity: "high",
        title: "Missing 'TypeScript' in skills section",
        hint: "18 of your target jobs list TypeScript as required.",
      },
      {
        id: "i2",
        severity: "high",
        title: "No summary / objective section",
        hint: "Add a 2–3 line summary tuned to Frontend Engineer roles.",
      },
      {
        id: "i3",
        severity: "medium",
        title: "3 bullets start with a passive verb",
        hint: "Replace 'was responsible for' with action verbs like 'shipped', 'led', 'built'.",
      },
      {
        id: "i4",
        severity: "medium",
        title: "Dates use inconsistent format",
        hint: "Normalize to 'Mon YYYY – Mon YYYY' across all roles.",
      },
      {
        id: "i5",
        severity: "low",
        title: "PDF contains an embedded image logo",
        hint: "Some ATS drop pages with images. Consider a text-only header.",
      },
    ],
    keywordsPresent: ["React", "JavaScript", "REST APIs", "Git", "CSS", "Agile"],
    keywordsMissing: ["TypeScript", "Docker", "System Design", "Testing", "CI/CD"],
  },
  versions: [
    {
      id: "v3",
      name: "Frontend v3 — Zerodha tuned",
      updatedAt: daysAgo(6),
      atsScore: 72,
      isCurrent: true,
    },
    {
      id: "v2",
      name: "Frontend v2 — General",
      updatedAt: daysAgo(20),
      atsScore: 64,
    },
    {
      id: "v1",
      name: "Frontend v1 — Original",
      updatedAt: daysAgo(45),
      atsScore: 51,
    },
  ],
};

export const mockAtsAnalysis: AtsAnalysis = {
  overall: 68,
  breakdown: {
    formatting: 88,
    keywords: 54,
    skills: 71,
    experience: 62,
  },
  matchedKeywords: [
    "React",
    "JavaScript",
    "REST APIs",
    "Agile",
    "Git",
    "HTML",
    "CSS",
  ],
  missingKeywords: [
    "TypeScript",
    "Next.js",
    "Testing",
    "CI/CD",
    "Accessibility",
    "Performance",
  ],
  suggestions: [
    {
      id: "s1",
      severity: "high",
      title: "Add TypeScript to skills and at least one bullet",
      detail:
        "The JD mentions TypeScript 4 times. Add it to Skills and quantify usage in one recent role.",
    },
    {
      id: "s2",
      severity: "high",
      title: "Include a tailored summary",
      detail:
        "Open with a 2–3 line summary mirroring the JD's opening paragraph — role, years, top 3 skills.",
    },
    {
      id: "s3",
      severity: "medium",
      title: "Reframe 2 bullets around impact",
      detail:
        "Replace responsibilities with outcomes: '+30% conversion', 'cut p95 latency by 240ms'.",
    },
    {
      id: "s4",
      severity: "low",
      title: "Move Education below Experience",
      detail:
        "For 2+ YoE roles, ATS scoring weighs Experience first. Move Education after it.",
    },
  ],
  sections: [
    { name: "Contact", present: true },
    { name: "Summary", present: false, note: "Recommended for this JD" },
    { name: "Skills", present: true },
    { name: "Experience", present: true },
    { name: "Education", present: true },
    { name: "Projects", present: false, note: "Nice to have" },
  ],
};

export const mockRoadmapPlan: RoadmapPlan = {
  targetRole: "Frontend Engineer",
  startedAt: daysAgo(14),
  totalWeeks: 4,
  currentWeek: 2,
  overallProgress: 25,
  weeks: [
    {
      week: 1,
      focus: "Foundations",
      goal: "Solidify modern JavaScript and tooling so you can read any React codebase.",
      skills: ["ES2020+", "Modules", "Async JS", "Git", "Vite"],
      project: {
        name: "Task Tracker CLI",
        description:
          "Build a terminal-style task manager that persists data to localStorage and supports CRUD via a clean DOM UI.",
        outcome: "A working SPA with routing, state, and async data flow.",
        resumeValue: 4,
        interviewFrequency: "High",
        difficulty: "Easy",
        technologies: ["JavaScript", "DOM", "Git"],
        estimatedTime: "5 hours",
        whyItMatters:
          "Interviewers love asking about state, event handling, and persistence — this project gives you a real answer for all three.",
      },
      resources: [
        {
          kind: "video",
          title: "JavaScript: The Hard Parts — Async",
          duration: "1h 20m",
          url: "https://www.youtube.com/results?search_query=javascript+async+hard+parts",
        },
        {
          kind: "documentation",
          title: "MDN — JavaScript Modules",
          duration: "12 min",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules",
        },
        {
          kind: "practice",
          title: "Vite Fundamentals — Hands-on",
          duration: "2h",
          url: "https://vitejs.dev/guide/",
        },
        {
          kind: "challenge",
          title: "Build a Todo App in 60 minutes",
          duration: "1h",
          url: "https://www.frontendmentor.io/challenges/todo-app-Su1_KokOW",
        },
        {
          kind: "certificate",
          title: "freeCodeCamp — JavaScript Algorithms",
          duration: "10h",
          url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
        },
      ],
      completionCriteria:
        "You can explain closures, async/await, and have a working Vite project deployed to Vercel.",
      tasks: [
        { id: "w1t1", text: "ES2020+ deep dive — modules, async, generators", kind: "learn", estHours: 4 },
        { id: "w1t2", text: "Set up ESLint + Prettier + Vite starter", kind: "build", estHours: 2 },
        { id: "w1t3", text: "Rebuild a small SPA from scratch", kind: "build", estHours: 5 },
      ],
    },
    {
      week: 2,
      focus: "TypeScript basics",
      goal: "Read and write typed React confidently without fighting the compiler.",
      skills: ["Types", "Generics", "Narrowing", "React.FC", "tsconfig"],
      project: {
        name: "Typed Movie DB",
        description:
          "Convert the Week 1 SPA to TypeScript. Add strict types for props, API responses, and global state.",
        outcome: "Zero `any` types and no TS errors on build.",
        resumeValue: 4,
        interviewFrequency: "High",
        difficulty: "Medium",
        technologies: ["TypeScript", "React", "REST APIs"],
        estimatedTime: "8 hours",
        whyItMatters:
          "Typed React is the industry default — shipping a strict-mode project proves you can join a serious codebase on day one.",
      },
      resources: [
        {
          kind: "video",
          title: "Total TypeScript — Generics",
          duration: "55m",
          url: "https://www.youtube.com/results?search_query=total+typescript+generics",
        },
        {
          kind: "documentation",
          title: "TypeScript Handbook — Narrowing",
          duration: "10 min",
          url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
        },
        {
          kind: "practice",
          title: "React + TypeScript Cheatsheet",
          duration: "3h",
          url: "https://react-typescript-cheatsheet.netlify.app/",
        },
        {
          kind: "challenge",
          title: "Type Challenges — Easy set",
          duration: "2h",
          url: "https://github.com/type-challenges/type-challenges",
        },
        {
          kind: "certificate",
          title: "Microsoft Learn — TypeScript",
          duration: "6h",
          url: "https://learn.microsoft.com/en-us/training/paths/build-javascript-applications-typescript/",
        },
      ],
      completionCriteria:
        "Convert one JS project to TS and explain the difference between `type` and `interface`.",
      tasks: [
        { id: "w2t1", text: "TS handbook: types, generics, narrowing", kind: "learn", estHours: 5 },
        { id: "w2t2", text: "Convert one JS project to TS", kind: "build", estHours: 4 },
        { id: "w2t3", text: "Study 3 open-source TS React repos", kind: "learn", estHours: 2 },
      ],
    },
    {
      week: 3,
      focus: "React patterns",
      goal: "Build composable components and understand hooks discipline.",
      skills: ["Hooks", "Composition", "Compound components", "Reconciliation", "Context"],
      project: {
        name: "Headless Combobox",
        description:
          "Create an accessible, keyboard-navigable combobox from scratch with zero external UI libraries.",
        outcome: "A reusable primitive with full a11y and unit-test coverage.",
        resumeValue: 5,
        interviewFrequency: "High",
        difficulty: "Hard",
        technologies: ["React", "TypeScript", "ARIA"],
        estimatedTime: "12 hours",
        whyItMatters:
          "Building a headless primitive from scratch is the #1 signal that separates senior frontend candidates from mid-level.",
      },
      resources: [
        {
          kind: "video",
          title: "Advanced React Patterns",
          duration: "1h 10m",
          url: "https://www.youtube.com/results?search_query=advanced+react+patterns+kent+dodds",
        },
        {
          kind: "documentation",
          title: "React Docs — Reusing Logic with Hooks",
          duration: "18 min",
          url: "https://react.dev/learn/reusing-logic-with-custom-hooks",
        },
        {
          kind: "practice",
          title: "Overreacted — Complete Guide to useEffect",
          duration: "45 min",
          url: "https://overreacted.io/a-complete-guide-to-useeffect/",
        },
        {
          kind: "challenge",
          title: "Frontend Mentor — Custom dropdown",
          duration: "3h",
          url: "https://www.frontendmentor.io/challenges",
        },
        {
          kind: "certificate",
          title: "Scrimba — Advanced React",
          duration: "8h",
          url: "https://scrimba.com/learn/advancedreact",
        },
      ],
      completionCriteria:
        "Build a headless UI primitive and explain when to lift state vs. use context.",
      tasks: [
        { id: "w3t1", text: "Build a headless UI primitive (Combobox)", kind: "build", estHours: 5 },
        { id: "w3t2", text: "Practice Q: hooks internals, reconciliation", kind: "interview", estHours: 3 },
        { id: "w3t3", text: "Apply to 3 mid-fit roles", kind: "apply", estHours: 2 },
      ],
    },
    {
      week: 4,
      focus: "Testing & Quality",
      goal: "Ship code with confidence using Vitest and Testing Library.",
      skills: ["Vitest", "Testing Library", "MSW", "A11y tests", "CI"],
      project: {
        name: "Tested Combobox + CI Pipeline",
        description:
          "Add unit, integration, and a11y tests to your Combobox. Wire GitHub Actions to run tests on every PR.",
        outcome: "A green CI badge and >80% coverage on core logic.",
        resumeValue: 4,
        interviewFrequency: "Medium",
        difficulty: "Medium",
        technologies: ["Vitest", "Testing Library", "MSW", "GitHub Actions"],
        estimatedTime: "6 hours",
        whyItMatters:
          "A public repo with a green CI badge and real coverage is a hiring-manager magnet — it proves you ship production-grade work.",
      },
      resources: [
        {
          kind: "video",
          title: "Testing Library Best Practices",
          duration: "45m",
          url: "https://www.youtube.com/results?search_query=testing+library+best+practices",
        },
        {
          kind: "documentation",
          title: "Vitest — Official Docs",
          duration: "20 min",
          url: "https://vitest.dev/guide/",
        },
        {
          kind: "practice",
          title: "Mock Service Worker 101",
          duration: "1h",
          url: "https://mswjs.io/docs/basics",
        },
        {
          kind: "challenge",
          title: "Testing Playground — write 5 tests",
          duration: "2h",
          url: "https://testing-playground.com/",
        },
        {
          kind: "certificate",
          title: "Testing JavaScript by Kent C. Dodds",
          duration: "10h",
          url: "https://testingjavascript.com/",
        },
      ],
      completionCriteria:
        "Cover the Combobox with unit + a11y tests and set up a GitHub Actions workflow.",
      tasks: [
        { id: "w4t1", text: "Cover the Combobox with unit + a11y tests", kind: "build", estHours: 4 },
        { id: "w4t2", text: "Learn MSW for API mocking", kind: "learn", estHours: 2 },
      ],
    },
  ],
};


// ============= Phase 3: Tracker =============

export type TrackerStatus =
  | "saved"
  | "applied"
  | "interview"
  | "assessment"
  | "offer"
  | "rejected";

export type TrackerApplication = {
  id: string;
  jobId: string;
  company: string;
  role: string;
  location: string;
  matchScore: number;
  status: TrackerStatus;
  appliedAt: string; // ISO
  notes?: string;
  history: { status: TrackerStatus; at: string }[];
};

export const TRACKER_COLUMNS: {
  status: TrackerStatus;
  label: string;
  color: string;
  dot: string;
}[] = [
  { status: "saved", label: "Saved", color: "bg-surface-2 text-text", dot: "bg-text-muted" },
  { status: "applied", label: "Applied", color: "bg-accent/10 text-accent-hi", dot: "bg-accent" },
  { status: "interview", label: "Interview", color: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  { status: "assessment", label: "Assessment", color: "bg-sky-100 text-sky-800", dot: "bg-sky-500" },
  { status: "offer", label: "Offer", color: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  { status: "rejected", label: "Rejected", color: "bg-rose-100 text-rose-800", dot: "bg-rose-500" },
];

export const mockTracker: TrackerApplication[] = [
  { id: "t1", jobId: "j1", company: "Zerodha", role: "Frontend Engineer", location: "Bangalore", matchScore: 88, status: "interview", appliedAt: daysAgo(6), notes: "Recruiter call went well. Technical round scheduled.", history: [{ status: "saved", at: daysAgo(8) }, { status: "applied", at: daysAgo(6) }, { status: "interview", at: daysAgo(2) }] },
  { id: "t2", jobId: "j3", company: "Razorpay", role: "Full-Stack Engineer", location: "Remote", matchScore: 76, status: "applied", appliedAt: daysAgo(2), history: [{ status: "applied", at: daysAgo(2) }] },
  { id: "t3", jobId: "j9", company: "Groww", role: "UI Engineer", location: "Bangalore", matchScore: 80, status: "assessment", appliedAt: daysAgo(9), notes: "Take-home due Friday.", history: [{ status: "applied", at: daysAgo(9) }, { status: "assessment", at: daysAgo(4) }] },
  { id: "t4", jobId: "j2", company: "Freshworks", role: "React Developer", location: "Chennai", matchScore: 82, status: "applied", appliedAt: daysAgo(1), history: [{ status: "applied", at: daysAgo(1) }] },
  { id: "t5", jobId: "j5", company: "CRED", role: "Node.js Backend Engineer", location: "Bangalore", matchScore: 69, status: "rejected", appliedAt: daysAgo(14), notes: "Passed on to another candidate.", history: [{ status: "applied", at: daysAgo(14) }, { status: "rejected", at: daysAgo(7) }] },
  { id: "t6", jobId: "j10", company: "Uber", role: "Software Engineer, New Grad", location: "Bangalore", matchScore: 78, status: "saved", appliedAt: daysAgo(0), history: [{ status: "saved", at: daysAgo(0) }] },
  { id: "t7", jobId: "j7", company: "Zoho", role: "Frontend Developer", location: "Kochi", matchScore: 71, status: "saved", appliedAt: daysAgo(1), history: [{ status: "saved", at: daysAgo(1) }] },
  { id: "t8", jobId: "j6", company: "Swiggy", role: "Senior Frontend Engineer", location: "Hyderabad", matchScore: 58, status: "interview", appliedAt: daysAgo(12), notes: "Round 2 with hiring manager.", history: [{ status: "applied", at: daysAgo(12) }, { status: "interview", at: daysAgo(5) }] },
  { id: "t9", jobId: "j4", company: "Postman", role: "Software Engineer Intern", location: "Bangalore", matchScore: 74, status: "offer", appliedAt: daysAgo(18), notes: "Offer letter received. Deadline: next Monday.", history: [{ status: "applied", at: daysAgo(18) }, { status: "interview", at: daysAgo(10) }, { status: "offer", at: daysAgo(2) }] },
];

// ============= Phase 3: Interview Coach =============

export type InterviewTopic = "frontend" | "backend" | "system-design" | "behavioral" | "dsa";

export type InterviewQuestion = {
  id: string;
  topic: InterviewTopic;
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  hints: string[];
  idealAnswer: string;
  keyPoints: string[];
};

export type InterviewSession = {
  id: string;
  topic: InterviewTopic;
  date: string;
  score: number;
  questionsAnswered: number;
  duration: string;
};

export const INTERVIEW_TOPICS: { id: InterviewTopic; label: string; color: string }[] = [
  { id: "frontend", label: "Frontend", color: "bg-accent/10 text-accent-hi" },
  { id: "backend", label: "Backend", color: "bg-emerald-100 text-emerald-800" },
  { id: "system-design", label: "System Design", color: "bg-violet-100 text-violet-800" },
  { id: "behavioral", label: "Behavioral", color: "bg-amber-100 text-amber-800" },
  { id: "dsa", label: "DSA", color: "bg-sky-100 text-sky-800" },
];

export const mockInterviewQuestions: InterviewQuestion[] = [
  { id: "q1", topic: "frontend", difficulty: "easy", prompt: "Explain the difference between let, const, and var in JavaScript.", hints: ["Think about scope", "What about hoisting?", "Consider reassignment"], idealAnswer: "var is function-scoped and hoisted with undefined initialization. let and const are block-scoped and hoisted but in the temporal dead zone. const additionally cannot be reassigned (though objects can be mutated).", keyPoints: ["Scope: function vs block", "Hoisting behavior", "Reassignment rules", "Temporal dead zone"] },
  { id: "q2", topic: "frontend", difficulty: "medium", prompt: "How does React's reconciliation algorithm work?", hints: ["Think about the virtual DOM", "How does React decide what to update?", "What role do keys play?"], idealAnswer: "React builds a virtual DOM tree, diffs it against the previous tree using heuristics: same type elements are updated in place, different types are replaced. Lists use keys for stable identity across renders.", keyPoints: ["Virtual DOM diffing", "Element type comparison", "Keys for list stability", "O(n) heuristic"] },
  { id: "q3", topic: "frontend", difficulty: "hard", prompt: "Design a debounce function with cancel support in TypeScript.", hints: ["Think about closures", "What about generics for args?", "How do you cancel a pending call?"], idealAnswer: "Use setTimeout stored in a closure. Return a callable with a cancel method that clears the timeout. Use generics to preserve arg types.", keyPoints: ["Generics for type safety", "Closure for timer state", "Cancel method", "Edge cases: leading/trailing"] },
  { id: "q4", topic: "backend", difficulty: "medium", prompt: "What's the difference between SQL and NoSQL databases?", hints: ["Data model", "Consistency", "Scale patterns"], idealAnswer: "SQL uses structured schemas, ACID transactions, and vertical scaling. NoSQL is schema-flexible, often BASE, and horizontally scalable. Choose based on query patterns, consistency needs, and scale.", keyPoints: ["Schema flexibility", "ACID vs BASE", "Scaling patterns", "Use cases"] },
  { id: "q5", topic: "system-design", difficulty: "hard", prompt: "Design a URL shortener like bit.ly.", hints: ["Think about the ID generation", "How do you handle high read load?", "Analytics?"], idealAnswer: "Use base62 encoding of an auto-increment ID or hash. Store in KV store like Redis for reads, Postgres for durability. Add CDN cache for hot URLs. Analytics via async event stream.", keyPoints: ["ID generation strategy", "Read-heavy caching", "Analytics pipeline", "Custom aliases"] },
  { id: "q6", topic: "behavioral", difficulty: "medium", prompt: "Tell me about a time you disagreed with a teammate. How did you resolve it?", hints: ["Use STAR: Situation, Task, Action, Result", "Focus on outcome", "Show empathy"], idealAnswer: "Use the STAR framework: describe the situation and stakes, the task at hand, the specific actions you took to align, and the concrete result. Emphasize listening and shared goals over winning.", keyPoints: ["STAR structure", "Empathy shown", "Concrete outcome", "What you learned"] },
  { id: "q7", topic: "dsa", difficulty: "medium", prompt: "Given an array of integers, find two numbers that add up to a target sum. Return their indices.", hints: ["Can you do better than O(n²)?", "Think about a hash map", "One pass or two?"], idealAnswer: "Use a hash map from value to index. Iterate once: for each num, check if (target - num) is in the map. O(n) time, O(n) space.", keyPoints: ["Hash map approach", "Single pass", "O(n) time and space", "Handle duplicates"] },
  { id: "q8", topic: "frontend", difficulty: "medium", prompt: "What are React hooks and why were they introduced?", hints: ["What problems did classes have?", "Reusing logic?", "Rules of hooks?"], idealAnswer: "Hooks let function components use state and lifecycle. They solve wrapper hell from HOCs/render props, make stateful logic reusable via custom hooks, and simplify complex class components.", keyPoints: ["Reusable stateful logic", "No wrapper hell", "Rules: top-level only", "Custom hooks"] },
];

export const mockInterviewSessions: InterviewSession[] = [
  { id: "s1", topic: "frontend", date: daysAgo(1), score: 82, questionsAnswered: 5, duration: "24 min" },
  { id: "s2", topic: "system-design", date: daysAgo(3), score: 65, questionsAnswered: 3, duration: "38 min" },
  { id: "s3", topic: "behavioral", date: daysAgo(5), score: 78, questionsAnswered: 6, duration: "18 min" },
  { id: "s4", topic: "dsa", date: daysAgo(7), score: 71, questionsAnswered: 4, duration: "42 min" },
];

// ============= Phase 3: Profile =============

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  bio: string;
  targetRoles: string[];
  yearsOfExperience: number;
  currentRole: string;
  skills: string[];
  desiredSalary: string;
  workAuthorization: string;
  openToRemote: boolean;
  openToRelocation: boolean;
  links: { linkedin: string; github: string; portfolio: string };
};

export const mockProfile: UserProfile = {
  name: "Aditi Sharma",
  email: "aditi@example.com",
  phone: "+91 98765 43210",
  location: "Bangalore, India",
  headline: "Frontend Engineer · React & TypeScript",
  bio: "Frontend engineer with 2 years of experience shipping polished React apps. Currently focused on TypeScript, testing, and design systems. Open to product-focused teams.",
  targetRoles: ["Frontend Engineer", "React Developer", "UI Engineer"],
  yearsOfExperience: 2,
  currentRole: "Frontend Developer at Zoho",
  skills: ["React", "TypeScript", "JavaScript", "CSS", "HTML", "Git", "REST APIs", "Testing"],
  desiredSalary: "₹18–28 LPA",
  workAuthorization: "Indian citizen · no sponsorship needed",
  openToRemote: true,
  openToRelocation: false,
  links: {
    linkedin: "https://linkedin.com/in/aditi-sharma",
    github: "https://github.com/aditi-sharma",
    portfolio: "https://aditi.dev",
  },
};

// ============= Easy Apply =============

export type EasyApplyStats = {
  ready: number;
  appliedThisWeek: number;
  savedForLater: number;
  responseRate: number;
};

export type EasyApplyApplication = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  appliedAt: string;
  status: "applied" | "interview" | "rejected" | "saved";
};

export const mockEasyApplyStats: EasyApplyStats = {
  ready: 5,
  appliedThisWeek: 3,
  savedForLater: 8,
  responseRate: 28,
};

export const mockEasyApplyHistory: EasyApplyApplication[] = [
  { id: "ea1", jobId: "j1", title: "Frontend Engineer", company: "Zerodha", location: "Bangalore", matchScore: 88, appliedAt: daysAgo(2), status: "applied" },
  { id: "ea2", jobId: "j2", title: "React Developer (Fresher)", company: "Freshworks", location: "Chennai", matchScore: 82, appliedAt: daysAgo(4), status: "interview" },
  { id: "ea3", jobId: "j4", title: "Software Engineer Intern", company: "Postman", location: "Bangalore", matchScore: 74, appliedAt: daysAgo(5), status: "applied" },
  { id: "ea4", jobId: "j9", title: "UI Engineer", company: "Groww", location: "Bangalore", matchScore: 80, appliedAt: daysAgo(6), status: "saved" },
  { id: "ea5", jobId: "j7", title: "Frontend Developer", company: "Zoho", location: "Kochi", matchScore: 71, appliedAt: daysAgo(7), status: "rejected" },
];
