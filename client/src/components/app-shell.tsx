import { useState, useRef, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText,
  HelpCircle,
  Settings,
  Mic,
  Square,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface AppShellProps {
  projectId: string;
  children: React.ReactNode;
}

export function AppShell({ projectId, children }: AppShellProps) {
  const [, navigate] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const startRecording = () => {
    if (isRecording) return;
    setIsRecording(true);
    setRecordingTime(0);
    intervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setShowTitleDialog(true);
  };

  const saveMeeting = () => {
    const title = meetingTitle.trim() || `미팅 ${new Date().toLocaleDateString('ko-KR')}`;
    console.log("Meeting saved:", { title, duration: recordingTime });
    setShowTitleDialog(false);
    setMeetingTitle("");
    setRecordingTime(0);
    navigate(`/projects/${projectId}/meetings`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside 
        className={`flex-shrink-0 border-r border-border bg-white flex flex-col transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
        data-testid="sidebar-main"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!isCollapsed && (
            <Link href={`/projects/${projectId}/overview`}>
              <div className="flex items-center gap-2" data-testid="logo">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">T</span>
                </div>
                <span className="text-lg font-semibold text-foreground">TRACE PM</span>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <Link href={`/projects/${projectId}/overview`}>
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center mx-auto" data-testid="logo-collapsed">
                <span className="text-primary-foreground text-sm font-bold">T</span>
              </div>
            </Link>
          )}
        </div>

        <div className={`p-3 ${isCollapsed ? "px-2" : ""}`}>
          {isRecording ? (
            <Button
              onClick={stopRecording}
              className={`w-full bg-red-500 hover:bg-red-600 text-white ${isCollapsed ? "px-0" : ""}`}
              data-testid="button-stop-recording"
            >
              <Square className="w-4 h-4" />
              {!isCollapsed && (
                <span className="ml-2">녹음 중 {formatTime(recordingTime)}</span>
              )}
            </Button>
          ) : (
            <Button
              onClick={startRecording}
              className={`w-full bg-primary hover:bg-primary/90 ${isCollapsed ? "px-0" : ""}`}
              data-testid="button-start-recording"
            >
              <Mic className="w-4 h-4" />
              {!isCollapsed && <span className="ml-2">녹음하기</span>}
            </Button>
          )}
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map(item => (
              <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-border">
          <ul className="space-y-1">
            <li>
              <Link
                href="/ask"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
                  isCollapsed ? "justify-center px-0" : ""
                }`}
                data-testid="nav-ask"
              >
                <HelpCircle className="w-4 h-4" />
                {!isCollapsed && "PM 비서에게 질문"}
              </Link>
            </li>
            <li>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
                  isCollapsed ? "justify-center px-0" : ""
                }`}
                data-testid="nav-settings"
              >
                <Settings className="w-4 h-4" />
                {!isCollapsed && "설정"}
              </button>
            </li>
          </ul>
        </div>

        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center"
            data-testid="button-toggle-sidebar"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="ml-2">접기</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>

      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>미팅 제목 설정</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="미팅 제목을 입력하세요"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              data-testid="input-meeting-title"
              autoFocus
            />
            <p className="text-sm text-muted-foreground mt-2">
              녹음 시간: {formatTime(recordingTime)}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTitleDialog(false)}
              data-testid="button-cancel-save"
            >
              취소
            </Button>
            <Button
              onClick={saveMeeting}
              data-testid="button-save-meeting"
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavLink({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) {
  const [isActive] = useRoute(item.href);
  const [isActiveWithSub] = useRoute(`${item.href}/*`);
  const active = isActive || isActiveWithSub;

  return (
    <li>
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
          active 
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
