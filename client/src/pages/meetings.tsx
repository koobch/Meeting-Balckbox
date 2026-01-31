import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, ChevronRight } from "lucide-react";

const meetingsData = [
  {
    id: "m1",
    title: "사용자 인터뷰 결과 공유 미팅",
    date: "2025-01-29",
    duration: "47분",
    participants: ["김연구", "이디자인", "박개발", "최PM"],
    keyPoints: ["온보딩 복잡성", "협업 기능 부족", "가격 민감도"],
    status: "완료"
  },
  {
    id: "m2",
    title: "MVP 스코프 확정 회의",
    date: "2025-01-27",
    duration: "62분",
    participants: ["최PM", "박개발", "이디자인"],
    keyPoints: ["핵심 기능 정의", "일정 조율", "리소스 배분"],
    status: "완료"
  },
  {
    id: "m3",
    title: "기술 스택 검토",
    date: "2025-01-25",
    duration: "35분",
    participants: ["박개발", "최PM"],
    keyPoints: ["프론트엔드 선택", "백엔드 구조", "DB 설계"],
    status: "완료"
  }
];

export default function MeetingsPage() {
  const params = useParams<{ projectId: string }>();

  return (
    <div className="flex-1 overflow-auto">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">
            Meetings
          </h1>
          <p className="text-sm text-muted-foreground">프로젝트 미팅 기록</p>
        </div>
      </header>

      <div className="p-6">
        <div className="space-y-3">
          {meetingsData.map(meeting => (
            <Link 
              key={meeting.id} 
              href={`/projects/${params.projectId}/meetings/${meeting.id}`}
            >
              <Card className="hover-elevate cursor-pointer" data-testid={`meeting-card-${meeting.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{meeting.title}</h3>
                        <Badge variant="secondary" className="text-xs">{meeting.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {meeting.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {meeting.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {meeting.participants.length}명
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {meeting.keyPoints.map(point => (
                          <span 
                            key={point}
                            className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                          >
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
