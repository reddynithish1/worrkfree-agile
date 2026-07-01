import { User, UserCredentials } from "../types";
import bcrypt from "bcryptjs";
import { UserModel } from "./models";

export async function getUsers(): Promise<UserCredentials[]> {
  try {
    const users = await UserModel.find().lean();
    return users.map((u: any) => ({
      id: u.id,
      displayName: u.displayName,
      email: u.email,
      passwordHash: u.passwordHash,
      avatar: u.avatar,
      projects: u.projects || [],
      createdAt: u.createdAt
    }));
  } catch (error) {
    console.error("Error fetching users from DB", error);
    return [];
  }
}

export async function createUser(emailRaw: string, passwordPlain: string, displayName: string): Promise<User> {
  const email = emailRaw.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  const existingUser = await UserModel.findOne({ email } as any);
  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(passwordPlain, 10);
  const id = "user-" + Date.now();
  
  const newUser = await UserModel.create({
    id,
    displayName,
    email,
    passwordHash: hashedPassword,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    projects: [],
    createdAt: new Date().toISOString()
  });

  return {
    id: newUser.id,
    displayName: newUser.displayName,
    email: newUser.email,
    avatar: newUser.avatar,
    projects: newUser.projects,
    createdAt: newUser.createdAt
  };
}

export async function verifyUser(emailRaw: string, passwordPlain: string): Promise<User | null> {
  const email = emailRaw.trim().toLowerCase();
  
  const user = await UserModel.findOne({ email } as any);
  if (!user) return null;

  const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!isValid) return null;

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatar: user.avatar,
    projects: user.projects,
    createdAt: user.createdAt
  };
}

export async function updateUser(
  id: string, 
  updates: { displayName?: string; avatar?: string }, 
  passwords?: { current: string; new: string }
): Promise<User> {
  const user = await UserModel.findOne({ id } as any);
  
  if (!user) {
    throw new Error("User not found");
  }

  // Handle password update if provided
  if (passwords && passwords.current && passwords.new) {
    const isValid = await bcrypt.compare(passwords.current, user.passwordHash);
    if (!isValid) {
      throw new Error("Incorrect current password");
    }
    user.passwordHash = await bcrypt.hash(passwords.new, 10);
  }

  // Update name and avatar if provided
  if (updates.displayName) user.displayName = updates.displayName;
  if (updates.avatar) user.avatar = updates.avatar;

  await user.save();

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatar: user.avatar,
    projects: user.projects,
    createdAt: user.createdAt
  };
}

export async function joinUserToProject(userId: string, projectId: string) {
  const user = await UserModel.findOne({ id: userId } as any);
  if (user) {
    if (!user.projects) user.projects = [];
    if (!user.projects.includes(projectId)) {
      user.projects.push(projectId);
      await user.save();
    }
  }
}

export async function removeProjectFromAllUsers(projectId: string) {
  await (UserModel as any).updateMany(
    { projects: projectId },
    { $pull: { projects: projectId } }
  );
}
