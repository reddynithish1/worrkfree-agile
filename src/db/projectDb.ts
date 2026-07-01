import { ProjectModel } from "./models";

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

export async function getProjects(): Promise<BackendProject[]> {
  try {
    const projects = await ProjectModel.find().lean();
    return projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      description: p.description,
      inviteCode: p.inviteCode,
      ownerId: p.ownerId,
      members: p.members
    }));
  } catch (error) {
    console.error("Error reading projects from DB", error);
    return [];
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

export async function createProject(id: string, name: string, key: string, description: string, ownerId: string): Promise<BackendProject> {
  const existing = await ProjectModel.findOne({ id });
  
  if (existing) {
    throw new Error("Project with this ID already exists in backend");
  }

  const newProject = await ProjectModel.create({
    id,
    name,
    key,
    description,
    inviteCode: generateInviteCode(),
    ownerId,
    members: [{ userId: ownerId, joinedAt: new Date().toISOString() }]
  });

  return {
    id: newProject.id,
    name: newProject.name,
    key: newProject.key,
    description: newProject.description,
    inviteCode: newProject.inviteCode,
    ownerId: newProject.ownerId,
    members: newProject.members
  };
}

export async function joinProject(inviteCode: string, userId: string): Promise<BackendProject> {
  const project = await ProjectModel.findOne({ inviteCode });

  if (!project) {
    throw new Error("Invalid invite code");
  }

  if (!project.members.find((m: any) => m.userId === userId)) {
    project.members.push({ userId, joinedAt: new Date().toISOString() });
    await project.save();
  }

  return {
    id: project.id,
    name: project.name,
    key: project.key,
    description: project.description,
    inviteCode: project.inviteCode,
    ownerId: project.ownerId,
    members: project.members
  };
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const project = await ProjectModel.findOne({ id: projectId });
  if (!project) return [];
  return project.members;
}

export async function getInviteCode(projectId: string, userId: string): Promise<string | null> {
  const project = await ProjectModel.findOne({ id: projectId });
  
  if (!project) return null;
  
  // Only members can see the invite code
  if (!project.members.find((m: any) => m.userId === userId)) {
    return null;
  }
  
  return project.inviteCode;
}

export async function updateProject(projectId: string, ownerId: string, updates: Partial<BackendProject>): Promise<BackendProject> {
  const project = await ProjectModel.findOne({ id: projectId });
  
  if (!project) {
    throw new Error("Project not found");
  }
  
  if (project.ownerId !== ownerId) {
    throw new Error("Only the project owner can edit this project");
  }

  if (updates.name) project.name = updates.name;
  if (updates.key) project.key = updates.key;
  if (updates.description !== undefined) project.description = updates.description;

  await project.save();

  return {
    id: project.id,
    name: project.name,
    key: project.key,
    description: project.description,
    inviteCode: project.inviteCode,
    ownerId: project.ownerId,
    members: project.members
  };
}

export async function deleteProject(projectId: string, ownerId: string): Promise<void> {
  const project = await ProjectModel.findOne({ id: projectId });
  
  if (!project) {
    throw new Error("Project not found");
  }

  if (project.ownerId !== ownerId) {
    throw new Error("Only the project owner can delete this project");
  }

  await ProjectModel.deleteOne({ id: projectId });
}
