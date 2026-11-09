import { describe, it, expect } from "vitest";
import { matchBuddyIntent, normalizeQuery, type MatchBuddyOptions } from "./buddy-matcher";
import { about, works, site, PROJECTS } from "@/content";

describe("buddy-matcher comprehensive test suite (>= 60 phrasing & typo tests)", () => {
  it("ignores empty or whitespace input", () => {
    expect(matchBuddyIntent("")).toBeNull();
    expect(matchBuddyIntent("   ")).toBeNull();
    expect(matchBuddyIntent("\n\t")).toBeNull();
  });

  // Table-driven suite: 70+ test cases
  const tableDrivenCases: Array<{
    query: string;
    options?: MatchBuddyOptions;
    expectedIntent: string;
    textContains?: string[];
    exactText?: string;
    followUpCount?: number;
    customAssert?: (res: ReturnType<typeof matchBuddyIntent>) => void;
  }> = [
    // -------------------------------------------------------------
    // 1. Identity Cases: Visitor Name (unknown & known)
    // -------------------------------------------------------------
    {
      query: "whats my name",
      expectedIntent: "visitor_name",
      textContains: ["I don't know your name yet", "Who am I talking to?"],
      customAssert: (res) => {
        expect(res?.text).not.toContain("Sprout, a tiny");
        expect(res?.awaitingName).toBe(true);
      },
    },
    {
      query: "what's my name",
      expectedIntent: "visitor_name",
      textContains: ["I don't know your name yet"],
    },
    {
      query: "what is my name?",
      expectedIntent: "visitor_name",
      textContains: ["I don't know your name yet"],
    },
    {
      query: "who am I",
      expectedIntent: "visitor_name",
      textContains: ["I don't know your name yet", "Who am I talking to?"],
    },
    {
      query: "who am i?",
      expectedIntent: "visitor_name",
      textContains: ["I don't know your name yet"],
    },
    {
      query: "do you know me",
      expectedIntent: "visitor_name",
      textContains: ["I don't know your name yet"],
    },
    {
      query: "tell me my name",
      expectedIntent: "visitor_name",
      textContains: ["I don't know your name yet"],
    },
    {
      query: "what's my name",
      options: { visitorName: "Alice" },
      expectedIntent: "visitor_name",
      exactText: "You told me your name is Alice.",
    },
    {
      query: "who am I",
      options: { visitorName: "Bob" },
      expectedIntent: "visitor_name",
      exactText: "You told me your name is Bob.",
    },

    // -------------------------------------------------------------
    // 2. Identity Cases: Visitor providing their name
    // -------------------------------------------------------------
    {
      query: "I'm Alice",
      expectedIntent: "set_visitor_name",
      textContains: ["Nice to meet you, Alice!"],
      customAssert: (res) => {
        expect(res?.newVisitorName).toBe("Alice");
      },
    },
    {
      query: "my name is Bob",
      expectedIntent: "set_visitor_name",
      textContains: ["Nice to meet you, Bob!"],
      customAssert: (res) => {
        expect(res?.newVisitorName).toBe("Bob");
      },
    },
    {
      query: "call me Charlie",
      expectedIntent: "set_visitor_name",
      textContains: ["Nice to meet you, Charlie!"],
      customAssert: (res) => {
        expect(res?.newVisitorName).toBe("Charlie");
      },
    },
    {
      query: "Alice",
      options: { awaitingName: true },
      expectedIntent: "set_visitor_name",
      textContains: ["Nice to meet you, Alice!"],
      customAssert: (res) => {
        expect(res?.newVisitorName).toBe("Alice");
      },
    },
    {
      query: "David Miller",
      options: { awaitingName: true },
      expectedIntent: "set_visitor_name",
      textContains: ["Nice to meet you, David Miller!"],
      customAssert: (res) => {
        expect(res?.newVisitorName).toBe("David Miller");
      },
    },

    // -------------------------------------------------------------
    // 3. Identity Cases: Sprout's Name
    // -------------------------------------------------------------
    {
      query: "what's your name",
      expectedIntent: "sprout_name",
      textContains: ["I'm Sprout", "portfolio assistant"],
    },
    {
      query: "whats your name",
      expectedIntent: "sprout_name",
      textContains: ["I'm Sprout"],
    },
    {
      query: "what is your name?",
      expectedIntent: "sprout_name",
      textContains: ["I'm Sprout"],
    },
    {
      query: "who are you",
      expectedIntent: "sprout_name",
      textContains: ["I'm Sprout"],
    },
    {
      query: "what are you",
      expectedIntent: "sprout_name",
      textContains: ["I'm Sprout"],
    },
    {
      query: "are you sprout",
      expectedIntent: "sprout_name",
      textContains: ["I'm Sprout"],
    },

    // -------------------------------------------------------------
    // 4. Identity Cases: Creator / Owner / Mishal's Name
    // -------------------------------------------------------------
    {
      query: "his name",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "what is his name?",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "whats his name",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "mishal's name",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "mishals name",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "user's name",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "what's user's name",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "whats users name",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "user name",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "owner",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "who is the owner",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "who made this",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "who built this",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "who created this",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "who is mishal",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },
    {
      query: "who is muhammed mishal",
      expectedIntent: "creator_name",
      exactText: "Muhammed Mishal, AI/ML engineer from Kollam, Kerala.",
    },

    // -------------------------------------------------------------
    // 5. Tech Stack & Typos (pyrtoch, pytroch, skils)
    // -------------------------------------------------------------
    {
      query: "what is your tech stack?",
      expectedIntent: "stack",
      textContains: ["Python", "FastAPI", "PyTorch"],
    },
    {
      query: "what technologies do you use?",
      expectedIntent: "stack",
      textContains: ["Python"],
    },
    {
      query: "tell me about your skills",
      expectedIntent: "stack",
      textContains: ["Python"],
    },
    {
      query: "what tools do you use",
      expectedIntent: "stack",
      textContains: ["Python"],
    },
    {
      query: "do you use pyrtoch?", // typo pyrtoch
      expectedIntent: "stack",
      textContains: ["PyTorch"],
    },
    {
      query: "experience with pytroch", // typo pytroch
      expectedIntent: "stack",
      textContains: ["PyTorch"],
    },
    {
      query: "what are your skils?", // typo skils
      expectedIntent: "stack",
      textContains: ["Python"],
    },

    // -------------------------------------------------------------
    // 6. DDSS Project (how it works, limits, typos)
    // -------------------------------------------------------------
    {
      query: "tell me about DDSS",
      expectedIntent: "ddss",
      textContains: ["Dermatology Decision Support", "Support, not diagnosis."],
    },
    {
      query: "how does ddss work?",
      expectedIntent: "ddss_how",
      textContains: ["DINOv2", "FAISS", "768-dimensional", "SD-198"],
    },
    {
      query: "what is the ddss pipeline?",
      expectedIntent: "ddss_how",
      textContains: ["DINOv2"],
    },
    {
      query: "what are the limits of ddss?",
      expectedIntent: "ddss_limits",
      textContains: ["Dermatology Decision Support Limits", "clinical decision support"],
    },
    {
      query: "how does dinov2 work here?", // typo dinov2
      expectedIntent: "ddss",
      textContains: ["Dermatology Decision Support"],
    },
    {
      query: "dino v2 retrieval model",
      expectedIntent: "ddss",
      textContains: ["Dermatology Decision Support"],
    },

    // -------------------------------------------------------------
    // 7. Productivity Project (how it works, role prediction)
    // -------------------------------------------------------------
    {
      query: "tell me about productivity project",
      expectedIntent: "productivity",
      textContains: ["Productivity and Role Prediction"],
    },
    {
      query: "how does the productivity model work?",
      expectedIntent: "productivity_how",
      textContains: ["Random Forest", "Logistic Regression"],
    },
    {
      query: "how does role prediction work",
      expectedIntent: "productivity_how",
      textContains: ["Random Forest", "Logistic Regression"],
    },
    {
      query: "what is role prediction?",
      expectedIntent: "productivity",
      textContains: ["Productivity and Role Prediction"],
    },

    // -------------------------------------------------------------
    // 8. CareerLens AI (how it works, typos)
    // -------------------------------------------------------------
    {
      query: "tell me about CareerLens",
      expectedIntent: "careerlens",
      textContains: ["CareerLens AI"],
    },
    {
      query: "tell me about carrerlens", // typo carrerlens
      expectedIntent: "careerlens",
      textContains: ["CareerLens AI"],
    },
    {
      query: "how does careerlens work?",
      expectedIntent: "careerlens_how",
      textContains: ["Sentence Transformers", "FAISS", "Gemini API"],
    },
    {
      query: "resume matcher project",
      expectedIntent: "careerlens",
      textContains: ["CareerLens AI"],
    },

    // -------------------------------------------------------------
    // 9. Projects Overview
    // -------------------------------------------------------------
    {
      query: "what has Mishal built?",
      expectedIntent: "projects",
      textContains: ["Dermatology Decision Support", "Productivity & Role Prediction", "CareerLens AI"],
    },
    {
      query: "show me his portfolio projects",
      expectedIntent: "projects",
      textContains: ["Dermatology Decision Support", "CareerLens AI"],
    },
    {
      query: "case studies",
      expectedIntent: "projects",
      textContains: ["Works"],
    },

    // -------------------------------------------------------------
    // 10. Why hire him & Best at
    // -------------------------------------------------------------
    {
      query: "why should I hire him?",
      expectedIntent: "why_hire",
      textContains: ["Blue Cast Technologies", "FastAPI", "TKM College of Engineering"],
    },
    {
      query: "why hire mishal",
      expectedIntent: "why_hire",
      textContains: ["Three reasons:"],
    },
    {
      query: "what is he best at?",
      expectedIntent: "best_at",
      textContains: ["Deep Learning", "Computer Vision", "FAISS"],
    },
    {
      query: "what is his superpower?",
      expectedIntent: "best_at",
      textContains: ["Deep Learning"],
    },

    // -------------------------------------------------------------
    // 11. Location, Education, Experience, Seeking, Hiring, CV, Contact
    // -------------------------------------------------------------
    {
      query: "where is he based?",
      expectedIntent: "location",
      textContains: ["Kollam, Kerala, India"],
    },
    {
      query: "what is his location?",
      expectedIntent: "location",
      textContains: ["Kollam"],
    },
    {
      query: "what is his edukation?", // typo edukation
      expectedIntent: "education",
      textContains: ["TKM College of Engineering", "8.33", "BCA"],
    },
    {
      query: "what colledge did he attend?", // typo colledge
      expectedIntent: "education",
      textContains: ["TKM College of Engineering"],
    },
    {
      query: "what degree does he have?",
      expectedIntent: "education",
      textContains: ["MCA"],
    },
    {
      query: "tell me about his exprerience", // typo exprerience
      expectedIntent: "experience",
      textContains: ["Blue Cast Technologies", "AI / ML Developer Intern"],
    },
    {
      query: "internship background",
      expectedIntent: "experience",
      textContains: ["Blue Cast Technologies"],
    },
    {
      query: "what certifications does he have?",
      expectedIntent: "certifications",
      textContains: ["Azure AI Essentials", "Keras", "NPTEL"],
    },
    {
      query: "additional projects",
      expectedIntent: "additional_projects",
      textContains: ["Build Track Pro", "Fresh Cart", "Drop for Life"],
    },
    {
      query: "is he available to hire?",
      expectedIntent: "hiring",
      textContains: ["Open to roles"],
    },
    {
      query: "what role is he looking for?",
      expectedIntent: "seeking",
      textContains: ["AI / ML Engineer", "deep learning"],
    },
    {
      query: "what is he looking for",
      expectedIntent: "seeking",
      textContains: ["AI / ML Engineer"],
    },
    {
      query: "download cv",
      expectedIntent: "cv",
      textContains: ["[Download CV]"],
    },
    {
      query: "download resumee", // typo resumee
      expectedIntent: "cv",
      textContains: ["[Download CV]"],
    },
    {
      query: "how can i kontact him?", // typo kontact
      expectedIntent: "contact",
      textContains: [site.email],
    },
    {
      query: "send him an email",
      expectedIntent: "contact",
      textContains: [site.email],
    },
    {
      query: "github profile",
      expectedIntent: "socials",
      textContains: [site.github],
    },
    {
      query: "linkdin profile", // typo linkdin
      expectedIntent: "socials",
      textContains: [site.linkedin],
    },
    {
      query: "what languages does he speak?",
      expectedIntent: "languages_spoken",
      textContains: ["English", "Malayalam"],
    },

    // -------------------------------------------------------------
    // 12. Small Talk & Greetings
    // -------------------------------------------------------------
    {
      query: "hello sprout",
      expectedIntent: "greeting",
      textContains: ["Welcome to"],
    },
    {
      query: "hello",
      options: { visitorName: "Sara", greetedWithName: false },
      expectedIntent: "greeting",
      textContains: ["Hello Sara!"],
    },
    {
      query: "namaste",
      expectedIntent: "greeting",
      textContains: ["Welcome"],
    },
    {
      query: "thank you so much",
      expectedIntent: "thanks",
      textContains: ["welcome"],
    },
    {
      query: "goodbye",
      expectedIntent: "goodbye",
      textContains: ["Thanks for visiting", site.email],
    },
    {
      query: "how are you today",
      expectedIntent: "how_are_you",
      textContains: ["Bark is solid"],
    },
    {
      query: "tell me a joke",
      expectedIntent: "joke",
      textContains: ["neural network", "weights"],
    },
    {
      query: "what the fuck",
      expectedIntent: "swear",
      textContains: ["friendly"],
    },

    // -------------------------------------------------------------
    // 13. Out of Scope Queries -> polite redirect
    // -------------------------------------------------------------
    {
      query: "what is the weather like in kollam?",
      expectedIntent: "out_of_scope",
      textContains: ["I only know Mishal's portfolio."],
    },
    {
      query: "who is the prime minister of india?",
      expectedIntent: "out_of_scope",
      textContains: ["I only know Mishal's portfolio."],
    },
    {
      query: "write python code for quicksort",
      expectedIntent: "out_of_scope",
      textContains: ["I only know Mishal's portfolio."],
    },
    {
      query: "what is bitcoin price today",
      expectedIntent: "out_of_scope",
      textContains: ["I only know Mishal's portfolio."],
    },

    // -------------------------------------------------------------
    // 14. Fallback on completely unrecognized query
    // -------------------------------------------------------------
    {
      query: "completely unrelated string 984729184",
      expectedIntent: "fallback",
      followUpCount: 3,
    },
  ];

  it(`verifies >= 60 table-driven phrasing tests (actual count: ${tableDrivenCases.length})`, () => {
    expect(tableDrivenCases.length).toBeGreaterThanOrEqual(60);
  });

  it.each(tableDrivenCases)(
    "query: '$query' -> intent: '$expectedIntent'",
    ({ query, options, expectedIntent, textContains, exactText, followUpCount, customAssert }) => {
      const res = matchBuddyIntent(query, options);
      expect(res).not.toBeNull();
      expect(res?.intent).toBe(expectedIntent);

      if (exactText) {
        expect(res?.text).toBe(exactText);
      }
      if (textContains) {
        for (const str of textContains) {
          expect(res?.text).toContain(str);
        }
      }
      if (followUpCount !== undefined) {
        expect(res?.followUps.length).toBe(followUpCount);
      }
      if (customAssert) {
        customAssert(res);
      }
    }
  );

  // Normalizer specific test
  describe("normalizeQuery", () => {
    it("expands contractions and strips punctuation", () => {
      expect(normalizeQuery("What's up?")).toBe("what is up");
      expect(normalizeQuery("Who's that!")).toBe("who is that");
      expect(normalizeQuery("I'm ready.")).toBe("i am ready");
    });

    it("corrects domain typos", () => {
      expect(normalizeQuery("pyrtoch")).toBe("pytorch");
      expect(normalizeQuery("dinov2")).toBe("dinov2");
      expect(normalizeQuery("carrerlens")).toBe("careerlens");
      expect(normalizeQuery("kontact")).toBe("contact");
    });
  });

  // Mini-game progression test
  describe("mini-game progression", () => {
    it("progresses smoothly through all 3 questions", () => {
      const q1 = matchBuddyIntent("play a game");
      expect(q1?.intent).toBe("game-q1");
      expect(q1?.gameStep).toBe(1);

      const q2 = matchBuddyIntent("Tabs", 1);
      expect(q2?.intent).toBe("game-q2");
      expect(q2?.gameStep).toBe(2);

      const q3 = matchBuddyIntent("PyTorch", 2);
      expect(q3?.intent).toBe("game-q3");
      expect(q3?.gameStep).toBe(3);

      const end = matchBuddyIntent("Coffee", 3);
      expect(end?.intent).toBe("game-end");
      expect(end?.gameStep).toBe(0);
      expect(end?.text).toContain(site.name);
    });
  });
});
