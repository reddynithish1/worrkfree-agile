import mongoose from 'mongoose';

const AssigneeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String, required: true },
  email: { type: String, required: true }
}, { _id: false });

const CommentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  author: { type: String, required: true },
  avatar: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { _id: false });

const SubTaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: String, required: true }
}, { _id: false });

const IssueSchema = new mongoose.Schema({
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

const IssueModel = mongoose.model('TestIssue', IssueSchema);

const issue = new IssueModel({
  id: "issue-" + Date.now(),
  key: "TEST-1",
  projectId: "proj-1",
  sprintId: null,
  summary: "Testing",
  description: "Test description",
  type: "Story",
  status: "To Do",
  priority: "Medium",
  storyPoints: 2,
  assignee: { name: "Unassigned", avatar: "", email: "" },
  subtasks: [],
  comments: []
});

const err = issue.validateSync();
if (err) {
  console.log("Validation Failed:", err.message);
} else {
  console.log("Validation Passed!");
}
