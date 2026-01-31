import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FolderKanban, 
  Calendar, 
  Users, 
  Plus,
  ChevronRight,
  LayoutDashboard,
  Lightbulb,
  FileText
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "planning" | "completed";
  decisionsCount: number;
  meetingsCount: number;
  evidenceCount: number;
  lastUpdated: string;
  members: number;
}

const projects: Project[] = [
  {
    id: "1",
    name: "TRACE PM MVP",
    description: "프로젝트 관리 도구 MVP 개발. 결정 추적, 미팅 녹음, 근거 관리 기능 포함.",
    status: "active",
    decisionsCount: 3,
    meetingsCount: 2,
    evidenceCount: 5,
    lastUpdated: "2025-01-30",
    members: 4
  },
  {
    id: "2",
    name: "모바일 앱 리디자인",
    description: "기존 모바일 앱의 UX/UI 전면 개편 프로젝트.",
    status: "planning",
    decisionsCount: 1,
    meetingsCount: 3,
    evidenceCount: 8,
    lastUpdated: "2025-01-28",
    members: 6
  },
  {
    id: "3",
    name: "B2B 플랫폼 구축",
    description: "기업 고객 대상 SaaS 플랫폼 신규 구축.",
    status: "active",
    decisionsCount: 5,
    meetingsCount: 7,
    evidenceCount: 12,
    lastUpdated: "2025-01-29",
    members: 8
  }
];

const statusConfig = {
  active: { label: "진행중", className: "bg-emerald-100 text-emerald-700" },
  planning: { label: "계획중", className: "bg-blue-100 text-blue-700" },
  completed: { label: "완료", className: "bg-slate-100 text-slate-600" }
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-lg font-bold">T</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">
                  TRACE PM
                </h1>
                <p className="text-sm text-muted-foreground">프로젝트 목록</p>
              </div>
            </div>
            <Button className="gap-2" data-testid="button-new-project">
              <Plus className="w-4 h-4" />
              새 프로젝트
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => {
            const statusInfo = statusConfig[project.status];
            return (
              <Link 
                key={project.id} 
                href={`/projects/${project.id}/overview`}
                className="block"
              >
                <Card 
                  className="h-full hover-elevate cursor-pointer transition-all" 
                  data-testid={`card-project-${project.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FolderKanban className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{project.name}</h3>
                          <Badge variant="secondary" className={`text-xs mt-1 ${statusInfo.className}`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5" />
                        결정 {project.decisionsCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        미팅 {project.meetingsCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        근거 {project.evidenceCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {project.members}명 참여
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {project.lastUpdated}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
