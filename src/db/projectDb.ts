import fs from "fs";
import path from "path";

const PROJECTS_FILE = path.join(process.cwd(), "src", "db", "projects.json");

export interface ProjectMember {
  userId: string;
  joinedAt: string;
}

export interface BackendProject {
  id: string;
  name: string;
  key: string;
  description: string;
  inviteCode: string;
  ownerId: string;
  members: ProjectMember[];
}

export function getProjects(): BackendProject[] {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(PROJECTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading projects.json", error);
    return [];
  }
}

export function saveProjects(projects: BackendProject[]) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error("Error writing to projects.json", error);
  }
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "WRK-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createProject(id: string, name: string, key: string, description: string, ownerId: string): BackendProject {
  const projects = getProjects();
  
  if (projects.find(p => p.id === id)) {
    throw new Error("Project with this ID already exists in backend");
  }

  const newProject: BackendProject = {
    id,
    name,
    key,
    description,
    inviteCode: generateInviteCode(),
    ownerId,
    members: [{ userId: ownerId, joinedAt: new Date().toISOString() }]
  };

  projects.push(newProject);
  saveProjects(projects);

  return newProject;
}

export function joinProject(inviteCode: string, userId: string): BackendProject {
  const projects = getProjects();
  const project = projects.find(p => p.inviteCode === inviteCode);

  if (!project) {
    throw new Error("Invalid invite code");
  }

  if (!project.members.find(m => m.userId === userId)) {
    project.members.push({ userId, joinedAt: new Date().toISOString() });
    saveProjects(projects);
  }

  return project;
}

export function getProjectMembers(projectId: string): ProjectMember[] {
  const projects = getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return [];
  return project.members;
}

export function getInviteCode(projectId: string, userId: string): string | null {
  const projects = getProjects();
  const project = projects.find(p => p.id === projectId);
  
  if (!project) return null;
  
  // Only members can see the invite code
  if (!project.members.find(m => m.userId === userId)) {
    return null;
  }
  
  return project.inviteCode;
}
