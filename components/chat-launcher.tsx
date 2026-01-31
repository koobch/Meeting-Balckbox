'use client'

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "안녕하세요! PM 비서입니다. 프로젝트 관련 질문이나 도움이 필요하시면 말씀해 주세요.",
    timestamp: new Date(),
  },
];

export function ChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAssistantResponse(userMessage.content),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed left-5 bottom-5 z-50 w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? "bg-muted text-muted-foreground shadow-lg"
            : "bg-primary text-primary-foreground shadow-lg hover:scale-[1.03] hover:shadow-xl"
        }`}
        style={{
          boxShadow: isOpen 
            ? undefined 
            : "0 4px 14px rgba(0, 0, 0, 0.15), 0 0 20px rgba(var(--primary), 0.1)"
        }}
        data-testid="button-chat-launcher"
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <MessageCircle className="w-5 h-5" />
        )}
      </button>

      {isOpen && (
        <Card 
          className="fixed left-5 bottom-[76px] z-50 w-[360px] h-[60vh] flex flex-col shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          data-testid="chat-drawer"
        >
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground" data-testid="chat-title">PM 비서</h3>
                  <p className="text-xs text-muted-foreground">프로젝트 도우미</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                data-testid="button-close-chat"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto p-4"
          >
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                  data-testid={`message-${message.id}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="질문을 입력하세요..."
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim()}
                size="icon"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

function getAssistantResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes("결정") || lowerMessage.includes("decision")) {
    return "현재 프로젝트에서 3개의 주요 결정이 기록되어 있습니다. Overview 페이지에서 전체 결정 목록을 확인하실 수 있습니다.";
  }
  if (lowerMessage.includes("미팅") || lowerMessage.includes("회의")) {
    return "최근 미팅 기록은 Meetings 페이지에서 확인하실 수 있습니다. 새로운 미팅을 녹음하려면 사이드바의 '녹음하기' 버튼을 사용해주세요.";
  }
  if (lowerMessage.includes("근거") || lowerMessage.includes("evidence")) {
    return "Evidence 페이지에서 프로젝트의 모든 근거 자료를 관리할 수 있습니다. 파일 업로드도 가능합니다.";
  }
  if (lowerMessage.includes("도움") || lowerMessage.includes("help")) {
    return "TRACE PM은 프로젝트 결정과 근거를 추적하는 도구입니다. 미팅 녹음, 결정 기록, 근거 관리 등의 기능을 제공합니다. 어떤 부분이 궁금하신가요?";
  }

  return "네, 알겠습니다. 더 자세한 정보가 필요하시면 말씀해 주세요. Overview, Meetings, Evidence 페이지에서 프로젝트 정보를 확인하실 수 있습니다.";
}
