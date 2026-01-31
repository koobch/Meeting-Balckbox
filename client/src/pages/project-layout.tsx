import { useParams } from "wouter";
import { AppShell } from "@/components/app-shell";
import { ProjectProvider } from "@/lib/project-context";

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId || "1";
  
  return (
    <ProjectProvider projectId={projectId}>
      <AppShell projectId={projectId}>
        {children}
      </AppShell>
    </ProjectProvider>
  );
}
