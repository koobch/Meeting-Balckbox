'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { saveRecentMeeting } from "@/components/app-shell";
import { useProjectName } from "@/lib/project-context";
import { useProjectMemory, MemoryItem } from "@/lib/project-memory-context";
import { InlineEditableText } from "@/components/inline-editable-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Clock,
  Users,
  MessageSquare,
  ListChecks,
  FileText,
  Bookmark,
  MoreHorizontal,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Check,
  CheckSquare,
  X,
  UserCog,
  Inbox,
  ExternalLink,
  Circle,
  CircleDot,
  Database,
  Settings,
  Calendar,
  Loader2
} from "lucide-react";
import { getMeetingDetails } from "@/app/actions/meetings";

type LogicMarkType = "leap" | "missing" | "ambiguous";

interface LogicMark {
  type: LogicMarkType;
  findingId: string;
}

interface TranscriptLine {
  id: string;
  speaker: string;
  speakerColor: string;
  timestamp: string;
  text: string;
  isHighlight?: boolean;
  logicMark?: LogicMark;
}

interface Topic {
  id: string;
  topic: string;
  timestamp: string;
}

interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  completed: boolean;
  dueDate?: string;
  priority?: string;
}

interface ParagraphSummary {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  summary: string;
}

interface DecisionSummary {
  id: string;
  title: string;
  status: "confirmed" | "deferred" | "pending";
  integrationStatus: "integrated" | "partial" | "not";
}

interface LogicFinding {
  id: string;
  type: LogicMarkType;
  claim: string;
  given: string;
  gap: string;
  suggestedQuestion: string;
  relatedLineIds: string[];
}

type FindingResearchState = "idle" | "loading" | "done" | "error";

const speakerColors: Record<string, string> = {
  "Speaker 0": "bg-blue-500",
  "Speaker 1": "bg-violet-500",
  "Speaker 2": "bg-emerald-500",
  "Speaker 3": "bg-amber-500",
  "Speaker 4": "bg-rose-500",
  "Speaker 5": "bg-orange-500"
};

const logicMarkConfig: Record<LogicMarkType, { label: string; description: string; className: string }> = {
  leap: {
    label: "leap",
    description: "논리적 도약",
    className: "bg-slate-100 text-slate-500 border-slate-200"
  },
  missing: {
    label: "missing",
    description: "근거 부족",
    className: "bg-slate-100 text-slate-500 border-slate-200"
  },
  ambiguous: {
    label: "ambiguous",
    description: "모호한 표현",
    className: "bg-slate-100 text-slate-500 border-slate-200"
  }
};

export default function MeetingDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params.projectId as string);
  const meetingId = (params.meetingId as string);

  const [isLoading, setIsLoading] = useState(true);
  const [meetingData, setMeetingData] = useState<any>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [actionItemsState, setActionItemsState] = useState<ActionItem[]>([]);
  const [decisionSummariesState, setDecisionSummariesState] = useState<DecisionSummary[]>([]);
  const [paragraphSummaries, setParagraphSummaries] = useState<ParagraphSummary[]>([]);

  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedFinding, setHighlightedFinding] = useState<string | null>(null);
  const [selectedFindingIndex, setSelectedFindingIndex] = useState(0);
  const [role, setRole] = useState<"lead" | "member">("lead");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [projectName, setProjectName] = useProjectName(projectId);

  const [selectedDecisions, setSelectedDecisions] = useState<Set<string>>(new Set());
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [commitSuccess, setCommitSuccess] = useState(false);
  const [decisionsSelectMode, setDecisionsSelectMode] = useState(false);
  const [actionsSelectMode, setActionsSelectMode] = useState(false);

  const [newDecisionText, setNewDecisionText] = useState("");
  const [newActionText, setNewActionText] = useState("");

  const [logicFindingsState, setLogicFindingsState] = useState<LogicFinding[]>([]);
  const [findingResearchStates, setFindingResearchStates] = useState<Record<string, FindingResearchState>>({});
  const [findingLoadingDots, setFindingLoadingDots] = useState<Record<string, number>>({});

  const parseTranscript = (raw: string | null): TranscriptLine[] => {
    if (!raw) return [];
    const lines = raw.split(/\n\n|\n/);
    return lines.filter(l => l.trim()).map((line, idx) => {
      const match = line.match(/^\[(\d{2}:\d{2})\]\s+(Speaker\s+\d+):\s+(.*)$/);
      if (match) {
        const [, timestamp, speaker, text] = match;
        return {
          id: `t-${idx}`,
          speaker,
          speakerColor: speakerColors[speaker] || "bg-slate-400",
          timestamp,
          text
        };
      }
      return {
        id: `t-${idx}`,
        speaker: "Unknown",
        speakerColor: "bg-slate-400",
        timestamp: "00:00",
        text: line
      };
    });
  };

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMeetingDetails(meetingId);
      if (result.success && result.data) {
        const { meeting, decisions, actionItems } = result.data;
        setMeetingData(meeting);
        setMeetingTitle(meeting.title);
        setTranscript(parseTranscript(meeting.transcript_with_speakers));

        // Parse Topics JSON
        let rawTopics = meeting.topics || [];
        if (rawTopics.length === 1 && typeof rawTopics[0] === 'string' && rawTopics[0].startsWith('[')) {
          try { rawTopics = JSON.parse(rawTopics[0]); } catch (e) { }
        }

        setTopics((rawTopics || []).map((t: any, idx: number) => {
          if (typeof t === 'string' && t.startsWith('{')) {
            try {
              const parsed = JSON.parse(t);
              return { id: `topic-${idx}`, ...parsed };
            } catch (e) {
              return { id: `topic-${idx}`, topic: t, timestamp: "00:00" };
            }
          }
          return {
            id: `topic-${idx}`,
            topic: t.topic || t.title || t,
            timestamp: t.timestamp || t.start_time || "00:00"
          };
        }));

        setActionItemsState(actionItems.map((ai: any) => ({
          id: ai.id,
          task: ai.task,
          assignee: ai.assignee || "미지정",
          completed: ai.status === "completed",
          dueDate: ai.due_date,
          priority: ai.priority
        })));

        setDecisionSummariesState(decisions.map((d: any) => ({
          id: d.id,
          title: d.content,
          status: "confirmed",
          integrationStatus: d.is_integrated ? "integrated" : "not"
        })));

        // Parse Timeline Summary JSON
        if (meeting.timeline_summary) {
          try {
            const parsed = JSON.parse(meeting.timeline_summary);
            if (Array.isArray(parsed)) {
              setParagraphSummaries(parsed.map((ps: any, idx: number) => ({
                id: `ps-${idx}`,
                start_time: ps.start_time || "00:00",
                end_time: ps.end_time || "",
                title: ps.title || "요약",
                summary: ps.summary || ""
              })));
            } else {
              throw new Error("Not an array");
            }
          } catch (e) {
            setParagraphSummaries([{
              id: "ps-1",
              start_time: "00:00",
              end_time: "End",
              title: "전체 요약",
              summary: meeting.timeline_summary
            }]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch meeting details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    if (meetingId) fetchDetails();
  }, [meetingId, fetchDetails]);

  const scrollToTranscriptLine = (lineId: string) => {
    const element = document.querySelector(`[data-testid="transcript-line-${lineId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setActiveLine(lineId);
      setTimeout(() => setActiveLine(null), 3000);
    }
  };

  const scrollToTime = (time: string) => {
    const line = transcript.find(t => t.timestamp === time);
    if (line) {
      scrollToTranscriptLine(line.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">미팅 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-10 flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/projects/${projectId}/meetings`}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-muted-foreground">{projectName}</span>
                  <span className="text-xs text-muted-foreground">/</span>
                </div>
                <h1 className="text-lg font-semibold text-foreground">{meetingTitle}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {meetingData?.meeting_date ? new Date(meetingData.meeting_date).toLocaleDateString('ko-KR') : '-'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.floor((meetingData?.audio_duration_seconds || 0) / 60)}분
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {meetingData?.participants?.length || 0}명
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col p-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">

          {/* 회의록 (좌측 - 7개 컬럼 차지) */}
          <section className="lg:col-span-7 flex flex-col min-h-0 h-full">
            <div className="flex items-center justify-between mb-3 px-1 flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-foreground">회의록</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">{transcript.length}개 발언</span>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <UserCog className="w-3.5 h-3.5" />
                  화자 지정
                </button>
              </div>
            </div>
            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm border-border/50">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {transcript.map((line) => (
                    <div
                      key={line.id}
                      className={`flex gap-4 group transition-colors ${activeLine === line.id ? "bg-primary/5 -mx-2 px-2 py-2 rounded-lg" : ""}`}
                      data-testid={`transcript-line-${line.id}`}
                    >
                      <div className="flex-shrink-0 pt-1">
                        <div className={`w-9 h-9 rounded-full ${line.speakerColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                          {line.speaker.replace("Speaker ", "").charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-foreground/90">{line.speaker}</span>
                          <span className="text-xs text-muted-foreground/70 font-mono">{line.timestamp}</span>
                          {line.isHighlight && (
                            <Badge variant="secondary" className="bg-blue-50 text-[10px] text-blue-500 hover:bg-blue-50 py-0 h-4 border-none">핵심</Badge>
                          )}
                        </div>
                        <p className="text-[13.5px] leading-relaxed text-foreground/80 break-words">{line.text}</p>
                      </div>
                    </div>
                  ))}
                  {transcript.length === 0 && <p className="text-center py-20 text-muted-foreground italic text-sm">대화 기록이 없습니다.</p>}
                </div>
              </ScrollArea>
            </Card>
          </section>

          {/* 정보 패널 (우측 - 5개 컬럼 차지) */}
          <div className="lg:col-span-5 flex flex-col gap-6 min-h-0 h-full overflow-y-auto pr-2 scrollbar-hide">

            {/* 주요 주제 */}
            <section className="flex flex-col shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Bookmark className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-foreground">주요 주제</h2>
              </div>
              <Card className="shadow-sm border-border/50">
                <div className="p-1">
                  {topics.map((topic, idx) => (
                    <button
                      key={topic.id}
                      onClick={() => scrollToTime(topic.timestamp)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors text-left ${idx !== topics.length - 1 ? 'border-b border-border/40' : ''}`}
                    >
                      <span className="font-medium text-foreground/80 truncate pr-4">{topic.topic}</span>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">{topic.timestamp}</span>
                    </button>
                  ))}
                  {topics.length === 0 && <p className="text-center py-6 text-muted-foreground text-xs italic">주제 분석 정보가 없습니다.</p>}
                </div>
              </Card>
            </section>

            {/* 의사결정 사항 */}
            <section className="flex flex-col shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-foreground">의사결정 사항</h2>
              </div>
              <Card className="shadow-sm border-border/50">
                <div className="p-4 space-y-3">
                  {decisionSummariesState.map((decision, idx) => (
                    <div key={decision.id} className={`flex items-start gap-3 ${idx !== decisionSummariesState.length - 1 ? 'border-b border-border/20 pb-3' : ''}`}>
                      <Checkbox checked={decision.integrationStatus === "integrated"} disabled className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground/90">{decision.title}</p>
                        <Badge variant="outline" className="text-[10px] mt-1 uppercase text-muted-foreground/70 scale-90 origin-left">
                          {decision.integrationStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {decisionSummariesState.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">기록된 사항이 없습니다.</p>}
                </div>
              </Card>
            </section>

            {/* 다음 할 일 */}
            <section className="flex flex-col shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-foreground">다음 할 일</h2>
              </div>
              <Card className="shadow-sm border-border/50">
                <div className="p-4 space-y-3">
                  {actionItemsState.map((item, idx) => (
                    <div key={item.id} className={`flex items-start gap-3 ${idx !== actionItemsState.length - 1 ? 'border-b border-border/20 pb-3' : ''}`}>
                      <Checkbox checked={item.completed} disabled className="mt-0.5" />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground/90'}`}>{item.task}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] py-0 px-2 bg-muted/50">{item.assignee}</Badge>
                          {item.dueDate && <span className="text-[10px] text-muted-foreground font-mono">~{item.dueDate}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {actionItemsState.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">할 일이 없습니다.</p>}
                </div>
              </Card>
            </section>

            {/* 단락별 요약 */}
            <section className="flex flex-col shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <FileText className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-foreground">단락별 요약</h2>
              </div>
              <Card className="shadow-sm border-border/50">
                <div className="p-4 space-y-6">
                  {paragraphSummaries.map((ps, idx) => (
                    <div key={ps.id} className={`${idx !== paragraphSummaries.length - 1 ? 'border-b border-border/40 pb-6' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-500 font-mono tracking-tight bg-blue-50 px-2 py-0.5 rounded">
                          {ps.start_time} - {ps.end_time}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground/90">{ps.title}</p>
                        <p className="text-[13.5px] leading-relaxed text-foreground/80">{ps.summary}</p>
                      </div>
                    </div>
                  ))}
                  {paragraphSummaries.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">요약 정보가 없습니다.</p>}
                </div>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
