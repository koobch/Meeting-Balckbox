import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Link2, FileText } from "lucide-react";

const decisionsData = [
  {
    id: "dec-1",
    title: "온보딩 5분 내 완료 목표",
    description: "신규 사용자가 5분 내에 첫 프로젝트를 생성하고 기본 기능을 사용할 수 있도록 온보딩 프로세스 설계",
    status: "integrated",
    strength: "strong",
    evidenceCount: 5,
    tags: ["UX", "온보딩", "MVP"]
  },
  {
    id: "dec-2",
    title: "MVP에 템플릿 3종 포함",
    description: "프로젝트 관리, 스프린트 플래닝, 버그 트래킹 템플릿을 MVP에 포함하여 초기 사용자 진입장벽 낮춤",
    status: "integrated",
    strength: "medium",
    evidenceCount: 3,
    tags: ["기능", "MVP"]
  },
  {
    id: "dec-3",
    title: "실시간 편집 1.1로 연기",
    description: "기술적 복잡도를 고려하여 실시간 협업 편집 기능은 MVP 이후 버전으로 연기",
    status: "draft",
    strength: "weak",
    evidenceCount: 2,
    tags: ["로드맵", "기술"]
  }
];

const strengthConfig = {
  strong: { label: "Strong", className: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700" },
  weak: { label: "Weak", className: "bg-red-100 text-red-700" }
};

export default function DecisionsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">
            Decisions
          </h1>
          <p className="text-sm text-muted-foreground">프로젝트 결정 사항</p>
        </div>
      </header>

      <div className="p-6">
        <div className="space-y-3">
          {decisionsData.map(decision => {
            const strength = strengthConfig[decision.strength as keyof typeof strengthConfig];
            return (
              <Card key={decision.id} className="hover-elevate cursor-pointer" data-testid={`decision-card-${decision.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-foreground">{decision.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${decision.status === "integrated" ? "border-emerald-300 text-emerald-700" : "border-slate-300 text-slate-600"}`}
                        >
                          {decision.status === "integrated" ? "Integrated" : "Draft"}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${strength.className}`}>
                          {strength.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{decision.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          근거 {decision.evidenceCount}개
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {decision.tags.join(", ")}
                        </span>
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
