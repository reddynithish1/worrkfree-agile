export type IssueType = "Epic" | "Story" | "Task" | "Bug";
export type IssuePriority = "Highest" | "High" | "Medium" | "Low";
export type IssueStatus = "Backlog" | "To Do" | "In Progress" | "In Review" | "Done";
export type SprintStatus = "active" | "future" | "completed";

export interface Project {
  id: string;
  name: string;
  key: string; // e.g. "KAN"
  description: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface WorkLog {
  id: string;
  author: string;
  hoursLogged: number;
  description: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  key: string; // e.g. "KAN-1"
  projectId: string;
  sprintId: string | null; // null means Product Backlog
  summary: string;
  description: string; // Markdown supported
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  storyPoints: number;
  assignee: {
    name: string;
    avatar: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  subtasks: SubTask[];
  workLogs: WorkLog[];
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
}

export type ActiveTab = "board" | "backlog" | "copilot" | "insights";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface UserCredentials extends User {
  passwordHash: string;
}
