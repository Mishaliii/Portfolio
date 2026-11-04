import { describe, it, expect } from "vitest";
import { matchBuddyIntent } from "./buddy-matcher";
import { about, works, site, PROJECTS } from "@/content";

describe("buddy-matcher intent tests", () => {
  it("ignores empty or whitespace input", () => {
    expect(matchBuddyIntent("")).toBeNull();
    expect(matchBuddyIntent("   ")).toBeNull();
    expect(matchBuddyIntent("\n\t")).toBeNull();
  });

  // Small-talk tests
  describe("small-talk intents", () => {
    const smallTalkQueries = [
      "how are you",
      "who are you",
      "who made you",
      "how old are you",
      "hello sprout",
      "good morning",
      "thank you so much",
      "i am sorry",
      "i am bored",
      "tell me a fun fact",
      "tell me a riddle",
      "can you dance",
      "what is your favourite food",
      "do you like football or cricket",
      "tell me about kerala",
      "do you drink coffee",
      "do you love someone",
      "what is the weather like",
      "tell me a secret",
      "what is the meaning of life",
      "what the fuck",
    ];

    it.each(smallTalkQueries)("intent '%s' returns non-empty text, reaction and follow-ups", (query) => {
      const res = matchBuddyIntent(query);
      expect(res).not.toBeNull();
      expect(res?.text.length).toBeGreaterThan(10);
      expect(res?.reaction.length).toBeGreaterThan(0);
      expect(res?.followUps.length).toBe(3);
    });

    it("does not repeat variants back-to-back for multi-variant intents", () => {
      for (let i = 0; i < 5; i++) {
        const res1 = matchBuddyIntent("tell me a fun fact");
        const res2 = matchBuddyIntent("tell me a fun fact");
        expect(res1?.text).not.toBe(res2?.text);

        const r1 = matchBuddyIntent("how are you");
        const r2 = matchBuddyIntent("how are you");
        expect(r1?.text).not.toBe(r2?.text);

        const fb1 = matchBuddyIntent("unmatched query xyz " + Math.random());
        const fb2 = matchBuddyIntent("unmatched query abc " + Math.random());
        expect(fb1?.text).not.toBe(fb2?.text);
      }
    });

    it("dance intent sets dance: true", () => {
      const res = matchBuddyIntent("dance for me");
      expect(res?.intent).toBe("dance");
      expect(res?.dance).toBe(true);
    });

    it("handles mini-game progression cleanly", () => {
      const q1 = matchBuddyIntent("play a game");
      expect(q1?.intent).toBe("game-q1");
      expect(q1?.gameStep).toBe(1);
      expect(q1?.followUps).toEqual(["Tabs", "Spaces"]);

      const q2 = matchBuddyIntent("Tabs", 1);
      expect(q2?.intent).toBe("game-q2");
      expect(q2?.gameStep).toBe(2);
      expect(q2?.followUps).toEqual(["PyTorch", "TensorFlow"]);

      const q3 = matchBuddyIntent("PyTorch", 2);
      expect(q3?.intent).toBe("game-q3");
      expect(q3?.gameStep).toBe(3);
      expect(q3?.followUps).toEqual(["Coffee", "Chai"]);

      const end = matchBuddyIntent("Coffee", 3);
      expect(end?.intent).toBe("game-end");
      expect(end?.gameStep).toBe(0);
      expect(end?.text).toContain(site.name);
    });
  });

  // Portfolio intents
  describe("portfolio groundedness", () => {
    it("handles who/about intent with content.bio", () => {
      const res = matchBuddyIntent("Who is Mishal?");
      expect(res?.intent).toBe("about");
      expect(res?.text).toContain(about.bio);
    });

    it("handles DDSS intent with works.projects[0]", () => {
      const res = matchBuddyIntent("Tell me about DDSS");
      expect(res?.intent).toBe("ddss");
      const ddss = works.projects.find((p) => p.id === "ddss")!;
      expect(res?.text).toContain(ddss.title);
      expect(res?.text).toContain(ddss.sentence);
    });

    it("handles DDSS how it works and limits", () => {
      const how = matchBuddyIntent("how does ddss work?");
      expect(how?.intent).toBe("ddss_how");
      expect(how?.text).toContain("DINOv2");
      expect(how?.text).toContain("FAISS");

      const limits = matchBuddyIntent("what are the limits of ddss?");
      expect(limits?.intent).toBe("ddss_limits");
      expect(limits?.text).toContain("decision support");
    });

    it("handles productivity & role prediction with content strings", () => {
      const res = matchBuddyIntent("How does the productivity model work?");
      expect(res?.intent).toBe("productivity");
      const role = works.projects.find((p) => p.id === "role")!;
      expect(res?.text).toContain(role.title);
    });

    it("handles CareerLens intent with content strings", () => {
      const res = matchBuddyIntent("What is CareerLens AI?");
      expect(res?.intent).toBe("careerlens");
      const cl = works.projects.find((p) => p.id === "careerlens")!;
      expect(res?.text).toContain(cl.title);
    });

    it("handles projects overview intent with content PROJECTS", () => {
      const res = matchBuddyIntent("What has Mishal built?");
      expect(res?.intent).toBe("projects");
      const keys = Object.keys(PROJECTS);
      expect(res?.text).toContain(keys[0]);
    });

    it("handles stack intent with about.facts stack", () => {
      const res = matchBuddyIntent("What is your tech stack?");
      expect(res?.intent).toBe("stack");
      const stackFact = about.facts.find((f) => f.label === "STACK")!;
      expect(res?.text).toContain(stackFact.text);
    });

    it("handles best at intent", () => {
      const res = matchBuddyIntent("what is he best at?");
      expect(res?.intent).toBe("best_at");
      expect(res?.text).toContain("Deep Learning");
      expect(res?.text).toContain("Computer Vision");
    });

    it("handles why hire him intent derived strictly from content", () => {
      const res = matchBuddyIntent("why should I hire him?");
      expect(res?.intent).toBe("why_hire");
      expect(res?.text).toContain("Bluecast Technologies");
      expect(res?.text).toContain("TKM College of Engineering");
    });

    it("handles location and languages spoken", () => {
      const loc = matchBuddyIntent("where is he based?");
      expect(loc?.intent).toBe("location");
      expect(loc?.text).toContain("Kollam, Kerala, India");

      const lang = matchBuddyIntent("what languages does he speak?");
      expect(lang?.intent).toBe("languages_spoken");
      expect(lang?.text).toContain("English");
      expect(lang?.text).toContain("Malayalam");
    });

    it("handles education, experience, hiring, and contact", () => {
      const edu = matchBuddyIntent("education background");
      expect(edu?.intent).toBe("education");
      expect(edu?.text).toContain("TKM College of Engineering");

      const exp = matchBuddyIntent("internship experience");
      expect(exp?.intent).toBe("experience");
      expect(exp?.text).toContain("Bluecast Technologies");

      const hire = matchBuddyIntent("is he available to hire?");
      expect(hire?.intent).toBe("hiring");
      expect(hire?.text).toContain(site.availability);

      const contact = matchBuddyIntent("how to contact him");
      expect(contact?.intent).toBe("contact");
      expect(contact?.text).toContain(site.email);

      const cv = matchBuddyIntent("download resume cv");
      expect(cv?.intent).toBe("cv");
      expect(cv?.text).toContain(site.cv);

      const soc = matchBuddyIntent("github linkedin profiles");
      expect(soc?.intent).toBe("socials");
      expect(soc?.text).toContain(site.github);
      expect(soc?.text).toContain(site.linkedin);
    });

    it("fallback always returns 3 follow-up chips and funny response", () => {
      const res = matchBuddyIntent("something completely unrelated 987654321");
      expect(res?.intent).toBe("fallback");
      expect(res?.followUps.length).toBe(3);
      expect(res?.text.length).toBeGreaterThan(15);
    });
  });
});
