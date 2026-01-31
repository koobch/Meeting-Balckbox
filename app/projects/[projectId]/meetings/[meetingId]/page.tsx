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
  title: string;
  startTime: string;
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
  timeRange: string;
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

        setTopics((meeting.topics || []).map((t: string, idx: number) => ({
          id: `topic-${idx}`,
          title: t,
          startTime: "00:00"
        })));

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

        if (meeting.timeline_summary) {
          setParagraphSummaries([{
            id: "ps-1",
            timeRange: "00:00 - End",
            summary: meeting.timeline_summary
          }]);
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

      <div className="p-6 space-y-8">
        {/* 주요 주제 섹션 */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary" />
            주요 주제
          </h2>
          <div className="flex flex-wrap gap-2">
            {topics.map(topic => (
              <Badge key={topic.id} variant="secondary" className="px-3 py-1 bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer" onClick={() => scrollToTime(topic.startTime)}>
                {topic.title}
              </Badge>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 의사결정 사항 */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                의사결정 사항
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-3">
                  {decisionSummariesState.map(decision => (
                    <div key={decision.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <Checkbox checked={decision.integrationStatus === "integrated"} disabled />
                      <div>
                        <p className="text-sm font-medium">{decision.title}</p>
                        <Badge variant="outline" className="text-[10px] mt-1 uppercase">
                          {decision.integrationStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {decisionSummariesState.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">기록된 의사결정 사항이 없습니다.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 다음 할 일 */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                다음 할 일
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-3">
                  {actionItemsState.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <Checkbox checked={item.completed} disabled />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>{item.task}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">{item.assignee}</Badge>
                          {item.dueDate && <span className="text-[10px] text-muted-foreground italic">~{item.dueDate}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {actionItemsState.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">등록된 할 일이 없습니다.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* 단락별 요약 */}
        {paragraphSummaries.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              단락별 요약
            </h2>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                {paragraphSummaries.map(ps => (
                  <div key={ps.id} className="space-y-1">
                    <p className="text-xs text-muted-foreground font-mono">{ps.timeRange}</p>
                    <p className="text-sm leading-relaxed">{ps.summary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {/* 전체 대화 기록 */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-500" />
            전체 대화 기록
          </h2>
          <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/10">
            {transcript.map((line) => (
              <div
                key={line.id}
                className={`flex gap-3 py-2 px-3 rounded-md transition-colors ${activeLine === line.id ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/50"}`}
                data-testid={`transcript-line-${line.id}`}
              >
                <div className="flex-shrink-0 pt-1">
                  <div className={`w-8 h-8 rounded-full ${line.speakerColor} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {line.speaker.replace("Speaker ", "")}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold">{line.speaker}</span>
                    <span className="text-[10px] text-muted-foreground">{line.timestamp}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{line.text}</p>
                </div>
              </div>
            ))}
            {transcript.length === 0 && <p className="text-center py-10 text-muted-foreground italic text-sm">대화 기록이 없습니다.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
