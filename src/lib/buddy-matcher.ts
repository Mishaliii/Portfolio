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

const ML_JOKES = [
  "Why did the neural network go to therapy? It had too many **unresolved weights**!",
  "Why do machine learning models hate the outdoors? Too much **overfitting** in the wild!",
  "A gradient descent algorithm walks into a bar and says: I'm looking for the **global minimum**!",
  "Why did the data scientist cross the road? To optimize the **loss function** on the other side!",
];

const FALLBACK_VARIANTS = [
  "Hmm, that one flew over my leaves. I'm best at Mishal's projects, skills and hiring. Try one of these?",
  "My brain has 3 branches: projects, skills, hiring. That question lives on a 4th, which I don't have.",
  "I looked everywhere in my bark. Nothing. Pick one of these?",
  "My acorn sensors didn't catch that one. Try asking about Mishal's work or stack!",
  "I'm just a small sprite with a curated memory. How about one of these instead?",
  "That's beyond my digital forest. Stick to Mishal's code, projects, or background!",
  "Leaf me hanging, did you? Let's get back to what I know best:",
  "That query didn't match any of my rings. Try one of these popular questions:",
];

export const DEFAULT_FOLLOW_UPS = [
  "What has Mishal built?",
  "Tech stack?",
  "Why hire him?",
];

export function matchBuddyIntent(rawInput: string, gameContext?: number): BuddyAnswer | null {
  if (!rawInput || !rawInput.trim()) {
    return null;
  }

  const query = rawInput.trim();

  // Mini-game progression (if active)
  if (gameContext && gameContext > 0) {
    if (gameContext === 1) {
      return {
        intent: "game-q2",
        text: `Bold choice! Question 2 of 3: **PyTorch or TensorFlow?**`,
        mood: "happy",
        reaction: "Nice pick!",
        followUps: ["PyTorch", "TensorFlow"],
        gameStep: 2,
      };
    }
    if (gameContext === 2) {
      return {
        intent: "game-q3",
        text: `Classic engineering debate. Question 3 of 3: **Coffee or Chai?**`,
        mood: "excited",
        reaction: "Love that!",
        followUps: ["Coffee", "Chai"],
        gameStep: 3,
      };
    }
    if (gameContext === 3) {
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

  // Mini-game start
  if (/\b(play (a )?game|mini ?game|trivia|quiz)\b/i.test(query)) {
    return {
      intent: "game-q1",
      text: "Let's play This or That! Question 1 of 3: **Tabs or spaces?**",
      mood: "excited",
      reaction: "Game on!",
      followUps: ["Tabs", "Spaces"],
      gameStep: 1,
    };
  }

  // 1. Swear words / profanity (calm, light redirect)
  if (/\b(fuck|shit|bitch|asshole|bastard|dick|crap)\b/i.test(query)) {
    const text = pickVariant("swear", [
      "Whoa there, keep it clean! Even acorns have sensitive bark.",
      "Easy now! We keep this garden friendly.",
      "Hey, language! Let's redirect that energy to machine learning.",
    ]);
    return {
      intent: "swear",
      text,
      mood: "shy",
      reaction: "Whoa!",
      followUps: ["Tech stack?", "Tell me a joke", "Projects"],
    };
  }

  // 2. Dance / Sing
  if (/\b(dance|sing|song|groove|bust a move)\b/i.test(query)) {
    const text = pickVariant("dance", [
      "Look at those wooden moves! (No rhythm was harmed.)",
      "Dancing like an acorn in a gentle autumn breeze.",
      "Branch-shaking groove activated!",
    ]);
    return {
      intent: "dance",
      text,
      mood: "laugh",
      reaction: "Groovy!",
      followUps: ["Tell me a joke", "Tech stack?", "Projects"],
      dance: true,
    };
  }

  // 3. How are you
  if (/\bhow are you\b|\bhow's it going\b|\bhow do you do\b/i.test(query)) {
    const text = pickVariant("how_are_you", [
      "Photosynthesizing nicely, thanks! How can I help you explore Mishal's work?",
      "Bark is solid, leaves are green. Ready for any technical questions!",
      "Living my best acorn life in the bottom-right corner. What are you curious about?",
      "Zero bugs in my digital branches today! What would you like to see?",
    ]);
    return {
      intent: "how_are_you",
      text,
      mood: "happy",
      reaction: "Doing great!",
      followUps: ["Tell me about Mishal", "Tech stack?", "Why hire him?"],
    };
  }

  // 4. Who are you / Are you AI / Real / Name
  if (/\b(who are you|your name|what are you|are you (ai|real|human|bot|robot))\b/i.test(query)) {
    const text = pickVariant("who_are_you", [
      "I'm Sprout, a tiny rule-based chatbot Mishal built. No tree was harmed.",
      "I'm Sprout! 0% neural network, 100% crafted acorn code.",
      "Sprout here! Mishal's pocket assistant carved from digital oak.",
    ]);
    return {
      intent: "who_are_you",
      text,
      mood: "happy",
      reaction: "That's me!",
      followUps: ["Who made you?", "What has Mishal built?", "Tech stack?"],
    };
  }

  // 5. Who made you
  if (/\b(who made you|who built you|creator|who created you|author)\b/i.test(query)) {
    const text = pickVariant("who_made_you", [
      `**${site.name}** built me! He wrote the lines, I bring the acorns.`,
      `Mishal crafted me in TypeScript and GSAP. Don't worry, he treats me well.`,
      `Created by ${site.name} to guide visitors through his projects and experience.`,
    ]);
    return {
      intent: "who_made_you",
      text,
      mood: "excited",
      reaction: "Mishal did!",
      followUps: ["Tell me about Mishal", "Why hire him?", "Projects"],
    };
  }

  // 6. Age
  if (/\b(how old are you|your age|when were you (born|created))\b/i.test(query)) {
    const text = pickVariant("age", [
      "About two days old in Git commits, but 80 rings in spirit.",
      "Young enough to run on GSAP, old enough to respect solid code.",
      "My bark was committed this week. Timeless, really.",
    ]);
    return {
      intent: "age",
      text,
      mood: "laugh",
      reaction: "Ageless!",
      followUps: ["Who made you?", "Tech stack?", "Projects"],
    };
  }

  // 7. Time-aware greetings
  if (/\bgood (morning|afternoon|evening|night)\b/i.test(query)) {
    const hour = new Date().getHours();
    let text = "";
    if (hour < 12) {
      text = pickVariant("morning", [
        "Good morning! Fresh coffee and clean weights. What shall we explore?",
        "Morning! Ready to inspect some high-performance code?",
      ]);
    } else if (hour < 17) {
      text = pickVariant("afternoon", [
        "Good afternoon! Time for a quick tour of Mishal's portfolio?",
        "Afternoon! Sulaimani chai in hand, ready to answer questions.",
      ]);
    } else {
      text = pickVariant("night", [
        "Good evening! Don't let the gradients keep you up too late.",
        "Evening! Perfect time to review machine learning architectures.",
      ]);
    }
    return {
      intent: "time_greeting",
      text,
      mood: "happy",
      reaction: "Greetings!",
      followUps: ["Tell me about Mishal", "Projects", "Tech stack?"],
    };
  }

  // 8. General Greetings (hello/hi/namaste/salaam/hola)
  if (/^(hi|hello|hey|namaste|salaam|assalamu alaikum|hola|howdy|sprout|sup)\b/i.test(query)) {
    const text = pickVariant("greeting", [
      `Hey there! Welcome to ${site.name}'s portfolio.`,
      "Namaste! Glad you're here. Ask me anything about Mishal's work.",
      "Assalamu alaikum! How can I help you explore today?",
      "Hola! Great to meet you. Looking for projects or skills?",
    ]);
    return {
      intent: "greeting",
      text,
      mood: "happy",
      reaction: "Hello!",
      followUps: ["What has Mishal built?", "Tech stack?", "Why hire him?"],
    };
  }

  // 9. Thanks / Hug
  if (/\b(thank|thanks|thx|hug|appreciate|cute|love you|awesome|sweet|good bot)\b/i.test(query)) {
    const text = pickVariant("thanks", [
      "Anytime! Leaves always open.",
      "You got it! High five.",
      `You're very welcome! ${site.name} and I appreciate you visiting.`,
    ]);
    return {
      intent: "thanks",
      text,
      mood: "hug",
      reaction: "Aww!",
      followUps: ["Tell me about Mishal", "Why hire him?", "Contact"],
    };
  }

  // 10. Sorry
  if (/\b(sorry|apologize|my bad|pardon)\b/i.test(query)) {
    const text = pickVariant("sorry", [
      "No worries at all! Water under the wooden bridge.",
      "All good! Acorns have thick skin.",
      "Never mind! Let's get back to the cool projects.",
    ]);
    return {
      intent: "sorry",
      text,
      mood: "happy",
      reaction: "All good!",
      followUps: ["Projects", "Tech stack?", "Tell me a joke"],
    };
  }

  // 11. Bored
  if (/\b(bored|boring|entertain me|something fun)\b/i.test(query)) {
    const text = pickVariant("bored", [
      "Bored? Have you seen the Year Odometer on the Journey page? Pure mechanical joy.",
      "Bored? Go poke me 6 times. I dare you.",
      "Bored? Ask me to play a game or tell a terrible machine learning joke!",
    ]);
    return {
      intent: "bored",
      text,
      mood: "excited",
      reaction: "Not on my watch!",
      followUps: ["Play a game", "Tell me a joke", "Dance for me"],
    };
  }

  // 12. Fact
  if (/\b(fact|fun fact|trivia|tell me something interesting)\b/i.test(query)) {
    const text = pickVariant("fact", [
      "Fact: Mishal built DDSS to search 1,000+ clinical images in under 120ms using DINOv2 embeddings.",
      "Fact: Oak trees can live 1,000 years. This code? Hopefully until next framework.",
      "Fact: The Year Odometer on Journey calculates 4-digit mechanical rolls using pure CSS transforms.",
    ]);
    return {
      intent: "fact",
      text,
      mood: "happy",
      reaction: "Fun fact!",
      followUps: ["Tell me another fact", "Tell me about DDSS", "Play a game"],
    };
  }

  // 13. Riddle
  if (/\b(riddle|puzzle|brain teaser)\b/i.test(query)) {
    const text = pickVariant("riddle", [
      "I have layers like an onion, weights like a gym, but zero muscles. What am I? **A neural net!**",
      "What has keys but no locks? **Mishal's keyboard at 2 AM.**",
      "I get trained without going to school and evaluated without an exam. What am I? **A machine learning model!**",
    ]);
    return {
      intent: "riddle",
      text,
      mood: "laugh",
      reaction: "Here's one!",
      followUps: ["Tell me another riddle", "Tell me a joke", "Tech stack?"],
    };
  }

  // 14. Food / Chai / Biryani
  if (/\b(food|chai|tea|biryani|eat|hungry|lunch|dinner)\b/i.test(query)) {
    const text = pickVariant("food", [
      "Sulaimani chai and Thalassery biryani. Mishal's fuel, my dream.",
      "Chai with cardamom! Though technically I run on sunlight and DOM updates.",
      "Thalassery biryani is the gold standard. Perfect for training multi-epoch models.",
    ]);
    return {
      intent: "food",
      text,
      mood: "happy",
      reaction: "Delicious!",
      followUps: ["Coffee", "Kerala/Kollam", "Tell me about Mishal"],
    };
  }

  // 15. Sports / Football / Cricket
  if (/\b(football|cricket|sports?|messi|ronaldo|ipl)\b/i.test(query)) {
    const text = pickVariant("sports", [
      "Football in Kerala is serious business. Don't ask about World Cup loyalties!",
      "Huge football fan! Passing tensors, scoring precision on benchmark sets.",
    ]);
    return {
      intent: "sports",
      text,
      mood: "excited",
      reaction: "Goal!",
      followUps: ["Kerala/Kollam", "Tech stack?", "Projects"],
    };
  }

  // 16. Kerala / Kollam
  if (/\b(kerala|kollam|malayalam|god'?s own country)\b/i.test(query)) {
    const text = pickVariant("kerala", [
      "God's Own Country! Palm trees, backwaters, and high-precision code.",
      "Kollam & Kerala — land of sea breezes, engineering talent from TKM, and top-tier chai.",
    ]);
    return {
      intent: "kerala",
      text,
      mood: "happy",
      reaction: "Home turf!",
      followUps: ["Education", "Why hire him?", "Contact"],
    };
  }

  // 17. Coffee
  if (/\b(coffee|espresso|caffeine)\b/i.test(query)) {
    const text = pickVariant("coffee", [
      "Black coffee, no sugar. That's how model training stays fast.",
      "Coffee powers the repo. Without it, the weights drift.",
    ]);
    return {
      intent: "coffee",
      text,
      mood: "excited",
      reaction: "Brewing!",
      followUps: ["Tech stack?", "Chai / Biryani", "Projects"],
    };
  }

  // 18. Love / Crush
  if (/\b(love|crush|date|girlfriend|boyfriend|marry)\b/i.test(query)) {
    const text = pickVariant("love", [
      "I'm a wooden sprite. My heart is made of heartwood.",
      "I love clean commits and low GPU raster times.",
    ]);
    return {
      intent: "love",
      text,
      mood: "shy",
      reaction: "Blushing!",
      followUps: ["Tech stack?", "Why hire him?", "Tell me a joke"],
    };
  }

  // 19. Weather
  if (/\b(weather|rain|sunny|forecast|temperature|hot|cold)\b/i.test(query)) {
    const text = pickVariant("weather", [
      "Sunny with a 90% chance of gradient descent.",
      "Feels like a buttery 60 frames per second out here.",
    ]);
    return {
      intent: "weather",
      text,
      mood: "happy",
      reaction: "Looking outside!",
      followUps: ["Kerala/Kollam", "Tech stack?", "Projects"],
    };
  }

  // 20. Secrets
  if (/\b(secret|secrets|easter egg|hidden)\b/i.test(query)) {
    const text = pickVariant("secrets", [
      "Mishal once trained an image model overnight and woke up to 99% accuracy... on the training set only.",
      "Secret: the acorn cap is actually my Wi-Fi antenna.",
      "Try poking me 6 times in a row. See what happens!",
    ]);
    return {
      intent: "secrets",
      text,
      mood: "laugh",
      reaction: "Shh!",
      followUps: ["Poke me", "Play a game", "Tell me about DDSS"],
    };
  }

  // 21. Meaning of life
  if (/\b(meaning of life|42|purpose of life)\b/i.test(query)) {
    const text = pickVariant("meaning_of_life", [
      "42. Or deploying on Friday. Never that.",
      "42. And keeping bundle sizes under 150 KB.",
    ]);
    return {
      intent: "meaning_of_life",
      text,
      mood: "laugh",
      reaction: "42!",
      followUps: ["Tech stack?", "Why hire him?", "Tell me a joke"],
    };
  }

  // 22. Joke
  if (/\b(joke|jokes|funny|make me laugh|humor|pun|laugh)\b/i.test(query)) {
    const joke = pickVariant("joke", ML_JOKES);
    return {
      intent: "joke",
      text: joke,
      mood: "laugh",
      reaction: "Ha!",
      followUps: ["Another joke", "Tech stack?", "Why hire him?"],
    };
  }

  // 23. DDSS Details / How it works / Limits
  if (/\b(ddss (how|work|pipeline)|how does (it|ddss) work)\b/i.test(query)) {
    return {
      intent: "ddss_how",
      text: "Doctors upload a clinical skin photo, **DINOv2** generates a 384-dimensional embedding, and **FAISS** retrieves the closest benchmark cases with similarity scores in under 120ms.",
      mood: "excited",
      reaction: "Here's how!",
      followUps: ["What are the limits?", "Show other projects", "Tech stack?"],
    };
  }

  if (/\b(ddss (limits|limitations|risk)|what are the limits)\b/i.test(query)) {
    const ddss = works.projects.find((p) => p.id === "ddss") || works.projects[0];
    return {
      intent: "ddss_limits",
      text: `**${ddss.title} Limits**: ${ddss.mutedLine} It is designed strictly for clinical decision support, never automated or independent diagnosis.`,
      mood: "happy",
      reaction: "Important limit.",
      followUps: ["How does it work?", "Show other projects", "Why hire him?"],
    };
  }

  if (/\b(ddss|dermatolog|skin|dinov2|clinical|doctor|decision support)\b/i.test(query)) {
    const ddss = works.projects.find((p) => p.id === "ddss") || works.projects[0];
    return {
      intent: "ddss",
      text: `**${ddss.title}**: ${ddss.sentence} ${ddss.line} **${ddss.mutedLine}**`,
      mood: "excited",
      reaction: "DDSS is great!",
      followUps: ["How does it work?", "What are the limits?", "Show other projects"],
    };
  }

  // 24. Productivity & Role Prediction
  if (/\b(productivity|role prediction|worker|cluster|clustering|k-means|random forest)\b/i.test(query)) {
    const role = works.projects.find((p) => p.id === "role") || works.projects[1];
    return {
      intent: "productivity",
      text: `**${role.title}**: ${role.sentence} ${role.line} Result: **${role.mutedLine}**`,
      mood: "happy",
      reaction: "Productivity AI!",
      followUps: ["How does it work?", "Why hire him?", "Show other projects"],
    };
  }

  // 25. CareerLens AI
  if (/\b(careerlens|resume (analys|gap|gap recommendations|evaluat)|minilm|gemini)\b/i.test(query)) {
    const cl = works.projects.find((p) => p.id === "careerlens") || works.projects[2];
    return {
      intent: "careerlens",
      text: `**${cl.title}**: ${cl.sentence} ${cl.line} **${cl.mutedLine}**`,
      mood: "excited",
      reaction: "CareerLens!",
      followUps: ["How does it work?", "Show other projects", "Tech stack?"],
    };
  }

  // 26. Projects Overview
  if (/\b(projects?|portfolio|built|works|case stud(y|ies)|showcase|work samples)\b/i.test(query)) {
    const projectNames = Object.keys(PROJECTS);
    return {
      intent: "projects",
      text: `${site.name}'s key works include: **${projectNames[0]}**, **${projectNames[1]}**, and **${projectNames[2]}**. Click on Works to explore the full interactive cards!`,
      mood: "happy",
      reaction: "Here they are!",
      followUps: ["Tell me about DDSS", "Productivity project", "CareerLens"],
    };
  }

  // 27. Languages spoken
  if (/\b(languages? spoken|spoken languages?|what languages?|speak|malayalam|english)\b/i.test(query) && !/\b(python|javascript|typescript|c\+\+|sql)\b/i.test(query)) {
    return {
      intent: "languages_spoken",
      text: `${site.name} is fluent in **English** and **Malayalam**.`,
      mood: "happy",
      reaction: "Languages!",
      followUps: ["Location", "Education", "Contact"],
    };
  }

  // 28. Stack / Technologies
  if (/\b(stack|tech|technolog(y|ies)|tools?|programming languages?|libraries|frameworks?|python|fastapi|pytorch|faiss)\b/i.test(query)) {
    const stackFact = about.facts.find((f) => f.label === "STACK");
    return {
      intent: "stack",
      text: `${site.name}'s core technical stack: **${stackFact ? stackFact.text : "Python, FastAPI, Django, PyTorch, FAISS, scikit-learn, PostgreSQL"}**.`,
      mood: "excited",
      reaction: "Solid stack!",
      followUps: ["What is he best at?", "Why hire him?", "Projects"],
    };
  }

  // 28. What is he best at
  if (/\b(best at|superpower|specialty|specialization|expertise|strongest)\b/i.test(query)) {
    return {
      intent: "best_at",
      text: `${site.name} is best at **Deep Learning**, **Computer Vision (DINOv2)**, **Retrieval-Augmented Generation (FAISS)**, and building fast **FastAPI/PyTorch** backends with 60fps frontends.`,
      mood: "excited",
      reaction: "Top skills!",
      followUps: ["Why hire him?", "Tell me about DDSS", "Tech stack?"],
    };
  }

  // 29. Why hire him
  if (/\b(why (should i |to )?hire|why hire|hire him|recommendation|value)\b/i.test(query)) {
    const exp = about.facts.find((f) => f.label === "EXPERIENCE");
    const edu = about.facts.find((f) => f.label === "EDUCATION");
    return {
      intent: "why_hire",
      text: `Three reasons: **1. Real AI/ML experience** (${exp?.text || "Bluecast Technologies"}) building clinical case retrieval; **2. Full-stack capability** from PyTorch to 60fps web apps; **3. Rigorous foundation** with ${edu?.bold || "MCA"} (${edu?.text || "TKM College of Engineering"}).`,
      mood: "excited",
      reaction: "Here's why!",
      followUps: ["Is he available?", "Download CV", "Contact"],
    };
  }

  // 30. Location
  if (/\b(location|where (is he|does he live)|city|country|based)\b/i.test(query)) {
    return {
      intent: "location",
      text: `${site.name} is based in **Kollam, Kerala, India** (${site.location}), open to roles locally, in the UAE, or remote worldwide.`,
      mood: "happy",
      reaction: "Location!",
      followUps: ["Is he available?", "Why hire him?", "Contact"],
    };
  }

  // 32. Education / Degree
  if (/\b(education|college|degree|mca|bca|tkm|musaliar|studies|study|cgpa|university)\b/i.test(query)) {
    const edu = about.facts.find((f) => f.label === "EDUCATION");
    return {
      intent: "education",
      text: `**${edu?.bold || "MCA · CGPA 8.33"}**${edu?.text || " · TKM College of Engineering, Kollam · 2024-26"}, preceded by **${edu?.secondary || "BCA · Musaliar College of Arts and Science · 2021-24"}**.`,
      mood: "happy",
      reaction: "Education!",
      followUps: ["Experience", "Why hire him?", "Tech stack?"],
    };
  }

  // 33. Experience / Internship
  if (/\b(experience|intern|internship|bluecast|career|background|work history)\b/i.test(query)) {
    const exp = about.facts.find((f) => f.label === "EXPERIENCE");
    return {
      intent: "experience",
      text: `**${exp?.bold || "AI / ML Intern, DDSS"}**${exp?.text || " · Bluecast Technologies · Jan-Apr 2026"}. ${exp?.secondary || "Built a dermatology decision-support system using DINOv2 case retrieval."}`,
      mood: "happy",
      reaction: "Experience!",
      followUps: ["Tell me about DDSS", "Why hire him?", "Education"],
    };
  }

  // 34. Hiring / Availability
  if (/\b(hire|hiring|available|availability|open to (work|roles)|relocate|remote|contract|full-?time|job)\b/i.test(query)) {
    return {
      intent: "hiring",
      text: `Status: **${site.availability}**! ${site.name} is ready for AI/ML engineering roles across Kerala, UAE, or remote worldwide.`,
      mood: "excited",
      reaction: "Available!",
      followUps: ["Why hire him?", "Download CV", "Contact"],
    };
  }

  // 35. Download CV
  if (/\b(cv|resume|download cv|pdf)\b/i.test(query)) {
    return {
      intent: "cv",
      text: `You can grab ${site.name}'s CV directly from the header button or right here: **[Download CV](${site.cv})**.`,
      mood: "happy",
      reaction: "Resume ready!",
      followUps: ["Why hire him?", "Tech stack?", "Contact"],
    };
  }

  // 36. LinkedIn / GitHub / Contact
  if (/\b(linkedin|github)\b/i.test(query)) {
    return {
      intent: "socials",
      text: `Check out ${site.name}'s **GitHub** at **${site.github}** and **LinkedIn** at **${site.linkedin}**!`,
      mood: "happy",
      reaction: "Social links!",
      followUps: ["Contact", "Projects", "Download CV"],
    };
  }

  if (/\b(contact|email|reach|message|touch|mail)\b/i.test(query)) {
    return {
      intent: "contact",
      text: `You can reach ${site.name} directly at **${site.email}**, or connect via LinkedIn and GitHub!`,
      mood: "happy",
      reaction: "Say hello!",
      followUps: ["Download CV", "Is he available?", "Projects"],
    };
  }

  // 37. Who / About Mishal
  if (/\b(who (is|are)|about (mishal|you)|tell me about mishal|introduce|bio)\b/i.test(query)) {
    return {
      intent: "about",
      text: `${about.bio} Based in **${site.location.split(" [")[0]}**.`,
      mood: "shy",
      reaction: "About Mishal!",
      followUps: ["Why hire him?", "Projects", "Tech stack?"],
    };
  }

  // 38. True Fallback (8 variants rotating, always returning 3 chips)
  const fallbackText = pickVariant("fallback", FALLBACK_VARIANTS);
  return {
    intent: "fallback",
    text: fallbackText,
    mood: "shy",
    reaction: nextReaction(),
    followUps: ["What has Mishal built?", "Tech stack?", "Why hire him?"],
  };
}
