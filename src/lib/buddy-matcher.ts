import { about, works, site, PROJECTS } from "@/content";

export type BuddyMood = "excited" | "happy" | "shy" | "laugh" | "sad" | "hug" | "surprised";

export interface BuddyAnswer {
  intent: string;
  text: string;
  mood: BuddyMood;
}

const ML_JOKES = [
  "Why did the neural network go to therapy? It had too many **unresolved weights**!",
  "Why do machine learning models hate the outdoors? Too much **overfitting** in the wild!",
  "A gradient descent algorithm walks into a bar and says: I'm looking for the **global minimum**!",
];

let jokeIndex = 0;

export function matchBuddyIntent(rawInput: string): BuddyAnswer | null {
  if (!rawInput || !rawInput.trim()) {
    return null;
  }

  const query = rawInput.trim();

  // 1. Greeting
  if (/^(hi|hello|hey|greetings|howdy|sprout|sup|good (morning|afternoon|evening))\b/i.test(query)) {
    return {
      intent: "greeting",
      text: `Hi there! I'm **Sprout**, ${site.name}'s acorn buddy. Ask me about his projects, skills, studies, or hiring!`,
      mood: "happy",
    };
  }

  // 2. Rude / Negative
  if (/\b(stupid|dumb|hate|bad|annoying|shut up|useless|idiot|trash|garbage|boring)\b/i.test(query)) {
    return {
      intent: "rude",
      text: "Hey now, let's keep it gentle! I'm just a little acorn sprite trying my best.",
      mood: "sad",
    };
  }

  // 3. Thanks / Hug
  if (/\b(thank|thanks|thx|hug|appreciate|cute|love you|awesome|sweet|good bot)\b/i.test(query)) {
    return {
      intent: "thanks/hug",
      text: `Aww, thank you! Sending you a big warm acorn hug. ${site.name} and I appreciate you stopping by!`,
      mood: "hug",
    };
  }

  // 4. Joke
  if (/\b(joke|jokes|funny|make me laugh|humor|pun|laugh)\b/i.test(query)) {
    const joke = ML_JOKES[jokeIndex % ML_JOKES.length];
    jokeIndex++;
    return {
      intent: "joke",
      text: joke,
      mood: "laugh",
    };
  }

  // 5. DDSS (decision support, not diagnosis)
  if (/\b(ddss|dermatolog|skin|dinov2|clinical|doctor|decision support)\b/i.test(query)) {
    const ddss = works.projects.find((p) => p.id === "ddss") || works.projects[0];
    return {
      intent: "ddss",
      text: `**${ddss.title}**: ${ddss.sentence} ${ddss.line} Remember: **${ddss.mutedLine}**`,
      mood: "excited",
    };
  }

  // 6. Productivity & Role Prediction
  if (/\b(productivity|role prediction|worker|cluster|clustering|k-means|random forest)\b/i.test(query)) {
    const role = works.projects.find((p) => p.id === "role") || works.projects[1];
    return {
      intent: "productivity",
      text: `**${role.title}**: ${role.sentence} ${role.line} Result: **${role.mutedLine}**`,
      mood: "happy",
    };
  }

  // 7. CareerLens AI
  if (/\b(careerlens|resume|gap|gaps|minilm|gemini)\b/i.test(query)) {
    const cl = works.projects.find((p) => p.id === "careerlens") || works.projects[2];
    return {
      intent: "careerlens",
      text: `**${cl.title}**: ${cl.sentence} ${cl.line} **${cl.mutedLine}**`,
      mood: "excited",
    };
  }

  // 8. Projects Overview / What has Mishal built
  if (/\b(projects?|portfolio|built|works|case stud(y|ies)|showcase|work samples)\b/i.test(query)) {
    const projectNames = Object.keys(PROJECTS);
    return {
      intent: "projects",
      text: `${site.name}'s key works include: **${projectNames[0]}**, **${projectNames[1]}**, and **${projectNames[2]}**. Click on Works to explore the full interactive cards!`,
      mood: "happy",
    };
  }

  // 9. Stack / Technologies
  if (/\b(stack|tech|technolog(y|ies)|tools?|languages?|libraries|frameworks?|python|fastapi|pytorch|faiss)\b/i.test(query)) {
    const stackFact = about.facts.find((f) => f.label === "STACK");
    return {
      intent: "stack",
      text: `${site.name}'s core technical stack: **${stackFact ? stackFact.text : "Python, FastAPI, Django, PyTorch, FAISS, scikit-learn, PostgreSQL"}**.`,
      mood: "excited",
    };
  }

  // 10. Education
  if (/\b(education|college|degree|mca|bca|tkm|musaliar|studies|study|cgpa|university)\b/i.test(query)) {
    const edu = about.facts.find((f) => f.label === "EDUCATION");
    return {
      intent: "education",
      text: `**${edu?.bold || "MCA · CGPA 8.33"}**${edu?.text || " · TKM College of Engineering, Kollam · 2024-26"}, preceded by **${edu?.secondary || "BCA · Musaliar College of Arts and Science · 2021-24"}**.`,
      mood: "happy",
    };
  }

  // 11. Experience / Internship
  if (/\b(experience|intern|internship|bluecast|career|background|work history)\b/i.test(query)) {
    const exp = about.facts.find((f) => f.label === "EXPERIENCE");
    return {
      intent: "experience",
      text: `**${exp?.bold || "AI / ML Intern, DDSS"}**${exp?.text || " · Bluecast Technologies · Jan-Apr 2026"}. ${exp?.secondary || "Built a dermatology decision-support system using DINOv2 case retrieval."}`,
      mood: "happy",
    };
  }

  // 12. Hiring / Availability
  if (/\b(hire|hiring|available|availability|open to (work|roles)|relocate|remote|kerala|uae|contract|full-?time|job)\b/i.test(query)) {
    return {
      intent: "hiring",
      text: `Status: **${site.availability}**! ${site.name} is ready for AI/ML engineering roles across Kerala, UAE, or remote worldwide.`,
      mood: "excited",
    };
  }

  // 13. Contact / Email / CV
  if (/\b(contact|email|reach|message|touch|cv|resume|download cv|github|linkedin|mail)\b/i.test(query)) {
    return {
      intent: "contact",
      text: `You can reach ${site.name} at **${site.email}**, check his GitHub at **${site.github}**, or download his CV directly from the header!`,
      mood: "happy",
    };
  }

  // 14. Who / About
  if (/\b(who (is|are)|about (mishal|you)|tell me about mishal|introduce|bio)\b/i.test(query)) {
    return {
      intent: "about",
      text: `${about.bio} Based in **${site.location.split(" [")[0]}**.`,
      mood: "shy",
    };
  }

  // 15. Fallback
  return {
    intent: "fallback",
    text: "I only know Mishal's work, skills, studies and hiring. Try those!",
    mood: "shy",
  };
}
