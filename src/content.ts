import ddssRetrieval from "@/assets/ddss-screen.webp";

export const site = {
  name: "Muhammed Mishal",
  role: "AI / ML Engineer",
  location: "KOLLAM, INDIA [IND] - 8.8932 N, 76.6141 E",
  roleYear: "AI / ML ENGINEER // 2026",
  wordmark: "MISHAL",
  tag: "AI / ML",
  email: "muhammedmishalkpm13@gmail.com",
  github: "https://github.com/Mishaliii",
  linkedin: "https://www.linkedin.com/in/muhammedmishal13/",
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
  bio: "I'm an AI/ML engineer from Kollam. I build Python machine learning and computer vision applications and serve them through tested APIs. At Blue Cast Technologies I contributed to an image-based dermatology decision-support system, extracting 768-dimensional DINOv2 embeddings and building FastAPI backends with Supabase PostgreSQL/pgvector across 198 classes.",
  portraitAlt: "Portrait of Muhammed Mishal",
  seeWorks: "See works",
  facts: [
    {
      label: "EDUCATION",
      bold: "MCA · GPA 8.33/10",
      text: " · TKM College of Engineering · 08/2024 – 07/2026",
      secondary: "BCA · Musaliar College of Arts and Science · 08/2021 – 04/2024",
    },
    {
      label: "EXPERIENCE",
      bold: "AI / ML Developer Intern",
      text: " · Blue Cast Technologies · Jan – Apr 2026",
      secondary:
        "Contributed to 768-dim DINOv2 ViT-B case retrieval and FastAPI pgvector pipeline across 198 classes",
    },
    {
      label: "CERTIFICATIONS",
      bold: "Azure AI Essentials · IBM Deep Learning with Keras",
      text: " · NPTEL Java · Python Data Science ML & AI · Data Engineering: SQL, Python & Spark",
    },
    {
      label: "ADDITIONAL",
      bold: "Additional projects",
      text: " · Build Track Pro (Django, MySQL) · Fresh Cart (PHP/MySQL) · Drop for Life",
    },
    {
      label: "STACK",
      text: "Python, FastAPI, Supabase PostgreSQL, pgvector, PyTorch, FAISS, scikit-learn, Streamlit",
    },
    { label: "STATUS", bold: "Open to work, 2026", text: " · Kerala, UAE or remote", live: true },
  ],
};

export type Skill = {
  id: string;
  name: string;
  cluster: number;
  x: number;
  y: number;
  note: string;
};
export const PROJECTS: Record<string, { status: string; target: string; skills: string[] }> = {
  "Dermatology Decision Support": {
    status: "done",
    target: "ddss",
    skills: [
      "Python",
      "FastAPI",
      "PyTorch",
      "DINOv2",
      "FAISS",
      "OpenCV",
      "PostgreSQL",
      "Image retrieval",
      "React / TS",
    ],
  },
  "Productivity & Role Prediction": {
    status: "done",
    target: "role",
    skills: ["Python", "scikit-learn", "Streamlit", "Pandas"],
  },
  "CareerLens AI": {
    status: "backend built",
    target: "careerlens",
    skills: [
      "Python",
      "FastAPI",
      "REST design",
      "SQLite",
      "FAISS",
      "Gemini API",
      "RAG pipelines",
      "Sentence Transformers",
      "Testing",
    ],
  },
  "This portfolio": { status: "live", target: "overview", skills: ["React / TS", "Git"] },
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
    { id: "py", name: "Python", cluster: 0, x: 0.15, y: 0.24, note: "" },
    { id: "fastapi", name: "FastAPI", cluster: 0, x: 0.29, y: 0.21, note: "" },
    { id: "rest", name: "REST design", cluster: 0, x: 0.15, y: 0.33, note: "" },
    { id: "pg", name: "PostgreSQL", cluster: 0, x: 0.29, y: 0.32, note: "" },
    { id: "sqlite", name: "SQLite", cluster: 0, x: 0.22, y: 0.42, note: "" },
    { id: "torch", name: "PyTorch", cluster: 1, x: 0.64, y: 0.23, note: "" },
    { id: "dino", name: "DINOv2", cluster: 1, x: 0.8, y: 0.23, note: "" },
    { id: "sk", name: "scikit-learn", cluster: 1, x: 0.64, y: 0.33, note: "" },
    { id: "pandas", name: "Pandas", cluster: 1, x: 0.8, y: 0.34, note: "" },
    { id: "cv", name: "OpenCV", cluster: 1, x: 0.7, y: 0.43, note: "" },
    { id: "image", name: "Image retrieval", cluster: 2, x: 0.62, y: 0.67, note: "" },
    { id: "sentence", name: "Sentence Transformers", cluster: 2, x: 0.81, y: 0.67, note: "" },
    { id: "faiss", name: "FAISS", cluster: 2, x: 0.64, y: 0.78, note: "" },
    { id: "rag", name: "RAG pipelines", cluster: 2, x: 0.77, y: 0.78, note: "" },
    { id: "gemini", name: "Gemini API", cluster: 2, x: 0.69, y: 0.87, note: "" },
    { id: "git", name: "Git", cluster: 3, x: 0.15, y: 0.67, note: "" },
    { id: "docker", name: "Docker", cluster: 3, x: 0.29, y: 0.67, note: "" },
    { id: "test", name: "Testing", cluster: 3, x: 0.15, y: 0.78, note: "" },
    { id: "react", name: "React / TS", cluster: 3, x: 0.29, y: 0.78, note: "" },
    { id: "streamlit", name: "Streamlit", cluster: 3, x: 0.21, y: 0.87, note: "" },
  ] as Skill[],
};

export type ImportanceItem = { label: string; value: number };
type PipelineStep = { label: string; shot: string; zoom?: boolean };
type PipelineRow = { label: string; shot: string; zoom?: boolean };
type FilmstripItem = { k: string; t: string };
type PipelineBox = { label: string; caption: string; built: boolean; desc?: string };

type TableRow = {
  id: string;
  vals: string[];
};

type TableOutput = {
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

type CaseStudyScreen = { shot: string; label: string; desc: string };

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
      sentence:
        "A clinician gets a ranked list of similar past cases with evidence, not one confident guess.",
      line: "DINOv2 ViT-B embeddings, FAISS cosine retrieval, and FastAPI with Supabase PostgreSQL/pgvector. Built at Blue Cast Technologies.",
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
      problem:
        "Clinician-facing tool that returns ranked similar dermatological conditions with High/Moderate/Low confidence indicators to support case review.",
      approach:
        "768-dim DINOv2 ViT-B embeddings, FAISS cosine retrieval, and FastAPI with Supabase PostgreSQL/pgvector across 198 SD-198 classes.",
      result: "Support, not diagnosis.",
      stack: ["DINOv2 ViT-B", "FastAPI", "Supabase", "pgvector", "FAISS", "PyTorch"],
    },
    {
      id: "role",
      title: "Productivity and Role Prediction",
      sentence:
        "Predicts employee productivity and roles, reaching approximately 87% classification accuracy.",
      line: "Random Forest and Logistic Regression models saved with joblib and served through Streamlit.",
      mutedLine: "EDA, feature engineering, and approximately 87% classification accuracy.",
      statusLine: "Random Forest, Logistic Regression, and Streamlit.",
      buttonLabel: "Details",
      pipelineSteps: [
        "EDA & feature engineering",
        "Random Forest & Logistic Regression",
        "~87% classification accuracy",
        "Streamlit & joblib deployment",
      ],
      table: {
        columns: [
          "Subject (Sample)",
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
          { id: "Sample 1", vals: ["75", "23", "11", "4.9", "7.65", "9.8", "13.78", "13.16"] },
          { id: "Sample 2", vals: ["61", "9", "7", "10.86", "12.22", "7.87", "7.6", "7.33"] },
          { id: "Sample 3", vals: ["87", "13", "4", "18.26", "19.24", "12.07", "0.33", "0.33"] },
        ],
        outputs: [
          { label: "Productivity score", vals: ["53.48", "54.36", "77.14"] },
          { label: "Label", vals: ["Medium", "Medium", "High"] },
          { label: "Role", vals: ["Manager"] },
        ],
      },
      importance: [] as ImportanceItem[],
      links: {},
      metrics: [],
      problem:
        "Predicts employee productivity and roles, reaching approximately 87% classification accuracy.",
      approach:
        "Random Forest and Logistic Regression models evaluated with cross-validation and served through Streamlit.",
      stack: ["scikit-learn", "Streamlit", "joblib", "Python", "pandas"],
    },
    {
      id: "careerlens",
      title: "CareerLens AI",
      sentence:
        "Matches a resume to roles and explains the gaps. Backend is built and tested; the front end is being rebuilt.",
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
        {
          label: "Resume PDF",
          caption: "Resume parsing",
          built: true,
          desc: "Parses candidate profile data from raw PDF documents.",
        },
        {
          label: "Profile extraction",
          caption: "Profile extraction",
          built: true,
          desc: "Extracts technical skills, experience, and education into structured entities.",
        },
        {
          label: "Embeddings (MiniLM)",
          caption: "MiniLM embeddings",
          built: true,
          desc: "Generates 384-dimensional dense semantic vectors using Sentence Transformers.",
        },
        {
          label: "FAISS search",
          caption: "Cosine similarity",
          built: true,
          desc: "Indexes role definitions and runs fast nearest-neighbor similarity searches.",
        },
        {
          label: "Gemini explanation with citations",
          caption: "Gemini citations",
          built: true,
          desc: "Synthesises personalised skill gap analysis with direct source citations.",
        },
        {
          label: "Job match and skill gaps",
          caption: "SQLAlchemy store",
          built: true,
          desc: "Calculates match scores and persists role-fit evaluation in SQLite.",
        },
        {
          label: "Front end",
          caption: "Being rebuilt",
          built: false,
          desc: "Next-generation responsive UI currently in active development.",
        },
        {
          label: "Deployment",
          caption: "Pending",
          built: false,
          desc: "Cloud containerization and deployment pending frontend completion.",
        },
      ],
      links: {},
      metrics: [],
      problem:
        "Matches a resume to roles and explains the gaps. Backend is built and tested; the front end is being rebuilt.",
      approach:
        "Sentence Transformers embeddings of resumes and roles, FAISS similarity search, Gemini gap explanation.",
      stack: ["FastAPI", "Python", "SQLite", "Sentence Transformers", "FAISS", "Gemini API"],
    },
  ] as Project[],
  ddssDemo: {
    img: ddssRetrieval,
    alt: "DermAI uploaded skin image alongside ranked differential suggestions and confidence scores",
  },
  demoNote: "Recorded retrieval result · not live inference",
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
          {
            shot: "ddss-2",
            label: "Dashboard",
            desc: "Daily patient intake, visit logs, and disease distribution at a glance.",
          },
          {
            shot: "ddss-5",
            label: "Patient history",
            desc: "Chronological visit records with past diagnoses and case notes.",
          },
          {
            shot: "ddss-6",
            label: "Photo upload",
            desc: "Lesion image upload to initiate the visual embedding pipeline.",
          },
          {
            shot: "ddss-8",
            label: "Differentials",
            desc: "Similar conditions ranked with confidence bars for clinician confirmation.",
          },
          {
            shot: "ddss-9",
            label: "GASI severity",
            desc: "Region-based severity calculator mapping scores to Mild, Moderate, or Severe.",
          },
          {
            shot: "ddss-10",
            label: "Treatment plan",
            desc: "Pre-filled medications and dosages that the doctor edits, approves, and saves.",
          },
        ],
      },
      {
        id: "data-preprocessing",
        num: "3",
        title: "Data and preprocessing",
        text: "The reference database is built on the published SD-198 benchmark dataset covering 198 skin conditions.",
        points: [
          "Reference set: SD-198 is partitioned into reference cases across all 198 disease classes.",
          "Image preparation: Photos are preprocessed using OpenCV and PyTorch, transformed and normalised for Vision Transformer input.",
          "Embedding representation: DINOv2 extracts patch tokens without supervised label bias across the lesion surface.",
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
          "Ranked results: Returns top candidate cases with similarity bars mapped to High, Moderate, and Low confidence tiers.",
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
          "FastAPI REST APIs: Built FastAPI endpoints to serve the end-to-end image upload, embedding extraction, and vector similarity retrieval pipeline.",
          "Supabase PostgreSQL with pgvector: Integrated Supabase PostgreSQL with pgvector for vector storage and similarity search across the image-to-prediction pipeline.",
          "Clinical case review: Clinician receives ranked dermatological conditions with High/Moderate/Low confidence indicators to support case review.",
        ],
      },
      {
        id: "retrieval-methods",
        num: "6",
        title: "Retrieval methods compared",
        methods: [
          {
            name: "MV-Mean",
            desc: "Averages feature vectors across multiple views of the same lesion into one centroid. Dropped because diverse stages blurred into unrepresentative averages.",
          },
          {
            name: "MV-CLS",
            desc: "Pools CLS token embeddings across multiple views to preserve visual transformer attention.",
          },
          {
            name: "kNN (FAISS)",
            desc: "Nearest-neighbour lookup over indexed individual training cases using cosine similarity, preserving intra-condition variety.",
          },
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
      {
        k: "ddss",
        t: "Clinical workspace",
        d: "Clinician entry point to the decision support system.",
      },
      { k: "ddss-2", t: "Dashboard", d: "Daily patients, visits and disease counts at a glance." },
      { k: "ddss-3", t: "Analytics", d: "Cases per month and severity distribution." },
      { k: "ddss-4", t: "Add patient", d: "Name, age, gender and contact create a new record." },
      { k: "ddss-5", t: "Patient history", d: "Every earlier visit with its confirmed diagnosis." },
      { k: "ddss-6", t: "Upload", d: "A lesion photograph starts the analysis." },
      { k: "ddss-7", t: "Image analysis", d: "Extracting 768-dimensional DINOv2 feature vectors." },
      {
        k: "ddss-8",
        t: "Ranked differential",
        d: "Similar conditions ranked with confidence bars; the doctor confirms one.",
      },
      { k: "ddss-9", t: "Severity: GAGS", d: "Region sliders compute the acne severity score." },
      { k: "ddss-10", t: "Treatment plan", d: "Pre-filled medicines the doctor edits and saves." },
    ],
  },
};

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
      line: "Bachelor of Computer Applications (08/2021 – 04/2024). Software foundations, programming, and algorithms.",
      tag: "Degree",
    },
    {
      year: "2024",
      role: "MCA · GPA 8.33/10",
      place: "TKM College of Engineering",
      line: "Master of Computer Applications (08/2024 – 07/2026), GPA 8.33/10. Machine learning and intelligent systems.",
      tag: "Postgraduate",
    },
    {
      year: "2026",
      role: "AI / ML Developer Intern",
      place: "Blue Cast Technologies (Jan - Apr 2026)",
      line: "Contributed to an image-based dermatology decision-support system with DINOv2, FAISS, and FastAPI with pgvector.",
      tag: "Internship",
    },
    {
      year: "2026",
      role: "AI / ML Engineer",
      place: "Open to work",
      line: "Building Python machine learning and computer vision applications, open to work in Kerala, UAE or remote.",
      tag: "Available",
    },
  ] as JourneyStop[],
  timeline: [
    { when: "08/2021 - 04/2024", what: "BCA", where: "Musaliar College of Arts and Science" },
    { when: "08/2024 - 07/2026", what: "MCA · GPA 8.33/10", where: "TKM College of Engineering" },
    { when: "Jan - Apr 2026", what: "AI / ML Developer Intern", where: "Blue Cast Technologies" },
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
  ...pages.map((p) => ({
    id: `go-${p.id}`,
    label: `Go to ${p.label}`,
    kind: "page" as const,
    target: p.id,
  })),
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
      text: "Trained Random Forest and Logistic Regression models to predict employee productivity and roles from session activity logs, reaching approximately 87% classification accuracy.",
      points: [
        "Classification accuracy: Reaches approximately 87% accuracy predicting employee productivity levels and roles.",
        "Feature evaluation: Analyzes behavioral metrics including typing intensity, idle duration, and application time distribution.",
        "Interactive deployment: Models saved with joblib and served through an interactive Streamlit application for real-time prediction.",
      ],
    },
    {
      id: "how-it-works",
      num: "2",
      title: "How it works",
      text: "A pipeline spanning exploratory data analysis, feature engineering, dual-model training, and real-time Streamlit prediction:",
      methods: [
        {
          name: "EDA & Feature Engineering",
          desc: "Extracts activity features including typing intensity, idle intervals, task switching frequency, and time allocated across coding, documentation, and communication tools.",
        },
        {
          name: "Random Forest & Logistic Regression",
          desc: "Trained Random Forest and Logistic Regression classifiers to evaluate productivity tiers and employee roles, reaching ~87% classification accuracy.",
        },
        {
          name: "Model Evaluation & Persistence",
          desc: "Rigorous cross-validation, feature importance ranking, and serialization with joblib for instant deployment.",
        },
        {
          name: "Streamlit App Deployment",
          desc: "Interactive Streamlit application providing real-time inference and prediction from live or sample session parameters.",
        },
      ],
      points: [
        "Typing Intensity & Inactivity: Measures active keystroke density and idle duration during work intervals.",
        "Application Breakdown: Allocates session time across coding, documentation, browsing, and communication tools.",
        "Context Switching: Quantifies task switches between different desktop tools and windows.",
      ],
    },
    {
      id: "stack-architecture",
      num: "3",
      title: "Stack and architecture",
      text: "Built in Python using established machine learning and data science libraries:",
      points: [
        "scikit-learn: Powers Random Forest, Logistic Regression, model evaluation, and cross-validation pipelines.",
        "Streamlit: Delivers the interactive front-end application for real-time model scoring and visualization.",
        "joblib: Serializes trained machine learning pipelines for lightweight, fast-loading inference.",
        "pandas & NumPy: Handles exploratory data analysis, data cleaning, and feature engineering transformations.",
      ],
    },
    {
      id: "results-limits",
      num: "4",
      title: "Results and limits",
      text: "Model benchmarks and operational boundaries evaluated on curated session datasets:",
      points: [
        "Classification benchmark: ~87% classification accuracy across validated test splits.",
        "Sample session data: Evaluated against benchmark test sessions with Medium and High productivity classifications.",
        "Desktop activity scope: Evaluates computer interaction patterns only; does not capture offline meetings or subjective work quality.",
      ],
    },
  ],
};

export interface CareerLensStage {
  num: string;
  label: string;
  fullLabel?: string;
  caption: string;
  built: boolean;
  desc: string;
}

export const careerlensStages: CareerLensStage[] = [
  {
    num: "01",
    label: "Resume PDF",
    caption: "Resume parsing",
    built: true,
    desc: "Parses candidate profile data from raw PDF documents into structured entities.",
  },
  {
    num: "02",
    label: "Profile extraction",
    caption: "Profile extraction",
    built: true,
    desc: "Extracts technical skills, experience, and education into structured entities.",
  },
  {
    num: "03",
    label: "Embeddings (MiniLM)",
    caption: "MiniLM embeddings",
    built: true,
    desc: "Generates 384-dimensional dense semantic vectors using Sentence Transformers.",
  },
  {
    num: "04",
    label: "FAISS search",
    caption: "Cosine similarity",
    built: true,
    desc: "Indexes role definitions and runs fast nearest-neighbor similarity searches.",
  },
  {
    num: "05",
    label: "Gemini citations",
    fullLabel: "Gemini explanation with citations",
    caption: "Gemini citations",
    built: true,
    desc: "Synthesises personalised skill gap analysis with direct source citations.",
  },
  {
    num: "06",
    label: "Job match & gaps",
    fullLabel: "Job match and skill gaps",
    caption: "SQLAlchemy store",
    built: true,
    desc: "Calculates match scores and persists role-fit evaluation in SQLite.",
  },
  {
    num: "07",
    label: "Front end",
    caption: "Being rebuilt",
    built: false,
    desc: "Next-generation responsive UI currently in active development.",
  },
  {
    num: "08",
    label: "Deployment",
    caption: "Pending",
    built: false,
    desc: "Cloud containerization and deployment pending frontend completion.",
  },
];

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
      text: `A semantic retrieval and cited explanation pipeline processes candidate profiles through ${careerlensStages.length} stages:`,
      methods: careerlensStages.map((stage) => ({
        name: stage.fullLabel || stage.label,
        desc: `${stage.desc}${stage.built ? "" : ` (${stage.caption})`}`,
      })),
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
