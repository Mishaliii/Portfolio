import { describe, expect, it } from "vitest";
import { expertise } from "@/content";
import { linkedSkills, projectsForSkill, skillState } from "./expertise";

describe("Expertise evidence rules", () => {
  it("computes skillState: 2 for completed/live projects, 1 for in progress only, 0 for core", () => {
    expect(skillState("FastAPI")).toBe(2);
    expect(skillState("DINOv2")).toBe(2);
    expect(skillState("Gemini API")).toBe(1);
    expect(skillState("BGE-M3")).toBe(1);
    expect(skillState("OpenCV")).toBe(0);
    expect(skillState("Docker")).toBe(0);
  });
  it("has the requested 6, 5, 5, 5 skills and no HTMX", () => {
    expect(expertise.clusters.map((_, i) => expertise.skills.filter((s) => s.cluster === i).length)).toEqual([6, 5, 5, 5]);
    expect(expertise.skills.some((s) => s.name === "HTMX")).toBe(false);
  });
  it("shows the two supplied FastAPI projects, including CareerLens in progress", () => {
    expect(projectsForSkill("FastAPI").map(([name, p]) => [name, p.status])).toEqual([["Dermatology Decision Support", "done"], ["CareerLens AI", "in progress"]]);
  });
  it("keeps OpenCV, Docker and Testing core rather than inventing project evidence", () => {
    for (const name of ["OpenCV", "Docker", "Testing"]) expect(projectsForSkill(name)).toEqual([]);
  });
  it("links only project-sharing skills, limited to six strongest neighbours", () => {
    const links = linkedSkills("FastAPI");
    expect(links).toHaveLength(6);
    expect(links.map((i) => expertise.skills[i].name)).toEqual(["Python", "PostgreSQL", "FAISS", "React / TS", "Supabase", "PyTorch"]);
    expect(linkedSkills("Docker")).toEqual([]);
  });
});