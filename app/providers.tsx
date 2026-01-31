'use client'

import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/queryClient"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ProjectMemoryProvider } from "@/lib/project-memory-context"
import { ChatLauncher } from "@/components/chat-launcher"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectMemoryProvider>
        <TooltipProvider>
          <Toaster />
          {children}
          <ChatLauncher />
        </TooltipProvider>
      </ProjectMemoryProvider>
    </QueryClientProvider>
  )
}
