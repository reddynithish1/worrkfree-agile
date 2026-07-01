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

export async function createUser(email: string, passwordPlain: string, name: string): Promise<User> {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(passwordPlain, 10);
  
  const newUser: UserCredentials = {
    id: "user-" + Date.now(),
    name,
    email,
    passwordHash: hashedPassword,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
  };

  users.push(newUser);
  saveUsers(users);

  // Return the safe user object (no password)
  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    avatar: newUser.avatar
  };
}

export async function verifyUser(email: string, passwordPlain: string): Promise<User | null> {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) return null;

  const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!isValid) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar
  };
}

export async function updateUser(
  id: string, 
  updates: { name?: string; avatar?: string }, 
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
  if (updates.name) user.name = updates.name;
  if (updates.avatar) user.avatar = updates.avatar;

  users[index] = user;
  saveUsers(users);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar
  };
}
