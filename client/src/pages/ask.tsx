import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  Send, 
  Bot, 
  User,
  Sparkles,
  FileSearch,
  CheckCircle
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const presetResponses = [
  {
    id: "preset-1",
    label: "근거 부족 안내",
    icon: FileSearch,
    userMessage: "이 결정에 대한 근거가 있나요?",
    assistantMessage: `이 결정의 근거가 회의 내에서 명시되지 않았습니다.

관련 발언을 검토한 결과, "5분 내 온보딩 완료" 목표는 사용자들이 기존 도구의 복잡성에 대해 불만을 표현한 것에서 도출된 것으로 보입니다. 다만 구체적인 시간 기준(5분)이 어떤 데이터나 벤치마크를 참고한 것인지는 회의록에서 확인되지 않습니다.

**추천 다음 단계:**
- 경쟁사 온보딩 시간 벤치마크 조사
- 사용자 테스트를 통한 적정 시간 검증
- 관련 이해관계자에게 근거 확인 요청`
  },
  {
    id: "preset-2",
    label: "외부 근거 발견",
    icon: Sparkles,
    userMessage: "관련된 외부 자료가 있나요?",
    assistantMessage: `외부 근거 2건을 찾았습니다.

**1. Nielsen Norman Group 연구 (2024)**
> "SaaS 온보딩의 황금 시간은 3-5분입니다. 5분을 초과하면 이탈률이 급격히 증가합니다."
> 출처: nngroup.com/articles/saas-onboarding

**2. ProductPlan 벤치마크 보고서**
> "프로젝트 관리 도구의 평균 첫 가치 도달 시간(Time-to-Value)은 7.2분이며, 상위 10% 제품은 4분 미만입니다."
> 출처: productplan.com/benchmarks/2024

이 자료들은 "5분 온보딩" 목표를 뒷받침하는 근거로 활용될 수 있습니다. 프로젝트 근거에 추가하시겠습니까?`
  },
  {
    id: "preset-3",
    label: "통합 제안",
    icon: CheckCircle,
    userMessage: "이 결정을 프로젝트에 반영해도 될까요?",
    assistantMessage: `이 결정을 통합하시겠습니까?

**결정 요약:**
- 온보딩 시간 목표: 5분 이내
- 관련 근거: 사용자 인터뷰 피드백 + 외부 벤치마크 2건
- 상태: 검토 완료

**통합 시 반영 사항:**
1. Decision Card가 "Integrated" 상태로 변경됩니다
2. Live Brief에 해당 결정이 추가됩니다
3. Evidence 3건이 프로젝트 기억에 저장됩니다

이 작업을 진행하려면 Overview 페이지의 MergeTray에서 [통합] 버튼을 클릭해 주세요.`
  }
];

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "안녕하세요, 프로젝트 PM 비서입니다. 결정의 근거 확인, 외부 자료 검색, 통합 관련 질문을 도와드릴 수 있습니다. 무엇을 도와드릴까요?",
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputValue, setInputValue] = useState("");

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handlePresetClick = (preset: typeof presetResponses[0]) => {
    addMessage("user", preset.userMessage);
    setTimeout(() => {
      addMessage("assistant", preset.assistantMessage);
    }, 500);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    addMessage("user", inputValue);
    setInputValue("");
    setTimeout(() => {
      addMessage("assistant", "질문을 이해했습니다. 해당 내용에 대해 분석 중입니다. 잠시만 기다려 주세요.\n\n(데모 모드에서는 상단의 프리셋 버튼을 사용하여 시나리오별 응답을 확인하실 수 있습니다.)");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/projects/1/overview"
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                data-testid="link-back"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground" data-testid="text-page-title">
                    PM 비서에게 질문
                  </h1>
                  <p className="text-xs text-muted-foreground">시니어 PM 관점의 조언을 제공합니다</p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">Demo Mode</Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full flex flex-col">
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">프리셋 시나리오</p>
          <div className="flex flex-wrap gap-2">
            {presetResponses.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border bg-white hover:bg-muted/50 transition-colors"
                data-testid={`preset-${preset.id}`}
              >
                <preset.icon className="w-3.5 h-3.5 text-primary" />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                data-testid={`message-${message.id}`}
              >
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  message.role === "assistant" 
                    ? "bg-primary/10" 
                    : "bg-slate-100"
                }`}>
                  {message.role === "assistant" 
                    ? <Bot className="w-4 h-4 text-primary" />
                    : <User className="w-4 h-4 text-slate-600" />
                  }
                </div>
                <div className={`flex-1 max-w-[80%] ${message.role === "user" ? "flex flex-col items-end" : ""}`}>
                  <Card className={`p-3 ${
                    message.role === "assistant" 
                      ? "bg-white" 
                      : "bg-primary text-primary-foreground"
                  }`}>
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                      message.role === "assistant" ? "text-foreground" : ""
                    }`}>
                      {message.content}
                    </p>
                  </Card>
                  <span className="text-xs text-muted-foreground mt-1">{message.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-white p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="질문을 입력하세요..."
              className="flex-1 px-4 py-2.5 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              data-testid="input-message"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover-elevate disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
