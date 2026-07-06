import React, { useState, useEffect } from "react";
import { Issue, IssueStatus, IssueType, IssuePriority, Sprint, Comment, SubTask, WorkLog } from "../types";
import { 
  X, Sparkles, Send, Trash, Edit, Check, Eye, Plus, Clock, Play, Calendar,
  Layers, Bookmark, CheckSquare, Bug, ChevronDown, CheckSquare2, FileText
} from "lucide-react";
import { SEED_USERS } from "../initialData";

interface IssueDetailDrawerProps {
  issue: Issue | null;
  sprints: Sprint[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateIssue: (updatedIssue: Issue) => void;
  onDeleteIssue: (issueId: string) => void;
}

export default function IssueDetailDrawer({
  issue,
  sprints,
  isOpen,
  onClose,
  onUpdateIssue,
  onDeleteIssue,
}: IssueDetailDrawerProps) {
  // Safe return if closed or no issue
  if (!isOpen || !issue) return null;

  // Edit states for fields
  const [summary, setSummary] = useState(issue.summary);
  const [description, setDescription] = useState(issue.description);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  // Work Log Modal state
  const [isLogHoursModalOpen, setIsLogHoursModalOpen] = useState(false);
  const [logHours, setLogHours] = useState("");
  const [logDesc, setLogDesc] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [workLogs, setWorkLogs] = useState<any[]>([]);

  // AI Loading & Result states
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiEstimationResult, setAiEstimationResult] = useState<{ points: number; rationale: string } | null>(null);

  // Sync state with issue when issue changes
  useEffect(() => {
    if (!issue) return;
    setSummary(issue.summary);
    setDescription(issue.description);
    setIsEditingDesc(false);
    setAiEstimationResult(null);
    setIsLogHoursModalOpen(false);

    // Fetch work logs for the issue
    fetch(`/api/issues/${issue.id}/worklogs`)
      .then(res => res.json())
      .then(data => setWorkLogs(data || []))
      .catch(err => console.error("Error fetching worklogs", err));

  }, [issue?.id]);

  // Handle auto-saves for text field modifications
  const handleSummaryBlur = () => {
    if (summary.trim() && summary !== issue.summary) {
      onUpdateIssue({ ...issue, summary, updatedAt: new Date().toISOString() });
    }
  };

  const handleDescSave = () => {
    onUpdateIssue({ ...issue, description, updatedAt: new Date().toISOString() });
    setIsEditingDesc(false);
  };

  const updateAttribute = (key: keyof Issue, value: any) => {
    onUpdateIssue({ ...issue, [key]: value, updatedAt: new Date().toISOString() });
  };

  // 1. ADD COMMENT
  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const added: Comment = {
      id: "comment-" + Date.now(),
      author: "Nithish Reddy", // Current logged user
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      text: newComment,
      createdAt: new Date().toISOString()
    };

    updateAttribute("comments", [added, ...issue.comments]);
    setNewComment("");
  };

  const handleDeleteComment = (commentId: string) => {
    const remaining = issue.comments.filter(c => c.id !== commentId);
    updateAttribute("comments", remaining);
  };

  // 2. ADD SUBTASK
  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;

    const added: SubTask = {
      id: "subtask-" + Date.now(),
      title: newSubtask,
      completed: false,
      createdAt: new Date().toISOString()
    };

    updateAttribute("subtasks", [...issue.subtasks, added]);
    setNewSubtask("");
  };

  const handleToggleSubtask = (subId: string, completed: boolean) => {
    const updated = issue.subtasks.map(s => s.id === subId ? { ...s, completed } : s);
    updateAttribute("subtasks", updated);
  };

  const handleDeleteSubtask = (subId: string) => {
    const remaining = issue.subtasks.filter(s => s.id !== subId);
    updateAttribute("subtasks", remaining);
  };

  // 3. LOG WORK HOURS
  const handleLogWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(logHours);
    if (isNaN(hours) || hours <= 0) return;

    try {
      const res = await fetch(`/api/issues/${issue.id}/worklogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "current-user", // We could grab this from a context, but we will use Nithish Reddy as default
          userName: "Nithish Reddy", 
          hours,
          comment: logDesc || "Worked on sprint tasks"
          // We can't override createdAt directly in our API right now, it sets it to current date.
        })
      });

      if (res.ok) {
        const newLog = await res.json();
        setWorkLogs([newLog, ...workLogs]);
        setLogHours("");
        setLogDesc("");
        setLogDate(new Date().toISOString().split("T")[0]);
        setIsLogHoursModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. AI INTEGRATION APIS
  const triggerAIDescription = async () => {
    setAiLoading(prev => ({ ...prev, desc: true }));
    try {
      const response = await fetch("/api/ai/suggest-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: summary, issueType: issue.type }),
      });
      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
        setIsEditingDesc(true); // Open edit mode so they can review and save
      } else {
        alert(data.error || "Failed to generate description");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setAiLoading(prev => ({ ...prev, desc: false }));
    }
  };

  const triggerAIEstimation = async () => {
    setAiLoading(prev => ({ ...prev, estimate: true }));
    try {
      const response = await fetch("/api/ai/estimate-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: summary, description: description, issueType: issue.type }),
      });
      const data = await response.json();
      if (data.points) {
        setAiEstimationResult(data);
      } else {
        alert(data.error || "Failed to estimate points");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setAiLoading(prev => ({ ...prev, estimate: false }));
    }
  };

  const triggerAIBreakdown = async () => {
    setAiLoading(prev => ({ ...prev, breakdown: true }));
    try {
      const response = await fetch("/api/ai/break-down", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: summary, description: description }),
      });
      const data = await response.json();
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const mapped: SubTask[] = data.subtasks.map((st: any, idx: number) => ({
          id: `subtask-ai-${Date.now()}-${idx}`,
          title: `${st.title} - ${st.description}`,
          completed: false,
          createdAt: new Date().toISOString()
        }));
        updateAttribute("subtasks", [...issue.subtasks, ...mapped]);
      } else {
        alert(data.error || "Failed to break down subtasks");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setAiLoading(prev => ({ ...prev, breakdown: false }));
    }
  };

  const applyAIEstimation = () => {
    if (aiEstimationResult) {
      updateAttribute("storyPoints", aiEstimationResult.points);
      setAiEstimationResult(null);
    }
  };

  // Helper formatting total worklog hours
  const totalHoursSpent = workLogs.reduce((sum, w) => sum + w.hours, 0);

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-4xl bg-slate-900/5 backdrop-blur-2xl shadow-2xl border-l border-slate-900/10 flex flex-col animate-in slide-in-from-right duration-250">
      
      {/* Drawer Title & Actions Bar */}
      <div className="px-6 py-4.5 border-b border-slate-900/10 bg-slate-900/5 text-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500">
          <span>{issue.projectId === "proj-quantum" ? "QUANTUM ENGINE" : "APOLLO FRONTEND"}</span>
          <span className="text-slate-900/20 font-normal">/</span>
          <span className="text-blue-600 font-black select-all">{issue.key}</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${issue.key}?`)) {
                onDeleteIssue(issue.id);
                onClose();
              }
            }}
            className="p-2 hover:bg-slate-900/5 text-rose-600 hover:text-rose-700 rounded-full transition-colors cursor-pointer"
            title="Delete Issue"
          >
            <Trash className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-900/5 text-slate-500 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5.5 h-5.5" />
          </button>
        </div>
      </div>

      {/* Drawer Body Area (Split View) */}
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 scrollbar-thin">
        
        {/* LEFT PANEL - Primary content (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Summary / Title */}
          <div>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              onBlur={handleSummaryBlur}
              className="w-full text-xl font-bold text-slate-800 border-0 border-b border-transparent hover:border-slate-900/10 focus:border-blue-500 focus:ring-0 px-2 py-1.5 transition-all bg-transparent rounded-xl focus:bg-slate-900/5"
            />
          </div>

          {/* AI AGENT COMPASS (Agile Assistant Controls) */}
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" /> AI Agile Copilot Actions
            </h4>

            <div className="flex flex-wrap gap-2.5">
              <button
                disabled={aiLoading.desc}
                onClick={triggerAIDescription}
                className="flex items-center gap-1.5 px-4 py-2 glass-button-primary disabled:bg-slate-900/5 disabled:text-slate-500 disabled:border-slate-900/10 font-bold text-xs rounded-full transition-all shadow-xs"
              >
                {aiLoading.desc ? "Drafting Description..." : "AI Optimize Description"}
              </button>

              <button
                disabled={aiLoading.breakdown}
                onClick={triggerAIBreakdown}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-900/5 disabled:text-slate-500 text-slate-900 font-bold text-xs rounded-full transition-all shadow-xs cursor-pointer border border-slate-900/10"
              >
                {aiLoading.breakdown ? "Analyzing..." : "AI Subtask Breakdown"}
              </button>

              <button
                disabled={aiLoading.estimate}
                onClick={triggerAIEstimation}
                className="flex items-center gap-1.5 px-4 py-2 glass-button-secondary disabled:bg-slate-100 font-bold text-xs rounded-full transition-all"
              >
                {aiLoading.estimate ? "Calculating..." : "AI Estimate Points"}
              </button>
            </div>

            {/* AI Estimation Result Panel */}
            {aiEstimationResult && (
              <div className="bg-slate-900/5 border border-slate-900/10 backdrop-blur-md rounded-xl p-4.5 text-xs shadow-2xs animate-in slide-in-from-top-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">
                    AI Estimated Value: <strong className="text-sm text-blue-600">{aiEstimationResult.points} SP</strong>
                  </span>
                  <button
                    onClick={applyAIEstimation}
                    className="px-3.5 py-1.5 glass-button-primary text-slate-900 font-bold rounded-full text-xs shadow-xs"
                  >
                    Apply Estimate
                  </button>
                </div>
                <p className="text-slate-500 leading-relaxed italic font-semibold">
                  Rationale: "{aiEstimationResult.rationale}"
                </p>
              </div>
            )}
          </div>

          {/* Issue Description Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Description
              </label>
              {!isEditingDesc ? (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Markdown
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleDescSave}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    onClick={() => {
                      setDescription(issue.description);
                      setIsEditingDesc(false);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {isEditingDesc ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-48 px-4 py-3 text-xs glass-input rounded-2xl font-mono focus:bg-slate-900/5 text-slate-800"
                placeholder="Use Markdown formats: # Header, **bold**, - list..."
              />
            ) : (
              <div className="prose prose-sm prose-slate max-w-none bg-slate-900/5 backdrop-blur-md rounded-2xl p-5 border border-slate-900/10 min-h-[120px] text-slate-800 text-xs leading-relaxed space-y-2 whitespace-pre-wrap font-sans shadow-2xs font-medium">
                {description || (
                  <span className="text-slate-500 italic">No description provided. Click AI Optimize or Edit to begin writing.</span>
                )}
              </div>
            )}
          </div>

          {/* Subtasks Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sub-tasks Checklist
              </label>
              {issue.subtasks.length > 0 && (
                <span className="text-xs font-bold text-slate-700 bg-slate-900/5 border border-slate-900/10 px-2 py-0.5 rounded-full text-[11px] shadow-2xs">
                  {Math.round((issue.subtasks.filter(s => s.completed).length / issue.subtasks.length) * 100)}% Complete
                </span>
              )}
            </div>

            {/* Subtask items checklist */}
            <div className="space-y-1.5 mb-3">
              {issue.subtasks.map((st) => (
                <div key={st.id} className="flex items-center justify-between p-2.5 bg-slate-900/5 hover:bg-slate-900/5 border border-slate-900/10 rounded-xl group text-xs transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={(e) => handleToggleSubtask(st.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-900/10 focus:ring-blue-500/20 focus:ring-2 cursor-pointer"
                    />
                    <span className={`text-slate-800 font-semibold truncate ${st.completed ? "line-through text-slate-500" : ""}`}>
                      {st.title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="opacity-0 group-hover:opacity-100 text-rose-600 hover:text-rose-700 font-semibold px-2 transition-opacity cursor-pointer"
                    title="Delete subtask"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {/* Inline Subtask input form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add sub-task..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSubtask();
                }}
                className="flex-1 px-3.5 py-2 text-xs glass-input rounded-xl"
              />
              <button
                onClick={handleAddSubtask}
                className="px-4 py-2 glass-button-primary text-slate-900 font-bold rounded-full text-xs shadow-2xs"
              >
                Add
              </button>
            </div>
          </div>

          {/* Comments Thread Section */}
          <div className="border-t border-slate-900/10 pt-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Activity & Comments ({issue.comments.length})
            </h4>

            {/* Add Comment Input form */}
            <form onSubmit={handleAddCommentSubmit} className="flex items-start gap-3 mb-6">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                alt="user avatar"
                className="w-8 h-8 rounded-full ring-1 ring-white/30 object-cover mt-0.5"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Ask a question or provide design logs..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs glass-input rounded-xl placeholder:text-slate-500 shadow-2xs text-slate-800"
                />
                <button
                  type="submit"
                  className="px-4 py-2 glass-button-primary font-bold text-xs rounded-full shadow-xs"
                >
                  Save Comment
                </button>
              </div>
            </form>

            {/* List of comments */}
            <div className="space-y-4">
              {issue.comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 text-xs p-4 bg-slate-900/5 rounded-xl border border-slate-900/10 hover:border-blue-600/30 transition-all group">
                  <img
                    src={comment.avatar}
                    alt={comment.author}
                    className="w-8 h-8 rounded-full ring-1 ring-white/30 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="space-x-2">
                        <strong className="font-bold text-slate-800">{comment.author}</strong>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-rose-600 hover:text-rose-700 font-semibold transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-slate-500 font-semibold leading-relaxed font-sans">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL - Attributes sidebar (4 columns) */}
        <div className="lg:col-span-4 bg-slate-900/5 backdrop-blur-md border border-slate-900/10 rounded-2xl p-5 space-y-5 h-fit">
          
          {/* Status dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={issue.status}
              onChange={(e) => updateAttribute("status", e.target.value as IssueStatus)}
              className="w-full px-3 py-2 text-xs glass-input rounded-xl font-bold text-slate-800 cursor-pointer shadow-2xs"
            >
              <option value="Backlog">Backlog</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Issue Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Issue Type
            </label>
            <select
              value={issue.type}
              onChange={(e) => updateAttribute("type", e.target.value as IssueType)}
              className="w-full px-3 py-2 text-xs glass-input rounded-xl font-bold text-slate-800 cursor-pointer shadow-2xs"
            >
              <option value="Epic">Epic</option>
              <option value="Story">Story</option>
              <option value="Task">Task</option>
              <option value="Bug">Bug</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Assignee
            </label>
            <select
              value={issue.assignee.name}
              onChange={(e) => {
                const user = SEED_USERS.find(u => u.name === e.target.value);
                if (user) updateAttribute("assignee", user);
              }}
              className="w-full px-3 py-2 text-xs glass-input rounded-xl font-bold text-slate-800 cursor-pointer shadow-2xs"
            >
              {SEED_USERS.map((user) => (
                <option key={user.email} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={issue.priority}
              onChange={(e) => updateAttribute("priority", e.target.value as IssuePriority)}
              className="w-full px-3 py-2 text-xs glass-input rounded-xl font-bold text-slate-800 cursor-pointer shadow-2xs"
            >
              <option value="Highest">Highest</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Story Points */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Story Points
            </label>
            <select
              value={issue.storyPoints || 0}
              onChange={(e) => updateAttribute("storyPoints", Number(e.target.value))}
              className="w-full px-3 py-2 text-xs glass-input rounded-xl font-bold text-slate-800 cursor-pointer shadow-2xs"
            >
              <option value="0">0 SP</option>
              <option value="1">1 SP</option>
              <option value="2">2 SP</option>
              <option value="3">3 SP</option>
              <option value="5">5 SP</option>
              <option value="8">8 SP</option>
              <option value="13">13 SP</option>
            </select>
          </div>

          {/* Sprint association */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Sprint
            </label>
            <select
              value={issue.sprintId || "backlog"}
              onChange={(e) => {
                const val = e.target.value === "backlog" ? null : e.target.value;
                updateAttribute("sprintId", val);
              }}
              className="w-full px-3 py-2 text-xs glass-input rounded-xl font-bold text-slate-800 cursor-pointer shadow-2xs"
            >
              <option value="backlog">Product Backlog</option>
              {sprints
                .filter((s) => s.projectId === issue.projectId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Work Log & Progress */}
          <div className="border-t border-slate-900/10 pt-4">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Logged Work Time
              </label>
              <span className="text-xs font-bold text-blue-600 bg-blue-600/10 border border-blue-600/20 rounded-full px-2 py-0.5 shadow-2xs">{totalHoursSpent} hours</span>
            </div>

            <button
              onClick={() => setIsLogHoursModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 glass-button-primary font-bold text-xs rounded-full shadow-xs transition-colors mb-4"
            >
              <Clock className="w-4 h-4" /> Log Hours
            </button>

            {/* History of work logs */}
            {workLogs.length > 0 && (
              <div className="mt-2 max-h-[250px] overflow-y-auto space-y-3 scrollbar-thin">
                {workLogs.map((wl) => (
                  <div key={wl.id} className="p-3 bg-white/60 border border-slate-900/10 rounded-xl shadow-xs transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                          {wl.userName.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{wl.userName}</span>
                      </div>
                      <span className="text-xs font-black text-blue-600">{wl.hours}h</span>
                    </div>
                    {wl.comment && (
                      <p className="text-xs text-slate-600 font-medium mb-1">
                        {wl.comment}
                      </p>
                    )}
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {new Date(wl.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time Dates stamp */}
          <div className="border-t border-slate-900/10 pt-4 text-[9px] text-slate-500 font-bold space-y-1">
            <div>Created: {new Date(issue.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(issue.updatedAt).toLocaleString()}</div>
          </div>

        </div>

      </div>

    </div>

      {/* Log Hours Modal */}
      {isLogHoursModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 text-slate-800">
              <h3 className="font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Log Time Spent
              </h3>
              <button 
                onClick={() => setIsLogHoursModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleLogWorkSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                <input 
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hours</label>
                <input 
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  placeholder="e.g. 2.5"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Comment</label>
                <input 
                  type="text"
                  placeholder="What did you work on?"
                  value={logDesc}
                  onChange={(e) => setLogDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsLogHoursModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold glass-button-primary rounded-full shadow-md"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
