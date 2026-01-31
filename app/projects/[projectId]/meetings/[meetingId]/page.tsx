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
import { getMeetingDetails, updateLogicGapStatus, updateActionItemStatus } from "@/app/actions/meetings";

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

interface LogicGap {
  id: string;
  speaker: string | null;
  statement: string;
  issueType: string | null;
  severity: string | null;
  reason: string | null;
  suggestedEvidence: string | null;
  context: string | null;
  researchType: string | null;
  reviewStatus: string | null;
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
  const [logicGapsState, setLogicGapsState] = useState<LogicGap[]>([]);


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
  const [currentLogicGapIndex, setCurrentLogicGapIndex] = useState(0);
  const [findingLoadingDots, setFindingLoadingDots] = useState<Record<string, number>>({});

  // Hidden items tracking
  const [hiddenDecisions, setHiddenDecisions] = useState<Set<string>>(new Set());
  const [hiddenActions, setHiddenActions] = useState<Set<string>>(new Set());

  const parseTranscript = (raw: string | null): TranscriptLine[] => {
    if (!raw) {
      console.log('[Transcript] No raw data provided');
      return [];
    }

    console.log('[Transcript] Raw data length:', raw.length);
    console.log('[Transcript] First 500 chars:', raw.substring(0, 500));

    // Split by double newline first, then single newline
    const lines = raw.split(/\n\n/).flatMap(block => block.split(/\n/));
    const filteredLines = lines.filter(l => l.trim());

    console.log('[Transcript] Total lines after split:', filteredLines.length);

    const parsed = filteredLines.map((line, idx) => {
      // Try multiple regex patterns
      // Pattern 1: [00:00] Speaker 0: text
      let match = line.match(/^\[(\d{2}:\d{2})\]\s+(Speaker\s+\d+):\s+(.*)$/);

      // Pattern 2: [0:00] Speaker 0: text (single digit minute)
      if (!match) {
        match = line.match(/^\[(\d{1,2}:\d{2})\]\s+(Speaker\s+\d+):\s+(.*)$/);
      }

      // Pattern 3: Speaker 0 [00:00]: text
      if (!match) {
        const altMatch = line.match(/^(Speaker\s+\d+)\s+\[(\d{1,2}:\d{2})\]:\s+(.*)$/);
        if (altMatch) {
          match = [altMatch[0], altMatch[2], altMatch[1], altMatch[3]] as RegExpMatchArray;
        }
      }

      // Pattern 4: [오후 9:27:54] speaker0: text (Korean time format)
      if (!match) {
        const koreanMatch = line.match(/^\[(오전|오후)\s+(\d{1,2}:\d{2}:\d{2})\]\s+(speaker\d+):\s*(.*)$/i);
        if (koreanMatch) {
          const [, period, time, speaker, text] = koreanMatch;
          const timestamp = `${period} ${time}`;
          // Normalize speaker name to match color mapping
          const normalizedSpeaker = `Speaker ${speaker.replace('speaker', '')}`;
          return {
            id: `t-${idx}`,
            speaker: normalizedSpeaker,
            speakerColor: speakerColors[normalizedSpeaker] || "bg-slate-400",
            timestamp,
            text: text.trim()
          };
        }
      }

      if (match) {
        const [, timestamp, speaker, text] = match;
        return {
          id: `t-${idx}`,
          speaker,
          speakerColor: speakerColors[speaker] || "bg-slate-400",
          timestamp,
          text: text.trim()
        };
      }

      // If no pattern matches, treat entire line as text with unknown speaker
      console.log('[Transcript] Failed to parse line:', line.substring(0, 100));
      return {
        id: `t-${idx}`,
        speaker: "Unknown",
        speakerColor: "bg-slate-400",
        timestamp: "00:00",
        text: line.trim()
      };
    });

    console.log('[Transcript] Successfully parsed lines:', parsed.length);
    console.log('[Transcript] Sample parsed:', parsed.slice(0, 2));

    // Merge consecutive lines from the same speaker
    const merged: TranscriptLine[] = [];
    parsed.forEach((line) => {
      const lastMerged = merged[merged.length - 1];
      if (lastMerged && lastMerged.speaker === line.speaker &&
        (line.speaker === "Unknown" || lastMerged.timestamp === line.timestamp)) {
        lastMerged.text += ' ' + line.text;
      } else {
        merged.push({ ...line });
      }
    });
    console.log('[Transcript] After merging:', merged.length, 'lines');
    return merged;
  };

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMeetingDetails(meetingId);
      if (result.success && result.data) {
        const { meeting, decisions, actionItems } = result.data;

        // Debug logging for transcript
        console.log('=== TRANSCRIPT DEBUG ===');
        console.log('Raw type:', typeof meeting.transcript_with_speakers);
        console.log('Is null?:', meeting.transcript_with_speakers === null);
        console.log('Length:', meeting.transcript_with_speakers?.length || 0);
        if (meeting.transcript_with_speakers) {
          console.log('First 500 chars:', meeting.transcript_with_speakers.substring(0, 500));
        }

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

        // Fetch Logic Gaps
        if (result.data.logicGaps) {
          setLogicGapsState(result.data.logicGaps.map((lg: any) => ({
            id: lg.id,
            speaker: lg.speaker,
            statement: lg.statement,
            issueType: lg.issue_type || lg.issueType,
            severity: lg.severity,
            reason: lg.reason,
            suggestedEvidence: lg.suggested_evidence || lg.suggestedEvidence,
            context: lg.context,
            researchType: lg.research_type || lg.researchType,
            reviewStatus: lg.review_status || lg.reviewStatus
          })));
        }

        // Parse Timeline Summary JSON
        if (meeting.timeline_summary) {
          console.log('[Timeline] Raw timeline_summary type:', typeof meeting.timeline_summary);
          console.log('[Timeline] Raw timeline_summary:', meeting.timeline_summary);

          try {
            let parsed;

            // If it's already an object/array, use it directly
            if (typeof meeting.timeline_summary === 'object') {
              parsed = meeting.timeline_summary;
            } else {
              // If it's a string, try to parse it
              parsed = JSON.parse(meeting.timeline_summary);
            }

            console.log('[Timeline] Parsed type:', typeof parsed, 'isArray:', Array.isArray(parsed));

            if (Array.isArray(parsed)) {
              const summaries = parsed.map((ps: any, idx: number) => ({
                id: `ps-${idx}`,
                start_time: ps.start_time || ps.startTime || "00:00",
                end_time: ps.end_time || ps.endTime || "",
                title: ps.title || ps.topic || "요약",
                summary: ps.summary || ps.content || ""
              }));

              console.log('[Timeline] Parsed summaries count:', summaries.length);
              console.log('[Timeline] Sample summary:', summaries[0]);
              setParagraphSummaries(summaries);
            } else {
              throw new Error("Not an array");
            }
          } catch (e) {
            console.error('[Timeline] Failed to parse timeline_summary:', e);
            console.log('[Timeline] Using fallback - treating as single summary');

            // Fallback: treat as single text summary
            setParagraphSummaries([{
              id: "ps-1",
              start_time: "00:00",
              end_time: "End",
              title: "전체 요약",
              summary: typeof meeting.timeline_summary === 'string'
                ? meeting.timeline_summary
                : JSON.stringify(meeting.timeline_summary)
            }]);
          }
        } else {
          console.log('[Timeline] No timeline_summary data');
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

  // Logic Gap handlers
  const handlePrevLogicGap = () => {
    setCurrentLogicGapIndex(prev =>
      prev > 0 ? prev - 1 : logicGapsState.length - 1
    );
  };

  const handleNextLogicGap = () => {
    setCurrentLogicGapIndex(prev =>
      prev < logicGapsState.length - 1 ? prev + 1 : 0
    );
  };

  const handleViewRelatedStatement = (speaker: string | null) => {
    if (!speaker) return;
    // Find first transcript line from this speaker
    const line = transcript.find(t => t.speaker === speaker);
    if (line) {
      scrollToTranscriptLine(line.id);
    }
  };

  const handleRunResearch = async (gapId: string) => {
    // TODO: Implement research logic
    console.log('[Research] Running research for gap:', gapId);
    alert('리서치 기능은 곧 구현될 예정입니다.');
  };

  const handleMarkAsResolved = async (gapId: string) => {
    try {
      console.log('[LogicGap] Marking as resolved:', gapId);

      // Call API to update review_status
      const result = await updateLogicGapStatus(gapId, 'resolved');

      if (result.success) {
        // Optimistic update
        setLogicGapsState(prev =>
          prev.map(gap =>
            gap.id === gapId
              ? { ...gap, reviewStatus: 'resolved' }
              : gap
          )
        );

        alert('보완 완료로 표시되었습니다.');
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('[LogicGap] Failed to mark as resolved:', error);
      alert('보완 완료 처리에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // Decision handlers
  const toggleDecisionSelect = (id: string) => {
    setSelectedDecisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllDecisions = () => {
    if (selectedDecisions.size === visibleDecisions.length) {
      setSelectedDecisions(new Set());
    } else {
      setSelectedDecisions(new Set(visibleDecisions.map(d => d.id)));
    }
  };

  const hideDecision = (id: string) => {
    setHiddenDecisions(prev => new Set(prev).add(id));
    // Also remove from selection if selected
    setSelectedDecisions(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleIntegrateDecisions = async () => {
    if (selectedDecisions.size === 0) return;

    try {
      console.log('[Integration] Integrating decisions:', Array.from(selectedDecisions));
      // TODO: Call n8n webhook
      alert(`${selectedDecisions.size}개 의사결정을 프로젝트 기억에 통합합니다.`);

      // Reset selection
      setSelectedDecisions(new Set());
      setDecisionsSelectMode(false);
    } catch (error) {
      console.error('[Integration] Failed:', error);
      alert('통합에 실패했습니다.');
    }
  };

  // Action handlers
  const toggleActionSelect = (id: string) => {
    setSelectedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllActions = () => {
    if (selectedActions.size === visibleActions.length) {
      setSelectedActions(new Set());
    } else {
      setSelectedActions(new Set(visibleActions.map(a => a.id)));
    }
  };

  const hideAction = (id: string) => {
    setHiddenActions(prev => new Set(prev).add(id));
    // Also remove from selection if selected
    setSelectedActions(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const toggleActionComplete = async (id: string) => {
    try {
      const action = actionItemsState.find(a => a.id === id);
      if (!action) return;

      const newStatus = action.completed ? 'pending' : 'completed';

      // Call API to update status
      console.log('[Action] Toggling status:', id, newStatus);
      const result = await updateActionItemStatus(id, newStatus);

      if (result.success) {
        // Optimistic update
        setActionItemsState(prev =>
          prev.map(item =>
            item.id === id
              ? { ...item, completed: !item.completed }
              : item
          )
        );
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('[Action] Failed to toggle:', error);
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  const handleIntegrateActions = async () => {
    if (selectedActions.size === 0) return;

    try {
      console.log('[Integration] Integrating actions:', Array.from(selectedActions));
      // TODO: Call n8n webhook
      alert(`${selectedActions.size}개 액션 아이템을 프로젝트 기억에 통합합니다.`);

      // Reset selection
      setSelectedActions(new Set());
      setActionsSelectMode(false);
    } catch (error) {
      console.error('[Integration] Failed:', error);
      alert('통합에 실패했습니다.');
    }
  };

  // Computed values
  const visibleDecisions = decisionSummariesState.filter(d => !hiddenDecisions.has(d.id));
  const visibleActions = actionItemsState.filter(a => !hiddenActions.has(a.id));
  const completedActionsCount = visibleActions.filter(a => a.completed).length;

  const currentLogicGap = logicGapsState[currentLogicGapIndex];

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

      <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto bg-slate-50/50">
        {/* 상단: 의사결정 & 할 일 (1:1) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-shrink-0">
          {/* 의사결정 사항 */}
          <section className="flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-foreground">의사 결정 사항</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none px-2 h-5">
                  {visibleDecisions.length}
                </Badge>
                <div className="flex items-center gap-1.5 ml-2">
                  <Checkbox
                    id="select-all-decisions"
                    checked={decisionsSelectMode}
                    onCheckedChange={(checked) => {
                      setDecisionsSelectMode(!!checked);
                      if (checked) {
                        // Select all visible decisions
                        setSelectedDecisions(new Set(visibleDecisions.map(d => d.id)));
                      } else {
                        setSelectedDecisions(new Set());
                      }
                    }}
                  />
                  <label htmlFor="select-all-decisions" className="text-[10px] text-muted-foreground cursor-pointer">통합 선택</label>
                </div>
              </div>
            </div>
            <Card className="shadow-sm border-border/50">
              <ScrollArea className="h-[220px]">
                <div className="p-4 space-y-4">
                  {visibleDecisions.map((decision, idx) => (
                    <div
                      key={decision.id}
                      onClick={() => decisionsSelectMode && toggleDecisionSelect(decision.id)}
                      className={`flex items-start gap-3 group transition-colors rounded-md -mx-2 px-2 py-1.5 ${selectedDecisions.has(decision.id) ? 'bg-amber-50/50' : ''
                        } ${decisionsSelectMode ? 'cursor-pointer hover:bg-amber-50/30' : ''}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0 group-hover:bg-amber-400 transition-colors" />
                      <p className="text-[13.5px] leading-relaxed text-foreground/80 flex-1">{decision.title}</p>

                      {/* Show check icon when selected in select mode */}
                      {decisionsSelectMode && selectedDecisions.has(decision.id) && (
                        <Check className="w-4 h-4 text-amber-500/60 shrink-0 mt-0.5" />
                      )}

                      {/* X button - only show when NOT in select mode */}
                      {!decisionsSelectMode && (
                        <button
                          onClick={() => hideDecision(decision.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  ))}
                  {visibleDecisions.length === 0 && <p className="text-sm text-center py-10 text-muted-foreground italic">기록된 사항이 없습니다.</p>}
                </div>
              </ScrollArea>
            </Card>
          </section>

          {/* 다음 할 일 */}
          <section className="flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-foreground">다음 할 일</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {completedActionsCount}/{visibleActions.length}
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Checkbox
                    id="select-all-actions"
                    checked={actionsSelectMode}
                    onCheckedChange={(checked) => {
                      setActionsSelectMode(!!checked);
                      if (checked) {
                        // Select all visible actions
                        setSelectedActions(new Set(visibleActions.map(a => a.id)));
                      } else {
                        setSelectedActions(new Set());
                      }
                    }}
                  />
                  <label htmlFor="select-all-actions" className="text-[10px] text-muted-foreground cursor-pointer">통합 선택</label>
                </div>
              </div>
            </div>
            <Card className="shadow-sm border-border/50">
              <ScrollArea className="h-[220px]">
                <div className="p-4 space-y-4">
                  {visibleActions.map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        // Only toggle selection if in select mode and not clicking on the complete checkbox
                        if (actionsSelectMode && !(e.target as HTMLElement).closest('[data-checkbox]')) {
                          toggleActionSelect(item.id);
                        }
                      }}
                      className={`flex items-start gap-4 group transition-colors rounded-md -mx-2 px-2 py-1.5 ${selectedActions.has(item.id) ? 'bg-emerald-50/50' : ''
                        } ${actionsSelectMode ? 'cursor-pointer hover:bg-emerald-50/30' : ''}`}
                    >
                      <div data-checkbox onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => toggleActionComplete(item.id)}
                          className="mt-0.5 rounded-sm"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13.5px] leading-relaxed ${item.completed ? 'line-through text-muted-foreground/60' : 'text-foreground/80'}`}>{item.task}</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">{item.assignee}</p>
                      </div>

                      {/* Show check icon when selected in select mode */}
                      {actionsSelectMode && selectedActions.has(item.id) && (
                        <Check className="w-4 h-4 text-emerald-500/60 shrink-0 mt-0.5" />
                      )}

                      {/* X button - only show when NOT in select mode */}
                      {!actionsSelectMode && (
                        <button
                          onClick={() => hideAction(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  ))}
                  {visibleActions.length === 0 && <p className="text-sm text-center py-10 text-muted-foreground italic">할 일이 없습니다.</p>}
                </div>
              </ScrollArea>
            </Card>
          </section>
        </div>

        {/* 중앙: 보완 필요 항목 (Full Width) */}
        <section className="flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-foreground">논리 검토 포인트</h2>
            </div>
            <Badge variant="secondary" className="bg-orange-50 text-orange-600 hover:bg-orange-50 border-none px-2 h-5">
              {logicGapsState.length}
            </Badge>
          </div>
          <Card className="shadow-sm border-border/50 relative overflow-hidden group">
            {logicGapsState.length > 0 ? (
              <>
                {/* Navigation Arrows */}
                {logicGapsState.length > 1 && (
                  <>
                    <div className="absolute inset-y-0 left-0 flex items-center z-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevLogicGap}
                        className="h-12 w-8 rounded-l-none bg-background/50 backdrop-blur-sm border-y border-r border-border/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center z-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextLogicGap}
                        className="h-12 w-8 rounded-r-none bg-background/50 backdrop-blur-sm border-y border-l border-border/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}

                <div className="p-8 flex flex-col items-center">
                  <div className="max-w-4xl w-full">
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-orange-50/50 border-orange-200 text-orange-600 px-3 py-1.5 font-medium flex items-start gap-1.5 h-auto rounded-md shadow-sm max-w-full">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="break-words whitespace-pre-wrap leading-relaxed">{currentLogicGap?.statement || "내용 없음"}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentLogicGap?.issueType && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[10px] font-medium h-6 px-3 border-none">
                            {currentLogicGap.issueType}
                          </Badge>
                        )}
                        {currentLogicGap?.severity && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-medium h-6 px-3 border-none ${currentLogicGap.severity === 'high'
                              ? 'bg-red-50 text-red-600'
                              : currentLogicGap.severity === 'medium'
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-yellow-50 text-yellow-600'
                              }`}
                          >
                            {currentLogicGap.severity}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-foreground/70 mb-6 pl-1 italic whitespace-pre-wrap break-words">
                      {currentLogicGap?.reason || "이유가 명시되지 않았습니다."}
                    </p>

                    {currentLogicGap?.suggestedEvidence && (
                      <div className="mb-6 pl-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">제안된 근거:</p>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">{currentLogicGap.suggestedEvidence}</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination Dots */}
                  {logicGapsState.length > 1 && (
                    <div className="flex gap-2 mt-8">
                      {logicGapsState.map((_, idx) => (
                        <div
                          key={idx}
                          onClick={() => setCurrentLogicGapIndex(idx)}
                          className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${idx === currentLogicGapIndex
                            ? 'bg-primary/60 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                            : 'bg-slate-200 hover:bg-slate-300'
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  보완이 필요한 항목이 없습니다.
                </p>
              </div>
            )}
          </Card>
        </section>

        {/* 하단: 회의록 | 주제 & 요약 (7:5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 flex-1">
          {/* 회의록 (좌측 - 7개 컬럼) */}
          <section className="lg:col-span-7 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-foreground">회의록</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-muted-foreground font-medium">{transcript.length}개 발언</span>
                <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium">
                  <UserCog className="w-3.5 h-3.5" />
                  화자 지정
                </button>
              </div>
            </div>
            <Card className="flex-1 min-h-0 flex flex-col shadow-sm border-border/50">
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
                          <span className="text-sm font-bold text-foreground/80">{line.speaker}</span>
                          <span className="text-xs text-muted-foreground/60 font-mono tracking-tighter">{line.timestamp}</span>
                          {Math.random() > 0.8 && (
                            <Badge variant="secondary" className="bg-blue-50 text-[10px] text-blue-500 hover:bg-blue-50 py-0 h-4 border-none font-bold">핵심</Badge>
                          )}
                        </div>
                        <p className="text-[13.5px] leading-relaxed text-foreground/80 break-words">{line.text}</p>
                      </div>
                    </div>
                  ))}
                  {transcript.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-sm text-muted-foreground text-center font-medium mb-1">회의록 데이터가 없습니다</p>
                      <p className="text-xs text-muted-foreground/60 text-center">음성 녹음 후 자동으로 생성됩니다</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </section>

          {/* 주요 주제 & 요약 (우측 - 5개 컬럼) */}
          <div className="lg:col-span-5 flex flex-col gap-6 min-h-0">
            {/* 주요 주제 */}
            <section className="flex flex-col">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Bookmark className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-foreground">주요 주제</h2>
              </div>
              <Card className="shadow-sm border-border/50">
                <ScrollArea className="h-auto max-h-[220px]">
                  <div className="p-1">
                    {topics.map((topic, idx) => (
                      <button
                        key={topic.id}
                        onClick={() => scrollToTime(topic.timestamp)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-[13px] hover:bg-slate-50 transition-colors text-left ${idx !== topics.length - 1 ? 'border-b border-border/30' : ''}`}
                      >
                        <span className="font-medium text-foreground/80 truncate pr-4">{topic.topic}</span>
                        <span className="text-[11px] font-mono text-muted-foreground shrink-0">{topic.timestamp}</span>
                      </button>
                    ))}
                    {topics.length === 0 && <p className="text-center py-6 text-muted-foreground text-xs italic">정보가 없습니다.</p>}
                  </div>
                </ScrollArea>
              </Card>
            </section>

            {/* 단락별 요약 */}
            <section className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center gap-2 mb-2 px-1">
                <FileText className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-foreground">단락별 요약</h2>
              </div>
              <Card className="flex-1 min-h-0 flex flex-col shadow-sm border-border/50">
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-6">
                    {paragraphSummaries.map((ps, idx) => (
                      <div key={ps.id} className={`${idx !== paragraphSummaries.length - 1 ? 'border-b border-border/30 pb-6' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-bold text-blue-500 font-mono tracking-tighter bg-blue-50 px-2 py-0.5 rounded">
                            {ps.start_time} - {ps.end_time}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-sm font-bold text-foreground/80">{ps.title}</p>
                          <p className="text-[13px] leading-relaxed text-foreground/70">{ps.summary}</p>
                        </div>
                      </div>
                    ))}
                    {paragraphSummaries.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10">
                        <FileText className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-sm text-muted-foreground text-center font-medium mb-1">단락별 요약이 없습니다</p>
                        <p className="text-xs text-muted-foreground/60 text-center">회의 분석 후 자동으로 생성됩니다</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </section>
          </div>
        </div>
      </div>

      {/* Unified Bottom Popup for Integration - Non-modal */}
      {((decisionsSelectMode && selectedDecisions.size > 0) || (actionsSelectMode && selectedActions.size > 0)) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom duration-200">
          <div className="bg-white border border-border rounded-lg shadow-2xl px-6 py-4 min-w-[800px] max-w-5xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md">
                  <span className="text-sm font-medium text-slate-700">
                    선택된 항목
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDecisions(new Set());
                  setSelectedActions(new Set());
                  setDecisionsSelectMode(false);
                  setActionsSelectMode(false);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-start gap-6">
              {/* Decisions Section */}
              {decisionsSelectMode && selectedDecisions.size > 0 && (
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-foreground">의사 결정</span>
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                      {selectedDecisions.size}개
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    선택한 의사 결정 사항을 프로젝트 기억에 통합합니다
                  </p>
                </div>
              )}

              {/* Actions Section */}
              {actionsSelectMode && selectedActions.size > 0 && (
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-foreground">다음 할 일</span>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {selectedActions.size}개
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    선택한 액션 아이템을 프로젝트 기억에 통합합니다
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDecisions(new Set());
                    setSelectedActions(new Set());
                  }}
                  className="h-9"
                >
                  선택 해제
                </Button>
                <Button
                  onClick={() => {
                    if (selectedDecisions.size > 0) handleIntegrateDecisions();
                    if (selectedActions.size > 0) handleIntegrateActions();
                  }}
                  className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  프로젝트 기억에 통합
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
