import { describe, it, expect } from "vitest";
import { matchBuddyIntent } from "./buddy-matcher";
import { about, works, site, PROJECTS } from "@/content";

describe("buddy-matcher intent tests", () => {
  it("ignores empty or whitespace input", () => {
    expect(matchBuddyIntent("")).toBeNull();
    expect(matchBuddyIntent("   ")).toBeNull();
    expect(matchBuddyIntent("\n\t")).toBeNull();
  });

  it("handles greeting intent with content strings and proper mood", () => {
    const res = matchBuddyIntent("Hello Sprout!");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("greeting");
    expect(res?.mood).toBe("happy");
    expect(res?.text).toContain(site.name);
  });

  it("handles who/about intent with content.bio", () => {
    const res = matchBuddyIntent("Who is Mishal?");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("about");
    expect(res?.text).toContain(about.bio);
  });

  it("handles DDSS intent with works.projects[0] sentence and line", () => {
    const res = matchBuddyIntent("Tell me about DDSS");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("ddss");
    expect(res?.mood).toBe("excited");
    const ddss = works.projects.find((p) => p.id === "ddss")!;
    expect(res?.text).toContain(ddss.title);
    expect(res?.text).toContain(ddss.sentence);
    expect(res?.text).toContain("Support, not diagnosis");
  });

  it("handles productivity & role prediction intent with content strings", () => {
    const res = matchBuddyIntent("How does the productivity model work?");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("productivity");
    const role = works.projects.find((p) => p.id === "role")!;
    expect(res?.text).toContain(role.title);
    expect(res?.text).toContain(role.sentence);
  });

  it("handles CareerLens intent with content strings", () => {
    const res = matchBuddyIntent("What is CareerLens AI?");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("careerlens");
    const cl = works.projects.find((p) => p.id === "careerlens")!;
    expect(res?.text).toContain(cl.title);
    expect(res?.text).toContain(cl.sentence);
  });

  it("handles projects overview intent with content PROJECTS", () => {
    const res = matchBuddyIntent("What has Mishal built?");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("projects");
    const keys = Object.keys(PROJECTS);
    expect(res?.text).toContain(keys[0]);
    expect(res?.text).toContain(keys[1]);
  });

  it("handles stack intent with about.facts stack", () => {
    const res = matchBuddyIntent("What is your tech stack?");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("stack");
    const stackFact = about.facts.find((f) => f.label === "STACK")!;
    expect(res?.text).toContain(stackFact.text);
  });

  it("handles education intent with TKM and CGPA 8.33", () => {
    const res = matchBuddyIntent("Where did you study?");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("education");
    const edu = about.facts.find((f) => f.label === "EDUCATION")!;
    expect(res?.text).toContain(edu.bold);
  });

  it("handles experience / internship intent with Bluecast Technologies", () => {
    const res = matchBuddyIntent("Tell me about your internship experience");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("experience");
    const exp = about.facts.find((f) => f.label === "EXPERIENCE")!;
    expect(res?.text).toContain(exp.bold);
  });

  it("handles hiring / availability intent with site.availability", () => {
    const res = matchBuddyIntent("Is Mishal available for hire?");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("hiring");
    expect(res?.text).toContain(site.availability);
  });

  it("handles contact / email intent with site.email and site.github", () => {
    const res = matchBuddyIntent("How can I contact Mishal?");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("contact");
    expect(res?.text).toContain(site.email);
    expect(res?.text).toContain(site.github);
  });

  it("handles jokes with valid clean ML jokes", () => {
    const res = matchBuddyIntent("Tell me a joke");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("joke");
    expect(res?.mood).toBe("laugh");
    expect(typeof res?.text).toBe("string");
    expect(res?.text.length).toBeGreaterThan(10);
  });

  it("handles thanks and hugs with warm message", () => {
    const res = matchBuddyIntent("Thanks so much! Sending a hug");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("thanks/hug");
    expect(res?.mood).toBe("hug");
  });

  it("handles rude input with gentle sad response", () => {
    const res = matchBuddyIntent("You are stupid and useless");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("rude");
    expect(res?.mood).toBe("sad");
  });

  it("falls back to standard guidance when no intent is recognized", () => {
    const res = matchBuddyIntent("xyz random nonsense query");
    expect(res).not.toBeNull();
    expect(res?.intent).toBe("fallback");
    expect(res?.text).toBe("I only know Mishal's work, skills, studies and hiring. Try those!");
    expect(res?.mood).toBe("shy");
  });
});

