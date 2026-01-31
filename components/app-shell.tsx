'use client'

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  Mic,
  Square,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  FolderKanban,
  Clock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProject } from "@/lib/project-context";
import { transcribeAudio } from "@/app/actions/transcribe";
import { createMeeting } from "@/app/actions/meetings";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface RecentMeeting {
  id: string;
  title: string;
  projectId: string;
  viewedAt: number;
}

const RECENT_MEETINGS_KEY = "trace-pm-recent-meetings";
const MAX_RECENT_MEETINGS = 10;

function getRecentMeetings(): RecentMeeting[] {
  try {
    const stored = localStorage.getItem(RECENT_MEETINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveRecentMeeting(meeting: Omit<RecentMeeting, "viewedAt">): void {
  const meetings = getRecentMeetings();
  const filtered = meetings.filter(m => !(m.id === meeting.id && m.projectId === meeting.projectId));
  const updated = [{ ...meeting, viewedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT_MEETINGS);
  localStorage.setItem(RECENT_MEETINGS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("recent-meetings-updated"));
}

interface AppShellProps {
  projectId: string;
  children: React.ReactNode;
}

export function AppShell({ projectId, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recentMeetings, setRecentMeetings] = useState<RecentMeeting[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { projects, currentProject } = useProject();

  useEffect(() => {
    setRecentMeetings(getRecentMeetings());
    const handleUpdate = () => setRecentMeetings(getRecentMeetings());
    window.addEventListener("recent-meetings-updated", handleUpdate);
    return () => window.removeEventListener("recent-meetings-updated", handleUpdate);
  }, []);

  const currentMeetingMatch = pathname?.match(/\/projects\/(\d+)\/meetings\/([^/]+)/);
  const currentMeetingId = currentMeetingMatch ? currentMeetingMatch[2] : null;

  const projectRecentMeetings = recentMeetings
    .filter(m => m.projectId === projectId)
    .sort((a, b) => {
      if (a.id === currentMeetingId) return -1;
      if (b.id === currentMeetingId) return 1;
      return b.viewedAt - a.viewedAt;
    })
    .slice(0, MAX_RECENT_MEETINGS);

  const navItems: NavItem[] = [
    { href: `/projects/${projectId}/overview`, label: "Overview", icon: LayoutDashboard },
    { href: `/projects/${projectId}/meetings`, label: "Meetings", icon: MessageSquare },
    { href: `/projects/${projectId}/evidence`, label: "Evidence", icon: FileText },
  ];

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    if (isRecording || isProcessing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/ogg';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
        await processRecording(audioBlob, recordingTime);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access failed:", err);
      alert("Microphone access is required to record audio.");
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const processRecording = async (blob: Blob, duration: number) => {
    setIsProcessing(true);
    try {
      // 1. Transcribe (Uploads to Supabase internally in the action)
      const formData = new FormData();
      formData.append('file', blob);

      const transcribeResult = await transcribeAudio(formData);
      if ('error' in transcribeResult) throw new Error(transcribeResult.error);

      // 2. Save to DB
      const saveResult = await createMeeting({
        title: `Meeting ${new Date().toLocaleString('ko-KR')}`,
        projectId: projectId,
        durationSeconds: duration,
        transcript: transcribeResult.text as string,
        audioUrl: transcribeResult.audioUrl as string,
        participants: []
      });

      if (!saveResult.success) throw new Error(saveResult.error);

      alert("Meeting saved and processed successfully!");
      router.push(`/projects/${projectId}/meetings`);
      router.refresh(); // Refresh list
    } catch (err: any) {
      console.error("Failed to process recording:", err);
      alert("Failed to save and process recording: " + err.message);
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProjectChange = (newProjectId: string) => {
    router.push(`/projects/${newProjectId}/overview`);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <aside
        className={`flex-shrink-0 h-screen border-r border-border bg-white flex flex-col transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"
          }`}
        data-testid="sidebar-main"
      >
        <div className="flex-shrink-0 p-4 border-b border-border">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 hover:bg-muted rounded-md p-1 -m-1 transition-colors flex-1 min-w-0"
                      data-testid="dropdown-project-selector"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground text-sm font-bold">T</span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold text-foreground truncate">{currentProject?.name || "프로젝트"}</p>
                        <p className="text-xs text-muted-foreground">프로젝트</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {projects.map(project => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => handleProjectChange(project.id)}
                        className="flex items-center justify-between"
                        data-testid={`menu-item-project-${project.id}`}
                      >
                        <span>{project.name}</span>
                        {project.id === projectId && <Check className="w-4 h-4 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      onClick={() => router.push("/projects")}
                      className="border-t mt-1 pt-2"
                      data-testid="menu-item-all-projects"
                    >
                      <FolderKanban className="w-4 h-4 mr-2" />
                      모든 프로젝트 보기
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(true)}
                  className="flex-shrink-0 h-8 w-8"
                  data-testid="button-collapse-sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <button
                className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors w-full"
                data-testid="nav-settings"
              >
                <Settings className="w-3.5 h-3.5" />
                설정
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link href={`/projects/${projectId}/overview`}>
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center" data-testid="logo-collapsed">
                  <span className="text-primary-foreground text-sm font-bold">T</span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(false)}
                className="h-8 w-8"
                data-testid="button-expand-sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <button
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                data-testid="nav-settings-collapsed"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className={`flex-shrink-0 p-3 ${isCollapsed ? "px-2" : ""}`}>
          {isProcessing ? (
            <Button
              disabled
              className={`w-full bg-slate-400 text-white ${isCollapsed ? "px-0" : ""}`}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              {!isCollapsed && <span className="ml-2">Processing...</span>}
            </Button>
          ) : isRecording ? (
            <Button
              onClick={stopRecording}
              className={`w-full bg-red-500 hover:bg-red-600 text-white animate-pulse ${isCollapsed ? "px-0" : ""}`}
              data-testid="button-stop-recording"
            >
              <Square className="w-4 h-4" />
              {!isCollapsed && (
                <span className="ml-2">Stop {formatTime(recordingTime)}</span>
              )}
            </Button>
          ) : (
            <Button
              onClick={startRecording}
              className={`w-full bg-primary hover:bg-primary/90 ${isCollapsed ? "px-0" : ""}`}
              data-testid="button-start-recording"
            >
              <Mic className="w-4 h-4" />
              {!isCollapsed && <span className="ml-2">New Recording</span>}
            </Button>
          )}
        </div>

        <nav className="flex-1 p-3 overflow-auto min-h-0">
          <ul className="space-y-1">
            {navItems.map(item => (
              <div key={item.href}>
                <NavLink item={item} isCollapsed={isCollapsed} pathname={pathname} />
                {item.label === "Meetings" && !isCollapsed && projectRecentMeetings.length > 0 && (
                  <div className="ml-7 mt-1 space-y-0.5" data-testid="recent-meetings-list">
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">최근 조회</span>
                    </div>
                    {projectRecentMeetings.map(meeting => (
                      <Link
                        key={meeting.id}
                        href={`/projects/${projectId}/meetings/${meeting.id}`}
                        className={`block px-2 py-1.5 text-xs rounded-md truncate transition-colors ${meeting.id === currentMeetingId
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        data-testid={`recent-meeting-${meeting.id}`}
                      >
                        {meeting.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function NavLink({ item, isCollapsed, pathname }: { item: NavItem; isCollapsed: boolean; pathname: string | null }) {
  const active = pathname?.startsWith(item.href) || false;

  return (
    <li>
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
          } ${isCollapsed ? "justify-center px-0" : ""}`}
        data-testid={`nav-${item.label.toLowerCase()}`}
      >
        <item.icon className="w-4 h-4" />
        {!isCollapsed && item.label}
      </Link>
    </li>
  );
}
