import { useState, useRef, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText,
  MessageCircleQuestion,
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
import { ChatDrawer } from "./chat-drawer";

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
  const [isChatOpen, setIsChatOpen] = useState(false);
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
        className={`flex-shrink-0 border-r border-border bg-white flex flex-col transition-all duration-300 relative ${
          isCollapsed ? "w-16" : "w-64"
        }`}
        data-testid="sidebar-main"
      >
        <div className="p-4 border-b border-border flex items-center justify-between gap-2">
          {!isCollapsed ? (
            <>
              <Link href={`/projects/${projectId}/overview`}>
                <div className="flex items-center gap-2" data-testid="logo">
                  <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-sm font-bold">T</span>
                  </div>
                  <span className="text-lg font-semibold text-foreground">TRACE PM</span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="flex-shrink-0 h-8 w-8"
                data-testid="button-collapse-sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full">
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
            </div>
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

        <nav className="flex-1 p-3 overflow-auto min-h-0">
          <ul className="space-y-1">
            {navItems.map(item => (
              <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
            ))}
          </ul>
        </nav>

        <div className={`flex-shrink-0 p-3 space-y-2 border-t border-border bg-white ${isCollapsed ? "px-2" : ""}`}>
          <Button
            variant="outline"
            onClick={() => setIsChatOpen(true)}
            className={`w-full rounded-full shadow-sm ${isCollapsed ? "px-0" : ""}`}
            data-testid="button-open-chat"
          >
            <MessageCircleQuestion className="w-4 h-4 text-primary" />
            {!isCollapsed && <span className="ml-2 truncate">PM 비서에게 질문</span>}
          </Button>

          <Button
            variant="ghost"
            className={`w-full justify-start ${isCollapsed ? "px-0 justify-center" : ""}`}
            data-testid="nav-settings"
          >
            <Settings className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2">설정</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

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
