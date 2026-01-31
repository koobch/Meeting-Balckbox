import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Lightbulb, 
  Calendar, 
  AlertCircle, 
  FileText, 
  Link2, 
  ChevronRight,
  Zap
} from "lucide-react";

type Status = "draft" | "integrated";
type EvidenceStrength = "strong" | "medium" | "weak";

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
    tags: ["MVP 정의", "로드맵"]
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
    tags: ["기술 검토"]
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
    tags: ["시장 분석", "경쟁사 분석"]
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
    keyPoints: ["핵심 페인포인트 3가지 도출", "우선순위 재정의 필요"]
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
    keyPoints: ["2주 스프린트 사이클 확정", "일일 스탠드업 10AM"]
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
    relatedDecisions: ["B2B SaaS 비즈니스 모델 채택"]
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
    relatedDecisions: ["React + TypeScript 기술 스택 선정"]
  }
];

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
        </div>
        <MetaInfo evidenceCount={meeting.evidenceCount} segmentCount={meeting.segmentCount} />
      </CardContent>
    </Card>
  );
}

function GapCard({ gap }: { gap: GapData }) {
  const priorityConfig = {
    high: { label: "높음", className: "bg-red-50 text-red-700 border-red-200" },
    medium: { label: "보통", className: "bg-amber-50 text-amber-700 border-amber-200" },
    low: { label: "낮음", className: "bg-slate-50 text-slate-600 border-slate-200" }
  };

  return (
    <Card className="hover-elevate cursor-pointer transition-all border-dashed" data-testid={`card-gap-${gap.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">Gap</span>
              <h3 className="text-base font-semibold text-foreground leading-tight">{gap.title}</h3>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4">{gap.description}</p>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <StatusBadge status={gap.status} />
          <StrengthBadge strength={gap.strength} />
          <Badge variant="outline" className={priorityConfig[gap.priority].className}>
            우선순위: {priorityConfig[gap.priority].label}
          </Badge>
        </div>
        <MetaInfo evidenceCount={gap.evidenceCount} segmentCount={gap.segmentCount} />
        {gap.relatedDecisions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">연결된 결정:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {gap.relatedDecisions.map(dec => (
                <span key={dec} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {dec}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProjectOverview() {
  const params = useParams<{ id: string }>();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-lg font-semibold">P</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground" data-testid="text-project-title">
                프로젝트 {params.id}
              </h1>
              <p className="text-sm text-muted-foreground">Overview</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-6 py-6">
        <section className="mb-6" data-testid="section-keywords">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">키워드</h2>
          <div className="flex flex-wrap gap-2">
            {keywords.map(keyword => (
              <button
                key={keyword}
                className="px-3 py-1.5 text-sm rounded-full border border-border bg-white text-foreground hover-elevate transition-all"
                data-testid={`chip-keyword-${keyword}`}
              >
                {keyword}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground" data-testid="section-decisions-title">
              주요 결정사항
            </h2>
            <Badge variant="secondary" className="ml-auto">{decisions.length}</Badge>
          </div>
          <div className="space-y-4" data-testid="list-decisions">
            {decisions.map(decision => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}
          </div>
        </section>

        <section className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-violet-100 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground" data-testid="section-meetings-title">
              미팅 기록
            </h2>
            <Badge variant="secondary" className="ml-auto">{meetings.length}</Badge>
          </div>
          <div className="space-y-4" data-testid="list-meetings">
            {meetings.map(meeting => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground" data-testid="section-gaps-title">
              보완 필요 항목
            </h2>
            <Badge variant="secondary" className="ml-auto">{gaps.length}</Badge>
          </div>
          <div className="space-y-4" data-testid="list-gaps">
            {gaps.map(gap => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
