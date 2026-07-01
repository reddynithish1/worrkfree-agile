import React from "react";
import { Issue, Project, Sprint, IssueType } from "../types";
import { BarChart2, CheckCircle2, Clock, Users, ShieldAlert, Award, AlertCircle } from "lucide-react";

interface InsightsViewProps {
  project: Project;
  sprints: Sprint[];
  issues: Issue[];
}

export default function InsightsView({ project, sprints, issues }: InsightsViewProps) {
  const projectIssues = issues.filter((i) => i.projectId === project.id);
  const projectSprints = sprints.filter((s) => s.projectId === project.id);

  // Group Issues by Status
  const todoIssues = projectIssues.filter((i) => i.status === "To Do");
  const inProgressIssues = projectIssues.filter((i) => i.status === "In Progress" || i.status === "In Review");
  const doneIssues = projectIssues.filter((i) => i.status === "Done");

  // Sum points by status
  const todoPoints = todoIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const progressPoints = inProgressIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const donePoints = doneIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const totalPoints = todoPoints + progressPoints + donePoints;

  // Group Issues by Type
  const epics = projectIssues.filter((i) => i.type === "Epic");
  const stories = projectIssues.filter((i) => i.type === "Story");
  const tasks = projectIssues.filter((i) => i.type === "Task");
  const bugs = projectIssues.filter((i) => i.type === "Bug");

  // Group all work logs across issues
  interface ExtendedWorkLog {
    id: string;
    issueKey: string;
    issueSummary: string;
    author: string;
    hoursLogged: number;
    description: string;
    createdAt: string;
  }

  const allWorkLogs: ExtendedWorkLog[] = [];
  projectIssues.forEach((issue) => {
    issue.workLogs.forEach((wl) => {
      allWorkLogs.push({
        ...wl,
        issueKey: issue.key,
        issueSummary: issue.summary
      });
    });
  });

  // Sort logs by newest first
  allWorkLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Aggregate stats
  const totalHoursLogged = allWorkLogs.reduce((sum, l) => sum + l.hoursLogged, 0);

  // Velocity Calculation per Sprint
  const velocityData = projectSprints.map((sprint) => {
    const sprintIssues = projectIssues.filter((i) => i.sprintId === sprint.id);
    const sprintDonePoints = sprintIssues
      .filter((i) => i.status === "Done")
      .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const sprintTotalPoints = sprintIssues
      .reduce((sum, i) => sum + (i.storyPoints || 0), 0);

    return {
      name: sprint.name.length > 15 ? `${sprint.name.substring(0, 15)}...` : sprint.name,
      donePoints: sprintDonePoints,
      totalPoints: sprintTotalPoints,
      status: sprint.status
    };
  });

  // Calculate percentages for the issue types donut chart
  const totalIssueCount = projectIssues.length || 1;
  const epicPct = Math.round((epics.length / totalIssueCount) * 100);
  const storyPct = Math.round((stories.length / totalIssueCount) * 100);
  const taskPct = Math.round((tasks.length / totalIssueCount) * 100);
  const bugPct = Math.round((bugs.length / totalIssueCount) * 100);

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-6 scrollbar-thin" id="insights-workspace">
      
      {/* Page Header */}
      <div className="max-w-5xl mx-auto w-full mb-6">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
          <BarChart2 className="w-3.5 h-3.5 text-blue-600" /> Metrics & Analytics
        </div>
        <h1 className="text-2xl font-bold text-slate-200 tracking-tight mt-1">
          Agile Insights Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1 italic font-semibold">
          Review overall project velocity, resource allocation ratios, and developer work log diagnostics.
        </p>
      </div>

      <div className="max-w-5xl mx-auto w-full space-y-6">

        {/* 1. AGGREGATE SUMMARY CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Scope</div>
              <div className="text-lg font-bold text-slate-200">{totalPoints} Story Points</div>
              <div className="text-[10px] text-slate-500 font-semibold">{projectIssues.length} issues tracked</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Completed Points</div>
              <div className="text-lg font-bold text-slate-200">{donePoints} Story Points</div>
              <div className="text-[10px] text-emerald-600 font-bold">
                {totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0}% completion velocity
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Logged Effort</div>
              <div className="text-lg font-bold text-slate-200">{totalHoursLogged} Hours</div>
              <div className="text-[10px] text-slate-500 font-semibold">{allWorkLogs.length} audit sessions</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Sprints</div>
              <div className="text-lg font-bold text-slate-200">{projectSprints.length} Planned</div>
              <div className="text-[10px] text-amber-600 font-bold">
                {projectSprints.filter(s => s.status === "active").length} active sprint running
              </div>
            </div>
          </div>
        </div>

        {/* 2. SPRINT BURNUP CHART & SCOPE RANGES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Active Sprint Burnup progress bar distribution */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-200 text-sm mb-1">Sprint Progress Bar</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed font-semibold">Percentage breakdown of story points inside all tracked columns.</p>
            </div>

            <div className="space-y-4">
              {/* Giant composite bar */}
              <div className="h-6 w-full rounded-full overflow-hidden flex bg-white/10 border border-white/10">
                {donePoints > 0 && (
                  <div
                    style={{ width: `${(donePoints / (totalPoints || 1)) * 100}%` }}
                    className="h-full bg-emerald-500 transition-all"
                    title={`Done: ${donePoints} SP`}
                  />
                )}
                {progressPoints > 0 && (
                  <div
                    style={{ width: `${(progressPoints / (totalPoints || 1)) * 100}%` }}
                    className="h-full bg-amber-500 transition-all"
                    title={`In Progress & Review: ${progressPoints} SP`}
                  />
                )}
                {todoPoints > 0 && (
                  <div
                    style={{ width: `${(todoPoints / (totalPoints || 1)) * 100}%` }}
                    className="h-full bg-slate-400 transition-all"
                    title={`To Do & Backlog: ${todoPoints} SP`}
                  />
                )}
              </div>

              {/* Legends with direct counts */}
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="flex items-center gap-1.5 p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <span className="block font-bold">Done</span>
                    <strong className="text-slate-200 font-bold">{donePoints} SP</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div>
                    <span className="block font-bold">Active</span>
                    <strong className="text-slate-200 font-bold">{progressPoints} SP</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 p-2 bg-white/10 rounded-xl border border-white/10 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <div>
                    <span className="block font-bold">Planned</span>
                    <strong className="text-slate-200 font-bold">{todoPoints} SP</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Issue Type Distribution Donut SVG */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xs flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <h3 className="font-bold text-slate-200 text-sm mb-1">Issue Types</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed font-semibold">Visual breakdown of scope profile.</p>

              {/* Donut Legend */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <span className="w-3 h-3 bg-slate-700 rounded-sm" />
                    <span>Epic Tasks</span>
                  </div>
                  <strong className="text-slate-200 font-bold">{epics.length} ({epicPct})%</strong>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <span className="w-3 h-3 bg-emerald-500 rounded-sm" />
                    <span>User Stories</span>
                  </div>
                  <strong className="text-slate-200 font-bold">{stories.length} ({storyPct}%)</strong>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <span className="w-3 h-3 bg-amber-500 rounded-sm" />
                    <span>Engineering Tasks</span>
                  </div>
                  <strong className="text-slate-200 font-bold">{tasks.length} ({taskPct}%)</strong>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <span className="w-3 h-3 bg-rose-500 rounded-sm" />
                    <span>Defects / Bugs</span>
                  </div>
                  <strong className="text-slate-200 font-bold">{bugs.length} ({bugPct}%)</strong>
                </div>
              </div>
            </div>

            {/* SVG Interactive Donut drawing */}
            <div className="w-32 h-32 mx-auto shrink-0 flex items-center justify-center relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                {/* Background circle */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="6" />

                {/* Bug segment */}
                <circle
                  cx="21" cy="21" r="15.915"
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth="6"
                  strokeDasharray={`${bugPct} ${100 - bugPct}`}
                  strokeDashoffset="0"
                />

                {/* Task segment */}
                <circle
                  cx="21" cy="21" r="15.915"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="6"
                  strokeDasharray={`${taskPct} ${100 - taskPct}`}
                  strokeDashoffset={-bugPct}
                />

                {/* Story segment */}
                <circle
                  cx="21" cy="21" r="15.915"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeDasharray={`${storyPct} ${100 - storyPct}`}
                  strokeDashoffset={-(bugPct + taskPct)}
                />

                {/* Epic segment */}
                <circle
                  cx="21" cy="21" r="15.915"
                  fill="transparent"
                  stroke="#374151"
                  strokeWidth="6"
                  strokeDasharray={`${epicPct} ${100 - epicPct}`}
                  strokeDashoffset={-(bugPct + taskPct + storyPct)}
                />
              </svg>
              {/* Inner core display */}
              <div className="absolute text-center">
                <span className="block text-xl font-extrabold text-slate-200">{projectIssues.length}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Issues</span>
              </div>
            </div>

          </div>

        </div>

        {/* 3. VELOCITY BAR GRAPH (SVG COMPOSITE) */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xs">
          <h3 className="font-bold text-slate-200 text-sm mb-1">Sprint Velocity & Estimates</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed font-semibold">Comparison of total story points in each planned and active sprint, showing Done vs Total.</p>

          <div className="space-y-4">
            {velocityData.length === 0 ? (
              <p className="text-xs text-slate-500 italic font-semibold">Plan sprints in the Backlog to populate velocity tracking.</p>
            ) : (
              velocityData.map((data, index) => {
                const percentageDone = data.totalPoints > 0 ? (data.donePoints / data.totalPoints) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-200 font-bold">{data.name} ({data.status})</span>
                      <span className="text-slate-500">
                        <strong className="text-blue-600 font-bold">{data.donePoints} SP</strong> / {data.totalPoints} SP done
                      </span>
                    </div>

                    <div className="h-4.5 w-full bg-white/10 rounded-full overflow-hidden relative border border-white/10">
                      {/* total points range bar background */}
                      <div
                        style={{ width: `${Math.min(100, (data.totalPoints / 30) * 100)}%` }}
                        className="h-full bg-white/10"
                      >
                        {/* done segment */}
                        <div
                          style={{ width: `${percentageDone}%` }}
                          className="h-full bg-blue-500"
                        />
                      </div>

                      {/* fallback text */}
                      {data.totalPoints === 0 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-bold">0 story points planned</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. CHRONICLED WORK LOG TABLE */}
        <div className="bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4.5 border-b border-white/10 bg-white/10 text-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm tracking-tight text-slate-200">Work Log Diagnostic Audit</h3>
              <p className="text-[10px] text-slate-500 font-bold">Detailed logs submitted by team developers</p>
            </div>
            <span className="text-xs bg-blue-600 text-white font-bold px-3.5 py-1.5 rounded-full shadow-xs">
              {totalHoursLogged} Hrs Logged
            </span>
          </div>

          {allWorkLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic bg-white/10 font-semibold">
              No work hours have been logged yet. Open an issue drawer to log development hours!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/10 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Issue</th>
                    <th className="p-3.5">Developer</th>
                    <th className="p-3.5">Logged Time</th>
                    <th className="p-3.5">Activity Description</th>
                    <th className="p-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {allWorkLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/10 transition-colors">
                      <td className="p-3.5 font-bold text-blue-600 whitespace-nowrap">
                        {log.issueKey}
                      </td>
                      <td className="p-3.5 font-bold text-slate-200">
                        {log.author}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 bg-blue-600/10 border border-blue-600/20 text-blue-600 font-bold rounded-full">
                          {log.hoursLogged} hours
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 italic font-semibold">
                        "{log.description}"
                      </td>
                      <td className="p-3.5 text-slate-500 text-right whitespace-nowrap font-bold">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
