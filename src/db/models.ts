import mongoose, { Document, Schema } from 'mongoose';

// User Schema
export interface IUser extends Document {
  id: string; // Keep original id for backward compatibility
  email: string;
  passwordHash: string;
  displayName: string;
  avatar: string;
  projects: string[];
  createdAt: string;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, required: true },
  avatar: { type: String, default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
  projects: { type: [String], default: [] },
  createdAt: { type: String, required: true }
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);


// Project Schema
export interface IProjectMember {
  userId: string;
  joinedAt: string;
}

export interface IProject extends Document {
  id: string;
  name: string;
  key: string;
  description: string;
  inviteCode: string;
  ownerId: string;
  members: IProjectMember[];
  createdAt?: string;
}

const ProjectMemberSchema = new Schema<IProjectMember>({
  userId: { type: String, required: true },
  joinedAt: { type: String, required: true }
}, { _id: false });

const ProjectSchema = new Schema<IProject>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  key: { type: String, required: true },
  description: { type: String, default: "" },
  inviteCode: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  members: { type: [ProjectMemberSchema], default: [] },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export const ProjectModel = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);


// Task/Issue Schema
export interface IIssue extends Document {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: string;
  createdAt: string;
}

const IssueSchema = new Schema<IIssue>({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, default: "To Do" },
  priority: { type: String, default: "Medium" },
  assigneeId: { type: String, default: "" },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export const IssueModel = mongoose.models.Issue || mongoose.model<IIssue>('Issue', IssueSchema);


// ChatMessage Schema
export interface IChatMessage extends Document {
  id: string;
  projectId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  id: { type: String, required: true, unique: true },
  projectId: { type: String },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  text: { type: String, required: true },
  timestamp: { type: String, required: true }
});

export const ChatMessageModel = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
