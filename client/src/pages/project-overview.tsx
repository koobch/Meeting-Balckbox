import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useProjectName } from "@/lib/project-context";
import { InlineEditableText } from "@/components/inline-editable-text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Lightbulb, 
  Calendar, 
  AlertCircle, 
  FileText, 
  Link2, 
  ChevronRight,
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
  SlidersHorizontal
} from "lucide-react";

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
}

interface EvidenceDrop {
  id: string;
  title: string;
  summary: string;
  source: string;
  addedAt: string;
}

interface CalendarDay {
  date: string;
  day: number;
  hasMeeting: boolean;
  meetingId: string | null;
  meetingTitle: string | null;
  todoStats: {
    total: number;
    completed: number;
  } | null;
}

const keywords = [
  "사용자 인터뷰",
  "시장 분석",
  "기술 검토",
  "UX 리서치",
  "경쟁사 분석",
  "MVP 정의",
  "로드맵",
  "KPI"
];

const decisions: DecisionData[] = [
  {
    id: "dec-1",
    title: "MVP 범위를 핵심 3개 기능으로 제한",
    description: "초기 출시 시간을 단축하기 위해 사용자 인증, 대시보드, 리포팅 기능만 포함하기로 결정",
    status: "integrated",
    strength: "strong",
    evidenceCount: 12,
    segmentCount: 8,
    createdAt: "2025-01-28",
    tags: ["MVP 정의", "로드맵"],
    hasLogicFlag: false
  },
  {
    id: "dec-2",
    title: "React + TypeScript 기술 스택 선정",
    description: "팀의 기술 역량과 생태계 지원을 고려하여 프론트엔드 기술 스택 결정",
    status: "integrated",
    strength: "strong",
    evidenceCount: 8,
    segmentCount: 5,
    createdAt: "2025-01-25",
    tags: ["기술 검토"],
    hasLogicFlag: false
  },
  {
    id: "dec-3",
    title: "B2B SaaS 비즈니스 모델 채택",
    description: "시장 조사 결과를 바탕으로 구독형 B2B 모델이 가장 적합하다고 판단",
    status: "draft",
    strength: "medium",
    evidenceCount: 6,
    segmentCount: 4,
    createdAt: "2025-01-30",
    tags: ["시장 분석", "경쟁사 분석"],
    hasLogicFlag: true
  }
];

const meetings: MeetingData[] = [
  {
    id: "meet-1",
    title: "사용자 인터뷰 결과 공유 미팅",
    date: "2025-01-29",
    participants: ["김연구", "이디자인", "박개발"],
    status: "integrated",
    strength: "strong",
    evidenceCount: 15,
    segmentCount: 22,
    keyPoints: ["핵심 페인포인트 3가지 도출", "우선순위 재정의 필요"],
    hasLogicFlag: false
  },
  {
    id: "meet-2",
    title: "스프린트 계획 회의",
    date: "2025-01-27",
    participants: ["박개발", "최PM", "정QA"],
    status: "draft",
    strength: "medium",
    evidenceCount: 4,
    segmentCount: 7,
    keyPoints: ["2주 스프린트 사이클 확정", "일일 스탠드업 10AM"],
    hasLogicFlag: true
  }
];

const gaps: GapData[] = [
  {
    id: "gap-1",
    title: "가격 정책에 대한 근거 부족",
    description: "경쟁사 대비 가격 책정 전략에 대한 데이터 검증이 필요함",
    status: "draft",
    strength: "weak",
    evidenceCount: 2,
    segmentCount: 1,
    priority: "high",
    relatedDecisions: ["B2B SaaS 비즈니스 모델 채택"],
    hasLogicFlag: true
  },
  {
    id: "gap-2",
    title: "확장성 테스트 미완료",
    description: "예상 사용자 수 대비 시스템 부하 테스트가 진행되지 않음",
    status: "draft",
    strength: "weak",
    evidenceCount: 1,
    segmentCount: 0,
    priority: "medium",
    relatedDecisions: ["React + TypeScript 기술 스택 선정"],
    hasLogicFlag: false
  }
];

const liveBrief = {
  currentGoal: "MVP 1차 버전 2월 15일까지 출시",
  latestDecision: "B2B SaaS 구독 모델 채택 검토 중",
  weeklyRisk: "가격 정책 근거 부족으로 출시 지연 가능성"
};

const actionItems: ActionItem[] = [
  { id: "act-1", title: "경쟁사 가격 조사 완료", assignee: "김연구", completed: true },
  { id: "act-2", title: "사용자 페르소나 문서 업데이트", assignee: "이디자인", completed: false },
  { id: "act-3", title: "API 스펙 문서 작성", assignee: "박개발", completed: false },
  { id: "act-4", title: "QA 테스트 계획 수립", assignee: "정QA", completed: false },
  { id: "act-5", title: "스프린트 회고 준비", assignee: "최PM", completed: true }
];

const evidenceDrops: EvidenceDrop[] = [
  {
    id: "ev-1",
    title: "2025 SaaS 시장 트렌드 리포트",
    summary: "B2B SaaS 시장 연 23% 성장 전망, AI 통합이 핵심 차별화 요소로 부상",
    source: "Gartner",
    addedAt: "2시간 전"
  },
  {
    id: "ev-2",
    title: "경쟁사 A사 신규 기능 출시",
    summary: "실시간 협업 기능 추가, 기존 대비 30% 가격 인상 없이 제공",
    source: "TechCrunch",
    addedAt: "5시간 전"
  },
  {
    id: "ev-3",
    title: "사용자 인터뷰 녹취록 #12",
    summary: "중소기업 PM 대상, 기존 도구의 복잡성이 가장 큰 불만 사항",
    source: "Internal",
    addedAt: "1일 전"
  }
];

function generateCalendarData(): CalendarDay[] {
  const year = 2025;
  const month = 0; // January
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  
  const meetingsMap: Record<number, { 
    meetingId: string; 
    meetingTitle: string;
    todoStats: { total: number; completed: number };
  }> = {
    6: { 
      meetingId: "m1", 
      meetingTitle: "킥오프 미팅",
      todoStats: { total: 3, completed: 3 }
    },
    10: { 
      meetingId: "m2", 
      meetingTitle: "기술 스택 논의",
      todoStats: { total: 4, completed: 4 }
    },
    15: { 
      meetingId: "m3", 
      meetingTitle: "사용자 리서치 리뷰",
      todoStats: { total: 5, completed: 2 }
    },
    20: { 
      meetingId: "m4", 
      meetingTitle: "MVP 범위 확정",
      todoStats: { total: 6, completed: 6 }
    },
    22: { 
      meetingId: "m5", 
      meetingTitle: "디자인 리뷰",
      todoStats: { total: 4, completed: 1 }
    },
    25: { 
      meetingId: "m6", 
      meetingTitle: "스프린트 계획",
      todoStats: { total: 3, completed: 0 }
    },
    29: { 
      meetingId: "m7", 
      meetingTitle: "가격 정책 논의",
      todoStats: { total: 5, completed: 0 }
    }
  };
  
  const days: CalendarDay[] = [];
  
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({
      date: "",
      day: 0,
      hasMeeting: false,
      meetingId: null,
      meetingTitle: null,
      todoStats: null
    });
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const meeting = meetingsMap[day];
    days.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
      hasMeeting: !!meeting,
      meetingId: meeting?.meetingId || null,
      meetingTitle: meeting?.meetingTitle || null,
      todoStats: meeting?.todoStats || null
    });
  }
  
  return days;
}

const calendarData = generateCalendarData();

function MeetingIntegrationCalendar({ projectId }: { projectId: string }) {
  const [, setLocation] = useLocation();
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  
  const getCompletionRate = (day: CalendarDay): number => {
    if (!day.todoStats || day.todoStats.total === 0) return 0;
    return (day.todoStats.completed / day.todoStats.total) * 100;
  };
  
  const getStatusColor = (day: CalendarDay) => {
    if (!day.hasMeeting || !day.todoStats) return "bg-muted/50 text-muted-foreground";
    const rate = getCompletionRate(day);
    if (rate === 100) return "bg-emerald-500 text-white";
    if (rate > 0) return "bg-amber-400 text-white";
    return "bg-red-500 text-white";
  };
  
  const getStatusLabel = (day: CalendarDay) => {
    if (!day.todoStats) return "";
    const rate = getCompletionRate(day);
    if (rate === 100) return "모든 할일 완료";
    if (rate > 0) return `${Math.round(rate)}% 완료`;
    return "미완료";
  };
  
  const handleDayClick = (day: CalendarDay) => {
    if (day.hasMeeting && day.meetingId) {
      setLocation(`/projects/${projectId}/meetings/${day.meetingId}`);
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
          <span className="text-xs text-muted-foreground">2025년 1월</span>
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
          {calendarData.map((day, index) => (
            day.day === 0 ? (
              <div key={`empty-${index}`} className="aspect-square" />
            ) : (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all ${getStatusColor(day)} ${day.hasMeeting ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary/50' : 'cursor-default'}`}
                    data-testid={`calendar-day-${day.day}`}
                    disabled={!day.hasMeeting}
                  >
                    {day.day}
                  </button>
                </TooltipTrigger>
                {day.hasMeeting && day.todoStats && (
                  <TooltipContent side="top" className="max-w-[200px] p-3">
                    <div className="space-y-1.5">
                      <p className="font-medium text-xs">{day.meetingTitle}</p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>할 일 {day.todoStats.completed}/{day.todoStats.total}개 완료</p>
                      </div>
                      <p className={`text-xs font-medium ${
                        getCompletionRate(day) === 100 ? 'text-emerald-600' :
                        getCompletionRate(day) > 0 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {getStatusLabel(day)}
                      </p>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            )
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">100% 완료</span>
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

function GapItem({ gap }: { gap: GapData }) {
  const priorityConfig = {
    high: { label: "높음", className: "bg-red-50 text-red-700 border-red-200" },
    medium: { label: "보통", className: "bg-amber-50 text-amber-700 border-amber-200" },
    low: { label: "낮음", className: "bg-slate-50 text-slate-600 border-slate-200" }
  };

  return (
    <div 
      className="p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer border border-border border-dashed" 
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
      <div className="flex items-center gap-2">
        <StrengthBadge strength={gap.strength} />
        {gap.hasLogicFlag && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs py-0">
            <TriangleAlert className="w-3 h-3 mr-1" />
            논리 검토
          </Badge>
        )}
      </div>
    </div>
  );
}

function LiveBriefCard() {
  return (
    <Card className="border-2 border-primary/20 bg-primary/5" data-testid="card-live-brief">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          라이브 요약
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">현재 목표</p>
          <p className="text-lg font-semibold text-foreground">{liveBrief.currentGoal}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">최신 결정</p>
          <p className="text-base text-foreground">{liveBrief.latestDecision}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">이번 주 리스크</p>
          <p className="text-base font-medium text-orange-600">{liveBrief.weeklyRisk}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionItemsCard() {
  const [items, setItems] = useState(actionItems);
  
  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <Card data-testid="card-action-items">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-600" />
          다음 할 일
          <Badge variant="secondary" className="ml-auto text-xs">
            {items.filter(i => i.completed).length}/{items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 max-h-[200px] overflow-y-auto">
          {items.map(item => (
            <li key={item.id} className="flex items-start gap-2">
              <Checkbox 
                id={item.id}
                checked={item.completed}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-0.5"
                data-testid={`checkbox-action-${item.id}`}
              />
              <label 
                htmlFor={item.id}
                className={`text-sm flex-1 cursor-pointer ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
              >
                {item.title}
                <span className="block text-xs text-muted-foreground">{item.assignee}</span>
              </label>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function DecisionIntegrityCard({ 
  activeFilter, 
  onFilterChange 
}: { 
  activeFilter: FilterType; 
  onFilterChange: (filter: FilterType) => void;
}) {
  const allItems = [...decisions, ...meetings, ...gaps];
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
            className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-all hover-elevate ${
              activeFilter === "weak" ? "bg-red-50 border border-red-200" : "hover:bg-muted"
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
            className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-all hover-elevate ${
              activeFilter === "logic-flags" ? "bg-yellow-50 border border-yellow-200" : "hover:bg-muted"
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
            className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-all hover-elevate ${
              activeFilter === "missing-evidence" ? "bg-orange-50 border border-orange-200" : "hover:bg-muted"
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

function EvidenceDropsCard() {
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
    { key: "weak" as const, label: "Weak only" },
    { key: "flags" as const, label: "Flags only" },
    { key: "integrated" as const, label: "Integrated only" }
  ];

  return (
    <div className="flex items-center gap-6 py-3 border-b border-border mb-6" data-testid="filter-sort-bar">
      <div className="flex items-center gap-1">
        <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground mr-1" />
        {toggleButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => onStatusFilterChange(statusFilter === btn.key ? null : btn.key)}
            className={`px-2.5 py-1 text-xs rounded-md transition-all ${
              statusFilter === btn.key
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
          className={`px-2.5 py-1 text-xs rounded-md transition-all ${
            sortType === "recent"
              ? "bg-foreground text-background font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          data-testid="sort-recent"
        >
          Recent
        </button>
        <button
          onClick={() => onSortChange("risk")}
          className={`px-2.5 py-1 text-xs rounded-md transition-all ${
            sortType === "risk"
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

export default function ProjectOverview() {
  const params = useParams<{ projectId: string }>();
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const [sortType, setSortType] = useState<SortType>("recent");
  const [visibility, setVisibility] = useState<CardVisibility>({ decisions: true, meetings: true });

  const getPriorityScore = (item: { strength: EvidenceStrength; hasLogicFlag?: boolean; priority?: string }) => {
    let score = 0;
    if (item.strength === "weak") score += 3;
    else if (item.strength === "medium") score += 2;
    if (item.hasLogicFlag) score += 2;
    if (item.priority === "high") score += 3;
    else if (item.priority === "medium") score += 1;
    return score;
  };

  const filterAndSortItems = <T extends { 
    strength: EvidenceStrength; 
    evidenceCount: number; 
    hasLogicFlag?: boolean;
    status: Status;
    createdAt?: string;
    date?: string;
    priority?: string;
  }>(items: T[]): T[] => {
    let result = [...items];
    
    if (activeFilter) {
      switch (activeFilter) {
        case "weak":
          result = result.filter(item => item.strength === "weak");
          break;
        case "logic-flags":
          result = result.filter(item => item.hasLogicFlag);
          break;
        case "missing-evidence":
          result = result.filter(item => item.evidenceCount < 3);
          break;
      }
    }

    if (statusFilter) {
      switch (statusFilter) {
        case "weak":
          result = result.filter(item => item.strength === "weak");
          break;
        case "flags":
          result = result.filter(item => item.hasLogicFlag);
          break;
        case "integrated":
          result = result.filter(item => item.status === "integrated");
          break;
      }
    }

    if (sortType === "recent") {
      result.sort((a, b) => {
        const dateA = a.createdAt || a.date || "";
        const dateB = b.createdAt || b.date || "";
        return dateB.localeCompare(dateA);
      });
    } else {
      result.sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
    }

    return result;
  };

  const filteredDecisions = useMemo(() => 
    visibility.decisions ? filterAndSortItems(decisions) : [], 
    [activeFilter, statusFilter, sortType, visibility.decisions]
  );
  
  const filteredMeetings = useMemo(() => 
    visibility.meetings ? filterAndSortItems(meetings) : [], 
    [activeFilter, statusFilter, sortType, visibility.meetings]
  );
  
  const filteredGaps = useMemo(() => 
    filterAndSortItems(gaps), 
    [activeFilter, statusFilter, sortType]
  );

  const hasResults = filteredDecisions.length > 0 || filteredMeetings.length > 0 || filteredGaps.length > 0;
  const hasActiveFilters = activeFilter !== null || statusFilter !== null;
  
  const [projectName, setProjectName] = useProjectName(params.projectId || "1");
  
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
      
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="space-y-4" data-testid="section-top-row">
          <div className="grid grid-cols-2 gap-4">
            <LiveBriefCard />
            <ActionItemsCard />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MeetingIntegrationCalendar projectId={params.projectId || "1"} />
            <Card data-testid="card-gaps">
              <CardHeader className="py-3 px-4 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  보완 필요 항목
                  <Badge variant="secondary" className="ml-2">{gaps.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {gaps.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto" data-testid="list-gaps">
                    {gaps.map(gap => (
                      <GapItem key={gap.id} gap={gap} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">보완 필요 항목이 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
