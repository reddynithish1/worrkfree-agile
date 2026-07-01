import React, { useState } from "react";
import { Issue, IssueStatus, IssueType, IssuePriority, Project, Sprint, Comment } from "../types";
import { 
  Search, Plus, Sparkles, AlertCircle, CheckSquare, Bug, Bookmark, 
  Layers, ArrowUp, ArrowDown, ShieldAlert, MoreHorizontal, User, HelpCircle, X
} from "lucide-react";
import { SEED_USERS } from "../initialData";

interface KanbanBoardProps {
  project: Project;
  activeSprint: Sprint | null;
  issues: Issue[];
  onUpdateIssueStatus: (issueId: string, newStatus: IssueStatus) => void;
  onOpenIssueDetail: (issue: Issue) => void;
  onCreateIssue: (issueData: Partial<Issue>) => void;
}

const COLUMNS: IssueStatus[] = ["To Do", "In Progress", "In Review", "Done"];

export default function KanbanBoard({
  project,
  activeSprint,
  issues,
  onUpdateIssueStatus,
  onOpenIssueDetail,
  onCreateIssue,
}: KanbanBoardProps) {
  // Filter states
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  
  // Create quick issue modal state
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickSummary, setQuickSummary] = useState("");
  const [quickType, setQuickType] = useState<IssueType>("Story");
  const [quickPriority, setQuickPriority] = useState<IssuePriority>("Medium");
  const [quickAssignee, setQuickAssignee] = useState(SEED_USERS[3]); // Default to Nithish
  const [quickPoints, setQuickPoints] = useState(3);

  // Drag and drop states
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);

  // Filtered issues inside the current project and active sprint
  const activeSprintIssues = issues.filter(
    (issue) => issue.projectId === project.id && issue.sprintId === (activeSprint?.id || null)
  );

  const filteredIssues = activeSprintIssues.filter((issue) => {
    const matchesSearch = 
      issue.summary.toLowerCase().includes(search.toLowerCase()) ||
      issue.key.toLowerCase().includes(search.toLowerCase()) ||
      issue.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = selectedType === "All" || issue.type === selectedType;
    const matchesAssignee = selectedAssignee === "All" || issue.assignee.name === selectedAssignee;
    const matchesPriority = selectedPriority === "All" || issue.priority === selectedPriority;

    return matchesSearch && matchesType && matchesAssignee && matchesPriority;
  });

  const getIssuesByStatus = (status: IssueStatus) => {
    return filteredIssues.filter((issue) => issue.status === status);
  };

  const getStoryPointsSum = (status: IssueStatus) => {
    return activeSprintIssues
      .filter((issue) => issue.status === status)
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedIssueId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: IssueStatus) => {
    e.preventDefault();
    if (draggedIssueId) {
      onUpdateIssueStatus(draggedIssueId, status);
      setDraggedIssueId(null);
    }
  };

  // Icon Helpers
  const getIssueTypeIcon = (type: IssueType) => {
    switch (type) {
      case "Epic":
        return <Layers className="w-4 h-4 text-purple-600 fill-purple-100" />;
      case "Story":
        return <Bookmark className="w-4 h-4 text-emerald-600 fill-emerald-100" />;
      case "Task":
        return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case "Bug":
        return <Bug className="w-4 h-4 text-rose-600" />;
    }
  };

  const getPriorityIcon = (priority: IssuePriority) => {
    switch (priority) {
      case "Highest":
        return <ShieldAlert className="w-4.5 h-4.5 text-rose-600" title="Highest" />;
      case "High":
        return <ArrowUp className="w-4.5 h-4.5 text-orange-600" title="High" />;
      case "Medium":
        return <div className="w-3 h-1.5 rounded-full bg-amber-500" title="Medium" />;
      case "Low":
        return <ArrowDown className="w-4.5 h-4.5 text-blue-500" title="Low" />;
    }
  };

  // Quick Issue Creation Submission
  const handleQuickCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSummary.trim()) return;

    onCreateIssue({
      projectId: project.id,
      sprintId: activeSprint?.id || null, // Create in active sprint
      summary: quickSummary,
      type: quickType,
      priority: quickPriority,
      assignee: quickAssignee,
      storyPoints: quickPoints,
      status: "To Do", // Starts in To Do
      description: `### Goal / Context\nDraft details for: ${quickSummary}\n\n*Use AI to generate full PM documentation.*`,
      comments: [],
      subtasks: [],
      workLogs: [],
    });

    setQuickSummary("");
    setIsQuickCreateOpen(false);
  };

  const hasActiveFilters = search !== "" || selectedType !== "All" || selectedAssignee !== "All" || selectedPriority !== "All";

  const clearAllFilters = () => {
    setSearch("");
    setSelectedType("All");
    setSelectedAssignee("All");
    setSelectedPriority("All");
  };

  return (
    <div className="flex flex-col h-full bg-transparent" id="kanban-workspace">
      {/* Board Header Section */}
      <div className="px-6 py-5 bg-white/25 backdrop-blur-md border-b border-slate-900/10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Active Sprint Board
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2 mt-0.5">
              {activeSprint ? activeSprint.name : "No Active Sprint"}
              {!activeSprint && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/5 text-slate-500 border border-slate-900/10">
                  Plan Sprints in Backlog
                </span>
              )}
            </h1>
            {activeSprint?.goal && (
              <p className="text-xs text-slate-500 mt-1 italic font-semibold">
                Sprint Goal: {activeSprint.goal}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              id="btn-quick-create"
              onClick={() => setIsQuickCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2 glass-button-primary text-sm font-semibold rounded-full shadow-xs"
            >
              <Plus className="w-4 h-4" /> Create Issue
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-5">
          {/* Search Input */}
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search issues, summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-full py-2 pl-10 pr-4 text-xs text-slate-800 focus:bg-slate-900/5 transition-all"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center">
            <label className="text-[10px] font-bold text-slate-500 mr-2 uppercase tracking-wider">Type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-xs glass-input rounded-xl text-slate-800 cursor-pointer shadow-2xs"
            >
              <option value="All">All Types</option>
              <option value="Epic">Epic</option>
              <option value="Story">Story</option>
              <option value="Task">Task</option>
              <option value="Bug">Bug</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center">
            <label className="text-[10px] font-bold text-slate-500 mr-2 uppercase tracking-wider">Assignee:</label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-3 py-1.5 text-xs glass-input rounded-xl text-slate-800 cursor-pointer shadow-2xs"
            >
              <option value="All">All People</option>
              {SEED_USERS.map((user) => (
                <option key={user.email} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center">
            <label className="text-[10px] font-bold text-slate-500 mr-2 uppercase tracking-wider">Priority:</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 text-xs glass-input rounded-xl text-slate-800 cursor-pointer shadow-2xs"
            >
              <option value="All">All Priorities</option>
              <option value="Highest">Highest</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 rounded-xl hover:bg-slate-900/5 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}

          {/* Issue Counter stats */}
          <div className="ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900/5 border border-slate-900/10 px-3 py-1.5 rounded-full backdrop-blur-md">
            Showing <strong className="text-slate-800">{filteredIssues.length}</strong> of {activeSprintIssues.length} active issues
          </div>
        </div>
      </div>

      {/* Grid of Board Columns */}
      <div className="flex-1 overflow-y-auto md:overflow-x-auto p-4 md:p-6 bg-transparent">
        <div className="flex flex-col md:flex-row gap-5 md:h-full md:min-w-[900px]">
          {COLUMNS.map((column) => {
            const columnIssues = getIssuesByStatus(column);
            const totalPoints = getStoryPointsSum(column);
            
            return (
              <div
                key={column}
                id={`column-${column.toLowerCase().replace(" ", "-")}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column)}
                className="w-full md:flex-1 md:min-w-[250px] bg-slate-900/5 backdrop-blur-md rounded-2xl p-4 flex flex-col border border-slate-900/10 shadow-xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{column}</span>
                    <span className="text-[10px] bg-slate-900/5 text-slate-700 px-2 py-0.5 rounded-full border border-slate-900/10 font-bold shadow-2xs">
                      {columnIssues.length}
                    </span>
                  </div>
                  {totalPoints > 0 && (
                    <span className="text-[10px] bg-blue-600/10 border border-blue-600/20 text-blue-600 font-bold px-2 py-0.5 rounded-full" title="Sum of Story Points">
                      {totalPoints} SP
                    </span>
                  )}
                </div>

                {/* Column Card Container */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[60vh] md:max-h-[calc(100vh-290px)] scrollbar-thin">
                  {columnIssues.length === 0 ? (
                    <div className="border border-dashed border-slate-900/10 bg-slate-900/5 rounded-2xl py-12 text-center text-slate-500 text-xs font-semibold">
                      Drag issues here
                    </div>
                  ) : (
                    columnIssues.map((issue) => {
                      const isHighPriority = issue.priority === "Highest" || issue.priority === "High";
                      const isDone = issue.status === "Done";
                      
                      return (
                        <div
                          key={issue.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, issue.id)}
                          onClick={() => onOpenIssueDetail(issue)}
                          id={`issue-card-${issue.key}`}
                          className={`p-4 rounded-2xl glass-card border cursor-pointer group relative ${
                            isDone ? "glass-card-done" : ""
                          } ${
                            isHighPriority && !isDone ? "border-l-4 border-l-amber-500 border-slate-900/10" : "border-slate-900/10"
                          }`}
                        >
                          {/* Issue Type, Key, and Priority */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              {getIssueTypeIcon(issue.type)}
                              <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                                {issue.key}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {getPriorityIcon(issue.priority)}
                            </div>
                          </div>

                          {/* Issue Title */}
                          <h4 className={`text-sm font-semibold text-slate-800 leading-snug mb-3 ${isDone ? "line-through text-slate-500" : ""}`}>
                            {issue.summary}
                          </h4>

                          {/* Story Points & Assignee */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-900/10">
                            {issue.storyPoints ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900/5 border border-slate-900/10 text-slate-500 rounded-full" title="Story Points">
                                {issue.storyPoints}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">No SP</span>
                            )}

                            <div className="flex items-center gap-2">
                              {issue.subtasks.length > 0 && (
                                <span className="text-[9px] text-slate-500 font-bold" title="Sub-task progress">
                                  {issue.subtasks.filter(s => s.completed).length}/{issue.subtasks.length} subtasks
                                </span>
                              )}
                              <img
                                src={issue.assignee.avatar}
                                alt={issue.assignee.name}
                                className="w-5.5 h-5.5 rounded-full border border-white ring-2 ring-white/40 object-cover"
                                title={`Assigned to ${issue.assignee.name}`}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>

                          {/* Quick state-selector overlay (visible on hover) for easy access */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all flex gap-1 bg-white/80 p-1 rounded-xl shadow-md border border-slate-900/10 backdrop-blur-md">
                            <select
                              onClick={(e) => e.stopPropagation()}
                              value={issue.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                onUpdateIssueStatus(issue.id, e.target.value as IssueStatus);
                              }}
                              className="text-[10px] font-bold text-slate-800 bg-transparent border-0 focus:ring-0 cursor-pointer rounded-lg px-1.5 py-0.5"
                            >
                              {COLUMNS.map((col) => (
                                <option key={col} value={col}>{col}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Create Issue Modal */}
      {isQuickCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/40 backdrop-blur-sm">
          <div className="glass-panel rounded-3xl shadow-2xl border border-slate-900/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900/5 text-slate-800 border-b border-slate-900/10">
              <h3 className="font-bold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600" /> Create Issue in Active Sprint
              </h3>
              <button 
                onClick={() => setIsQuickCreateOpen(false)}
                className="p-1 hover:bg-slate-900/5 rounded-full transition-colors text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateSubmit} className="p-6 space-y-4 bg-transparent">
              {/* Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Summary / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Integrate auth routes with passport"
                  value={quickSummary}
                  onChange={(e) => setQuickSummary(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl"
                />
              </div>

              {/* Grid 2x2 */}
              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Issue Type
                  </label>
                  <select
                    value={quickType}
                    onChange={(e) => setQuickType(e.target.value as IssueType)}
                    className="w-full px-3 py-2 text-sm glass-input rounded-xl"
                  >
                    <option value="Story">Story</option>
                    <option value="Task">Task</option>
                    <option value="Bug">Bug</option>
                    <option value="Epic">Epic</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as IssuePriority)}
                    className="w-full px-3 py-2 text-sm glass-input rounded-xl"
                  >
                    <option value="Highest">Highest</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Assignee */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={quickAssignee.name}
                    onChange={(e) => {
                      const user = SEED_USERS.find(u => u.name === e.target.value);
                      if (user) setQuickAssignee(user);
                    }}
                    className="w-full px-3 py-2 text-sm glass-input rounded-xl"
                  >
                    {SEED_USERS.map((user) => (
                      <option key={user.email} value={user.name}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Story Points */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Story Points
                  </label>
                  <select
                    value={quickPoints}
                    onChange={(e) => setQuickPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm glass-input rounded-xl"
                  >
                    {[1, 2, 3, 5, 8, 13].map(sp => (
                      <option key={sp} value={sp}>{sp}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-900/10">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold glass-button-primary rounded-full"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
