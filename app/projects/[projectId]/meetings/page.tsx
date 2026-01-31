"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Users, Clock, ChevronRight, Search, Mic, Upload, Loader2 } from "lucide-react";
import { createMeeting, getMeetings } from "@/app/actions/meetings";

interface MeetingUI {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: string[];
  keyPoints: string[];
  status: string;
}

const PROJECT_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function MeetingsPage() {
  const params = useParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [meetings, setMeetings] = useState<MeetingUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0분";
    const mins = Math.floor(seconds / 60);
    return mins > 0 ? `${mins}분` : `${seconds}초`;
  };

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMeetings(PROJECT_ID);
      if (result.success && result.data) {
        const formatted: MeetingUI[] = result.data.map((m: any) => ({
          id: m.id,
          title: m.title,
          date: m.meeting_date ? new Date(m.meeting_date).toLocaleDateString('ko-KR') : "-",
          duration: formatDuration(m.audio_duration_seconds),
          participants: m.participants || [],
          keyPoints: m.topics || [],
          status: m.status || "완료"
        }));
        setMeetings(formatted);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      alert("Please upload a .txt file.");
      return;
    }

    setIsUploading(true);
    try {
      const text = await file.text();
      const result = await createMeeting({
        title: `Imported Transcript`,
        projectId: PROJECT_ID,
        transcript: text,
        participants: []
      });

      if (result.success) {
        alert("Transcript uploaded successfully!");
        fetchMeetings(); // Refresh list
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert("Failed to upload transcript: " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) return meetings;
    const query = searchQuery.toLowerCase();
    return meetings.filter((meeting) =>
      meeting.title.toLowerCase().includes(query)
    );
  }, [searchQuery, meetings]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="flex-shrink-0 border-b border-border bg-white dark:bg-background">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1
                className="text-xl font-semibold text-foreground"
                data-testid="text-page-title"
              >
                Meetings
              </h1>
              <p className="text-sm text-muted-foreground">프로젝트 미팅 기록</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt"
                className="hidden"
              />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Transcript (.txt)
              </Button>

              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="회의록 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-meetings"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-h-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>회의 목록을 불러오는 중입니다...</p>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>"{searchQuery}"에 대한 검색 결과가 없습니다.</p>
            </div>
          ) : (
            filteredMeetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/projects/${params.projectId}/meetings/${meeting.id}`}
              >
                <Card
                  className="hover-elevate cursor-pointer border-border/50 shadow-sm"
                  data-testid={`meeting-card-${meeting.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground text-lg truncate">
                            {meeting.title}
                          </h3>
                          <Badge variant="secondary" className="text-xs bg-secondary/50 font-medium">
                            {meeting.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {meeting.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {meeting.duration}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            {meeting.participants.length}명
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50 flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

