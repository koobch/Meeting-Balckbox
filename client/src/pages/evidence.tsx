import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ExternalLink, Calendar } from "lucide-react";

const evidenceData = [
  {
    id: "ev-1",
    title: "사용자 인터뷰 녹취록",
    summary: "8명의 중소기업 PM 대상 심층 인터뷰. 온보딩 복잡성, 협업 기능, 가격에 대한 피드백 수집.",
    source: "내부 리서치",
    type: "interview",
    addedAt: "2025-01-29",
    linkedDecisions: ["dec-1", "dec-2"]
  },
  {
    id: "ev-2",
    title: "Nielsen Norman Group 온보딩 연구",
    summary: "SaaS 온보딩 황금 시간 3-5분. 5분 초과 시 이탈률 급증.",
    source: "nngroup.com",
    type: "external",
    addedAt: "2025-01-28",
    linkedDecisions: ["dec-1"]
  },
  {
    id: "ev-3",
    title: "ProductPlan 벤치마크 보고서",
    summary: "PM 도구 평균 Time-to-Value 7.2분, 상위 10% 제품 4분 미만.",
    source: "productplan.com",
    type: "external",
    addedAt: "2025-01-28",
    linkedDecisions: ["dec-1"]
  },
  {
    id: "ev-4",
    title: "경쟁사 분석 문서",
    summary: "Jira, Asana, Notion 기능 및 가격 비교 분석.",
    source: "내부 문서",
    type: "document",
    addedAt: "2025-01-27",
    linkedDecisions: ["dec-2", "dec-3"]
  },
  {
    id: "ev-5",
    title: "기술 검토 회의록",
    summary: "실시간 편집 구현 복잡도 및 일정 영향 분석.",
    source: "미팅 기록",
    type: "meeting",
    addedAt: "2025-01-25",
    linkedDecisions: ["dec-3"]
  }
];

const typeConfig = {
  interview: { label: "인터뷰", className: "bg-blue-100 text-blue-700" },
  external: { label: "외부 자료", className: "bg-violet-100 text-violet-700" },
  document: { label: "문서", className: "bg-emerald-100 text-emerald-700" },
  meeting: { label: "미팅", className: "bg-amber-100 text-amber-700" }
};

export default function EvidencePage() {
  return (
    <div className="flex-1 overflow-auto">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">
            Evidence
          </h1>
          <p className="text-sm text-muted-foreground">프로젝트 근거 자료</p>
        </div>
      </header>

      <div className="p-6">
        <div className="space-y-3">
          {evidenceData.map(evidence => {
            const typeInfo = typeConfig[evidence.type as keyof typeof typeConfig];
            return (
              <Card key={evidence.id} className="hover-elevate cursor-pointer" data-testid={`evidence-card-${evidence.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-foreground">{evidence.title}</h3>
                        <Badge variant="secondary" className={`text-xs ${typeInfo.className}`}>
                          {typeInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{evidence.summary}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {evidence.source}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {evidence.addedAt}
                        </span>
                        <span>연결된 결정 {evidence.linkedDecisions.length}개</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
