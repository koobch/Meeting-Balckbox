'use client'

import { AppShell } from "@/components/app-shell";
import { ProjectProvider } from "@/lib/project-context";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: { projectId: string };
}

export default function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const projectId = params.projectId || "1";
  
  return (
    <ProjectProvider projectId={projectId}>
      <AppShell projectId={projectId}>
        {children}
      </AppShell>
    </ProjectProvider>
  );
}
