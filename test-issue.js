import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.log("No MONGODB_URI");
  process.exit(1);
}

const AssigneeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String, required: true },
  email: { type: String, required: true }
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
  comments: { type: Array, default: [] },
  subtasks: { type: Array, default: [] },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const IssueModel = mongoose.model('TestIssue', IssueSchema);

async function test() {
  try {
    await mongoose.connect(uri);
    const issue = await IssueModel.create({
      id: "issue-" + Date.now(),
      key: "TEST-1",
      projectId: "test",
      sprintId: null,
      summary: "test",
      description: "test",
      type: "Story",
      status: "To Do",
      priority: "Medium",
      storyPoints: 2,
      assignee: { name: "Unassigned", avatar: "", email: "" },
      subtasks: [],
      comments: []
    });
    console.log("Success:", issue.id);
  } catch (err) {
    console.error("ValidationError:", err.message);
  } finally {
    mongoose.disconnect();
  }
}
test();
