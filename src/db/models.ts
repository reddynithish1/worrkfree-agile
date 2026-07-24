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
  resetToken?: string;
  resetTokenExpiry?: number;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, required: true },
  avatar: { type: String, default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
  projects: { type: [String], default: [] },
  createdAt: { type: String, required: true },
  resetToken: { type: String, default: undefined },
  resetTokenExpiry: { type: Number, default: undefined }
});

export const UserModel = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

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

export const ProjectModel = (mongoose.models.Project as mongoose.Model<IProject>) || mongoose.model<IProject>('Project', ProjectSchema);

// Sprint Schema
export interface ISprint extends Document {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate?: string;
  endDate?: string;
  status: string;
}

const SprintSchema = new Schema<ISprint>({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  name: { type: String, required: true },
  goal: { type: String, default: "" },
  startDate: { type: String },
  endDate: { type: String },
  status: { type: String, default: "future" }
});

export const SprintModel = (mongoose.models.Sprint as mongoose.Model<ISprint>) || mongoose.model<ISprint>('Sprint', SprintSchema);

// WorkLog Schema
export interface IWorkLog extends Document {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  hours: number;
  comment: string;
  createdAt: string;
}

const WorkLogSchema = new Schema<IWorkLog>({
  id: { type: String, required: true, unique: true },
  issueId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  hours: { type: Number, required: true },
  comment: { type: String, default: "" },
  createdAt: { type: String, required: true }
});

export const WorkLogModel = (mongoose.models.WorkLog as mongoose.Model<IWorkLog>) || mongoose.model<IWorkLog>('WorkLog', WorkLogSchema);

// Task/Issue Schema
export interface IAssignee {
  name: string;
  avatar: string;
  email: string;
}

export interface IComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  createdAt: string;
}

export interface ISubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface IIssue extends Document {
  id: string;
  key: string;
  projectId: string;
  sprintId: string | null;
  summary: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  storyPoints: number;
  assignee: IAssignee;
  comments: IComment[];
  subtasks: ISubTask[];
  createdAt: string;
  updatedAt: string;
}

const AssigneeSchema = new Schema<IAssignee>({
  name: { type: String, required: true },
  avatar: { type: String, required: false },
  email: { type: String, required: false }
}, { _id: false });

const CommentSchema = new Schema<IComment>({
  id: { type: String, required: true },
  author: { type: String, required: true },
  avatar: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { _id: false });

const SubTaskSchema = new Schema<ISubTask>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: String, required: true }
}, { _id: false });

const IssueSchema = new Schema<IIssue>({
  id: { type: String, required: true, unique: true },
  key: { type: String, required: true },
  projectId: { type: String, required: true },
  sprintId: { type: String, default: null },
  summary: { type: String, required: true },
  description: { type: String, default: "" },
  type: { type: String, default: "Story" },
  status: { type: String, default: "To Do" },
  priority: { type: String, default: "Medium" },
  storyPoints: { type: Number, default: 0 },
  assignee: { type: AssigneeSchema, required: true },
  comments: { type: [CommentSchema], default: [] },
  subtasks: { type: [SubTaskSchema], default: [] },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

export const IssueModel = (mongoose.models.Issue as mongoose.Model<IIssue>) || mongoose.model<IIssue>('Issue', IssueSchema);

// ChatMessage Schema
export interface IChatMessage extends Document {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  message: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { collection: 'workspace_chats' });

export const ChatMessageModel = (mongoose.models.ChatMessage as mongoose.Model<IChatMessage>) || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
