import { useState, useRef, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
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
  FolderKanban
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface Project {
  id: string;
  name: string;
}

const projects: Project[] = [
  { id: "1", name: "TRACE PM MVP" },
  { id: "2", name: "모바일 앱 리디자인" },
  { id: "3", name: "B2B 플랫폼 구축" },
];

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

  const currentProject = projects.find(p => p.id === projectId) || projects[0];

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

  const handleProjectChange = (newProjectId: string) => {
    navigate(`/projects/${newProjectId}/overview`);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <aside 
        className={`flex-shrink-0 h-screen border-r border-border bg-white flex flex-col transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
        data-testid="sidebar-main"
      >
        <div className="flex-shrink-0 p-4 border-b border-border">
          {!isCollapsed ? (
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
                      <p className="text-sm font-semibold text-foreground truncate">{currentProject.name}</p>
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
                    onClick={() => navigate("/projects")}
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
            </div>
          )}
        </div>

        <div className={`flex-shrink-0 p-3 ${isCollapsed ? "px-2" : ""}`}>
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

        <div className={`flex-shrink-0 p-3 border-t border-border bg-white ${isCollapsed ? "px-2" : ""}`}>
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

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
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
