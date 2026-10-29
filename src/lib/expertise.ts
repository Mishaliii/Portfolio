import { expertise, PROJECTS } from "@/content";

export const projectsForSkill = (name: string) => Object.entries(PROJECTS).filter(([, p]) => p.skills.includes(name));
export const skillState = (name: string): 0 | 1 | 2 => { const ps = projectsForSkill(name); if (!ps.length) return 0; return ps.some(([, p]) => p.status !== "in progress") ? 2 : 1; };
export function linkedSkills(name: string) {
  const projects = projectsForSkill(name);
  return expertise.skills.map((skill, index) => ({ index, weight: projects.reduce((n, [, p]) => n + Number(p.skills.includes(skill.name)), 0) }))
    .filter((s) => s.weight > 0 && expertise.skills[s.index].name !== name)
    .sort((a, b) => b.weight - a.weight || a.index - b.index).slice(0, 6).map((s) => s.index);
}