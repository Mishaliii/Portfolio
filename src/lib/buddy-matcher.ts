import { about, works, site, PROJECTS } from "@/content";

export type BuddyMood = "excited" | "happy" | "shy" | "laugh" | "sad" | "hug" | "surprised";

export interface BuddyAnswer {
  intent: string;
  text: string;
  mood: BuddyMood;
  reaction: string;
  followUps: string[];
  dance?: boolean;
  gameStep?: number;
  newVisitorName?: string;
  awaitingName?: boolean;
  greetedWithName?: boolean;
}

export interface MatchBuddyOptions {
  gameStep?: number;
  visitorName?: string;
  awaitingName?: boolean;
  greetedWithName?: boolean;
  lastIntent?: string;
  lastResponseText?: string;
}

const SHORT_REACTIONS = [
  "Ooh, good one!",
  "Easy one.",
  "Hmm, let me think...",
  "Ha!",
  "Got it!",
  "Right on!",
  "On it!",
];
let reactionIdx = 0;
function nextReaction(): string {
  const r = SHORT_REACTIONS[reactionIdx % SHORT_REACTIONS.length];
  reactionIdx++;
  return r;
}

const lastVariants: Record<string, number> = {};

function pickVariant(intentKey: string, variants: string[]): string {
  const last = lastVariants[intentKey] ?? -1;
  let next = Math.floor(Math.random() * variants.length);
  if (variants.length > 1 && next === last) {
    next = (next + 1) % variants.length;
  }
  lastVariants[intentKey] = next;
  return variants[next];
}

const FALLBACK_VARIANTS = [
  "Hmm, that one flew over my leaves. I'm best at Mishal's projects, skills and hiring. Try one of these?",
  "My brain has 3 branches: projects, skills, and hiring. That question lives on a 4th, which I don't have. Try one of these?",
  "I looked everywhere in my digital bark. Try picking one of these popular questions:",
  "My sensors didn't catch that one. Try asking about Mishal's work, tech stack, or background!",
  "I'm just a small sprite with a curated memory of Mishal's portfolio. How about one of these instead?",
  "That's beyond my digital forest. Stick to Mishal's code, projects, or background!",
  "Leaf me hanging, did you? Let's get back to what I know best:",
  "That query didn't match any of my rings. Try one of these popular questions:",
];

export const DEFAULT_FOLLOW_UPS = [
  "What has Mishal built?",
  "Tech stack?",
  "Why hire him?",
  "Contact",
];

// Normalizer: expands contractions, removes punctuation, corrects typos
export function normalizeQuery(raw: string): string {
  if (!raw) return "";
  let s = raw.toLowerCase().trim();

  // Contraction expansions
  s = s.replace(/\bwhat'?s\b/g, "what is");
  s = s.replace(/\bwho'?s\b/g, "who is");
  s = s.replace(/\bhow'?s\b/g, "how is");
  s = s.replace(/\bwhere'?s\b/g, "where is");
  s = s.replace(/\bi'?m\b/g, "i am");
  s = s.replace(/\byou'?re\b/g, "you are");
  s = s.replace(/\bdon'?t\b/g, "do not");
  s = s.replace(/\bcan'?t\b/g, "cannot");
  s = s.replace(/\bit'?s\b/g, "it is");
  s = s.replace(/\bthat'?s\b/g, "that is");

  // Common typo corrections
  const typoMap: Record<string, string> = {
    pyrtoch: "pytorch",
    pytroch: "pytorch",
    pytorh: "pytorch",
    dinov: "dinov2",
    dino: "dinov2",
    "dino-v2": "dinov2",
    dino_v2: "dinov2",
    carrerlens: "careerlens",
    "carrer lens": "careerlens",
    carerlens: "careerlens",
    "career lens": "careerlens",
    "fast api": "fastapi",
    fstapi: "fastapi",
    kontact: "contact",
    cntact: "contact",
    conatct: "contact",
    colledge: "college",
    colleg: "college",
    skils: "skills",
    skil: "skills",
    intren: "intern",
    intrenship: "internship",
    internhip: "internship",
    exprerience: "experience",
    expirience: "experience",
    edukation: "education",
    educashun: "education",
    mishall: "mishal",
    misaal: "mishal",
    mishaal: "mishal",
    resumee: "resume",
    resum: "resume",
    linkdin: "linkedin",
    linkidin: "linkedin",
    githb: "github",
    "git-hub": "github",
  };

  // Strip non-alphanumeric except spaces and hyphens
  s = s.replace(/[^a-z0-9\s-]/g, " ");

  const words = s.split(/\s+/).filter(Boolean);
  const corrected = words.map((w) => typoMap[w] || w);
  return corrected.join(" ");
}

export function matchBuddyIntent(
  rawInput: string,
  gameContextOrOptions?: number | MatchBuddyOptions,
): BuddyAnswer | null {
  if (!rawInput || !rawInput.trim()) {
    return null;
  }

  const query = rawInput.trim();
  const options: MatchBuddyOptions =
    typeof gameContextOrOptions === "number"
      ? { gameStep: gameContextOrOptions }
      : gameContextOrOptions || {};

  const normalized = normalizeQuery(query);

  // Mini-game progression (if active)
  if (options.gameStep && options.gameStep > 0) {
    if (options.gameStep === 1) {
      return {
        intent: "game-q2",
        text: `Bold choice! Question 2 of 3: **PyTorch or TensorFlow?**`,
        mood: "happy",
        reaction: "Nice pick!",
        followUps: ["PyTorch", "TensorFlow"],
        gameStep: 2,
      };
    }
    if (options.gameStep === 2) {
      return {
        intent: "game-q3",
        text: `Classic engineering debate. Question 3 of 3: **Coffee or Chai?**`,
        mood: "excited",
        reaction: "Love that!",
        followUps: ["Coffee", "Chai"],
        gameStep: 3,
      };
    }
    if (options.gameStep === 3) {
      return {
        intent: "game-end",
        text: `A person of exquisite taste! You know who shares that exact mindset? **${site.name}**. Check out how he applied it in **DDSS**!`,
        mood: "laugh",
        reaction: "Perfect!",
        followUps: ["Tell me about DDSS", "Tech stack?", "Show other projects"],
        gameStep: 0,
      };
    }
  }

  // =========================================================================
  // 1. IDENTITY INTENTS (CHECKED BEFORE ANYTHING ELSE)
  // =========================================================================

  // Helper: check if visitor is stating their name
  const nameIntroMatch = query.match(/^(?:my name is|i am|i'm|call me)\s+([a-zA-Z\s'-]+)$/i);
  if (nameIntroMatch) {
    const rawName = nameIntroMatch[1].trim();
    if (rawName && !/\b(sprout|mishal|bot|assistant|nothing|unknown)\b/i.test(rawName)) {
      const formattedName = rawName
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      return {
        intent: "set_visitor_name",
        text: `Nice to meet you, ${formattedName}! What would you like to know about Mishal's work?`,
        mood: "happy",
        reaction: "Nice to meet you!",
        followUps: ["What has Mishal built?", "Tech stack?", "Why hire him?"],
        newVisitorName: formattedName,
        awaitingName: false,
      };
    }
  }

  // If Sprout was awaiting visitor's name and user enters a short name (not a command/keyword)
  if (options.awaitingName) {
    const isSingleOrPairName = /^[a-zA-Z'-]{2,20}(?:\s+[a-zA-Z'-]{2,20})?$/.test(query);
    const isSystemKeyword =
      /\b(what|who|why|where|how|projects?|stack|skills?|cv|resume|ddss|contact|email|hello|hi|bye|help|joke|no|yes)\b/i.test(
        query,
      );
    if (isSingleOrPairName && !isSystemKeyword) {
      const formattedName = query
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      return {
        intent: "set_visitor_name",
        text: `Nice to meet you, ${formattedName}! What would you like to know about Mishal's work?`,
        mood: "happy",
        reaction: "Nice to meet you!",
        followUps: ["What has Mishal built?", "Tech stack?", "Why hire him?"],
        newVisitorName: formattedName,
        awaitingName: false,
      };
    }
  }

  // A) VISITOR NAME: "my name", "who am I", "do you know me"
  const isVisitorNameQuery =
    /\b(my name|who am i|do you know me|tell me my name|do you remember me|what is my name)\b/i.test(
      normalized,
    ) || /\b(whats my name|what's my name)\b/i.test(query);

  if (isVisitorNameQuery) {
    if (options.visitorName) {
      return {
        intent: "visitor_name",
        text: `You told me your name is ${options.visitorName}.`,
        mood: "happy",
        reaction: "I remember!",
        followUps: ["What has Mishal built?", "Tech stack?", "Why hire him?"],
      };
    }
    return {
      intent: "visitor_name",
      text: "I don't know your name yet. I'm Sprout, Mishal's assistant. Who am I talking to?",
      mood: "shy",
      reaction: "Who are you?",
      followUps: ["Tell me about Mishal", "Projects", "Tech stack?"],
      awaitingName: true,
    };
  }

  // B) SPROUT'S IDENTITY: "your name", "who are you", "what are you"
  const isSproutIdentity =
    /\b(your name|who are you|what are you|what is your name|are you sprout|are you a bot|are you ai)\b/i.test(
      normalized,
    ) && !/\b(mishal|his|creator|owner|author|built)\b/i.test(normalized);

  if (isSproutIdentity) {
    return {
      intent: "sprout_name",
      text: "I'm Sprout, Mishal's portfolio assistant. I only answer questions about Mishal's portfolio, projects, skills, education, and availability.",
      mood: "happy",
      reaction: "That's me!",
      followUps: ["Who is Mishal?", "What has Mishal built?", "Tech stack?"],
    };
  }

  // C) CREATOR / OWNER / MISHAL'S NAME: "his name", "Mishal's name", "owner", "user's name", "who made this", "who is mishal"
  const isCreatorNameQuery =
    /\b((his|mishals?|users?|creators?|authors?)\s+name|owner|who is the owner|portfolio owner|who made this|who built this|who created this|who is mishal|who is muhammed mishal)\b/i.test(
      normalized,
    ) || /\b(user's name|mishal's name|who's mishal|who made)\b/i.test(query);

  if (isCreatorNameQuery) {
    return {
      intent: "creator_name",
      text: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
      mood: "excited",
      reaction: "Muhammed Mishal!",
      followUps: ["Tell me about DDSS", "Tech stack?", "Why hire him?"],
    };
  }

  // Mini-game start
  if (/\b(play (a )?game|mini ?game|trivia|quiz)\b/i.test(normalized)) {
    return {
      intent: "game-q1",
      text: "Let's play This or That! Question 1 of 3: **Tabs or spaces?**",
      mood: "excited",
      reaction: "Game on!",
      followUps: ["Tabs", "Spaces"],
      gameStep: 1,
    };
  }

  // Profanity / Rude input (calm, polite redirect)
  if (/\b(fuck|shit|bitch|asshole|bastard|dick|crap|piss|stfu)\b/i.test(normalized)) {
    return {
      intent: "swear",
      text: "Let's keep things friendly! I'm here to help you explore Mishal's AI/ML projects, skills, and background.",
      mood: "shy",
      reaction: "Friendly vibes!",
      followUps: ["Tech stack?", "What has Mishal built?", "Why hire him?"],
    };
  }

  // Out of scope (weather, politics, generic coding help, crypto)
  if (
    /\b(weather|temperature|forecast|rain|sunny|hot outside|cold outside)\b/i.test(normalized) ||
    /\b(politics|election|president|prime minister|government|trump|biden|modi)\b/i.test(
      normalized,
    ) ||
    /\b(write (python |any |a )?code|debug (my |this )?code|solve this|help me code|fix my code|code for me|python homework|write a script|leetcode)\b/i.test(
      normalized,
    ) ||
    /\b(bitcoin|crypto|stock price|recipe|movie review)\b/i.test(normalized)
  ) {
    return {
      intent: "out_of_scope",
      text: "I only know Mishal's portfolio. Ask me about his projects, skills, education, or availability!",
      mood: "shy",
      reaction: "Portfolio only!",
      followUps: ["What has Mishal built?", "Tech stack?", "Why hire him?"],
    };
  }

  // Dance / Sing
  if (/\b(dance|sing|song|groove|bust a move)\b/i.test(normalized)) {
    return {
      intent: "dance",
      text: "Look at those wooden moves! (No rhythm was harmed.)",
      mood: "laugh",
      reaction: "Groovy!",
      followUps: ["Tell me a joke", "Tech stack?", "Projects"],
      dance: true,
    };
  }

  // Jokes -> polite redirect with witty ML pun
  if (/\b(joke|jokes|funny|make me laugh|humor|pun|laugh)\b/i.test(normalized)) {
    return {
      intent: "joke",
      text: "I specialize in Mishal's engineering portfolio rather than stand-up comedy! But here's a quick one: Why did the neural network go to therapy? It had too many **unresolved weights**! Let's get back to his projects and stack.",
      mood: "laugh",
      reaction: "Ha!",
      followUps: ["What has Mishal built?", "Tech stack?", "Why hire him?"],
    };
  }

  // How are you
  if (/\b(how are you|how is it going|how do you do)\b/i.test(normalized)) {
    return {
      intent: "how_are_you",
      text: "Bark is solid and leaves are green! Ready to answer any questions about Mishal's projects and skills.",
      mood: "happy",
      reaction: "Doing great!",
      followUps: ["Tell me about Mishal", "Tech stack?", "Why hire him?"],
    };
  }

  // Time-aware greetings
  if (/\bgood (morning|afternoon|evening|night)\b/i.test(normalized)) {
    const hour = new Date().getHours();
    let text = "";
    if (hour < 12) {
      text = "Good morning! Fresh coffee and clean weights. What shall we explore?";
    } else if (hour < 17) {
      text = "Good afternoon! Time for a quick tour of Mishal's portfolio?";
    } else {
      text = "Good evening! Don't let the gradients keep you up too late.";
    }
    return {
      intent: "time_greeting",
      text,
      mood: "happy",
      reaction: "Greetings!",
      followUps: ["Tell me about Mishal", "Projects", "Tech stack?"],
    };
  }

  // General Greetings
  if (/^(hi|hello|hey|namaste|salaam|assalamu alaikum|hola|howdy|sprout|sup)\b/i.test(normalized)) {
    let text = `Hey there! Welcome to ${site.name}'s portfolio.`;
    if (options.visitorName && !options.greetedWithName) {
      text = `Hello ${options.visitorName}! Glad you're here. Ask me anything about Mishal's work.`;
    }
    return {
      intent: "greeting",
      text,
      mood: "happy",
      reaction: "Hello!",
      followUps: ["What has Mishal built?", "Tech stack?", "Why hire him?"],
      greetedWithName: true,
    };
  }

  // Thanks
  if (
    /\b(thank|thanks|thx|hug|appreciate|cute|love you|awesome|sweet|good bot)\b/i.test(normalized)
  ) {
    return {
      intent: "thanks",
      text: `You're very welcome! ${site.name} and I appreciate you visiting.`,
      mood: "hug",
      reaction: "Aww!",
      followUps: ["Tell me about Mishal", "Why hire him?", "Contact"],
    };
  }

  // Goodbye
  if (/\b(bye|goodbye|see you|cya|farewell|exit|quit)\b/i.test(normalized)) {
    return {
      intent: "goodbye",
      text: `Thanks for visiting! Feel free to reach out to Mishal at **${site.email}** anytime.`,
      mood: "happy",
      reaction: "See you!",
      followUps: ["Download CV", "Contact", "Why hire him?"],
    };
  }

  // What is he looking for / Seeking
  if (
    /\b(what (role|job) is he looking for|what is he looking for|what are you looking for|what (role|job) are you looking for|looking for (a |work|roles?)|target roles?|job preferences?|career goals?)\b/i.test(
      normalized,
    )
  ) {
    return {
      intent: "seeking",
      text: `${site.name} is looking for **AI / ML Engineer** roles focusing on deep learning, computer vision, retrieval pipelines (RAG), and high-performance Python backends.`,
      mood: "excited",
      reaction: "Target roles!",
      followUps: ["Why hire him?", "Tech stack?", "Is he available?"],
    };
  }

  // Why hire him
  if (/\b(why (should i |to )?hire|why hire|hire him|recommendation|value)\b/i.test(normalized)) {
    const exp = about.facts.find((f) => f.label === "EXPERIENCE");
    const edu = about.facts.find((f) => f.label === "EDUCATION");
    return {
      intent: "why_hire",
      text: `Three reasons: **1. Real AI/ML experience** (${exp?.text?.trim() || "Blue Cast Technologies"}) building clinical case retrieval; **2. Full-stack capability** from PyTorch and FastAPI to 60fps web apps; **3. Rigorous foundation** with ${edu?.bold || "MCA"} (${edu?.text?.trim() || "TKM College of Engineering"}).`,
      mood: "excited",
      reaction: "Here's why!",
      followUps: ["Is he available?", "Download CV", "Contact"],
    };
  }

  // DDSS How it works
  if (
    /\b(how does ddss work|ddss (how|pipeline|architecture)|how does (the )?case retrieval work)\b/i.test(
      normalized,
    )
  ) {
    return {
      intent: "ddss_how",
      text: "A clinician uploads a lesion photo, **DINOv2 (ViT-Base)** extracts a 768-dimensional dense embedding, and **FAISS** with **Supabase PostgreSQL/pgvector** retrieves the most similar cases across 198 SD-198 disease classes with High/Moderate/Low confidence indicators, served via **FastAPI**.",
      mood: "excited",
      reaction: "Here's how!",
      followUps: ["What are the limits?", "Show other projects", "Tech stack?"],
    };
  }

  // DDSS Limits
  if (/\b(ddss (limits|limitations|risk)|what are the limits)\b/i.test(normalized)) {
    const ddss = works.projects.find((p) => p.id === "ddss") || works.projects[0];
    return {
      intent: "ddss_limits",
      text: `**${ddss.title} Limits**: ${ddss.mutedLine} Designed strictly for clinical decision support to assist medical doctors with evidence, never for autonomous or independent patient diagnosis.`,
      mood: "happy",
      reaction: "Important limit.",
      followUps: ["How does it work?", "Show other projects", "Why hire him?"],
    };
  }

  // DDSS Overview
  if (/\b(ddss|dermatolog|skin|dinov2|clinical|doctor|decision support)\b/i.test(normalized)) {
    const ddss = works.projects.find((p) => p.id === "ddss") || works.projects[0];
    return {
      intent: "ddss",
      text: `**${ddss.title}**: ${ddss.sentence} ${ddss.line} **${ddss.mutedLine}**`,
      mood: "excited",
      reaction: "DDSS is great!",
      followUps: ["How does it work?", "What are the limits?", "Show other projects"],
    };
  }

  // Productivity How it works
  if (
    /\b(how does (the )?productivity|productivity (how|pipeline|model)|how does (the )?role prediction work)\b/i.test(
      normalized,
    )
  ) {
    return {
      intent: "productivity_how",
      text: "The pipeline performs EDA and feature engineering across session activity metrics (typing intensity, idle intervals, application usage), training **Random Forest** and **Logistic Regression** models saved with **joblib** and served through an interactive **Streamlit** app with ~87% classification accuracy.",
      mood: "excited",
      reaction: "Here's how!",
      followUps: ["Productivity project", "Show other projects", "Why hire him?"],
    };
  }

  // Productivity Overview
  if (
    /\b(productivity|role prediction|worker|random forest|logistic regression|streamlit)\b/i.test(
      normalized,
    )
  ) {
    const role = works.projects.find((p) => p.id === "role") || works.projects[1];
    return {
      intent: "productivity",
      text: `**${role.title}**: ${role.sentence} ${role.line} Result: **${role.mutedLine}**`,
      mood: "happy",
      reaction: "Productivity AI!",
      followUps: ["How does it work?", "Why hire him?", "Show other projects"],
    };
  }

  // CareerLens How it works
  if (/\b(how does (the )?careerlens|careerlens (how|pipeline|architecture))\b/i.test(normalized)) {
    return {
      intent: "careerlens_how",
      text: "CareerLens parses PDF resumes, creates 384-dimensional dense vectors using **Sentence Transformers (MiniLM)**, searches role definitions with **FAISS**, and orchestrates the **Gemini API** to produce verified skill gap citations.",
      mood: "excited",
      reaction: "Here's how!",
      followUps: ["CareerLens AI", "Show other projects", "Tech stack?"],
    };
  }

  // CareerLens Overview
  if (/\b(careerlens|resume (analys|gap|matcher|evaluat)|minilm|gemini)\b/i.test(normalized)) {
    const cl = works.projects.find((p) => p.id === "careerlens") || works.projects[2];
    return {
      intent: "careerlens",
      text: `**${cl.title}**: ${cl.sentence} ${cl.line} **${cl.mutedLine}**`,
      mood: "excited",
      reaction: "CareerLens!",
      followUps: ["How does it work?", "Show other projects", "Tech stack?"],
    };
  }

  // Additional projects
  if (
    /\b(additional projects?|other projects?|build track pro|fresh cart|drop for life)\b/i.test(
      normalized,
    )
  ) {
    return {
      intent: "additional_projects",
      text: `Besides his flagship AI/ML systems, ${site.name} has built: **Build Track Pro** (Django, MySQL contractor management), **Fresh Cart** (PHP, JavaScript, MySQL e-commerce), and **Drop for Life** (blood donation coordination platform).`,
      mood: "happy",
      reaction: "More projects!",
      followUps: ["Tell me about DDSS", "Productivity project", "Tech stack?"],
    };
  }

  // Projects Overview
  if (
    /\b(projects?|portfolio|built|works|case stud(y|ies)|showcase|work samples)\b/i.test(normalized)
  ) {
    const projectNames = Object.keys(PROJECTS);
    return {
      intent: "projects",
      text: `${site.name}'s key works include: **${projectNames[0]}**, **${projectNames[1]}**, and **${projectNames[2]}**. Click on Works to explore the full interactive cards!`,
      mood: "happy",
      reaction: "Here they are!",
      followUps: ["Tell me about DDSS", "Productivity project", "CareerLens"],
    };
  }

  // Languages spoken
  if (
    /\b(languages? spoken|spoken languages?|what languages?|speak)\b/i.test(normalized) &&
    !/\b(python|javascript|typescript|c\+\+|sql)\b/i.test(normalized)
  ) {
    return {
      intent: "languages_spoken",
      text: `${site.name} is fluent in **English** and **Malayalam**.`,
      mood: "happy",
      reaction: "Languages!",
      followUps: ["Location", "Education", "Contact"],
    };
  }

  // Tech Stack / Technologies
  if (
    /\b(stack|tech|technolog(y|ies)|tools?|skills?|programming languages?|libraries|frameworks?|python|fastapi|pytorch|faiss|postgresql|django)\b/i.test(
      normalized,
    )
  ) {
    const stackFact = about.facts.find((f) => f.label === "STACK");
    return {
      intent: "stack",
      text: `${site.name}'s core technical stack: **${stackFact ? stackFact.text : "Python, FastAPI, Django, PyTorch, FAISS, scikit-learn, PostgreSQL"}**.`,
      mood: "excited",
      reaction: "Solid stack!",
      followUps: ["What is he best at?", "Why hire him?", "Projects"],
    };
  }

  // Best at / Superpower
  if (/\b(best at|superpower|specialty|specialization|expertise|strongest)\b/i.test(normalized)) {
    return {
      intent: "best_at",
      text: `${site.name} is best at **Deep Learning**, **Computer Vision (DINOv2)**, **Retrieval-Augmented Generation (FAISS)**, and building fast **FastAPI/PyTorch** backend services with 60fps frontends.`,
      mood: "excited",
      reaction: "Top skills!",
      followUps: ["Why hire him?", "Tell me about DDSS", "Tech stack?"],
    };
  }

  // Location
  if (/\b(location|where (is he|does he live)|city|country|based)\b/i.test(normalized)) {
    return {
      intent: "location",
      text: `${site.name} is based in **Kollam, Kerala, India** (${site.location}), open to roles locally, across India, GCC, or remote worldwide.`,
      mood: "happy",
      reaction: "Location!",
      followUps: ["Is he available?", "Why hire him?", "Contact"],
    };
  }

  // Education / Degree
  if (
    /\b(education|college|degree|mca|bca|tkm|musaliar|studies|study|gpa|cgpa|university)\b/i.test(
      normalized,
    )
  ) {
    const edu = about.facts.find((f) => f.label === "EDUCATION");
    return {
      intent: "education",
      text: `**${edu?.bold || "MCA · GPA 8.33/10"}**${edu?.text || " · TKM College of Engineering · 08/2024 - 07/2026"}, preceded by **${edu?.secondary || "BCA · Musaliar College of Arts and Science · 08/2021 - 04/2024"}**.`,
      mood: "happy",
      reaction: "Education!",
      followUps: ["Experience", "Why hire him?", "Tech stack?"],
    };
  }

  // Experience / Internship
  if (
    /\b(experience|intern|internship|blue cast|bluecast|career|background|work history)\b/i.test(
      normalized,
    )
  ) {
    const exp = about.facts.find((f) => f.label === "EXPERIENCE");
    return {
      intent: "experience",
      text: `**${exp?.bold || "AI / ML Developer Intern"}**${exp?.text || " · Blue Cast Technologies · Jan - Apr 2026"}. ${exp?.secondary || "Contributed to an image-based dermatology decision-support system using 768-dim DINOv2 embeddings and FastAPI pgvector pipeline across 198 classes."}`,
      mood: "happy",
      reaction: "Experience!",
      followUps: ["Tell me about DDSS", "Why hire him?", "Education"],
    };
  }

  // Certifications
  if (/\b(certifications?|certified|credentials?|azure ai|keras|nptel)\b/i.test(normalized)) {
    return {
      intent: "certifications",
      text: `${site.name} holds 5 key certifications: **Microsoft Azure AI Essentials** (LinkedIn), **Deep Learning Essentials with Keras** (IBM), **Java Certification** (NPTEL), **Python Data Science, Machine Learning & AI**, and **Data Engineering: SQL, Python & Spark**.`,
      mood: "happy",
      reaction: "Certified!",
      followUps: ["Tech stack?", "Education", "Projects"],
    };
  }

  // Hiring / Availability
  if (
    /\b(hire|hiring|available|availability|open to (work|roles)|relocate|remote|contract|full-?time|job)\b/i.test(
      normalized,
    )
  ) {
    return {
      intent: "hiring",
      text: `Status: **${site.availability}**! ${site.name} is ready for AI/ML engineering roles across Kerala, India, GCC, or remote worldwide.`,
      mood: "excited",
      reaction: "Available!",
      followUps: ["Why hire him?", "Download CV", "Contact"],
    };
  }

  // Download CV
  if (/\b(cv|resume|download cv|pdf)\b/i.test(normalized)) {
    return {
      intent: "cv",
      text: `You can grab ${site.name}'s CV directly from the header button or right here: **[Download CV](${site.cv})**.`,
      mood: "happy",
      reaction: "Resume ready!",
      followUps: ["Why hire him?", "Tech stack?", "Contact"],
    };
  }

  // LinkedIn / GitHub / Socials
  if (/\b(linkedin|github|socials?|profiles?)\b/i.test(normalized)) {
    return {
      intent: "socials",
      text: `Check out ${site.name}'s **GitHub** at **${site.github}** and **LinkedIn** at **${site.linkedin}**!`,
      mood: "happy",
      reaction: "Social links!",
      followUps: ["Contact", "Projects", "Download CV"],
    };
  }

  // Contact / Email
  if (/\b(contact|email|reach|message|touch|mail)\b/i.test(normalized)) {
    return {
      intent: "contact",
      text: `You can reach ${site.name} directly at **${site.email}**, or connect via LinkedIn and GitHub!`,
      mood: "happy",
      reaction: "Say hello!",
      followUps: ["Download CV", "Is he available?", "Projects"],
    };
  }

  // About Mishal / Bio
  if (
    /\b(who (is|are)|about (mishal|you)|tell me about mishal|introduce|bio)\b/i.test(normalized)
  ) {
    return {
      intent: "about",
      text: `${about.bio} Based in **${site.location.split(" [")[0]}**.`,
      mood: "shy",
      reaction: "About Mishal!",
      followUps: ["Why hire him?", "Projects", "Tech stack?"],
    };
  }

  // True Fallback (rotating polite response with exactly 3 suggestion chips)
  const fallbackText = pickVariant("fallback", FALLBACK_VARIANTS);
  return {
    intent: "fallback",
    text: fallbackText,
    mood: "shy",
    reaction: nextReaction(),
    followUps: ["What has Mishal built?", "Tech stack?", "Why hire him?"],
  };
}
