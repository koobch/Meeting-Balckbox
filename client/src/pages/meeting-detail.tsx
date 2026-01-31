import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { saveRecentMeeting } from "@/components/app-shell";
import { useProjectName } from "@/lib/project-context";
import { useProjectMemory, MemoryItem } from "@/lib/project-memory-context";
import { InlineEditableText } from "@/components/inline-editable-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronLeft,
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
  X,
  UserCog,
  Inbox,
  ExternalLink,
  Circle,
  CircleDot,
  Database
} from "lucide-react";

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

interface LogicFinding {
  id: string;
  type: LogicMarkType;
  claim: string;
  given: string;
  gap: string;
  suggestedQuestion: string;
  relatedLineIds: string[];
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
}

interface ParagraphSummary {
  id: string;
  timeRange: string;
  summary: string;
}

const logicFindings: LogicFinding[] = [
  {
    id: "lf-1",
    type: "leap",
    claim: "5분 내로 온보딩을 완료할 수 있어야 한다",
    given: "사용자들이 기존 도구의 온보딩이 복잡하다고 느낌 (8명 중 6명)",
    gap: "\"복잡하다\"는 피드백에서 \"5분\"이라는 구체적인 시간 목표가 어떻게 도출되었는지 근거가 명시되지 않았습니다.",
    suggestedQuestion: "5분이라는 기준은 어떤 데이터나 벤치마크를 참고한 것인지 확인해 보시면 좋을 것 같습니다.",
    relatedLineIds: ["t8"]
  },
  {
    id: "lf-2",
    type: "missing",
    claim: "경쟁사 대비 저렴한 가격이 필요하다",
    given: "인터뷰에서 가격에 대한 피드백이 있었음",
    gap: "구체적으로 어떤 가격대를 기대하는지, 경쟁사 가격 대비 얼마나 저렴해야 하는지에 대한 정량적 근거가 부족합니다.",
    suggestedQuestion: "사용자들이 언급한 \"저렴하다\"의 기준이 무엇이었는지 추가 확인이 필요해 보입니다.",
    relatedLineIds: ["t17", "t18"]
  },
  {
    id: "lf-3",
    type: "ambiguous",
    claim: "모바일 사용 비율 40%는 반응형 디자인이 필수임을 의미한다",
    given: "인터뷰 대상자 중 40%가 모바일로 상태 확인을 한다고 응답",
    gap: "8명 중 40%는 약 3명으로, 표본 크기가 작아 일반화하기에는 다소 조심스러울 수 있습니다. 또한 \"상태 확인\" 용도가 전체 사용 시나리오를 대표하는지 불분명합니다.",
    suggestedQuestion: "모바일 사용 패턴에 대해 더 넓은 사용자 그룹에서 추가 검증을 고려해 보시면 어떨까요?",
    relatedLineIds: ["t29", "t30"]
  }
];

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

const meetingInfo = {
  id: "m1",
  title: "사용자 인터뷰 결과 공유 미팅",
  date: "2025-01-29",
  duration: "47분",
  participants: ["김연구", "이디자인", "박개발", "최PM"]
};

const speakerColors: Record<string, string> = {
  "김연구": "bg-blue-500",
  "이디자인": "bg-violet-500",
  "박개발": "bg-emerald-500",
  "최PM": "bg-amber-500"
};

const transcript: TranscriptLine[] = [
  { id: "t1", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "00:00", text: "네, 그럼 오늘 사용자 인터뷰 결과 공유 미팅을 시작하겠습니다. 김연구님이 지난주에 진행하신 인터뷰 결과를 공유해 주시면 될 것 같아요." },
  { id: "t2", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "00:15", text: "네, 감사합니다. 지난주에 총 8명의 사용자를 대상으로 심층 인터뷰를 진행했습니다. 주요 타겟층인 중소기업 PM들이었고요." },
  { id: "t3", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "00:32", text: "먼저 주요 발견사항부터 말씀드리면, 가장 큰 페인포인트는 기존 도구들의 복잡성이었습니다. 8명 중 6명이 이 부분을 언급했어요.", isHighlight: true },
  { id: "t4", speaker: "이디자인", speakerColor: speakerColors["이디자인"], timestamp: "00:48", text: "복잡성이라고 하면 구체적으로 어떤 부분을 말씀하시는 건가요? UI 측면인지 기능 측면인지..." },
  { id: "t5", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "01:02", text: "주로 온보딩 과정에서의 진입장벽이 높다는 피드백이 많았습니다. 처음 시작할 때 뭘 해야 할지 모르겠다는 의견이요." },
  { id: "t6", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "01:18", text: "그리고 기능이 너무 많아서 정작 필요한 기능을 찾기 어렵다는 의견도 있었어요. 특히 Jira 같은 도구에서 그런 불만이 많았습니다." },
  { id: "t7", speaker: "박개발", speakerColor: speakerColors["박개발"], timestamp: "01:35", text: "저도 공감이 되네요. 저희 팀도 Jira 쓰면서 비슷한 경험이 있거든요. 설정하는 데만 시간이 너무 많이 들어요." },
  { id: "t8", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "01:48", text: "그럼 우리 제품은 온보딩을 최대한 간소화하는 방향으로 가야겠네요. 5분 내로 시작할 수 있게.", logicMark: { type: "leap", findingId: "lf-1" } },
  { id: "t9", speaker: "이디자인", speakerColor: speakerColors["이디자인"], timestamp: "02:05", text: "네, 저도 그게 좋을 것 같아요. 빈 캔버스로 시작하는 게 아니라 템플릿을 제공하면 어떨까요?" },
  { id: "t10", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "02:20", text: "맞아요. 실제로 템플릿에 대한 니즈도 인터뷰에서 나왔습니다. 처음부터 다 만드는 게 부담스럽다고요." },
  { id: "t11", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "02:38", text: "좋습니다. 그러면 MVP에 기본 템플릿 3-5개 정도 포함하는 걸로 하죠. 이디자인님 가능하실까요?" },
  { id: "t12", speaker: "이디자인", speakerColor: speakerColors["이디자인"], timestamp: "02:52", text: "네, 다음 주까지 프로젝트 관리, 스프린트 플래닝, 버그 트래킹 이렇게 세 가지 템플릿 초안 만들어볼게요." },
  { id: "t13", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "03:10", text: "두 번째 페인포인트는 협업 기능 부족이었습니다. 특히 실시간 편집이나 코멘트 기능에 대한 니즈가 높았어요.", isHighlight: true },
  { id: "t14", speaker: "박개발", speakerColor: speakerColors["박개발"], timestamp: "03:28", text: "실시간 편집은 기술적으로 조금 도전적인 부분이 있어요. MVP에 넣으려면 일정 조율이 필요할 것 같은데..." },
  { id: "t15", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "03:45", text: "그럼 실시간 편집은 1.1 버전으로 미루고, 코멘트 기능만 MVP에 넣는 건 어떨까요?" },
  { id: "t16", speaker: "박개발", speakerColor: speakerColors["박개발"], timestamp: "04:00", text: "코멘트 기능은 괜찮을 것 같아요. 기본적인 CRUD라서요." },
  { id: "t17", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "04:12", text: "그리고 세 번째로 가격에 대한 피드백도 있었는데요, 경쟁사 대비 저렴하면 좋겠다는 의견이 있었습니다.", logicMark: { type: "missing", findingId: "lf-2" } },
  { id: "t18", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "04:28", text: "가격 부분은 조금 더 고민이 필요할 것 같아요. 일단 경쟁사 가격 분석부터 해봐야겠네요.", logicMark: { type: "missing", findingId: "lf-2" } },
  { id: "t19", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "04:45", text: "네, 제가 경쟁사 가격 조사 자료 정리해서 공유드릴게요." },
  { id: "t20", speaker: "이디자인", speakerColor: speakerColors["이디자인"], timestamp: "05:02", text: "혹시 UI에 대한 직접적인 피드백도 있었나요? 디자인 개선 포인트가 있다면 알고 싶어요." },
  { id: "t21", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "05:18", text: "네, 몇 가지 있었어요. 일단 다크모드 지원 요청이 가장 많았고요." },
  { id: "t22", speaker: "이디자인", speakerColor: speakerColors["이디자인"], timestamp: "05:30", text: "다크모드는 이미 계획에 있어서 다행이네요. 다른 건요?" },
  { id: "t23", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "05:42", text: "대시보드가 너무 밋밋하다는 의견이 있었어요. 시각적으로 진행 상황을 한눈에 볼 수 있으면 좋겠다고요." },
  { id: "t24", speaker: "이디자인", speakerColor: speakerColors["이디자인"], timestamp: "05:58", text: "차트나 프로그레스 바 같은 시각화 요소를 추가하면 되겠네요. 메모해둘게요." },
  { id: "t25", speaker: "박개발", speakerColor: speakerColors["박개발"], timestamp: "06:15", text: "차트 라이브러리는 Recharts 쓰면 될 것 같아요. 이미 프로젝트에 설치되어 있어서요." },
  { id: "t26", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "06:30", text: "좋아요. 그러면 대시보드 시각화도 MVP 스코프에 포함하죠.", isHighlight: true },
  { id: "t27", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "06:45", text: "한 가지 더 중요한 발견이 있었는데요, 모바일에서 사용하는 비율이 예상보다 높았어요." },
  { id: "t28", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "07:00", text: "모바일이요? 어느 정도 비율인가요?" },
  { id: "t29", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "07:12", text: "인터뷰 대상자 중 약 40%가 이동 중에 모바일로 확인한다고 했어요. 주로 상태 확인 용도로요.", logicMark: { type: "ambiguous", findingId: "lf-3" } },
  { id: "t30", speaker: "이디자인", speakerColor: speakerColors["이디자인"], timestamp: "07:28", text: "그럼 반응형 디자인은 필수겠네요. 모바일 퍼스트로 갈 필요까지는 없겠지만...", logicMark: { type: "ambiguous", findingId: "lf-3" } },
  { id: "t31", speaker: "박개발", speakerColor: speakerColors["박개발"], timestamp: "07:42", text: "Tailwind 쓰고 있어서 반응형은 어렵지 않을 거예요." },
  { id: "t32", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "07:55", text: "네, 반응형은 기본으로 하고요. 혹시 다른 중요한 피드백이 있었나요?" },
  { id: "t33", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "08:10", text: "알림 기능에 대한 니즈도 있었어요. 중요한 업데이트가 있을 때 알려주면 좋겠다고요." },
  { id: "t34", speaker: "박개발", speakerColor: speakerColors["박개발"], timestamp: "08:25", text: "이메일 알림은 MVP에 가능하고, 푸시 알림은 좀 더 시간이 필요할 것 같아요." },
  { id: "t35", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "08:40", text: "그럼 이메일 알림만 MVP에 넣고, 푸시는 이후 버전에 추가하죠." },
  { id: "t36", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "08:55", text: "마지막으로 보안에 대한 우려도 있었습니다. 특히 기업 고객들은 SSO 지원 여부를 물어보셨어요." },
  { id: "t37", speaker: "박개발", speakerColor: speakerColors["박개발"], timestamp: "09:12", text: "SSO는 엔터프라이즈 플랜에서 제공하는 게 좋을 것 같아요. MVP에서는 기본 인증만 하고요." },
  { id: "t38", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "09:28", text: "동의합니다. 그럼 정리하면, MVP에 들어갈 것들이... 잠깐 정리해볼게요.", isHighlight: true },
  { id: "t39", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "09:45", text: "첫째, 간소화된 온보딩과 기본 템플릿 3개. 둘째, 코멘트 기능. 셋째, 대시보드 시각화. 넷째, 반응형 디자인. 다섯째, 이메일 알림." },
  { id: "t40", speaker: "이디자인", speakerColor: speakerColors["이디자인"], timestamp: "10:08", text: "그리고 다크모드도요!" },
  { id: "t41", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "10:18", text: "맞아요, 다크모드까지. 이 정도면 2월 중순 출시 목표에 맞출 수 있을까요?" },
  { id: "t42", speaker: "박개발", speakerColor: speakerColors["박개발"], timestamp: "10:32", text: "빠듯하긴 한데... 집중해서 하면 가능할 것 같아요. 다만 테스트 기간은 좀 필요해요." },
  { id: "t43", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "10:48", text: "그럼 개발 완료를 2월 10일로 잡고, 그 후 5일간 QA 진행하는 걸로 하죠." },
  { id: "t44", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "11:02", text: "혹시 베타 테스트 계획은 있나요? 인터뷰 참여자분들 중 몇 분이 관심 있어 하셨거든요." },
  { id: "t45", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "11:18", text: "오, 좋은 아이디어네요. 베타 테스터 풀을 미리 만들어두면 좋겠어요. 김연구님이 연락처 정리해주실 수 있나요?" },
  { id: "t46", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "11:32", text: "네, 이번 주 내로 정리해서 공유드릴게요." },
  { id: "t47", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "11:45", text: "좋습니다. 그러면 다음 할 일 정리해볼게요." },
  { id: "t48", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "11:58", text: "이디자인님은 템플릿 초안 3개, 박개발님은 기술 검토 및 일정 산정, 김연구님은 경쟁사 가격 조사와 베타 테스터 리스트 정리." },
  { id: "t49", speaker: "이디자인", speakerColor: speakerColors["이디자인"], timestamp: "12:18", text: "네, 확인했습니다." },
  { id: "t50", speaker: "박개발", speakerColor: speakerColors["박개발"], timestamp: "12:25", text: "저도요." },
  { id: "t51", speaker: "김연구", speakerColor: speakerColors["김연구"], timestamp: "12:30", text: "네, 알겠습니다." },
  { id: "t52", speaker: "최PM", speakerColor: speakerColors["최PM"], timestamp: "12:35", text: "그럼 다음 주 월요일에 진행 상황 공유하는 걸로 하고, 오늘 미팅은 여기서 마무리하겠습니다. 수고하셨어요!" }
];

const topics: Topic[] = [
  { id: "topic-1", title: "사용자 인터뷰 결과 개요", startTime: "00:00" },
  { id: "topic-2", title: "주요 페인포인트: 복잡성", startTime: "00:32" },
  { id: "topic-3", title: "온보딩 개선 및 템플릿", startTime: "02:05" },
  { id: "topic-4", title: "협업 기능 논의", startTime: "03:10" },
  { id: "topic-5", title: "가격 정책", startTime: "04:12" },
  { id: "topic-6", title: "UI/UX 피드백", startTime: "05:02" },
  { id: "topic-7", title: "모바일 대응", startTime: "06:45" },
  { id: "topic-8", title: "MVP 스코프 확정", startTime: "09:28" },
  { id: "topic-9", title: "일정 및 다음 단계", startTime: "10:48" }
];

const actionItemsData: ActionItem[] = [
  { id: "ai-1", task: "템플릿 초안 3개 (프로젝트 관리, 스프린트 플래닝, 버그 트래킹) 작성", assignee: "이디자인", completed: false },
  { id: "ai-2", task: "기술 검토 및 일정 산정", assignee: "박개발", completed: false },
  { id: "ai-3", task: "경쟁사 가격 조사 자료 정리", assignee: "김연구", completed: true },
  { id: "ai-4", task: "베타 테스터 리스트 정리", assignee: "김연구", completed: false },
  { id: "ai-5", task: "다음 주 월요일 진행 상황 공유 미팅", assignee: "전체", completed: false }
];

const paragraphSummaries: ParagraphSummary[] = [
  { id: "ps-1", timeRange: "00:00 - 02:00", summary: "8명의 중소기업 PM 대상 인터뷰 결과 공유. 가장 큰 페인포인트는 기존 도구의 복잡성과 높은 온보딩 진입장벽." },
  { id: "ps-2", timeRange: "02:00 - 04:00", summary: "온보딩 간소화 방안 논의. 템플릿 제공으로 초기 진입장벽 완화 결정. 이디자인님 담당으로 3개 템플릿 초안 작성 예정." },
  { id: "ps-3", timeRange: "04:00 - 06:00", summary: "협업 기능 중 실시간 편집은 1.1 버전으로 연기, 코멘트 기능만 MVP 포함. 가격 정책은 추가 조사 필요." },
  { id: "ps-4", timeRange: "06:00 - 09:00", summary: "UI 개선점: 다크모드, 대시보드 시각화 추가. 모바일 사용률 40%로 반응형 디자인 필수. 이메일 알림 MVP 포함." },
  { id: "ps-5", timeRange: "09:00 - 12:35", summary: "MVP 스코프 확정: 온보딩, 템플릿, 코멘트, 시각화, 반응형, 다크모드, 이메일 알림. 2월 10일 개발 완료, 15일 출시 목표." }
];

interface EvidenceDrop {
  id: string;
  title: string;
  summary: string;
  source: string;
  relevantFinding: string;
}

const evidenceDrops: EvidenceDrop[] = [
  {
    id: "ed-1",
    title: "Nielsen Norman Group 온보딩 연구",
    summary: "SaaS 온보딩 황금 시간 3-5분. 5분 초과 시 이탈률 급증.",
    source: "nngroup.com",
    relevantFinding: "lf-1"
  },
  {
    id: "ed-2",
    title: "2024 SaaS 가격 전략 보고서",
    summary: "경쟁사 대비 가격 책정 전략 분석. 중소기업 타겟 시 10-20% 저렴한 가격 권장.",
    source: "OpenView Partners",
    relevantFinding: "lf-2"
  },
  {
    id: "ed-3",
    title: "모바일 사용 패턴 대규모 조사",
    summary: "PM 도구 사용자 1,200명 대상 조사. 모바일 사용률 35-45% 확인.",
    source: "ProductPlan",
    relevantFinding: "lf-3"
  }
];

type IntegrationStatus = "integrated" | "partial" | "not";

interface DecisionSummary {
  id: string;
  title: string;
  status: "confirmed" | "deferred" | "pending";
  integrationStatus: IntegrationStatus;
}

const initialDecisionSummaries: DecisionSummary[] = [
  { id: "ds-1", title: "온보딩 5분 내 완료 목표", status: "confirmed", integrationStatus: "integrated" },
  { id: "ds-2", title: "MVP에 기본 템플릿 3종 포함", status: "confirmed", integrationStatus: "integrated" },
  { id: "ds-3", title: "실시간 편집 기능 1.1 버전으로 연기", status: "deferred", integrationStatus: "partial" },
  { id: "ds-4", title: "코멘트 기능 MVP 포함", status: "confirmed", integrationStatus: "integrated" },
  { id: "ds-5", title: "대시보드 시각화 MVP 포함", status: "confirmed", integrationStatus: "not" },
  { id: "ds-6", title: "가격 정책은 추가 조사 후 결정", status: "pending", integrationStatus: "not" }
];

const integrationStatusConfig: Record<IntegrationStatus, { label: string; color: string; bgColor: string }> = {
  integrated: { label: "통합됨", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  partial: { label: "부분 통합", color: "text-amber-600", bgColor: "bg-amber-50" },
  not: { label: "미통합", color: "text-slate-500", bgColor: "bg-slate-50" }
};

function LogicMarkBadge({ 
  mark, 
  onClick 
}: { 
  mark: LogicMark; 
  onClick: () => void;
}) {
  const config = logicMarkConfig[mark.type];
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border ${config.className} hover:opacity-80 transition-opacity cursor-pointer`}
      title={config.description}
      data-testid={`logic-mark-${mark.findingId}`}
    >
      {mark.type === "leap" && <AlertTriangle className="w-3 h-3" />}
      {mark.type === "missing" && <HelpCircle className="w-3 h-3" />}
      {mark.type === "ambiguous" && <Lightbulb className="w-3 h-3" />}
      <span>{config.label}</span>
    </button>
  );
}

function TranscriptItem({ 
  line, 
  isActive,
  onLogicMarkClick
}: { 
  line: TranscriptLine; 
  isActive: boolean;
  onLogicMarkClick?: (findingId: string) => void;
}) {
  return (
    <div 
      className={`group flex gap-3 py-3 px-4 rounded-md transition-all ${
        isActive ? "bg-primary/5" : "hover:bg-muted/50"
      } ${line.isHighlight ? "border-l-2 border-primary" : ""}`}
      data-testid={`transcript-line-${line.id}`}
    >
      <div className="flex-shrink-0 pt-0.5">
        <div className={`w-8 h-8 rounded-full ${line.speakerColor} flex items-center justify-center`}>
          <span className="text-white text-xs font-medium">{line.speaker.charAt(0)}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-medium text-foreground">{line.speaker}</span>
          <span className="text-xs text-muted-foreground">{line.timestamp}</span>
          {line.isHighlight && (
            <Badge variant="secondary" className="text-xs py-0 px-1.5 bg-primary/10 text-primary">
              핵심
            </Badge>
          )}
          {line.logicMark && (
            <LogicMarkBadge 
              mark={line.logicMark} 
              onClick={() => onLogicMarkClick?.(line.logicMark!.findingId)}
            />
          )}
        </div>
        <p className="text-sm text-foreground leading-relaxed">{line.text}</p>
      </div>
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1 rounded hover:bg-muted" data-testid={`bookmark-${line.id}`}>
          <Bookmark className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function LogicFindingCard({ 
  finding, 
  isHighlighted,
  onScrollToLine
}: { 
  finding: LogicFinding; 
  isHighlighted: boolean;
  onScrollToLine: (lineId: string) => void;
}) {
  const config = logicMarkConfig[finding.type];
  
  return (
    <div 
      className={`p-3 rounded-md border transition-all ${
        isHighlighted 
          ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
          : "border-border hover:border-border/80"
      }`}
      data-testid={`logic-finding-${finding.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border ${config.className}`}>
          {finding.type === "leap" && <AlertTriangle className="w-3 h-3" />}
          {finding.type === "missing" && <HelpCircle className="w-3 h-3" />}
          {finding.type === "ambiguous" && <Lightbulb className="w-3 h-3" />}
          <span>{config.description}</span>
        </div>
        <button
          onClick={() => onScrollToLine(finding.relatedLineIds[0])}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
          data-testid={`goto-line-${finding.id}`}
        >
          발언 보기
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">주장</p>
          <p className="text-foreground">{finding.claim}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">근거</p>
          <p className="text-foreground">{finding.given}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">검토 포인트</p>
          <p className="text-muted-foreground italic">{finding.gap}</p>
        </div>
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-0.5">제안 질문</p>
          <p className="text-primary/80 text-sm">&ldquo;{finding.suggestedQuestion}&rdquo;</p>
        </div>
      </div>
    </div>
  );
}

export default function MeetingDetail() {
  const params = useParams<{ projectId: string; meetingId: string }>();
  const projectId = params.projectId || "1";
  const meetingId = params.meetingId || "m1";
  
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedFinding, setHighlightedFinding] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<string>(logicFindings[0]?.id || "");
  const [role, setRole] = useState<"lead" | "member">("lead");
  const [meetingTitle, setMeetingTitle] = useState(meetingInfo.title);
  const [projectName, setProjectName] = useProjectName(projectId);
  const [decisionSummaries] = useState<DecisionSummary[]>(initialDecisionSummaries);
  const scrollRef = useRef<HTMLDivElement>(null);
  const logicFindingsRef = useRef<HTMLDivElement>(null);
  
  const [selectedDecisions, setSelectedDecisions] = useState<Set<string>>(new Set());
  const [selectedEvidence, setSelectedEvidence] = useState<Set<string>>(new Set());
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [commitSuccess, setCommitSuccess] = useState(false);
  
  const { addToMemory, isItemIntegrated, getIntegrationStatus } = useProjectMemory();
  
  const filteredEvidenceDrops = evidenceDrops.filter(drop => drop.relevantFinding === selectedFinding);

  const toggleDecisionSelection = (id: string) => {
    setSelectedDecisions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEvidenceSelection = (id: string) => {
    setSelectedEvidence(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleActionSelection = (id: string) => {
    setSelectedActions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearAllSelections = () => {
    setSelectedDecisions(new Set());
    setSelectedEvidence(new Set());
    setSelectedActions(new Set());
    setCommitSuccess(false);
  };

  const totalSelectedCount = selectedDecisions.size + selectedEvidence.size + selectedActions.size;

  const handleCommitToMemory = () => {
    const items: MemoryItem[] = [];
    const now = new Date().toISOString();

    selectedDecisions.forEach(id => {
      const decision = decisionSummaries.find(d => d.id === id);
      if (decision) {
        items.push({
          id: `mem-${id}-${Date.now()}`,
          type: "decision",
          title: decision.title,
          sourceId: id,
          sourceMeetingId: meetingId,
          integratedAt: now
        });
      }
    });

    selectedEvidence.forEach(id => {
      const evidence = evidenceDrops.find(e => e.id === id);
      if (evidence) {
        items.push({
          id: `mem-${id}-${Date.now()}`,
          type: "evidence",
          title: evidence.title,
          content: evidence.summary,
          sourceId: id,
          sourceMeetingId: meetingId,
          integratedAt: now
        });
      }
    });

    selectedActions.forEach(id => {
      const action = actionItemsData.find(a => a.id === id);
      if (action) {
        items.push({
          id: `mem-${id}-${Date.now()}`,
          type: "action",
          title: action.task,
          sourceId: id,
          sourceMeetingId: meetingId,
          integratedAt: now
        });
      }
    });

    if (items.length > 0) {
      addToMemory(projectId, items);
      setCommitSuccess(true);
      setSelectedDecisions(new Set());
      setSelectedEvidence(new Set());
      setSelectedActions(new Set());
    }
  };

  const getItemStatus = (sourceId: string): IntegrationStatus => {
    return isItemIntegrated(projectId, sourceId) ? "integrated" : "not";
  };

  const getMeetingIntegrationStatus = (): IntegrationStatus => {
    const integratedCount = decisionSummaries.filter(d => isItemIntegrated(projectId, d.id)).length;
    const totalCount = decisionSummaries.length;
    if (integratedCount === totalCount) return "integrated";
    if (integratedCount > 0) return "partial";
    return "not";
  };

  useEffect(() => {
    if (params.projectId && params.meetingId) {
      saveRecentMeeting({
        id: params.meetingId,
        title: meetingTitle,
        projectId: params.projectId
      });
    }
  }, [params.projectId, params.meetingId]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setActiveLine(prev => {
          const currentIndex = transcript.findIndex(t => t.id === prev);
          const nextIndex = currentIndex < transcript.length - 1 ? currentIndex + 1 : 0;
          return transcript[nextIndex].id;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const scrollToTime = (time: string) => {
    const line = transcript.find(t => t.timestamp === time);
    if (line) {
      setActiveLine(line.id);
      const element = document.querySelector(`[data-testid="transcript-line-${line.id}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const scrollToLogicFinding = (findingId: string) => {
    setHighlightedFinding(findingId);
    const element = document.querySelector(`[data-testid="logic-finding-${findingId}"]`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedFinding(null), 3000);
  };

  const scrollToTranscriptLine = (lineId: string) => {
    setActiveLine(lineId);
    const element = document.querySelector(`[data-testid="transcript-line-${lineId}"]`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-10 flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href={`/projects/${params.projectId}/meetings`}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                data-testid="link-back"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-muted-foreground">
                    <InlineEditableText
                      value={projectName}
                      onSave={setProjectName}
                      className="text-xs"
                      testId="text-project-name"
                    />
                  </span>
                  <span className="text-xs text-muted-foreground">/</span>
                </div>
                <h1 className="text-lg font-semibold text-foreground">
                  <InlineEditableText
                    value={meetingTitle}
                    onSave={setMeetingTitle}
                    testId="text-meeting-title"
                  />
                </h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {meetingInfo.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {meetingInfo.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {meetingInfo.participants.length}명
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background">
                <UserCog className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Role:</span>
                <button
                  onClick={() => setRole(role === "lead" ? "member" : "lead")}
                  className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                    role === "lead" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}
                  data-testid="toggle-role"
                >
                  {role === "lead" ? "Lead" : "Member"}
                </button>
              </div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover-elevate"
                data-testid="button-play-pause"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? "일시정지" : "재생"}
              </button>
              <button className="p-2 rounded-md hover:bg-muted" data-testid="button-more">
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-4 flex flex-col">
        <section className="mb-4 space-y-4 flex-shrink-0" data-testid="section-summary">
          <div className="grid grid-cols-2 gap-4">
            <Card data-testid="summary-decisions">
              <CardHeader className="py-3 px-4 border-b border-border">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Decisions
                  <span className={`text-xs px-2 py-0.5 rounded ${integrationStatusConfig[getMeetingIntegrationStatus()].bgColor} ${integrationStatusConfig[getMeetingIntegrationStatus()].color}`}>
                    {decisionSummaries.filter(d => d.integrationStatus === "integrated").length}/{decisionSummaries.length} 통합
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {decisionSummaries.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <ScrollArea className="h-40">
                <CardContent className="p-3">
                  <ul className="space-y-2">
                    {decisionSummaries.map(decision => {
                      const itemStatus = getItemStatus(decision.id);
                      const isSelected = selectedDecisions.has(decision.id);
                      const isAlreadyIntegrated = itemStatus === "integrated";
                      return (
                        <li key={decision.id} className="flex items-center gap-2" data-testid={`decision-${decision.id}`}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleDecisionSelection(decision.id)}
                            disabled={isAlreadyIntegrated}
                            data-testid={`decision-checkbox-${decision.id}`}
                          />
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            decision.status === "confirmed" ? "bg-emerald-500" : 
                            decision.status === "deferred" ? "bg-amber-500" : "bg-slate-400"
                          }`} />
                          <span className={`text-sm flex-1 ${isAlreadyIntegrated ? "text-muted-foreground" : "text-foreground"}`}>
                            {decision.title}
                          </span>
                          <span 
                            className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${integrationStatusConfig[itemStatus].bgColor} ${integrationStatusConfig[itemStatus].color}`}
                            data-testid={`decision-status-${decision.id}`}
                          >
                            {itemStatus === "integrated" ? (
                              <Check className="w-3 h-3" />
                            ) : itemStatus === "partial" ? (
                              <CircleDot className="w-3 h-3" />
                            ) : (
                              <Circle className="w-3 h-3" />
                            )}
                            <span>{integrationStatusConfig[itemStatus].label}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </ScrollArea>
            </Card>

            <Card data-testid="summary-action-items">
              <CardHeader className="py-3 px-4 border-b border-border">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-emerald-500" />
                  다음 할 일
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {actionItemsData.filter(a => a.completed).length}/{actionItemsData.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <ScrollArea className="h-40">
                <CardContent className="p-3">
                  <ul className="space-y-2">
                    {actionItemsData.map(item => {
                      const itemStatus = getItemStatus(item.id);
                      const isSelected = selectedActions.has(item.id);
                      const isAlreadyIntegrated = itemStatus === "integrated";
                      return (
                        <li key={item.id} className="flex items-start gap-2" data-testid={`action-summary-${item.id}`}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleActionSelection(item.id)}
                            disabled={isAlreadyIntegrated}
                            className="mt-0.5"
                            data-testid={`action-checkbox-${item.id}`}
                          />
                          <div className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center ${
                            item.completed ? "bg-emerald-500 border-emerald-500" : "border-border"
                          }`}>
                            {item.completed && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${item.completed ? "line-through text-muted-foreground" : isAlreadyIntegrated ? "text-muted-foreground" : "text-foreground"}`}>
                              {item.task}
                            </p>
                            <span className="text-xs text-muted-foreground">{item.assignee}</span>
                          </div>
                          {isAlreadyIntegrated && (
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              통합됨
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </ScrollArea>
            </Card>
          </div>

          <div className="relative space-y-1">
            <Card ref={logicFindingsRef} data-testid="summary-logic-findings" className="relative">
              <CardHeader className="py-3 px-4 border-b border-border">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  Logic Findings
                  <Badge variant="secondary" className="ml-auto text-xs bg-slate-100 text-slate-600">
                    {logicFindings.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ul className="flex flex-wrap gap-2">
                  {logicFindings.map((finding) => (
                    <li 
                      key={finding.id} 
                      className={`flex items-center gap-2 cursor-pointer rounded px-2.5 py-1.5 transition-all border ${
                        selectedFinding === finding.id 
                          ? "bg-primary/10 border-primary shadow-sm" 
                          : "border-border hover:bg-muted/50 hover:border-muted-foreground/30"
                      }`}
                      onClick={() => setSelectedFinding(finding.id)}
                      data-testid={`logic-summary-${finding.id}`}
                    >
                      <div className={`px-1.5 py-0.5 text-xs rounded border flex-shrink-0 ${logicMarkConfig[finding.type].className}`}>
                        {finding.type}
                      </div>
                      <span className={`text-xs ${selectedFinding === finding.id ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {finding.claim.length > 30 ? finding.claim.substring(0, 30) + "..." : finding.claim}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              {selectedFinding && (
                <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 flex flex-col items-center" data-testid="connection-line">
                  <div className="w-px h-1 bg-gradient-to-b from-primary/60 to-violet-500/60" />
                </div>
              )}
            </Card>

            <Card data-testid="section-evidence-drops" className="relative">
              {selectedFinding && (
                <div className="absolute left-1/2 -top-1 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-px h-1 bg-gradient-to-b from-primary/60 to-violet-500/60" />
                </div>
              )}
              <CardHeader className="py-3 px-4 border-b border-border">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-violet-600" />
                  Evidence Drops
                  <Badge variant="secondary" className="ml-auto text-xs bg-violet-100 text-violet-600">
                    {filteredEvidenceDrops.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {filteredEvidenceDrops.length > 0 ? (
                  <ul className="space-y-2">
                    {filteredEvidenceDrops.map(drop => {
                      const itemStatus = getItemStatus(drop.id);
                      const isSelected = selectedEvidence.has(drop.id);
                      const isAlreadyIntegrated = itemStatus === "integrated";
                      return (
                        <li 
                          key={drop.id} 
                          className="group p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                          data-testid={`evidence-drop-${drop.id}`}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleEvidenceSelection(drop.id)}
                              disabled={isAlreadyIntegrated}
                              className="mt-0.5"
                              data-testid={`evidence-checkbox-${drop.id}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`text-sm font-medium group-hover:text-primary transition-colors ${isAlreadyIntegrated ? "text-muted-foreground" : "text-foreground"}`}>
                                  {drop.title}
                                </h4>
                                {isAlreadyIntegrated ? (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 flex items-center gap-0.5 flex-shrink-0">
                                    <Check className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{drop.summary}</p>
                              <span className="text-xs text-primary mt-1 inline-block">{drop.source}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    선택된 Logic Finding에 대한 추천 자료가 없습니다.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="flex gap-6">
          <main className="flex-1 min-w-0" ref={scrollRef}>
            <Card className="h-[600px] flex flex-col overflow-hidden" data-testid="card-transcript">
              <CardHeader className="py-3 px-4 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Transcript
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">{transcript.length}개 발언</span>
                </div>
              </CardHeader>
              <div className="flex-1 overflow-auto">
                <div className="divide-y divide-border/50">
                  {transcript.map(line => (
                    <TranscriptItem 
                      key={line.id} 
                      line={line} 
                      isActive={activeLine === line.id}
                      onLogicMarkClick={scrollToLogicFinding}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </main>

          <aside className="w-80 flex-shrink-0 flex flex-col gap-4" data-testid="sidebar-summary">
            <Card className="h-[290px] flex flex-col overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-border flex-shrink-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-600" />
                  주요 주제
                </CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-auto">
                <ul className="divide-y divide-border/50">
                  {topics.map(topic => (
                    <li key={topic.id}>
                      <button
                        onClick={() => scrollToTime(topic.startTime)}
                        className="w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
                        data-testid={`topic-${topic.id}`}
                      >
                        <span className="text-sm text-foreground">{topic.title}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{topic.startTime}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="h-[290px] flex flex-col overflow-hidden" data-testid="card-paragraph-summaries">
              <CardHeader className="py-3 px-4 border-b border-border flex-shrink-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  단락별 요약
                </CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-auto">
                <ul className="divide-y divide-border/50">
                  {paragraphSummaries.map(summary => (
                    <li key={summary.id} className="p-3" data-testid={`summary-${summary.id}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary">{summary.timeRange}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{summary.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {(totalSelectedCount > 0 || commitSuccess) && (
        <div 
          className="fixed bottom-0 right-0 z-20 animate-in slide-in-from-bottom duration-300 pointer-events-none"
          style={{ left: '256px' }}
          data-testid="integration-commit-bar"
        >
          <div className="max-w-3xl mx-auto px-6 pb-6 pointer-events-auto">
            <div className="bg-card border border-border rounded-lg shadow-lg p-4">
              {commitSuccess ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        프로젝트 기억에 성공적으로 통합되었습니다
                      </p>
                      <p className="text-xs text-muted-foreground">
                        통합된 항목들은 프로젝트 전체에서 활용됩니다
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${projectId}/overview`}>
                      <Button variant="outline" size="sm" data-testid="button-view-memory">
                        <Database className="w-4 h-4 mr-1.5" />
                        프로젝트 기억에서 보기
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setCommitSuccess(false)}
                      data-testid="button-dismiss-success"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        선택됨 {totalSelectedCount}개
                        {selectedDecisions.size > 0 && `: 결정 ${selectedDecisions.size}`}
                        {selectedEvidence.size > 0 && `, 근거 ${selectedEvidence.size}`}
                        {selectedActions.size > 0 && `, 할일 ${selectedActions.size}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        선택한 항목을 프로젝트 기억에 통합합니다
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllSelections}
                      data-testid="button-clear-selection"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      선택 해제
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCommitToMemory}
                      data-testid="button-commit-memory"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      프로젝트 기억에 통합
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
