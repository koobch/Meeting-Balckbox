import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface Project {
  id: string;
  name: string;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  updateProjectName: (projectId: string, newName: string) => void;
  getProject: (projectId: string) => Project | undefined;
}

const initialProjects: Project[] = [
  { id: "1", name: "TRACE PM MVP" },
  { id: "2", name: "모바일 앱 리디자인" },
  { id: "3", name: "B2B 플랫폼 구축" },
];

const PROJECTS_STORAGE_KEY = "trace-pm-projects";

function loadProjects(): Project[] {
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return initialProjects;
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  window.dispatchEvent(new CustomEvent("projects-updated"));
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children, projectId }: { children: React.ReactNode; projectId?: string }) {
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  
  useEffect(() => {
    const handleUpdate = () => setProjects(loadProjects());
    window.addEventListener("projects-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("projects-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const currentProject = projectId ? projects.find(p => p.id === projectId) || null : null;

  const updateProjectName = useCallback((projectId: string, newName: string) => {
    setProjects(prev => {
      const updated = prev.map(p => 
        p.id === projectId ? { ...p, name: newName } : p
      );
      saveProjects(updated);
      return updated;
    });
  }, []);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  return (
    <ProjectContext.Provider value={{ projects, currentProject, updateProjectName, getProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}

export function useProjectName(projectId: string) {
  const { getProject, updateProjectName, projects } = useProject();
  const project = getProject(projectId);
  
  const defaultName = projects.find(p => p.id === projectId)?.name || 
    initialProjects.find(p => p.id === projectId)?.name || 
    "프로젝트";
  
  const setName = useCallback((newName: string) => {
    updateProjectName(projectId, newName);
  }, [projectId, updateProjectName]);
  
  return [project?.name || defaultName, setName] as const;
}
