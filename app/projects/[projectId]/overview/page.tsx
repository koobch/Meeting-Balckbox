"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectName } from "@/lib/project-context";
import { InlineEditableText } from "@/components/inline-editable-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Lightbulb,
  Calendar,
  AlertCircle,
  FileText,
  Link2,
  ChevronRight,
  ChevronLeft,
  Zap,
  Target,
  CheckSquare,
  Shield,
  Inbox,
  X,
  TriangleAlert,
  CircleSlash,
  ExternalLink,
  ArrowUpDown,
  SlidersHorizontal,
  Loader2,
  Check,
  Database,
  Info,
  User,
  Clock
} from "lucide-react";
import { getProjectOverview, getProjectById, updateActionItemStatus } from "@/app/actions/meetings";
import { useToast } from "@/hooks/use-toast";

type Status = "draft" | "integrated";
type EvidenceStrength = "strong" | "medium" | "weak";
type FilterType = "weak" | "logic-flags" | "missing-evidence" | null;
type StatusFilter = "weak" | "flags" | "integrated" | null;
type SortType = "recent" | "risk";
type CardVisibility = { decisions: boolean; meetings: boolean };

interface DecisionData {
  id: string;
  title: string;
  description: string;
  status: Status;
  strength: EvidenceStrength;
  evidenceCount: number;
  segmentCount: number;
  createdAt: string;
  tags: string[];
  hasLogicFlag?: boolean;
}

interface MeetingData {
  id: string;
  title: string;
  date: string;
  participants: string[];
  status: Status;
  strength: EvidenceStrength;
  evidenceCount: number;
  segmentCount: number;
  keyPoints: string[];
  hasLogicFlag?: boolean;
}

interface GapData {
  id: string;
  title: string;
  description: string;
  status: Status;
  strength: EvidenceStrength;
  evidenceCount: number;
  segmentCount: number;
  priority: "high" | "medium" | "low";
  relatedDecisions: string[];
  hasLogicFlag?: boolean;
}

interface ActionItem {
  id: string;
  title: string;
  assignee: string;
  completed: boolean;
  createdAt: string;
}

interface EvidenceDrop {
  id: string;
  title: string;
  summary: string;
  source: string;
  addedAt: string;
}

interface CalendarMeeting {
  id: string;
  title: string;
  todoStats: {
    total: number;
    completed: number;
  };
}

interface CalendarDay {
  date: string;
  day: number;
  hasMeeting: boolean;
  meetings: CalendarMeeting[];
}

interface ProjectInfo {
  name: string;
  description: string;
  team_lead: string;
  created_at: string;
}

// Hardcoded data removed - now handled by state

function generateCalendarData(year: number, month: number, meetingsData: any): CalendarDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const meetingsMap = (meetingsData && meetingsData[`${year}-${month}`]) || {};

  const days: CalendarDay[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({
      date: "",
      day: 0,
      hasMeeting: false,
      meetings: []
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayMeetings = meetingsMap[day] || [];
    days.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
      hasMeeting: dayMeetings.length > 0,
      meetings: dayMeetings
    });
  }

  return days;
}

function MeetingIntegrationCalendar({ projectId, meetingsData }: { projectId: string; meetingsData: any }) {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const calendarData = useMemo(() => generateCalendarData(currentYear, currentMonth, meetingsData), [currentYear, currentMonth, meetingsData]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDayStats = (day: CalendarDay) => {
    let total = 0;
    let completed = 0;
    day.meetings.forEach(m => {
      total += m.todoStats.total;
      completed += m.todoStats.completed;
    });
    return { total, completed };
  };

  const getCompletionRate = (day: CalendarDay): number => {
    const stats = getDayStats(day);
    if (stats.total === 0) return 100; // No todos means effectively complete
    return (stats.completed / stats.total) * 100;
  };

  const getStatusColor = (day: CalendarDay) => {
    if (!day.hasMeeting) return "bg-muted/50 text-muted-foreground";
    const stats = getDayStats(day);
    if (stats.total === 0) return "bg-emerald-500 text-white"; // Meeting exists but no tasks

    const rate = getCompletionRate(day);
    if (rate === 100) return "bg-emerald-500 text-white";
    if (rate > 0) return "bg-amber-400 text-white";
    return "bg-red-500 text-white";
  };

  const getStatusLabel = (day: CalendarDay) => {
    if (!day.hasMeeting) return "";
    const stats = getDayStats(day);
    if (stats.total === 0) return "회의 완료 (할 일 없음)";

    const rate = getCompletionRate(day);
    if (rate === 100) return "모든 할 일 완료";
    if (rate > 0) return `${Math.round(rate)}% 완료`;
    return "미완료";
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.hasMeeting && day.meetings.length === 1) {
      router.push(`/projects/${projectId}/meetings/${day.meetings[0].id}`);
    }
  };

  return (
    <Card data-testid="card-meeting-calendar">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            진행 사항 확인 캘린더
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[70px] text-center">{currentYear}년 {currentMonth + 1}월</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              data-testid="button-next-month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((day: CalendarDay, index: number) => {
            if (day.day === 0) return <div key={`empty-${index}`} className="aspect-square" />;

            const mainButton = (
              <button
                onClick={() => handleDayClick(day)}
                className={`aspect-square w-full rounded-md flex items-center justify-center text-xs font-medium transition-all ${getStatusColor(day)} ${day.hasMeeting ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary/50' : 'cursor-default'}`}
                data-testid={`calendar-day-${day.day}`}
                disabled={!day.hasMeeting}
              >
                {day.day}
              </button>
            );

            return (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  {day.hasMeeting && day.meetings.length > 1 ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        {mainButton}
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold px-2 py-1 mb-1 border-b">회의 선택 ({day.meetings.length}건)</p>
                          {day.meetings.map(m => (
                            <button
                              key={m.id}
                              onClick={() => router.push(`/projects/${projectId}/meetings/${m.id}`)}
                              className="w-full text-left text-xs p-2 hover:bg-muted rounded-md transition-colors flex flex-col gap-0.5"
                            >
                              <span className="font-medium truncate">{m.title}</span>
                              <span className="text-[10px] text-muted-foreground">
                                할 일 {m.todoStats.completed}/{m.todoStats.total} 완료
                              </span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : mainButton}
                </TooltipTrigger>
                {day.hasMeeting && (
                  <TooltipContent side="top" className="max-w-[200px] p-3">
                    <div className="space-y-1.5">
                      {day.meetings.length === 1 ? (
                        <>
                          <p className="font-medium text-xs">{day.meetings[0].title}</p>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p>할 일 {day.meetings[0].todoStats.completed}/{day.meetings[0].todoStats.total}개 완료</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-xs">회의 {day.meetings.length}건</p>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {day.meetings.slice(0, 3).map(m => (
                              <p key={m.id} className="truncate">• {m.title}</p>
                            ))}
                            {day.meetings.length > 3 && <p className="text-[10px]">...외 {day.meetings.length - 3}건</p>}
                          </div>
                        </>
                      )}
                      <p className={`text-xs font-medium ${getCompletionRate(day) === 100 ? 'text-emerald-600' :
                        getCompletionRate(day) > 0 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                        {getStatusLabel(day)}
                      </p>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-400" />
            <span className="text-muted-foreground">진행 중</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">미완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-muted/50 border border-border" />
            <span className="text-muted-foreground">회의 없음</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant={status === "integrated" ? "default" : "outline"}
      className={status === "integrated"
        ? "bg-emerald-500 text-white border-transparent"
        : "text-muted-foreground"
      }
      data-testid={`badge-status-${status}`}
    >
      {status === "integrated" ? "반영됨" : "초안"}
    </Badge>
  );
}

function StrengthBadge({ strength }: { strength: EvidenceStrength }) {
  const config = {
    strong: { label: "강함", className: "bg-blue-50 text-blue-700 border-blue-200" },
    medium: { label: "보통", className: "bg-amber-50 text-amber-700 border-amber-200" },
    weak: { label: "약함", className: "bg-red-50 text-red-700 border-red-200" }
  };

  return (
    <Badge
      variant="outline"
      className={config[strength].className}
      data-testid={`badge-strength-${strength}`}
    >
      <Zap className="w-3 h-3 mr-1" />
      {config[strength].label}
    </Badge>
  );
}

function MetaInfo({ evidenceCount, segmentCount }: { evidenceCount: number; segmentCount: number }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <FileText className="w-3.5 h-3.5" />
        근거 {evidenceCount}개
      </span>
      <span className="flex items-center gap-1">
        <Link2 className="w-3.5 h-3.5" />
        세그먼트 {segmentCount}개
      </span>
    </div>
  );
}

function DecisionCard({ decision }: { decision: DecisionData }) {
  return (
    <Card className="hover-elevate cursor-pointer transition-all" data-testid={`card-decision-${decision.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">Decision</span>
              <h3 className="text-base font-semibold text-foreground leading-tight">{decision.title}</h3>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{decision.description}</p>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <StatusBadge status={decision.status} />
          <StrengthBadge strength={decision.strength} />
          {decision.hasLogicFlag && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <TriangleAlert className="w-3 h-3 mr-1" />
              논리 검토
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <MetaInfo evidenceCount={decision.evidenceCount} segmentCount={decision.segmentCount} />
          <span className="text-xs text-muted-foreground">{decision.createdAt}</span>
        </div>
        {decision.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
            {decision.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MeetingCard({ meeting }: { meeting: MeetingData }) {
  return (
    <Card className="hover-elevate cursor-pointer transition-all" data-testid={`card-meeting-${meeting.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-violet-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-violet-600 uppercase tracking-wide">Meeting</span>
              <h3 className="text-base font-semibold text-foreground leading-tight">{meeting.title}</h3>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <span>{meeting.date}</span>
          <span className="text-border">•</span>
          <span>{meeting.participants.length}명 참여</span>
        </div>
        <ul className="text-sm text-muted-foreground mb-4 space-y-1">
          {meeting.keyPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
              {point}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <StatusBadge status={meeting.status} />
          <StrengthBadge strength={meeting.strength} />
          {meeting.hasLogicFlag && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <TriangleAlert className="w-3 h-3 mr-1" />
              논리 검토
            </Badge>
          )}
        </div>
        <MetaInfo evidenceCount={meeting.evidenceCount} segmentCount={meeting.segmentCount} />
      </CardContent>
    </Card>
  );
}

function GapItem({ gap, onComplete }: { gap: GapData; onComplete: (id: string) => void }) {
  const priorityConfig = {
    high: { label: "높음", className: "bg-red-50 text-red-700 border-red-200" },
    medium: { label: "보통", className: "bg-amber-50 text-amber-700 border-amber-200" },
    low: { label: "낮음", className: "bg-slate-50 text-slate-600 border-slate-200" }
  };

  return (
    <div
      className="p-3 rounded-md hover-elevate transition-colors border border-border border-dashed overflow-visible"
      data-testid={`card-gap-${gap.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <h3 className="text-sm font-medium text-foreground">{gap.title}</h3>
        </div>
        <Badge variant="outline" className={`text-xs ${priorityConfig[gap.priority].className}`}>
          {priorityConfig[gap.priority].label}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{gap.description}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StrengthBadge strength={gap.strength} />
          {gap.hasLogicFlag && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs py-0">
              <TriangleAlert className="w-3 h-3 mr-1" />
              논리 검토
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onComplete(gap.id)}
          data-testid={`button-complete-gap-${gap.id}`}
        >
          <CheckSquare className="w-3.5 h-3.5 mr-1" />
          보완 완료
        </Button>
      </div>
    </div>
  );
}

// OLD: LiveBriefCard removed as per user request
/*
function LiveBriefCard({ meetings }: { meetings: MeetingData[] }) {
  ...
}
*/

function ProjectInfoCard({ projectInfo }: { projectInfo: ProjectInfo | null }) {
  if (!projectInfo) return null;

  return (
    <Card className="border-2 border-primary/20 bg-primary/5" data-testid="card-project-info">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Info className="w-5 h-5 text-white" />
          </div>
          프로젝트 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> 프로젝트명
          </p>
          <p className="text-lg font-semibold text-foreground">{projectInfo.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> 프로젝트 설명
          </p>
          <p className="text-sm text-foreground line-clamp-3">{projectInfo.description || "설명이 없습니다."}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 팀 리드
            </p>
            <p className="text-sm font-medium text-foreground">{projectInfo.team_lead || "미지정"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> 등록일
            </p>
            <p className="text-sm font-medium text-foreground">
              {projectInfo.created_at ? new Date(projectInfo.created_at).toLocaleDateString('ko-KR') : "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionItemsCard({
  actionItems,
  onToggle
}: {
  actionItems: ActionItem[];
  onToggle: (id: string | number) => Promise<void>;
}) {
  const sortedItems = useMemo(() => {
    return [...actionItems].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [actionItems]);

  return (
    <Card data-testid="card-action-items" className="flex flex-col h-full border-none shadow-sm bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          </div>
          다음 할 일
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 h-5">
            {actionItems.filter(i => i.completed).length}/{actionItems.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {sortedItems.length > 0 ? (
            sortedItems.map(item => (
              <li key={item.id} className="flex items-start gap-2 group">
                <Checkbox
                  id={item.id}
                  checked={item.completed}
                  onCheckedChange={() => onToggle(item.id)}
                  disabled={item.completed}
                  className="mt-0.5"
                  data-testid={`checkbox-action-${item.id}`}
                />
                <label
                  htmlFor={item.id}
                  className={`text-sm flex-1 cursor-pointer transition-colors ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground hover:text-primary'}`}
                >
                  {item.title}
                </label>
              </li>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Inbox className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs">할 일이 없습니다.</p>
            </div>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function DecisionIntegrationCard({ decisions }: { decisions: DecisionData[] }) {
  const pendingDecisions = useMemo(() =>
    decisions.filter(d => d.status === "draft"),
    [decisions]
  );

  return (
    <Card className="flex flex-col h-full border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="py-3 px-4 border-b border-border/50 bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/30">
            <Lightbulb className="w-4 h-4 text-blue-600" />
          </div>
          통합 완료 항목
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 h-5 bg-blue-50 text-blue-700 border-blue-100">
            {pendingDecisions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        {pendingDecisions.length > 0 ? (
          <div className="divide-y divide-border/40 max-h-[400px] overflow-y-auto scrollbar-thin">
            {pendingDecisions.map((decision) => (
              <div key={decision.id} className="group p-4 hover:bg-muted/30 transition-all relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {decision.title}
                    </p>
                    <Badge variant="outline" className="text-[9px] font-normal py-0 px-1 whitespace-nowrap opacity-60">
                      {decision.createdAt}
                    </Badge>
                  </div>
                  {decision.description && (
                    <div className="relative">
                      <p className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-muted">
                        {decision.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Zap className="w-10 h-10 text-blue-400 mb-2 opacity-20" />
            <p className="text-sm">통합 대기 중인 항목이 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// OLD Components preserved but unused in current simplified view
/*
function DecisionIntegrityCard({
  activeFilter,
  onFilterChange,
  gapsData,
  decisions,
  meetings
}: {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  gapsData: GapData[];
  decisions: DecisionData[];
  meetings: MeetingData[];
}) {
  const allItems = [...decisions, ...meetings, ...gapsData];
  const weakCount = allItems.filter(item => item.strength === "weak").length;
  const logicFlagCount = allItems.filter(item => item.hasLogicFlag).length;
  const missingEvidenceCount = allItems.filter(item => item.evidenceCount < 3).length;

  const handleClick = (filter: FilterType) => {
    onFilterChange(activeFilter === filter ? null : filter);
  };

  return (
    <Card data-testid="card-decision-integrity">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          Decision Integrity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <button
            onClick={() => handleClick("weak")}
            className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-all hover-elevate ${activeFilter === "weak" ? "bg-red-50 border border-red-200" : "hover:bg-muted"
              }`}
            data-testid="filter-weak"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-red-500" />
              <span className={activeFilter === "weak" ? "text-red-700 font-medium" : "text-foreground"}>
                Weak Evidence
              </span>
            </span>
            <Badge variant="secondary" className={activeFilter === "weak" ? "bg-red-100 text-red-700" : ""}>
              {weakCount}
            </Badge>
          </button>

          <button
            onClick={() => handleClick("logic-flags")}
            className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-all hover-elevate ${activeFilter === "logic-flags" ? "bg-yellow-50 border border-yellow-200" : "hover:bg-muted"
              }`}
            data-testid="filter-logic-flags"
          >
            <span className="flex items-center gap-2">
              <TriangleAlert className="w-3.5 h-3.5 text-yellow-600" />
              <span className={activeFilter === "logic-flags" ? "text-yellow-700 font-medium" : "text-foreground"}>
                Logic Flags
              </span>
            </span>
            <Badge variant="secondary" className={activeFilter === "logic-flags" ? "bg-yellow-100 text-yellow-700" : ""}>
              {logicFlagCount}
            </Badge>
          </button>

          <button
            onClick={() => handleClick("missing-evidence")}
            className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-all hover-elevate ${activeFilter === "missing-evidence" ? "bg-orange-50 border border-orange-200" : "hover:bg-muted"
              }`}
            data-testid="filter-missing-evidence"
          >
            <span className="flex items-center gap-2">
              <CircleSlash className="w-3.5 h-3.5 text-orange-500" />
              <span className={activeFilter === "missing-evidence" ? "text-orange-700 font-medium" : "text-foreground"}>
                Missing Evidence
              </span>
            </span>
            <Badge variant="secondary" className={activeFilter === "missing-evidence" ? "bg-orange-100 text-orange-700" : ""}>
              {missingEvidenceCount}
            </Badge>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceDropsCard({meetings}: {meetings: MeetingData[] }) {
  const evidenceDrops: EvidenceDrop[] = meetings.map(m => ({
    id: `ev-${m.id}`,
    title: `${m.title} 녹취록`,
    summary: (m.keyPoints || []).join(', ').substring(0, 100),
    source: "Internal",
    addedAt: m.date
  })).slice(0, 5);

  return (
    <Card data-testid="card-evidence-drops">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Inbox className="w-4 h-4 text-violet-600" />
          Evidence Drops
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {evidenceDrops.map(evidence => (
            <li key={evidence.id} className="group" data-testid={`evidence-drop-${evidence.id}`}>
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer">
                  {evidence.title}
                </h4>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{evidence.summary}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-primary">{evidence.source}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{evidence.addedAt}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function FilterSortBar({
  statusFilter,
  onStatusFilterChange,
  sortType,
  onSortChange,
  visibility,
  onVisibilityChange
}: {
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  sortType: SortType;
  onSortChange: (sort: SortType) => void;
  visibility: CardVisibility;
  onVisibilityChange: (visibility: CardVisibility) => void;
}) {
  const toggleButtons = [
    {key: "weak" as const, label: "Weak only" },
    {key: "flags" as const, label: "Flags only" },
    {key: "integrated" as const, label: "Integrated only" }
  ];

  return (
    <div className="flex items-center gap-6 py-3 border-b border-border mb-6" data-testid="filter-sort-bar">
      <div className="flex items-center gap-1">
        <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground mr-1" />
        {toggleButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => onStatusFilterChange(statusFilter === btn.key ? null : btn.key)}
            className={`px-2.5 py-1 text-xs rounded-md transition-all ${statusFilter === btn.key
              ? "bg-foreground text-background font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            data-testid={`filter-${btn.key}`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-1">
        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground mr-1" />
        <button
          onClick={() => onSortChange("recent")}
          className={`px-2.5 py-1 text-xs rounded-md transition-all ${sortType === "recent"
            ? "bg-foreground text-background font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          data-testid="sort-recent"
        >
          Recent
        </button>
        <button
          onClick={() => onSortChange("risk")}
          className={`px-2.5 py-1 text-xs rounded-md transition-all ${sortType === "risk"
            ? "bg-foreground text-background font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          data-testid="sort-risk"
        >
          Risk first
        </button>
      </div>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={visibility.decisions}
            onCheckedChange={(checked) => onVisibilityChange({ ...visibility, decisions: !!checked })}
            className="w-3.5 h-3.5"
            data-testid="toggle-decisions"
          />
          <span className={`text-xs ${visibility.decisions ? "text-foreground" : "text-muted-foreground"}`}>
            Decisions
          </span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={visibility.meetings}
            onCheckedChange={(checked) => onVisibilityChange({ ...visibility, meetings: !!checked })}
            className="w-3.5 h-3.5"
            data-testid="toggle-meetings"
          />
          <span className={`text-xs ${visibility.meetings ? "text-foreground" : "text-muted-foreground"}`}>
            Meetings
          </span>
        </label>
      </div>
    </div>
  );
}
*/

export default function ProjectOverview() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  // OLD: Filters and sort types removed to simplify overview
  /*
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const [sortType, setSortType] = useState<SortType>("recent");
  const [visibility, setVisibility] = useState<CardVisibility>({decisions: true, meetings: true });
  */

  const [decisionsState, setDecisionsState] = useState<DecisionData[]>([]);
  const [meetingsState, setMeetingsState] = useState<MeetingData[]>([]);
  const [gapsData, setGapsData] = useState<GapData[]>([]);
  const [actionItemsState, setActionItemsState] = useState<ActionItem[]>([]);
  const [meetingsCalendarData, setMeetingsCalendarData] = useState<any>({});
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [projectName, setProjectName] = useProjectName(projectId || "1");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchOverview() {
      if (!projectId) return;
      setIsLoading(true);
      try {
        const result = await getProjectOverview(projectId);
        if (result.success && result.data) {
          const { meetings, decisions, actionItems, logicGaps } = result.data;

          setMeetingsState(meetings.map((m: any) => ({
            id: m.id,
            title: m.title,
            date: m.meeting_date ? new Date(m.meeting_date).toISOString().split('T')[0] : "-",
            participants: m.participants || [],
            status: "integrated",
            strength: "strong",
            evidenceCount: 1,
            segmentCount: 5,
            keyPoints: m.topics || [],
            hasLogicFlag: false
          })));

          setDecisionsState(decisions.map((d: any) => ({
            id: d.id,
            title: d.content,
            description: d.reasoning || "",
            status: d.is_integrated ? "integrated" : "draft",
            strength: "strong",
            evidenceCount: 1,
            segmentCount: 1,
            createdAt: new Date(d.created_at).toISOString().split('T')[0],
            tags: [],
            hasLogicFlag: false
          })));

          setGapsData(logicGaps.map((g: any) => ({
            id: g.id,
            title: g.claim,
            description: g.gap,
            status: g.review_status === "done" ? "integrated" : "draft",
            strength: "weak",
            evidenceCount: 1,
            segmentCount: 0,
            priority: "high",
            relatedDecisions: [],
            hasLogicFlag: true
          })));

          setActionItemsState(actionItems.map((ai: any) => ({
            id: ai.id,
            title: ai.task,
            assignee: ai.assignee || "미지정",
            completed: ai.status === "done",
            createdAt: ai.created_at
          })));

          // Format meetings for calendar (Robust string-based parsing)
          const cal: any = {};
          if (Array.isArray(meetings)) {
            meetings.forEach((m: any) => {
              if (m.meeting_date && typeof m.meeting_date === 'string') {
                try {
                  const datePart = m.meeting_date.split('T')[0];
                  const parts = datePart.split('-');
                  if (parts.length === 3) {
                    const y = parseInt(parts[0]);
                    const mm = parseInt(parts[1]);
                    const dd = parseInt(parts[2]);

                    if (!isNaN(y) && !isNaN(mm) && !isNaN(dd)) {
                      const key = `${y}-${mm - 1}`; // JS month is 0-indexed
                      if (!cal[key]) cal[key] = {};
                      if (!cal[key][dd]) cal[key][dd] = [];

                      const meetingActions = (actionItems || []).filter((ai: any) =>
                        String(ai.meeting_id) === String(m.id)
                      );

                      cal[key][dd].push({
                        id: String(m.id),
                        title: m.title || "제목 없음",
                        todoStats: {
                          total: meetingActions.length,
                          completed: meetingActions.filter((ai: any) => ai.status === "done").length
                        }
                      });
                    }
                  }
                } catch (e) {
                  console.error("Error processing calendar data:", e);
                }
              }
            });
          }
          setMeetingsCalendarData(cal);

          // 5. Fetch project master data
          const projectResult = await getProjectById(projectId);
          if (projectResult.success && projectResult.data) {
            setProjectInfo(projectResult.data as ProjectInfo);
          }
        }
      } catch (error) {
        console.error("Failed to load overview:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOverview();
  }, [projectId]);

  const handleCompleteGap = (gapId: string) => {
    setGapsData(prev => prev.filter(gap => gap.id !== gapId));
  };

  const handleToggleActionItem = async (id: string | number) => {
    // Optimistic Update
    const originalItems = [...actionItemsState];
    setActionItemsState(prev => prev.map(item =>
      item.id === id ? { ...item, completed: true } : item
    ));

    try {
      const result = await updateActionItemStatus(id.toString(), "done");
      if (!result.success) throw new Error(result.error);

      toast({
        title: "할 일 완료",
        description: "상태가 업데이트되었습니다."
      });
    } catch (error: any) {
      console.error("Failed to update action item:", error);
      // Rollback
      setActionItemsState(originalItems);
      toast({
        title: "업데이트 실패",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // OLD: Filter and Sort logic removed for simplified overview
  /*
  const getPriorityScore = ...
  const filterAndSortItems = ...
  const filteredDecisions = ...
  const filteredMeetings = ...
  const filteredGaps = ...
  const hasResults = ...
  const hasActiveFilters = ...
  */

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <header className="flex-shrink-0 border-b border-border bg-muted/30">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-project-title">
            <InlineEditableText
              value={projectName}
              onSave={setProjectName}
              testId="text-project-name"
            />
          </h1>
          <p className="text-sm text-muted-foreground">Overview</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 py-6 font-sans">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="animate-pulse">프로젝트 데이터를 분석하는 중입니다...</p>
          </div>
        ) : (
          <div className="space-y-6" data-testid="section-top-row">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProjectInfoCard projectInfo={projectInfo} />
              <ActionItemsCard
                actionItems={actionItemsState}
                onToggle={handleToggleActionItem}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="section-bottom-row">
              <MeetingIntegrationCalendar projectId={projectId || "1"} meetingsData={meetingsCalendarData} />
              <DecisionIntegrationCard decisions={decisionsState} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
