import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { getClaudeProjectDir, getProjectNameFromPath } from "./claudeDataReader.js";

export async function debugProjectPaths(projectPath: string) {
  const projectName = getProjectNameFromPath(projectPath);
  const projectDir = getClaudeProjectDir(projectPath);

  console.log("Debug Info:");
  console.log("  Project Path:", projectPath);
  console.log("  Generated Project Name:", projectName);
  console.log("  Expected Project Dir:", projectDir);

  try {
    const claudeProjectsDir = join(homedir(), ".claude", "projects");
    const allProjects = await readdir(claudeProjectsDir);
    const matchingProjects = allProjects.filter((name) => name.includes("ccgraph"));
    console.log("  Available ccgraph projects:", matchingProjects);
  } catch (error) {
    console.log("  Error reading projects dir:", error);
  }
}
