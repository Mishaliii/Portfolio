// All site copy, links and project data. Components never hard-code copy.
import ddssRetrieval from "@/assets/ddss-8-screen.webp";
import sampleA from "@/assets/skin-sample-a.jpg";
import sampleB from "@/assets/skin-sample-b.jpg";
import sampleC from "@/assets/skin-sample-c.jpg";
import type { ReferenceCase, RetrievalSample } from "@/lib/retrieval";

export const site = {
  name: "Muhammed Mishal",
  wordmark: "MISHAL",
  tag: "AI / ML",
  email: "muhammedmishalkpm13@gmail.com",
  github: "https://github.com/", // VERIFY
  linkedin: "https://www.linkedin.com/", // VERIFY
  cv: "/cv.pdf",
  location: "KOLLAM, INDIA [IND] - 8.8932 N, 76.6141 E",
  roleYear: "AI / ML ENGINEER // 2026",
  availability: "Open to roles in Kerala, UAE or remote", // VERIFY
  timezone: "Asia/Kolkata",
};

export const ui = {
  performance: {
    title: "Performance", fps: "FPS", frame: "Frame", longest: "Longest", tasks: "Long tasks", heap: "JS heap", unavailable: "Unavailable",
    layers: { shader: "Scene shader", video: "Video upload / playback", headline: "Headline dissolve", grain: "Grain overlay", blur: "Nav backdrop blur", gradients: "Gradient overlays", lenis: "Lenis", wipe: "Section wipe" },
  },
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
  palettePlaceholder: "Type a command…",
  paletteHint: "Ctrl K",
  backToOverview: "Back to overview",
  copyright: "(c) 2026 MISHAL",
  istLabel: "IST",
  scrollHint: "Scroll / ↓ / 1-6",
};

export const pages = [
  { id: "overview", num: "00", label: "Overview" },
  { id: "about", num: "01", label: "About" },
  { id: "expertise", num: "02", label: "Expertise" },
  { id: "works", num: "03", label: "Works" },
  { id: "journey", num: "04", label: "Journey" },
  { id: "connect", num: "05", label: "Connect" },
] as const;

export const intro = {
  status: "Loading portfolio",
  skip: "SKIP",
  clusters: ["Backend", "Vision", "Retrieval", "Practice"],
  lines: ["loading embeddings", "indexing 3 projects", "top-k ready"],
};

export const hero = {
  line1: "AI / ML",
  line2: "ENGINEER",
  // Full-bleed WebGL scene (public/hero/): looping video + depth-map parallax behind cream type.
  scene: { alt: "Illustrated portrait of Mishal working at his laptop at night" },
  chip: "OPEN TO WORK, 2026",
};

export const about = {
  label: "01 / ABOUT",
  name: "MISHAL",
  period: ".",
  fullName: "MUHAMMED MISHAL",
  role: " · AI / ML ENGINEER · KOLLAM, KERALA",
  bio: "I build machine learning and computer vision systems and serve them through tested Python APIs.",
  portraitAlt: "Portrait of Muhammed Mishal",
  seeWorks: "See works",
  poseCue: "LOOKS UP: LOOKS AT YOU",
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
  "Productivity & Role Prediction": { status: "done", target: "role", skills: ["Python","Pandas","scikit-learn","SQLite","Streamlit"] },
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

export type Project = {
  id: string;
  title: string;
  context: string;
  stack: string[];
  problem: string;
  approach: string;
  result: string;
  limitations: string;
  links: { live?: string; github?: string; video?: string };
  metrics: { label: string; value: string }[];
  demo?: boolean;
  flagship?: boolean;
  pipeline?: string[];
  status?: string;
  flow?: string[];
};

export const works = {
  heading: "SELECTED WORKS.",
  labels: { problem: "Problem", approach: "Approach", result: "Result", limitations: "Limitations", live: "Live", github: "GitHub", video: "Demo video", demo: "Product preview", flagship: "Flagship project", status: "Status", deepDive: "Deep Dive" },
  projects: [
    {
      id: "ddss",
      title: "DERMATOLOGY DECISION SUPPORT",
      context: "Primary internship work · Vision retrieval",
      stack: ["DINOv2 ViT-B", "PyTorch", "FAISS", "pgvector"],
      problem: "A single-label skin classifier is unsafe: doctors need a ranked differential with evidence, not one confident guess.",
      approach: "{{DINOv2|underline-draw}} 768-d embeddings over 198 conditions (SD-198), cosine search, confidence bands, then a rule-based severity score.",
      result: "Ranked conditions with High / Moderate / Low confidence, severity and an editable prescription.",
      limitations: "Not medically fine-tuned; look-alike conditions overlap. Support, not diagnosis.",
      links: {},
      metrics: [],
      demo: true,
      status: "Completed (internship prototype)",
      pipeline: ["Input Image", "DINOv2 Embedding", "Similarity Retrieval", "Retrieved Cases"],
    },
    {
      id: "role",
      title: "PRODUCTIVITY & ROLE PREDICTION",
      context: "Academic study · Classical ML & feature importance",
      stack: ["scikit-learn", "Python", "pandas"],
      problem: "Predict suitable roles and productivity signals from work data.",
      approach: "Feature engineering and classical classifiers with cross-validation.",
      result: "An interpretable model with per-feature importance.",
      limitations: "Small dataset; results are indicative.",
      status: "Completed",
      flow: ["Work data", "Feature engineering", "Classifiers + cross-validation", "Predicted role", "Per-feature importance"],
      links: {},
      metrics: [],
    },
    {
      id: "careerlens",
      title: "CAREERLENS AI",
      context: "Prototype · RAG & LLM architecture",
      stack: ["FastAPI", "Python", "SQLite", "Sentence Transformers", "FAISS", "Gemini API"],
      problem: "Job seekers cannot see which skills separate them from a target role.",
      approach: "Sentence Transformers embeddings of resumes and roles, {{FAISS|underline-draw}} search, Gemini to explain the gap.",
      result: "A skill-gap view with matched and missing skills per role.",
      limitations: "Quality depends on job description coverage.",
      status: "Backend built",
      flow: ["Resume + target role", "Sentence Transformers embeddings", "FAISS similarity search", "Gemini gap explanation", "Skill-gap view"],
      links: {},
      metrics: [],
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
    placeholderNote: "Placeholder illustration · approved query images and actual retrieval results have not been supplied yet.",
    queryLabel: "Query image",
    resultsLabel: "Similar reference cases",
    referenceLabel: "Reference image",
    anotherExample: "Select another example",
    similarityLabel: "Similarity",
    empty: "No reference matches for this sample.",
    references: [] as ReferenceCase[],
    samples: [
      { id: "sample-a", label: "Placeholder A", image: sampleA, placeholder: true, matches: [] },
      { id: "sample-b", label: "Placeholder B", image: sampleB, placeholder: true, matches: [] },
      { id: "sample-c", label: "Placeholder C", image: sampleC, placeholder: true, matches: [] },
    ] as RetrievalSample[],
  },
  caseStudy: {
    eyebrow: "CASE STUDY // BLUECAST TECHNOLOGIES · JAN-APR 2026",
    title: ["DERMATOLOGY", "DECISION SUPPORT."],
    lede: "A clinical assistant that turns a skin photo into a ranked differential: likely conditions with confidence bands, a severity score and an editable treatment plan. The doctor always makes the final call.",
    close: "Close",
    closeKey: "Esc",
    galleryLabel: "PRODUCT SCREENS / 10 CAPTURES",
    galleryPrevious: "Previous screen",
    galleryNext: "Next screen",
    galleryError: "This screenshot could not be loaded.",
    galleryRetry: "Retry",
    galleryCount: "of",
    navigation: [
      { id: "demo", label: "Try retrieval" },
      { id: "product", label: "Product screens" },
      { id: "decisions", label: "Engineering decisions" },
      { id: "architecture", label: "Architecture" },
      { id: "limits", label: "Limits & validation" },
    ],
    needTitle: "The clinical need",
    need: "Skin conditions can share colour, texture and shape. The goal was not to replace a dermatologist with one predicted label, but to bring candidate conditions into a reviewable workflow: patient record, image analysis, differential review, grading and treatment planning.",
    retrievalTitle: "What retrieval actually does",
    retrieval: [
      { t: "Build the reference index", d: "Preprocess the training images, extract a DINOv2 embedding for each image, and retain its disease label alongside the vector. Hold test images outside that index to avoid evaluating on the same photographs used as references." },
      { t: "Embed a new query", d: "Apply the same preprocessing and backbone to the uploaded image. The resulting 768-dimensional CLS representation is compared with reference embeddings, rather than training a new classifier for every query." },
      { t: "Retrieve and review", d: "Rank reference matches by cosine similarity and present candidate conditions for clinician review. The screenshots show the product’s ranked differential; they are not an interactive search against the reference index." },
    ],
    scoreNote: "Similarity is not a calibrated probability of disease. The percentage bars shown in the app should not be read as diagnostic accuracy. Confidence-band thresholds and clinical calibration have not been supplied for this portfolio.",
    validationTitle: "Evidence and unresolved questions",
    validation: [
      { t: "Product evidence", d: "The ten supplied captures show the implemented patient-to-prescription workflow, including differential review and a GAGS score of 20 shown as Moderate." },
      { t: "Evaluation evidence", d: "The documentation describes a held-out SD-198 test split, but no measured top-k recall, diagnostic accuracy or search latency was supplied. Dataset coverage is not a performance result." },
      { t: "Index implementation", d: "FAISS and pgvector both appear in the documentation. Their exact roles in the final deployed system still need confirmation; this brief does not claim a measured comparison." },
      { t: "Portfolio retrieval demo", d: "The client-side demo is prepared for approved query images and their actual precomputed reference matches. Current images are identified as placeholder illustrations; no scores or medical metadata are invented. It does not run model inference or access the private dataset." },
    ],
    role: [
      { k: "Role", v: "AI / ML Intern" },
      { k: "Duration", v: "Jan-Apr 2026" },
      { k: "Dataset", v: "SD-198 · 198 conditions" },
      { k: "Backbone", v: "DINOv2 ViT-B · 768-d" },
    ],
    stats: [
      { v: "198", l: "skin conditions covered" },
      { v: "768", l: "numbers per image embedding" },
      { v: "196", l: "16×16 patches read per image" },
      { v: "6", l: "clinical severity calculators" },
    ],
    compareTitle: "Why not a classifier",
    before: { t: "Single-label classifier", points: ["One hard label with high confidence", "Unsafe when two conditions look alike", "No way to add a new disease without retraining", "Clinician cannot see the evidence"] },
    after: { t: "Differential support", points: ["Several likely conditions, ranked", "Similarity scores mapped to High / Moderate / Low", "New confirmed cases and diseases can be added", "Doctor-in-the-loop: AI suggests, doctor decides"] },
    datasetTitle: "Choosing the data",
    datasets: [
      { n: "HAM10000", d: "Large, but only 7 labels", pick: false },
      { n: "Derma (Harvard)", d: "23 diseases with a train-test split", pick: false },
      { n: "Mega Balanced (Kaggle)", d: "36 diseases, no test set", pick: false },
      { n: "SD-198", d: "198 diseases, published research benchmark", pick: true },
    ],
    datasetNote: "SD-198 was split into train and test folders. The train set is embedded and indexed; the test set is held out for evaluation.",
    vitTitle: "How the model reads a photo",
    vit: [
      "The image is resized to 224×224 and cut into a 14×14 grid of 16×16 patches.",
      "Each patch becomes a vector, with position added so the model knows where it sits.",
      "Self-attention lets every patch look at every other: the lesion links to its neighbours and the background fades.",
      "A summary [CLS] token collects it all into one 768-d embedding, the vector that gets stored and searched.",
    ],
    vitHint: "Hover the grid",
    iterTitle: "Three approaches, in order",
    iters: [
      { n: "01", t: "Mean vector per disease", tag: "Dropped", why: "Fast and simple, but skin diseases are not one tight cluster. Stages, body sites and lighting form sub-clusters, so the average blurred them into a point that matched no real case, and small classes were unstable." },
      { n: "02", t: "kNN retrieval with FAISS", tag: "Improved", why: "Comparing against real training images kept the variation inside each disease and made results explainable. Conditions with near-identical texture still overlapped." },
      { n: "03", t: "CLS token representation", tag: "Current", why: "Use the ViT's [CLS] summary as the single image representation for retrieval. This is a representation choice within the retrieval pipeline, not a replacement for nearest-neighbour search. Improvements across lighting or angle still require held-out measurement." },
    ],
    archTitle: "End-to-end pipeline",
    arch: [
      { n: "01", t: "Capture", d: "Camera or upload, with file and quality checks; lesion region kept in focus." },
      { n: "02", t: "Embed", d: "OpenCV / Pillow preprocessing, then DINOv2 ViT-B produces a 768-d vector." },
      { n: "03", t: "Search", d: "Cosine similarity over stored embeddings with FAISS and pgvector." },
      { n: "04", t: "Rank", d: "Scores normalised into High / Moderate / Low bands; low confidence falls back safely." },
      { n: "05", t: "Assess", d: "A rule-based severity calculator matched to the predicted disease." },
      { n: "06", t: "Prescribe", d: "Editable treatment plan; every case is saved for review and audit." },
    ],
    sevTitle: "Severity, not just a label",
    sevIntro: "The same disease can need different treatment. After prediction, the doctor scores symptoms and a rule-based calculator maps the total to Mild, Moderate or Severe.",
    sev: [
      { k: "GAGS", t: "Acne", d: "Vulgaris, cystic, comedonal" },
      { k: "EASI", t: "Eczema", d: "Atopic, contact, seborrheic" },
      { k: "PASI", t: "Psoriasis", d: "Plaque, guttate, scalp" },
      { k: "SALT", t: "Fungal", d: "Tinea, tinea pedis" },
      { k: "ABCDE", t: "Pigmentation", d: "Melasma, vitiligo" },
      { k: "GEN", t: "General", d: "Rare cases and low-confidence fallback" },
    ],
    loopTitle: "Doctor in the loop",
    loop: [
      "Doctor reviews the differential and confirms the disease.",
      "A case record stores predicted vs confirmed disease, severity and AI confidence.",
      "Suggested medicines are pre-filled; dosage, frequency and duration stay editable.",
      "The final prescription is saved and can be retrieved for follow-up and audit.",
    ],
    shotsTitle: "The product, screen by screen",
    shotsIntro: "Actual captures from DermAI CDSS: patient intake, image analysis, ranked differential, severity grading and treatment planning. Supporting login and dashboard screens are included too.",
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
    stackTitle: "Stack",
    stack: ["Python 3.10", "PyTorch", "DINOv2", "OpenCV", "Pillow", "FAISS", "pgvector"],
    guardTitle: "Limits I kept visible",
    guards: [
      "DINOv2 is not medically fine-tuned: it sees texture and colour, not pathology.",
      "Visually similar conditions still overlap.",
      "Severity depends on accurate clinician input.",
      "Decision support only, never a diagnosis.",
    ],
    learnTitle: "What I learned",
    learn: "The first idea is rarely the right representation. Measuring why the centroid failed is what led to retrieval, then to the CLS token, and keeping the doctor in control shaped every screen after the model.",
  },
  flowLabel: "How it works",
};

export const journey = {
  heading: "ACADEMIC & INDUSTRY JOURNEY.",
  timeline: [
    { when: "2021-24", what: "BCA", where: "Musaliar College of Arts and Science, Pathanamthitta" }, // VERIFY years
    { when: "2024-26", what: "MCA · CGPA 8.33", where: "TKM College of Engineering, Kollam" }, // VERIFY years
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

export const connect = {
  heading: ["LET'S BUILD", "SOMETHING."],
  sub: "Backend, ML or retrieval work. I reply within two days.",
  mailto: "Write an email",
  greetings: ["Hello", "Namaskaram", "Marhaba", "Namaste"],
  namePrefix: "· ",
};

export const palette = [
  ...pages.map((p) => ({ id: `go-${p.id}`, label: `Go to ${p.label}`, kind: "page" as const, target: p.id })),
  { id: "cv", label: "Download CV", kind: "cv" as const },
  { id: "email", label: "Copy email", kind: "email" as const },
  { id: "gh", label: "Open GitHub", kind: "github" as const },
  { id: "li", label: "Open LinkedIn", kind: "linkedin" as const },
];
