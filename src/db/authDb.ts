import fs from "fs";
import path from "path";
import { User, UserCredentials } from "../types";
import bcrypt from "bcryptjs";

const USERS_FILE = path.join(process.cwd(), "src", "db", "users.json");

export function getUsers(): UserCredentials[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading users.json", error);
    return [];
  }
}

export function saveUsers(users: UserCredentials[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error writing to users.json", error);
  }
}

export async function createUser(emailRaw: string, passwordPlain: string, displayName: string): Promise<User> {
  const users = getUsers();
  const email = emailRaw.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  if (users.find(u => u.email === email)) {
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(passwordPlain, 10);
  
  const newUser: UserCredentials = {
    id: "user-" + Date.now(),
    displayName,
    email,
    passwordHash: hashedPassword,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    projects: [],
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  // Return the safe user object (no password)
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
  const users = getUsers();
  const user = users.find(u => u.email === email);
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
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new Error("User not found");
  }

  const user = users[index];

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

  users[index] = user;
  saveUsers(users);

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatar: user.avatar,
    projects: user.projects,
    createdAt: user.createdAt
  };
}

export function joinUserToProject(userId: string, projectId: string) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    const user = users[index];
    if (!user.projects) user.projects = [];
    if (!user.projects.includes(projectId)) {
      user.projects.push(projectId);
      users[index] = user;
      saveUsers(users);
    }
  }
}

export function removeProjectFromAllUsers(projectId: string) {
  const users = getUsers();
  let modified = false;

  for (const user of users) {
    if (user.projects && user.projects.includes(projectId)) {
      user.projects = user.projects.filter(id => id !== projectId);
      modified = true;
    }
  }

  if (modified) {
    saveUsers(users);
  }
}
