import React, { useState } from "react";
import { Issue, Project, Sprint, IssueType, IssuePriority, IssueStatus } from "../types";
import { Sparkles, Calendar, ArrowRight, ShieldAlert, CheckCircle2, Bookmark, CheckSquare, Bug, Layers, HelpCircle, RefreshCw, Clipboard } from "lucide-react";

interface AICopilotProps {
  project: Project;
  activeSprint: Sprint | null;
  issues: Issue[];
  onImportIssues: (proposedIssues: Partial<Issue>[]) => void;
  onNavigateToTab: (tab: "board" | "backlog" | "copilot" | "insights") => void;
}

interface ProposedIssue {
  summary: string;
  issueType: IssueType;
  priority: IssuePriority;
  storyPoints: number;
  description: string;
  initialStatus: IssueStatus;
}

export default function AICopilot({
  project,
  activeSprint,
  issues,
  onImportIssues,
  onNavigateToTab,
}: AICopilotProps) {
  const [goalInput, setGoalInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposedIssues, setProposedIssues] = useState<ProposedIssue[]>([]);
  const [loadingStep, setLoadingStep] = useState("");

  // PM Health Check recommendations state
  const [healthFeedback, setHealthFeedback] = useState<string | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Generate sprint roadmap
  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;

    setLoading(true);
    setProposedIssues([]);
    setLoadingStep("Analyzing project context & tech architecture...");

    setTimeout(() => {
      setLoadingStep("Formulating Epics and breaking down User Stories...");
    }, 2000);

    setTimeout(() => {
      setLoadingStep("Predicting story point allocations and priorities...");
    }, 4000);

    try {
      const response = await fetch("/api/ai/generate-sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goalInput }),
      });
      const data = await response.json();
      if (data.issues && Array.isArray(data.issues)) {
        setProposedIssues(data.issues);
      } else {
        // BUG-009 FIX: Show clean user-friendly error, never raw JSON
        const friendlyError = data.error?.includes("API") || data.error?.includes("key") || data.error?.includes("quota")
          ? "AI is temporarily unavailable. Please check your API key or try again later."
          : (data.error || "Failed to generate roadmap. Please try again.");
        alert(friendlyError);
      }
    } catch (error: any) {
      console.error(error);
      // BUG-009 FIX: Never show raw error.message to users
      alert("AI is temporarily unavailable. Please try again in a moment.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  // Perform a Project Health Audit using heuristics + AI response
  const handleHealthCheck = () => {
    setCheckingHealth(true);
    setHealthFeedback(null);

    // Filter project issues
    const projIssues = issues.filter(i => i.projectId === project.id);
    const inProgressCount = projIssues.filter(i => i.status === "In Progress" || i.status === "In Review").length;
    const todoCount = projIssues.filter(i => i.status === "To Do").length;
    const backlogCount = projIssues.filter(i => i.status === "Backlog" || i.sprintId === null).length;
    const highestPriorityCount = projIssues.filter(i => i.priority === "Highest" && i.status !== "Done").length;
    
    // Check developer allocation workloads
    const assigneeMap: Record<string, number> = {};
    projIssues.forEach(i => {
      if (i.status !== "Done") {
        assigneeMap[i.assignee.name] = (assigneeMap[i.assignee.name] || 0) + 1;
      }
    });

    let bottleneckMember = "";
    let bottleneckCount = 0;
    Object.entries(assigneeMap).forEach(([name, count]) => {
      if (count > bottleneckCount) {
        bottleneckCount = count;
        bottleneckMember = name;
      }
    });

    setTimeout(() => {
      let analysis = `### Scrum Coach Project Health Audit for **${project.name}**\n\n`;
      
      analysis += `#### 📊 Current Dashboard Statistics\n`;
      analysis += `- **Unscheduled Backlog scope**: ${backlogCount} issues currently waiting.\n`;
      analysis += `- **Highest Priority Blockers**: ${highestPriorityCount} items flagged as critical.\n`;
      analysis += `- **Active Concurrency**: ${inProgressCount} issues in progress or in review.\n\n`;

      analysis += `#### 🔍 Key Audit Findings\n`;
      
      if (highestPriorityCount > 0) {
        analysis += `- ⚠️ **Highest Priority Risks**: You have **${highestPriorityCount}** issues flagged as "Highest" priority that are not yet complete. Recommend moving these to the top of the sprint column immediately to unblock workflows.\n`;
      } else {
        analysis += `- ✅ **High Priority Clear**: No outstanding Highest priority blockers. Great queue control!\n`;
      }

      if (bottleneckCount >= 3) {
        analysis += `- ⚠️ **Developer Bottleneck Alert**: **${bottleneckMember}** is assigned to **${bottleneckCount}** unresolved issues. This is a potential choke point for the team's velocity. Consider re-assigning some tasks to load-balance team effort.\n`;
      } else {
        analysis += `- ✅ **Balanced Workloads**: Workloads are well distributed among developers.\n`;
      }

      const issuesNoDescription = projIssues.filter(i => !i.description || i.description.length < 50);
      if (issuesNoDescription.length > 0) {
        analysis += `- ⚠️ **Vague Requirement Scopes**: **${issuesNoDescription.length}** issues have very brief descriptions. Developers might struggle with vague acceptance criteria. *Action:* Use the **AI Optimize Description** tool inside each issue detail page to automatically draft PM specs!\n`;
      }

      analysis += `\n#### 💡 Scrum Coach Advice\n`;
      analysis += `1. Hold a quick 10-minute standup to check on the Highest priority items.\n`;
      analysis += `2. Before starting the next sprint, verify that the active sprint has zero "In Review" issues.\n`;
      analysis += `3. Maintain strict WIP (Work In Progress) limits: no developer should have more than 2 tasks in progress concurrently.`;

      setHealthFeedback(analysis);
      setCheckingHealth(false);
    }, 1200);
  };

  // Bulk Import
  const handleBulkImport = () => {
    if (proposedIssues.length === 0) return;

    // Map proposed issue fields to full issue model defaults
    const listToImport: Partial<Issue>[] = proposedIssues.map((st) => ({
      projectId: project.id,
      sprintId: activeSprint?.id || null, // Import into active sprint or backlog
      summary: st.summary,
      type: st.issueType,
      priority: st.priority,
      storyPoints: st.storyPoints || 2,
      status: st.initialStatus || "To Do",
      description: `### Goal / Context\n${st.description}\n\n*Generated by WorrkFree Agile AI Copilot.*`,
      comments: [],
      subtasks: [],
      workLogs: []
    }));

    onImportIssues(listToImport);
    setProposedIssues([]);
    setGoalInput("");
    
    // Take user to Backlog tab to see the imported issues!
    onNavigateToTab("backlog");
  };

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

  const getPriorityBadgeColor = (p: IssuePriority) => {
    switch (p) {
      case "Highest": return "bg-rose-500/10 text-rose-600 border-rose-500/25";
      case "High": return "bg-orange-500/10 text-orange-600 border-orange-500/25";
      case "Medium": return "bg-amber-500/10 text-amber-600 border-amber-500/25";
      case "Low": return "bg-blue-500/10 text-blue-600 border-blue-500/25";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent scrollbar-thin" id="ai-copilot-workspace">
      {/* Page Header */}
      <div className="px-6 py-4.5 bg-white/25 backdrop-blur-md border-b border-slate-900/10">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-600" /> Agile AI Copilot
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
          Scrum AI Assistant & Roadmapper
        </h1>
        <p className="text-xs text-slate-500 mt-1 italic font-semibold">
          Plan entire sprints automatically or run an agile audit on your active Kanban board status to detect blockers.
        </p>
      </div>

      <div className="p-6 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Roadmap generator (7 columns) */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Form */}
          <div className="bg-slate-900/5 backdrop-blur-md rounded-2xl border border-slate-900/10 p-6 shadow-2xs">
            <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4.5 h-4.5 text-blue-600" /> Sprint Goals AI Roadmapper
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-semibold">
              Type in a product requirement or milestone, and the copilot will automatically generate 4 to 7 structured Epics, Stories, and Bugs.
            </p>

            <form onSubmit={handleGenerateRoadmap} className="space-y-4">
              <div>
                <textarea
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g. Integrate a Stripe checkout subscription system supporting monthly and annual billing with a graceful loading portal"
                  required
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs glass-input rounded-xl placeholder:text-slate-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 glass-button-primary disabled:bg-slate-900/5 disabled:text-slate-500 disabled:border-slate-900/10 text-slate-900 font-bold text-xs rounded-full transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {loading ? "Generating Roadmap..." : "Generate Proposed Backlog"}
                </button>
              </div>
            </form>
          </div>

          {/* Proposal loading status */}
          {loading && (
            <div className="bg-slate-900/5 backdrop-blur-md rounded-2xl border border-slate-900/10 p-8 text-center shadow-2xs animate-pulse">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm">WorrkFree Ai is working...</h4>
              <p className="text-xs text-slate-500 mt-1.5 font-semibold">{loadingStep}</p>
            </div>
          )}

          {/* Proposal Review List */}
          {proposedIssues.length > 0 && (
            <div className="bg-slate-900/5 backdrop-blur-md rounded-2xl border border-slate-900/10 overflow-hidden shadow-xs animate-in fade-in duration-300">
              <div className="px-5 py-4 bg-slate-900/5 border-b border-slate-900/10 text-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-widest text-blue-600">Review Proposed Roadmap</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Generated {proposedIssues.length} issues for your backlog</p>
                </div>
                <button
                  onClick={handleBulkImport}
                  className="px-4 py-2 glass-button-primary font-bold text-xs rounded-full shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  Import All to Backlog <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-white/20 max-h-[480px] overflow-y-auto scrollbar-thin">
                {proposedIssues.map((issue, index) => (
                  <div key={index} className="p-4 bg-slate-900/5 hover:bg-slate-900/5 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span>{getIssueTypeIcon(issue.issueType)}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{issue.issueType}</span>
                        <h5 className="font-bold text-slate-800 text-xs">{issue.summary}</h5>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full border font-bold text-[9px] ${getPriorityBadgeColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed pl-6 italic mb-2">
                      {issue.description}
                    </p>

                    <div className="flex items-center gap-3 pl-6 text-[10px] text-slate-500 font-bold">
                      <span>Estimated Points: <strong className="text-blue-600 font-bold">{issue.storyPoints} SP</strong></span>
                      <span>•</span>
                      <span>Initial Status: <strong className="text-amber-600 font-bold">{issue.initialStatus}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: PM Health check & standup assistant (5 columns) */}
        <div className="md:col-span-5 space-y-6">
          
          <div className="bg-slate-900/5 backdrop-blur-md rounded-2xl border border-slate-900/10 p-6 shadow-2xs">
            <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 text-sm">
              <Clipboard className="w-4.5 h-4.5 text-blue-600" /> Scrum Coach Audit
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-semibold">
              Initiate a live project health check. The Scrum Coach AI will analyze active story metrics, identify unassigned tickets, and highlight workload bottlenecks.
            </p>

            <button
              onClick={handleHealthCheck}
              disabled={checkingHealth}
              className="w-full py-2.5 glass-button-primary text-slate-900 font-bold text-xs rounded-full shadow-xs transition-colors"
            >
              {checkingHealth ? "Running Heuristics Audit..." : "Run Scrum Health Check"}
            </button>
          </div>

          {/* Heuristic Audit Output */}
          {healthFeedback && (
            <div className="bg-slate-900/5 backdrop-blur-md text-slate-800 rounded-2xl p-6 shadow-xs border border-slate-900/10 animate-in slide-in-from-bottom-2 duration-300">
              <div className="prose prose-xs leading-relaxed space-y-3 font-semibold text-xs text-slate-500">
                {/* Visual markdown formatter */}
                {healthFeedback.split("\n").map((line, idx) => {
                  if (line.startsWith("### ")) {
                    return <h3 key={idx} className="text-sm font-bold text-blue-600 mt-4 first:mt-0 pb-1 border-b border-slate-900/10">{line.replace("### ", "")}</h3>;
                  }
                  if (line.startsWith("#### ")) {
                    return <h4 key={idx} className="text-xs font-bold text-amber-600 mt-3">{line.replace("#### ", "")}</h4>;
                  }
                  if (line.startsWith("- ")) {
                    return <div key={idx} className="pl-3 py-0.5">• {line.replace("- ", "")}</div>;
                  }
                  if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ")) {
                    return <div key={idx} className="pl-3 py-0.5 text-slate-500">{line}</div>;
                  }
                  return <p key={idx} className="text-slate-500">{line}</p>;
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
