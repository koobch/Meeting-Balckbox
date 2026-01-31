import { useParams } from "wouter";
import { AppShell } from "@/components/app-shell";

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams<{ projectId: string }>();
  
  return (
    <AppShell projectId={params.projectId || "1"}>
      {children}
    </AppShell>
  );
}
