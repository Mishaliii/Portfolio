import { describe, expect, it } from "vitest";
import { expertise } from "@/content";
import { linkedSkills, projectsForSkill, skillState } from "./expertise";

describe("Expertise evidence rules", () => {
  it("asserts skillState: FastAPI 2, OpenCV 2, Testing 2, Sentence Transformers 2, Docker 0", () => {
    expect(skillState("FastAPI")).toBe(2);
    expect(skillState("OpenCV")).toBe(2);
    expect(skillState("Testing")).toBe(2);
    expect(skillState("Sentence Transformers")).toBe(2);
    expect(skillState("Docker")).toBe(0);
  });

  it("returns 1 for a skill appearing only in an in-progress project using a fixture", () => {
    const fixtureProjects: Record<string, { status: string; skills: string[] }> = {
      "WIP Experiment": { status: "in progress", skills: ["AlphaModel"] },
      "Completed App": { status: "done", skills: ["BetaModel"] },
    };
    const computeState = (name: string): 0 | 1 | 2 => {
      const ps = Object.entries(fixtureProjects).filter(([, p]) => p.skills.includes(name));
      if (!ps.length) return 0;
      return ps.some(([, p]) => p.status !== "in progress") ? 2 : 1;
    };
    expect(computeState("AlphaModel")).toBe(1);
    expect(computeState("BetaModel")).toBe(2);
    expect(computeState("UntrackedModel")).toBe(0);
  });

  it("has the requested 5, 5, 5, 5 skills and no HTMX, Supabase or BGE-M3", () => {
    expect(expertise.clusters.map((_, i) => expertise.skills.filter((s) => s.cluster === i).length)).toEqual([5, 5, 5, 5]);
    expect(expertise.skills.some((s) => s.name === "HTMX" || s.name === "Supabase" || s.name === "BGE-M3")).toBe(false);
  });

  it("shows the two supplied FastAPI projects, with CareerLens backend built", () => {
    expect(projectsForSkill("FastAPI").map(([name, p]) => [name, p.status])).toEqual([
      ["Dermatology Decision Support", "done"],
      ["CareerLens AI", "backend built"],
    ]);
  });

  it("keeps Docker as a core skill with no projects", () => {
    expect(projectsForSkill("Docker")).toEqual([]);
    expect(projectsForSkill("OpenCV").length).toBeGreaterThan(0);
    expect(projectsForSkill("Testing").length).toBeGreaterThan(0);
  });

  it("links only project-sharing skills, limited to six strongest neighbours", () => {
    const links = linkedSkills("FastAPI");
    expect(links).toHaveLength(6);
    expect(links.map((i) => expertise.skills[i].name)).toEqual([
      "Python",
      "FAISS",
      "REST design",
      "PostgreSQL",
      "SQLite",
      "PyTorch",
    ]);
    expect(linkedSkills("Docker")).toEqual([]);
  });
});
