import ddssRetrieval from "@/assets/ddss-screen.webp";
import sampleA from "@/assets/skin-sample-a.jpg";
import sampleB from "@/assets/skin-sample-b.jpg";
import sampleC from "@/assets/skin-sample-c.jpg";

export const site = {
  name: "Muhammed Mishal",
  role: "AI / ML Engineer",
  location: "KOLLAM, INDIA [IND] - 8.8932 N, 76.6141 E",
  roleYear: "AI / ML ENGINEER // 2026",
  wordmark: "MISHAL",
  tag: "AI / ML",
  email: "muhammedmishalkpm13@gmail.com",
  github: "https://github.com/Mishaliii",
  linkedin: "https://www.linkedin.com/",
  cv: "/cv.pdf",
  availability: "Open to roles in Kerala, UAE or remote",
  timezone: "Asia/Kolkata",
};

export const ui = {
  downloadCv: "Download CV",
  sayHello: "Say hello",
  viewProjects: "View projects",
  copyEmail: "Copy email",
  github: "GitHub",
  linkedin: "LinkedIn",
  copied: "Copied",
  view: "View",
  pull: "Pull",
  skip: "Skip intro",
  paletteTitle: "Command palette",
  palettePlaceholder: "Type a command...",
  paletteHint: "Ctrl K",
  backToOverview: "Back to overview",
  copyright: "(c) 2026 MISHAL",
  istLabel: "IST",
  scrollHint: "Scroll / ↓ / 1-6",
  performance: {
    title: "Performance",
    fps: "FPS",
    frame: "Frame",
    longest: "Longest",
    tasks: "Long tasks",
    heap: "JS heap",
    unavailable: "n/a",
    layers: {
      shader: "Scene shader",
      video: "Video upload / playback",
      headline: "Headline dissolve",
      grain: "Grain overlay",
      blur: "Nav backdrop blur",
      gradients: "Gradient overlays",
      lenis: "Lenis",
      wipe: "Section wipe",
    },
  },
};

export const pages = [
  { id: "overview", num: "00", label: "Overview" },
  { id: "about", num: "01", label: "About" },
  { id: "expertise", num: "02", label: "Expertise" },
  { id: "works", num: "03", label: "Works" },
  { id: "journey", num: "04", label: "Journey" },
  { id: "connect", num: "05", label: "Connect" },
];

export const intro = {
  status: "Loading portfolio",
  skip: "SKIP",
  clusters: ["Backend", "Vision", "Retrieval", "Practice"],
  lines: ["loading embeddings", "indexing 3 projects", "top-k ready"],
};

export const hero = {
  line1: "AI / ML",
  line2: "ENGINEER",
  scene: { alt: "Illustrated portrait of Mishal working at his laptop at night" },
  chip: "OPEN TO WORK, 2026",
  h1: ["AI / ML", "ENGINEER."],
  sub: "I build vision, retrieval and backend systems that run in production.",
  cta1: "Download CV",
  cta2: "View projects",
  status: "Open to work, 2026",
  openToWork: "Open to work, 2026",
  loading: "Loading portfolio",
};

export const about = {
  name: "MISHAL",
  period: ".",
  fullName: "MUHAMMED MISHAL",
  role: " · AI / ML ENGINEER · KOLLAM, KERALA",
  bio: "I'm an AI/ML engineer from Kollam. I build machine learning and computer vision systems and serve them through tested Python APIs. At Bluecast Technologies I built a dermatology decision-support system that finds similar cases with DINOv2 and FAISS.",
  portraitAlt: "Portrait of Muhammed Mishal",
  seeWorks: "See works",
  facts: [
    { label: "EDUCATION", bold: "MCA · CGPA 8.33", text: " · TKM College of Engineering, Kollam · 2024-26", secondary: "BCA · Musaliar College of Arts and Science · 2021-24" },
    { label: "EXPERIENCE", bold: "AI / ML Intern, DDSS", text: " · Bluecast Technologies · Jan-Apr 2026", secondary: "Built a dermatology decision-support system using DINOv2 case retrieval" },
    { label: "STACK", text: "Python, FastAPI, Django, PyTorch, FAISS, scikit-learn, PostgreSQL" },
    { label: "STATUS", bold: "Open to work, 2026", text: " · Kerala / Remote", live: true },
  ],
};

export type Skill = { id: string; name: string; cluster: number; x: number; y: number; note: string };
export const PROJECTS: Record<string, { status: string; target: string; skills: string[] }> = {
  "Dermatology Decision Support": { status: "done", target: "ddss", skills: ["Python","FastAPI","PyTorch","DINOv2","FAISS","OpenCV","PostgreSQL","Image retrieval","React / TS"] },
  "Productivity & Role Prediction": { status: "done", target: "role", skills: ["Python","Pandas","scikit-learn","SQLite"] },
  "CareerLens AI": { status: "backend built", target: "careerlens", skills: ["Python","FastAPI","REST design","SQLite","FAISS","Gemini API","RAG pipelines","Sentence Transformers","Testing"] },
  "This portfolio": { status: "live", target: "overview", skills: ["React / TS","Git"] },
};

export const expertise = {
  heading: "MY EXPERTISE.",
  intro: "Hover a skill to see where I used it.",
  idle: "Hover a skill",
  core: "Core skill, used day to day.",
  dockerCore: "Core skill, from college work.",
  usedWithPrefix: "Used with ",
  legend: {
    used: "Used in a project",
    building: "Building",
    core: "Core skill",
  },
  clusters: ["BACKEND & DATA", "ML & VISION", "RETRIEVAL & RAG", "ENGINEERING"],
  skills: [
    { id: "py", name: "Python", cluster: 0, x: .15, y: .24, note: "" },
    { id: "fastapi", name: "FastAPI", cluster: 0, x: .29, y: .21, note: "" },
    { id: "rest", name: "REST design", cluster: 0, x: .15, y: .33, note: "" },
    { id: "pg", name: "PostgreSQL", cluster: 0, x: .29, y: .32, note: "" },
    { id: "sqlite", name: "SQLite", cluster: 0, x: .22, y: .42, note: "" },
    { id: "torch", name: "PyTorch", cluster: 1, x: .64, y: .23, note: "" },
    { id: "dino", name: "DINOv2", cluster: 1, x: .80, y: .23, note: "" },
    { id: "sk", name: "scikit-learn", cluster: 1, x: .64, y: .33, note: "" },
    { id: "pandas", name: "Pandas", cluster: 1, x: .80, y: .34, note: "" },
    { id: "cv", name: "OpenCV", cluster: 1, x: .70, y: .43, note: "" },
    { id: "image", name: "Image retrieval", cluster: 2, x: .62, y: .67, note: "" },
    { id: "sentence", name: "Sentence Transformers", cluster: 2, x: .81, y: .67, note: "" },
    { id: "faiss", name: "FAISS", cluster: 2, x: .64, y: .78, note: "" },
    { id: "rag", name: "RAG pipelines", cluster: 2, x: .77, y: .78, note: "" },
    { id: "gemini", name: "Gemini API", cluster: 2, x: .69, y: .87, note: "" },
    { id: "git", name: "Git", cluster: 3, x: .15, y: .67, note: "" },
    { id: "docker", name: "Docker", cluster: 3, x: .29, y: .67, note: "" },
    { id: "test", name: "Testing", cluster: 3, x: .15, y: .78, note: "" },
    { id: "react", name: "React / TS", cluster: 3, x: .29, y: .78, note: "" },
    { id: "streamlit", name: "Streamlit", cluster: 3, x: .21, y: .87, note: "" },
  ] as Skill[],
};

export type ImportanceItem = { label: string; value: number };
export type PipelineStep = { label: string; shot: string; zoom?: boolean };
export type PipelineRow = { label: string; shot: string; zoom?: boolean };
export type FilmstripItem = { k: string; t: string };
export type PipelineBox = { label: string; caption: string; built: boolean; desc?: string };

export type TableRow = {
  id: string;
  vals: string[];
};

export type TableOutput = {
  label: string;
  vals: string[];
};

export type Project = {
  id: string;
  title: string;
  sentence: string;
  line?: string;
  mutedLine?: string;
  statusLine?: string;
  buttonLabel?: string;
  badge?: string;
  pipelineSteps?: PipelineStep[] | string[];
  pipelineRows?: PipelineRow[];
  filmstrip?: FilmstripItem[];
  importance?: ImportanceItem[];
  table?: {
    columns: string[];
    rows: TableRow[];
    outputs: TableOutput[];
  };
  pipelineBoxes?: PipelineBox[];
  links: { live?: string; github?: string; video?: string };
  metrics: { label: string; value: string }[];
  problem?: string;
  approach?: string;
  result?: string;
  limitations?: string;
  stack?: string[];
};

export type CaseStudyData = {
  title: string | string[];
  badge?: string;
  close: string;
  closeKey?: string;
  galleryLabel?: string;
  galleryPrevious?: string;
  galleryNext?: string;
  galleryError?: string;
  galleryRetry?: string;
  galleryCount?: string;
  nav: { id: string; label: string }[];
  sections: CaseStudySection[];
  shots?: { k: string; t: string; d: string }[];
};

export type CaseStudyScreen = { shot: string; label: string; desc: string };

export type CaseStudySection = {
  id: string;
  num: string;
  title: string;
  text?: string;
  shot?: string;
  shots?: string[];
  shotCaption?: string;
  methods?: { name: string; desc: string }[];
  points?: string[];
  screens?: CaseStudyScreen[];
};

export const works = {
  heading: "SELECTED WORKS.",
  labels: {
    problem: "Problem",
    approach: "Approach",
    result: "Result",
    limitations: "Limitations",
    live: "Live",
    github: "GitHub",
    video: "Demo video",
    demo: "Product preview",
    status: "Status",
    deepDive: "Deep Dive",
  },
  playDemo: "Play demo",
  projects: [
    {
      id: "ddss",
      title: "Dermatology Decision Support",
      sentence: "A doctor gets a ranked list of similar cases with the evidence, not one confident guess.",
      line: "DINOv2 embeddings and FAISS similarity search. Built at Bluecast Technologies.",
      mutedLine: "Support, not diagnosis.",
      buttonLabel: "Deep Dive",
      statusLine: "Support, not diagnosis.",
      pipelineRows: [
        { label: "Photo", shot: "ddss-6", zoom: false },
        { label: "Embedding", shot: "ddss-7", zoom: false },
        { label: "Similarity search", shot: "ddss-8", zoom: false },
        { label: "Ranked cases", shot: "ddss-8", zoom: true },
      ],
      filmstrip: [
        { k: "ddss-2", t: "Dashboard" },
        { k: "ddss-4", t: "Add patient" },
        { k: "ddss-5", t: "Patient history" },
        { k: "ddss-6", t: "Photo" },
        { k: "ddss-7", t: "Embedding" },
        { k: "ddss-8", t: "Similarity" },
        { k: "ddss-9", t: "Severity" },
        { k: "ddss-10", t: "Plan" },
      ],
      pipelineSteps: [
        { label: "Photo", shot: "ddss-6" },
        { label: "Embedding", shot: "ddss-7" },
        { label: "Similarity search", shot: "ddss-8" },
        { label: "Ranked cases", shot: "ddss-8" },
      ],
      links: {},
      metrics: [],
      problem: "A doctor gets a ranked list of similar cases with the evidence, not one confident guess.",
      approach: "DINOv2 embeddings and FAISS similarity search. Built at Bluecast Technologies.",
      result: "Support, not diagnosis.",
      stack: ["DINOv2 ViT-B", "PyTorch", "FAISS", "pgvector"],
    },
    {
      id: "role",
      title: "Productivity and Role Prediction",
      sentence: "Predicts how productive a worker is and groups workers by behaviour.",
      line: "Random Forest regression for the productivity score, K-Means for the worker groups.",
      mutedLine: "Objective numeric score and behavioural cluster pattern.",
      statusLine: "Random Forest regression and K-Means clustering.",
      buttonLabel: "Details",
      pipelineSteps: [
        "Behaviour features",
        "Random Forest regression",
        "K-Means clustering",
        "Score and role",
      ],
      table: {
        columns: [
          "Subject",
          "Typing_Intensity",
          "Idle_Duration",
          "Task_Switching_Frequency",
          "Time_Coding",
          "Time_Email",
          "Time_SocialMedia",
          "Time_Browsing",
          "Time_Docs",
        ],
        rows: [
          { id: "S001", vals: ["75", "23", "11", "4.9", "7.65", "9.8", "13.78", "13.16"] },
          { id: "S003", vals: ["61", "9", "7", "10.86", "12.22", "7.87", "7.6", "7.33"] },
          { id: "S007", vals: ["87", "13", "4", "18.26", "19.24", "12.07", "0.33", "0.33"] },
        ],
        outputs: [
          { label: "Productivity score", vals: ["S001 53.48", "S003 54.36", "S007 77.14"] },
          { label: "Label", vals: ["Medium", "Medium", "High"] },
          { label: "Role", vals: ["Manager"] },
        ],
      },
      importance: [] as ImportanceItem[],
      links: {},
      metrics: [],
      problem: "Predicts how productive a worker is and groups workers by behaviour.",
      approach: "Random Forest regression for the productivity score, K-Means for the worker groups.",
      stack: ["scikit-learn", "Python", "pandas"],
    },
    {
      id: "careerlens",
      title: "CareerLens AI",
      sentence: "Matches a resume to roles and explains the gaps. Backend is built and tested; the front end is being rebuilt.",
      line: "Sentence Transformers embeddings of resumes and roles, FAISS similarity search, Gemini gap explanation.",
      mutedLine: "Automated semantic role matching with verified citations.",
      statusLine: "Backend built and tested. Front end being rebuilt.",
      buttonLabel: "Details",
      pipelineSteps: [
        "Resume extraction",
        "MiniLM embeddings",
        "FAISS search",
        "Gemini citations",
        "Skill gaps & store",
      ],
      pipelineBoxes: [
        { label: "Resume PDF", caption: "Resume parsing", built: true, desc: "Parses candidate profile data from raw PDF documents." },
        { label: "Profile extraction", caption: "Profile extraction", built: true, desc: "Extracts technical skills, experience, and education into structured entities." },
        { label: "Embeddings (MiniLM)", caption: "MiniLM embeddings", built: true, desc: "Generates 384-dimensional dense semantic vectors using Sentence Transformers." },
        { label: "FAISS search", caption: "Cosine similarity", built: true, desc: "Indexes role definitions and runs fast nearest-neighbor similarity searches." },
        { label: "Gemini explanation with citations", caption: "Gemini citations", built: true, desc: "Synthesises personalised skill gap analysis with direct source citations." },
        { label: "Job match and skill gaps", caption: "SQLAlchemy store", built: true, desc: "Calculates match scores and persists role-fit evaluation in SQLite." },
        { label: "Front end", caption: "Being rebuilt", built: false, desc: "Next-generation responsive UI currently in active development." },
        { label: "Deployment", caption: "Pending", built: false, desc: "Cloud containerization and deployment pending frontend completion." },
      ],
      links: {},
      metrics: [],
      problem: "Matches a resume to roles and explains the gaps. Backend is built and tested; the front end is being rebuilt.",
      approach: "Sentence Transformers embeddings of resumes and roles, FAISS similarity search, Gemini gap explanation.",
      stack: ["FastAPI", "Python", "SQLite", "Sentence Transformers", "FAISS", "Gemini API"],
    },
  ] as Project[],
  ddssDemo: {
    img: ddssRetrieval,
    alt: "DermAI uploaded skin image alongside ranked differential suggestions and confidence scores",
  },
  demoNote: "Recorded retrieval result · not live inference",
  retrievalDemo: {
    title: "Try retrieval",
    badge: "PRECOMPUTED DEMO",
    intro: "DDSS compares a skin image with reference images using visual embeddings. This public demo presents prepared examples from the research workflow, without running the model.",
    disclaimer: "This is an experimental research demonstration using precomputed image-similarity results. Similarity does not establish a diagnosis and should not replace evaluation by a qualified healthcare professional.",
    sampleNote: "Sample illustration · approved query images and actual retrieval results have not been supplied yet.",
    queryLabel: "Query image",
    resultsLabel: "Similar reference cases",
    referenceLabel: "Reference image",
    anotherExample: "Select another example",
    similarityLabel: "Similarity",
    empty: "No reference matches for this sample.",
    references: [] as ReferenceCase[],
    samples: [
      { id: "sample-a", label: "Example 1", image: sampleA, placeholder: true, matches: [] },
      { id: "sample-b", label: "Example 2", image: sampleB, placeholder: true, matches: [] },
      { id: "sample-c", label: "Example 3", image: sampleC, placeholder: true, matches: [] },
    ] as RetrievalSample[],
  },
  caseStudy: {
    title: ["DERMATOLOGY", "DECISION SUPPORT."],
    close: "Close",
    closeKey: "Esc",
    galleryLabel: "PRODUCT SCREENS / 10 CAPTURES",
    galleryPrevious: "Previous screen",
    galleryNext: "Next screen",
    galleryError: "This screenshot could not be loaded.",
    galleryRetry: "Retry",
    galleryCount: "of",
    nav: [
      { id: "what-it-does", label: "What it does" },
      { id: "workflow-screens", label: "Workflow screens" },
      { id: "data-preprocessing", label: "Data & preprocessing" },
      { id: "embedding-search", label: "Embedding & search" },
      { id: "backend-api", label: "Backend & API" },
      { id: "retrieval-methods", label: "Retrieval methods" },
      { id: "limits-next-steps", label: "Limits & next steps" },
    ],
    sections: [
      {
        id: "what-it-does",
        num: "1",
        title: "What it does",
        text: "A doctor uploads a lesion photo and gets ranked similar past cases with the evidence. It supports a clinical decision, it does not make one.",
        points: [
          "Candidate conditions are ranked with visual similarity evidence.",
          "Clinician stays in control from intake to treatment plan confirmation.",
        ],
      },
      {
        id: "workflow-screens",
        num: "2",
        title: "The clinical workflow screens",
        text: "Six key product screens from patient intake to treatment planning:",
        screens: [
          { shot: "ddss-2", label: "Dashboard", desc: "Daily patient intake, visit logs, and disease distribution at a glance." },
          { shot: "ddss-5", label: "Patient history", desc: "Chronological visit records with past diagnoses and case notes." },
          { shot: "ddss-6", label: "Photo upload", desc: "High-resolution lesion image upload with automated quality checks." },
          { shot: "ddss-8", label: "Differentials", desc: "Similar conditions ranked with confidence bars for clinician confirmation." },
          { shot: "ddss-9", label: "GASI severity", desc: "Region-based severity calculator mapping scores to Mild, Moderate, or Severe." },
          { shot: "ddss-10", label: "Treatment plan", desc: "Pre-filled medications and dosages that the doctor edits, approves, and saves." },
        ],
      },
      {
        id: "data-preprocessing",
        num: "3",
        title: "Data and preprocessing",
        text: "The reference database is built on the published SD-198 benchmark dataset covering 198 skin conditions.",
        points: [
          "Reference set: SD-198 is partitioned into reference training cases and a held-out evaluation test split.",
          "Image preparation: Photos are preprocessed using OpenCV and Pillow, resized to 224×224 pixels, and normalised.",
          "Patch division: The 224×224 image is divided into a 14×14 grid of 16×16 patches for Vision Transformer attention.",
        ],
      },
      {
        id: "embedding-search",
        num: "4",
        title: "Embedding and search",
        text: "Query images are matched in visual vector space rather than passing through a hard single-label classifier.",
        points: [
          "DINOv2 ViT-B model: Vision Transformer Base backbone extracts patch tokens without supervised label bias.",
          "768-d embedding: The [CLS] token condenses lesion color and texture into a single 768-dimensional dense vector.",
          "Similarity metric: Cosine similarity compares the query vector against indexed reference embeddings.",
          "FAISS index: Nearest-neighbour vector search retrieves closest reference matches with low latency.",
          "Ranked results: Returns top-3 candidate cases with similarity bars mapped to High, Moderate, and Low confidence tiers.",
        ],
        shot: "ddss-8",
        shotCaption: "Ranked differential candidates with similarity confidence bars.",
      },
      {
        id: "backend-api",
        num: "5",
        title: "Backend and API",
        text: "The architecture separates clinical record management from low-latency visual inference services.",
        points: [
          "Framework: Django powers the clinical portal, patient history, and severity grading; FastAPI serves vector retrieval.",
          "Database: PostgreSQL stores patient records, case history, diagnoses, and saved prescriptions.",
          "Authentication: Role-based doctor login provides secure access to the private clinical workspace.",
        ],
      },
      {
        id: "retrieval-methods",
        num: "6",
        title: "Retrieval methods compared",
        methods: [
          { name: "MV-Mean", desc: "Averages feature vectors across multiple views of the same lesion into one centroid. Dropped because diverse stages blurred into unrepresentative averages." },
          { name: "MV-CLS", desc: "Pools CLS token embeddings across multiple views to preserve visual transformer attention." },
          { name: "kNN (FAISS)", desc: "Nearest-neighbour lookup over indexed individual training cases using cosine similarity, preserving intra-condition variety." },
        ],
      },
      {
        id: "limits-next-steps",
        num: "7",
        title: "Limits and next steps",
        points: [
          "Decision support only: The system retrieves visual evidence; it does not replace a clinician's diagnosis.",
          "Reference set dependency: Retrieval fidelity is bounded by the coverage and distribution of indexed conditions.",
          "Evaluation plan: Measure top-k recall (Top-1, Top-3, Top-5) and diagnostic agreement on the held-out SD-198 test split across skin condition categories.",
          "Clinical review: All treatment plans and confirmed diagnoses require sign-off by a qualified dermatologist.",
        ],
      },
    ] as CaseStudySection[],
    shots: [
      { k: "ddss", t: "Sign in", d: "Doctors sign in to a private workspace." },
      { k: "ddss-2", t: "Dashboard", d: "Daily patients, visits and disease counts at a glance." },
      { k: "ddss-3", t: "Analytics", d: "Cases per month and severity distribution." },
      { k: "ddss-4", t: "Add patient", d: "Name, age, gender and contact create a new record." },
      { k: "ddss-5", t: "Patient history", d: "Every earlier visit with its confirmed diagnosis." },
      { k: "ddss-6", t: "Upload", d: "A lesion photograph starts the analysis." },
      { k: "ddss-7", t: "Image analysis", d: "The photo is checked before the model runs." },
      { k: "ddss-8", t: "Ranked differential", d: "Similar conditions ranked with confidence bars; the doctor confirms one." },
      { k: "ddss-9", t: "Severity: GAGS", d: "Region sliders compute the acne severity score." },
      { k: "ddss-10", t: "Treatment plan", d: "Pre-filled medicines the doctor edits and saves." },
    ],
  },
};

export type ReferenceCase = { id: string; image: string; label?: string; note?: string };
export type RetrievalSample = { id: string; label: string; image: string; placeholder?: boolean; matches: { referenceId: string; similarity?: number }[] };

export type JourneyStop = {
  year: string;
  role: string;
  place: string;
  line: string;
  tag?: string;
};

export const journey = {
  heading: "ACADEMIC & INDUSTRY JOURNEY.",
  stops: [
    {
      year: "2021",
      role: "BCA",
      place: "Musaliar College of Arts and Science",
      line: "Bachelor of Computer Applications, algorithms, programming, and software foundations.",
      tag: "Degree",
    },
    {
      year: "2024",
      role: "MCA · CGPA 8.33",
      place: "TKM College of Engineering, Kollam",
      line: "Master of Computer Applications with focus on machine learning and intelligent systems.",
      tag: "Postgraduate",
    },
    {
      year: "2026",
      role: "AI / ML Intern, DDSS",
      place: "Bluecast Technologies (Jan to Apr)",
      line: "Built a dermatology decision-support system using DINOv2 case retrieval and FAISS.",
      tag: "Internship",
    },
    {
      year: "2026",
      role: "AI / ML Engineer",
      place: "Open to work",
      line: "Building machine learning and computer vision systems, open to work in Kerala, UAE or remote.",
      tag: "Available",
    },
  ] as JourneyStop[],
  timeline: [
    { when: "2021-24", what: "BCA", where: "Musaliar College of Arts and Science, Pathanamthitta" },
    { when: "2024-26", what: "MCA · CGPA 8.33", where: "TKM College of Engineering, Kollam" },
    { when: "Jan-Apr 2026", what: "AI / ML Intern, DDSS", where: "Bluecast Technologies" },
    { when: "2026", what: "AI / ML Engineer", where: "Open to work" },
  ],
  stream: ["embed -> 768-d", "search -> top-k", "rank -> 3 cases"],
  diagramTitle: "DDSS PIPELINE",
  nodes: [
    { id: "img", t: "Dermatology image", d: "Query image is resized and normalised." },
    { id: "emb", t: "DINOv2 embedding", d: "Backbone produces a dense feature vector." },
    { id: "sim", t: "Similarity search", d: "Cosine search over indexed reference cases." },
    { id: "out", t: "Ranked similar cases", d: "Top-k cases returned via FastAPI." },
  ],
};

export type GreetingItem = {
  text: string;
  lang: string;
  dir?: "ltr" | "rtl";
};

export const connect = {
  heading: ["LET'S BUILD", "SOMETHING."],
  sub: "Backend, ML or retrieval work. I reply within two days.",
  mailto: "Write an email",
  greetings: [
    { text: "Hello", lang: "en" },
    { text: "നമസ്കാരം", lang: "ml" },
    { text: "नमस्ते", lang: "hi" },
    { text: "مرحباً", lang: "ar", dir: "rtl" as const },
  ],
  namePrefix: "· ",
};

export const palette = [
  ...pages.map((p) => ({ id: `go-${p.id}`, label: `Go to ${p.label}`, kind: "page" as const, target: p.id })),
  { id: "cv", label: "Download CV", kind: "cv" as const },
  { id: "email", label: "Copy email", kind: "email" as const },
  { id: "gh", label: "Open GitHub", kind: "github" as const },
  { id: "li", label: "Open LinkedIn", kind: "linkedin" as const },
];

export const roleCaseStudy: CaseStudyData = {
  title: ["PRODUCTIVITY &", "ROLE PREDICTION."],
  badge: "DETAILS",
  close: "Close",
  closeKey: "Esc",
  nav: [
    { id: "what-it-does", label: "What it does" },
    { id: "how-it-works", label: "How it works" },
    { id: "stack-architecture", label: "Stack & architecture" },
    { id: "results-limits", label: "Results & limits" },
  ],
  sections: [
    {
      id: "what-it-does",
      num: "1",
      title: "What it does",
      text: "Predicts how productive a worker is and groups workers by behaviour based on desktop session activity logs. It outputs an objective numeric productivity score and behavioural cluster role classification.",
      points: [
        "Objective numeric scoring: Continuously estimates worker productivity on a calibrated 0–100 scale.",
        "Role pattern discovery: Groups workers into behavioural clusters without manual activity logging.",
        "Dual-model approach: Combines supervised regression for continuous scores with unsupervised clustering for role patterns.",
      ],
    },
    {
      id: "how-it-works",
      num: "2",
      title: "How it works",
      text: "A four-stage pipeline extracts behavioural features from desktop sessions and transforms them into predictive scores and role groups:",
      methods: [
        {
          name: "Behaviour Features",
          desc: "Extracts 8 activity features: Typing Intensity, Idle Duration, Task Switching Frequency, Time Coding, Time Email, Time Social Media, Time Browsing, and Time Docs.",
        },
        {
          name: "Random Forest Regression",
          desc: "Trained on tabular behavioural features to predict a continuous productivity score from 0 to 100.",
        },
        {
          name: "K-Means Clustering",
          desc: "Unsupervised clustering grouping workers into behavioural role patterns (e.g. Manager) based on activity time distribution.",
        },
        {
          name: "Score and Role Assignment",
          desc: "Maps continuous regression outputs into performance tiers (Medium, High) and assigns cluster role identities.",
        },
      ],
      points: [
        "Typing Intensity & Inactivity: Measures active keystroke density and idle duration during work intervals.",
        "Application Breakdown: Allocates session time across coding, email, social media, browsing, and documentation.",
        "Context Switching: Quantifies task switches between different desktop tools and windows.",
      ],
    },
    {
      id: "stack-architecture",
      num: "3",
      title: "Stack and architecture",
      text: "Built in Python using established machine learning and data engineering libraries:",
      points: [
        "scikit-learn: Powers the Random Forest regressor and K-Means clustering algorithms.",
        "pandas: Handles tabular ingestion, feature transformation, and time normalization across desktop sessions.",
        "SQLite: Stores subject session logs, computed feature matrices, and evaluation runs.",
        "Python: Core execution runtime for preprocessing and statistical inference pipelines.",
      ],
    },
    {
      id: "results-limits",
      num: "4",
      title: "Results and limits",
      text: "Model outputs and operational boundaries established on sample subject benchmarks:",
      points: [
        "Subject scoring: S001 (53.48, Medium), S003 (54.36, Medium), and S007 (77.14, High) with Manager role classification.",
        "Desktop scope: Evaluates computer interaction patterns only; does not capture offline meetings, planning, or code quality.",
        "Ground truth calibration: Supervised regression baselines depend on calibrated ground-truth productivity benchmarks.",
      ],
    },
  ],
};

export const careerlensCaseStudy: CaseStudyData = {
  title: ["CAREERLENS AI", "ARCHITECTURE."],
  badge: "DETAILS",
  close: "Close",
  closeKey: "Esc",
  nav: [
    { id: "what-it-does", label: "What it does" },
    { id: "how-it-works", label: "How it works" },
    { id: "stack-architecture", label: "Stack & architecture" },
    { id: "results-limits", label: "Results & limits" },
  ],
  sections: [
    {
      id: "what-it-does",
      num: "1",
      title: "What it does",
      text: "Matches a candidate resume to open roles and explains skill gaps with source citations, providing actionable alignment insights.",
      points: [
        "Semantic matching: Compares resume experience directly against indexed role definitions in vector space.",
        "Evidence-backed explanations: Highlights specific skill gaps supported by direct textual quotes rather than arbitrary compatibility percentages.",
        "Targeted transitions: Assists candidates in identifying concrete qualification requirements for career changes.",
      ],
    },
    {
      id: "how-it-works",
      num: "2",
      title: "How it works",
      text: "A semantic retrieval and cited explanation pipeline processes candidate profiles through five stages:",
      methods: [
        {
          name: "Resume PDF Parsing",
          desc: "Parses candidate profile data from raw PDF documents into structured entities covering skills, experience, and education.",
        },
        {
          name: "MiniLM Embeddings",
          desc: "Generates 384-dimensional dense semantic vectors using Sentence Transformers to capture role nuances.",
        },
        {
          name: "FAISS Cosine Search",
          desc: "Indexes role definitions and runs sub-millisecond nearest-neighbor similarity searches.",
        },
        {
          name: "Gemini Gap Explanation",
          desc: "Synthesises personalised skill gap analysis with direct textual citations from the resume and target job description.",
        },
        {
          name: "SQLAlchemy Store",
          desc: "Calculates match scores and persists role-fit evaluation in SQLite.",
        },
      ],
      points: [
        "Local vectorization: Dense embeddings are computed locally using Sentence Transformers, keeping resume data private.",
        "Direct citation: Gap explanations cite exact job qualification requirements and corresponding candidate experiences.",
      ],
    },
    {
      id: "stack-architecture",
      num: "3",
      title: "Stack and architecture",
      text: "Implemented as a modular Python backend service combining fast vector search with generative explanation:",
      points: [
        "FastAPI: Asynchronous REST endpoints for resume ingestion, parsing, and candidate match requests.",
        "Sentence Transformers (all-MiniLM-L6-v2): Efficient local embedding generation producing 384-d dense vectors.",
        "FAISS: High-speed vector index executing cosine similarity searches over target role vectors.",
        "Gemini API: Structured prompt orchestration generating verifiable citations for identified skill gaps.",
        "SQLAlchemy & SQLite: Persistent relational store for parsed profiles, candidate evaluations, and role definitions.",
      ],
    },
    {
      id: "results-limits",
      num: "4",
      title: "Results and limits",
      text: "Current implementation milestone and active engineering constraints:",
      points: [
        "Backend status: Ingestion, MiniLM vector search, FAISS indexing, and Gemini citation pipelines are built and tested.",
        "Frontend rebuild: User interface is undergoing a complete architectural rebuild for modern web standards.",
        "Deployment readiness: Cloud containerization and production rollout are held pending frontend completion.",
        "External dependencies: Cited explanations require active Gemini API connectivity and clean PDF formatting.",
      ],
    },
  ],
};
