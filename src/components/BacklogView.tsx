import React, { useState } from "react";
import { Issue, Sprint, Project, IssueType, IssuePriority, IssueStatus, User } from "../types";
import { 
  Play, CheckCircle2, Plus, Calendar, Bookmark, Layers, CheckSquare, Bug,
  ArrowUp, ArrowDown, ShieldAlert, ChevronRight, ChevronDown, Move, Trash
} from "lucide-react";

interface BacklogViewProps {
  project: Project;
  sprints: Sprint[];
  issues: Issue[];
  projectMembers: User[];
  onMoveIssueToSprint: (issueId: string, sprintId: string | null) => void;
  onUpdateIssueStatus: (issueId: string, status: IssueStatus) => void;
  onOpenIssueDetail: (issue: Issue) => void;
  onCreateIssue: (issueData: Partial<Issue>) => void;
  onCreateSprint: (sprintData: Partial<Sprint>) => void;
  onStartSprint: (sprintId: string) => void;
  onCompleteSprint: (sprintId: string) => void;
}

export default function BacklogView({
  project,
  sprints,
  issues,
  projectMembers,
  onMoveIssueToSprint,
  onUpdateIssueStatus,
  onOpenIssueDetail,
  onCreateIssue,
  onCreateSprint,
  onStartSprint,
  onCompleteSprint,
}: BacklogViewProps) {
  // Collapsible toggle for sprints
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});
  
  // Inline sprint creator
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [sprintStart, setSprintStart] = useState("");
  const [sprintEnd, setSprintEnd] = useState("");

  // Inline issue creator for specific lists
  const [activeCreatorSprintId, setActiveCreatorSprintId] = useState<string | null | undefined>(undefined);
  const [newIssueSummary, setNewIssueSummary] = useState("");
  const [newIssueType, setNewIssueType] = useState<IssueType>("Story");

  // Get current project's sprints and issues
  const projectSprints = sprints.filter((s) => s.projectId === project.id);
  const projectIssues = issues.filter((i) => i.projectId === project.id);

  // Group sprints by status
  const activeSprint = projectSprints.find((s) => s.status === "active");
  const futureSprints = projectSprints.filter((s) => s.status === "future");
  const completedSprints = projectSprints.filter((s) => s.status === "completed");

  const getSprintIssues = (sprintId: string | null) => {
    return projectIssues.filter((i) => i.sprintId === sprintId);
  };

  const getSprintMetrics = (sprintId: string | null) => {
    const sIssues = getSprintIssues(sprintId);
    const totalPoints = sIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const donePoints = sIssues.filter(i => i.status === "Done").reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const todoPoints = sIssues.filter(i => i.status === "To Do").reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const progressPoints = sIssues.filter(i => i.status === "In Progress" || i.status === "In Review").reduce((sum, i) => sum + (i.storyPoints || 0), 0);

    return { totalPoints, donePoints, todoPoints, progressPoints, count: sIssues.length };
  };

  const toggleCollapse = (id: string) => {
    setCollapsedSprints(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Create sprint handler
  const handleCreateSprintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) return;

    onCreateSprint({
      projectId: project.id,
      name: sprintName,
      goal: sprintGoal,
      startDate: sprintStart || undefined,
      endDate: sprintEnd || undefined,
      status: "future"
    });

    setSprintName("");
    setSprintGoal("");
    setSprintStart("");
    setSprintEnd("");
    setIsCreatingSprint(false);
  };

  // Create inline issue
  const handleCreateIssueSubmit = (sprintId: string | null) => {
    if (!newIssueSummary.trim()) return;

    onCreateIssue({
      projectId: project.id,
      sprintId: sprintId,
      summary: newIssueSummary,
      type: newIssueType,
      priority: "Medium",
      status: sprintId ? "To Do" : "Backlog",
      storyPoints: 2,
      assignee: projectMembers.length > 0 ? {
        name: projectMembers[0].displayName || projectMembers[0].name || "Unassigned",
        avatar: projectMembers[0].avatar || "",
        email: projectMembers[0].email || ""
      } : { name: "Unassigned", avatar: "", email: "" },
      description: `### Goal / Context\nDraft for backlog issue: ${newIssueSummary}\n\n*Generate full description inside detailed view.*`,
      comments: [],
      subtasks: [],
      workLogs: []
    });

    setNewIssueSummary("");
    setActiveCreatorSprintId(undefined);
  };

  // Icons and Badges helpers
  const getIssueTypeIcon = (type: IssueType) => {
    switch (type) {
      case "Epic":
        return <Layers className="w-3.5 h-3.5 text-purple-600 fill-purple-100" />;
      case "Story":
        return <Bookmark className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />;
      case "Task":
        return <CheckSquare className="w-3.5 h-3.5 text-blue-600" />;
      case "Bug":
        return <Bug className="w-3.5 h-3.5 text-rose-600" />;
    }
  };

  const getPriorityIcon = (priority: IssuePriority) => {
    switch (priority) {
      case "Highest":
        return <ShieldAlert className="w-4 h-4 text-rose-600" title="Highest" />;
      case "High":
        return <ArrowUp className="w-4 h-4 text-orange-600" title="High" />;
      case "Medium":
        return <div className="w-2.5 h-1 bg-amber-500 rounded-full" title="Medium" />;
      case "Low":
        return <ArrowDown className="w-4 h-4 text-blue-500" title="Low" />;
      default:
        return <div className="w-2.5 h-1 bg-amber-500 rounded-full" title="Medium" />;
    }
  };

  const getStatusBadgeClass = (status: IssueStatus) => {
    switch (status) {
      case "Backlog":
        return "bg-slate-900/5 text-slate-500 border-slate-900/10";
      case "To Do":
        return "bg-slate-900/5 text-slate-500 border-slate-900/10";
      case "In Progress":
        return "bg-blue-600/10 text-blue-600 border-blue-600/25";
      case "In Review":
        return "bg-amber-500/10 text-amber-600 border-amber-500/25";
      case "Done":
        return "bg-emerald-600/10 text-emerald-600 border-emerald-600/25";
      default:
        return "bg-slate-900/5 text-slate-500 border-slate-900/10";
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto" id="backlog-workspace">
      {/* Page Header */}
      <div className="px-6 py-5 bg-white/25 backdrop-blur-md border-b border-slate-900/10 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Agile Backlog
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">
            Backlog Planner
          </h1>
          <p className="text-xs text-slate-500 mt-1 italic font-semibold">
            Manage your project scope, construct upcoming sprints, and drag/re-assign backlog priorities.
          </p>
        </div>

        <div>
          {!isCreatingSprint && (
            <button
              id="btn-create-sprint"
              onClick={() => setIsCreatingSprint(true)}
              className="flex items-center gap-1.5 px-4 py-2 glass-button-primary text-xs font-semibold rounded-full shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Create Sprint
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Sprint Creator Form (Collapsible Panel) */}
        {isCreatingSprint && (
          <div className="glass-panel rounded-3xl p-5 shadow-lg animate-in fade-in duration-200 border-slate-900/10">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-blue-600" /> Plan Upcoming Sprint
            </h3>
            <form onSubmit={handleCreateSprintSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Sprint Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QTUM Sprint 2: Core Processing"
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs glass-input rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Sprint Goal
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Connect engine endpoints to dashboard"
                    value={sprintGoal}
                    onChange={(e) => setSprintGoal(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs glass-input rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full md:w-1/2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={sprintStart}
                    onChange={(e) => setSprintStart(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs glass-input rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={sprintEnd}
                    onChange={(e) => setSprintEnd(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs glass-input rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900/10">
                <button
                  type="button"
                  onClick={() => setIsCreatingSprint(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold glass-button-primary rounded-full transition-colors"
                >
                  Save Sprint Plan
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 1. ACTIVE SPRINT CONTAINER */}
        <div id="active-sprint-container">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Active Sprint
          </h2>

          {activeSprint ? (
            <SprintContainer
              sprint={activeSprint}
              issues={getSprintIssues(activeSprint.id)}
              metrics={getSprintMetrics(activeSprint.id)}
              allSprints={projectSprints}
              isCollapsed={!!collapsedSprints[activeSprint.id]}
              onToggleCollapse={() => toggleCollapse(activeSprint.id)}
              onOpenIssueDetail={onOpenIssueDetail}
              onMoveIssue={onMoveIssueToSprint}
              onUpdateIssueStatus={onUpdateIssueStatus}
              activeCreatorSprintId={activeCreatorSprintId}
              setActiveCreatorSprintId={setActiveCreatorSprintId}
              newIssueSummary={newIssueSummary}
              setNewIssueSummary={setNewIssueSummary}
              newIssueType={newIssueType}
              setNewIssueType={setNewIssueType}
              onAddIssue={handleCreateIssueSubmit}
              onCompleteSprint={() => onCompleteSprint(activeSprint.id)}
              getIssueTypeIcon={getIssueTypeIcon}
              getPriorityIcon={getPriorityIcon}
              getStatusBadgeClass={getStatusBadgeClass}
            />
          ) : (
            <div className="bg-white/25 backdrop-blur-md border border-dashed border-slate-900/10 rounded-2xl p-6 text-center text-sm text-slate-500 font-semibold shadow-xs">
              There is no currently active sprint. Start one of your planned sprints below.
            </div>
          )}
        </div>

        {/* 2. FUTURE PLANNED SPRINTS */}
        <div id="future-sprints-container" className="space-y-4">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Planned Future Sprints ({futureSprints.length})
          </h2>

          {futureSprints.length === 0 ? (
            <p className="text-xs text-slate-500 italic font-semibold">No future sprints planned. Create one in the header!</p>
          ) : (
            futureSprints.map((sprint) => (
              <SprintContainer
                key={sprint.id}
                sprint={sprint}
                issues={getSprintIssues(sprint.id)}
                metrics={getSprintMetrics(sprint.id)}
                allSprints={projectSprints}
                isCollapsed={!!collapsedSprints[sprint.id]}
                onToggleCollapse={() => toggleCollapse(sprint.id)}
                onOpenIssueDetail={onOpenIssueDetail}
                onMoveIssue={onMoveIssueToSprint}
                onUpdateIssueStatus={onUpdateIssueStatus}
                activeCreatorSprintId={activeCreatorSprintId}
                setActiveCreatorSprintId={setActiveCreatorSprintId}
                newIssueSummary={newIssueSummary}
                setNewIssueSummary={setNewIssueSummary}
                newIssueType={newIssueType}
                setNewIssueType={setNewIssueType}
                onAddIssue={handleCreateIssueSubmit}
                onStartSprint={() => onStartSprint(sprint.id)}
                disableStart={!!activeSprint} // Only allow starting if no sprint is currently active
                getIssueTypeIcon={getIssueTypeIcon}
                getPriorityIcon={getPriorityIcon}
                getStatusBadgeClass={getStatusBadgeClass}
              />
            ))
          )}
        </div>

        {/* 3. PRODUCT BACKLOG */}
        <div id="product-backlog-container">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Product Backlog
          </h2>

          <SprintContainer
            sprint={null}
            issues={getSprintIssues(null)}
            metrics={getSprintMetrics(null)}
            allSprints={projectSprints}
            isCollapsed={false}
            onToggleCollapse={() => {}}
            onOpenIssueDetail={onOpenIssueDetail}
            onMoveIssue={onMoveIssueToSprint}
            onUpdateIssueStatus={onUpdateIssueStatus}
            activeCreatorSprintId={activeCreatorSprintId}
            setActiveCreatorSprintId={setActiveCreatorSprintId}
            newIssueSummary={newIssueSummary}
            setNewIssueSummary={setNewIssueSummary}
            newIssueType={newIssueType}
            setNewIssueType={setNewIssueType}
            onAddIssue={handleCreateIssueSubmit}
            getIssueTypeIcon={getIssueTypeIcon}
            getPriorityIcon={getPriorityIcon}
            getStatusBadgeClass={getStatusBadgeClass}
          />
        </div>

        {/* 4. COMPLETED SPRINTS (ARCHIVE) */}
        {completedSprints.length > 0 && (
          <div id="completed-sprints-container" className="pt-4 opacity-80">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Completed Sprints Archive ({completedSprints.length})
            </h2>
            <div className="space-y-2">
              {completedSprints.map((sprint) => {
                const sIssues = getSprintIssues(sprint.id);
                const sMetrics = getSprintMetrics(sprint.id);
                return (
                  <div key={sprint.id} className="bg-slate-900/5 backdrop-blur-md rounded-2xl border border-slate-900/10 p-4 flex items-center justify-between text-xs text-slate-500 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-800">{sprint.name}</span>
                      <span className="text-[10px] bg-slate-900/5 border border-slate-900/10 px-1.5 py-0.5 rounded-full text-slate-500 font-semibold shadow-2xs">
                        Goal achieved
                      </span>
                    </div>
                    <div className="font-semibold">
                      <strong>{sIssues.length}</strong> issues completed • <strong>{sMetrics.totalPoints}</strong> Story Points
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for an isolated Sprint list block
interface SprintContainerProps {
  key?: string | number;
  sprint: Sprint | null; // null represents Product Backlog
  issues: Issue[];
  metrics: { totalPoints: number; donePoints: number; todoPoints: number; progressPoints: number; count: number };
  allSprints: Sprint[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenIssueDetail: (issue: Issue) => void;
  onMoveIssue: (issueId: string, sprintId: string | null) => void;
  onUpdateIssueStatus: (issueId: string, status: IssueStatus) => void;
  activeCreatorSprintId: string | null | undefined;
  setActiveCreatorSprintId: (id: string | null | undefined) => void;
  newIssueSummary: string;
  setNewIssueSummary: (val: string) => void;
  newIssueType: IssueType;
  setNewIssueType: (type: IssueType) => void;
  onAddIssue: (sprintId: string | null) => void;
  onStartSprint?: () => void;
  onCompleteSprint?: () => void;
  disableStart?: boolean;
  getIssueTypeIcon: (type: IssueType) => React.ReactNode;
  getPriorityIcon: (priority: IssuePriority) => React.ReactNode;
  getStatusBadgeClass: (status: IssueStatus) => string;
}

function SprintContainer({
  sprint,
  issues,
  metrics,
  allSprints,
  isCollapsed,
  onToggleCollapse,
  onOpenIssueDetail,
  onMoveIssue,
  onUpdateIssueStatus,
  activeCreatorSprintId,
  setActiveCreatorSprintId,
  newIssueSummary,
  setNewIssueSummary,
  newIssueType,
  setNewIssueType,
  onAddIssue,
  onStartSprint,
  onCompleteSprint,
  disableStart,
  getIssueTypeIcon,
  getPriorityIcon,
  getStatusBadgeClass,
}: SprintContainerProps) {
  const sprintId = sprint ? sprint.id : null;
  const isBacklog = sprint === null;

  return (
    <div className="bg-slate-900/5 backdrop-blur-md rounded-2xl border border-slate-900/10 overflow-hidden shadow-2xs">
      {/* Sprint Header Row */}
      <div className="px-4 py-3 bg-slate-900/5 border-b border-slate-900/10 flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => !isBacklog && onToggleCollapse()}>
          {!isBacklog && (
            isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
          <span className="font-bold text-slate-800 text-sm">
            {isBacklog ? "Product Backlog" : sprint.name}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            ({metrics.count} issues)
          </span>

          {sprint?.status === "active" && (
            <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-600/10 text-blue-600 rounded-full border border-blue-600/20">
              Active Sprint
            </span>
          )}
        </div>

        {/* Stats segment */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" title="To Do" />
            <span className="font-bold text-slate-700">{metrics.todoPoints}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" title="In Progress & Review" />
            <span className="font-bold text-slate-700">{metrics.progressPoints}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" title="Done" />
            <span className="font-bold text-emerald-600">{metrics.donePoints}</span>
            <span className="text-slate-500 font-normal ml-1">SP total</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-900/5 hidden sm:block" />

          {/* Header Actions */}
          {!isBacklog && (
            <div className="flex items-center gap-2">
              {sprint.status === "active" && onCompleteSprint && (
                <button
                  onClick={(e) => { e.stopPropagation(); onCompleteSprint(); }}
                  className="flex items-center gap-1 px-3 py-1 glass-button-primary text-[11px] font-bold rounded-full shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete Sprint
                </button>
              )}
              {sprint.status === "future" && onStartSprint && (
                <button
                  disabled={disableStart}
                  onClick={(e) => { e.stopPropagation(); onStartSprint(); }}
                  className={`flex items-center gap-1 px-3 py-1 text-slate-900 text-[11px] font-bold rounded-full transition-all shadow-2xs ${
                    disableStart 
                      ? "bg-slate-900/5 text-slate-500 border border-slate-900/10 cursor-not-allowed" 
                      : "glass-button-primary hover:scale-105"
                  }`}
                  title={disableStart ? "You can only run one active sprint at a time" : "Start this sprint now"}
                >
                  <Play className="w-3.5 h-3.5" /> Start Sprint
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Issues Sub-List */}
      {!isCollapsed && (
        <div className="divide-y divide-white/20">
          {issues.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-500 bg-slate-900/5">
              No issues in this sprint. Click "Create backlog item" below to plan scope.
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onOpenIssueDetail(issue)}
                className="px-4 py-2.5 bg-slate-900/5 hover:bg-slate-900/5 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 cursor-pointer text-xs"
              >
                {/* Left cell: Type, Key, Summary */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="shrink-0">{getIssueTypeIcon(issue.type)}</span>
                  <span className="font-bold text-slate-500 tracking-tight shrink-0 select-all">
                    {issue.key}
                  </span>
                  <span className="text-slate-800 font-semibold truncate">
                    {issue.summary}
                  </span>
                </div>

                {/* Right cell: Assignee, Priority, SP, Status, Destination Sprint */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {/* Status pill */}
                  <span className={`px-2 py-0.5 font-bold rounded-full border text-[10px] uppercase tracking-wide ${getStatusBadgeClass(issue.status)}`}>
                    {issue.status}
                  </span>

                  {/* Priority icon */}
                  <span>{getPriorityIcon(issue.priority)}</span>

                  {/* Story point badge */}
                  <span className="hidden md:flex w-5 h-5 rounded-full bg-slate-900/5 border border-slate-900/10 text-slate-500 items-center justify-center font-bold text-[10px]">
                    {issue.storyPoints || "-"}
                  </span>

                  {/* Assignee Avatar */}
                  <img
                    src={issue.assignee.avatar}
                    alt={issue.assignee.name}
                    className="hidden md:block w-5.5 h-5.5 rounded-full ring-1 ring-white/30 object-cover"
                    title={`Assigned to ${issue.assignee.name}`}
                    referrerPolicy="no-referrer"
                  />

                  {/* Move Sprint destination selector */}
                  <div className="hidden md:block relative" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={sprintId || "backlog"}
                      onChange={(e) => {
                        const target = e.target.value === "backlog" ? null : e.target.value;
                        onMoveIssue(issue.id, target);
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-slate-900/5 border border-slate-900/10 rounded-lg text-slate-500 cursor-pointer hover:border-blue-500 transition-all focus:outline-none"
                    >
                      <option value="backlog">Backlog</option>
                      {allSprints
                        .filter((s) => s.status !== "completed")
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name.length > 20 ? `${s.name.substring(0, 20)}...` : s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Quick Issue Creator row inside this list container */}
          <div className="px-4 py-2.5 bg-slate-900/5 border-t border-slate-900/10">
            {activeCreatorSprintId === sprintId ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
                <select
                  value={newIssueType}
                  onChange={(e) => setNewIssueType(e.target.value as IssueType)}
                  className="px-2.5 py-1.5 text-xs glass-input rounded-xl cursor-pointer"
                >
                  <option value="Story">Story</option>
                  <option value="Task">Task</option>
                  <option value="Bug">Bug</option>
                  <option value="Epic">Epic</option>
                </select>
                <input
                  type="text"
                  placeholder="What needs to be done? Press Enter or Click '+'"
                  value={newIssueSummary}
                  onChange={(e) => setNewIssueSummary(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onAddIssue(sprintId);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs glass-input rounded-xl text-slate-800 placeholder:text-slate-500 focus:bg-slate-900/5"
                  autoFocus
                />
                <button
                  onClick={() => onAddIssue(sprintId)}
                  className="px-4 py-1.5 glass-button-primary rounded-full text-xs font-bold transition-all shadow-2xs"
                >
                  Add
                </button>
                <button
                  onClick={() => setActiveCreatorSprintId(undefined)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setNewIssueSummary("");
                  setActiveCreatorSprintId(sprintId);
                }}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs py-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create {isBacklog ? "backlog item" : "issue in this sprint"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
