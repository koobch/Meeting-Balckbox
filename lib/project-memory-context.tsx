'use client'

import { createContext, useContext, useState, useCallback, useEffect } from "react";

export type MemoryItemType = "decision" | "evidence" | "action";

export interface MemoryItem {
  id: string;
  type: MemoryItemType;
  title: string;
  content?: string;
  sourceId: string;
  sourceMeetingId: string;
  integratedAt: string;
  linkedItems?: string[];
}

interface ProjectMemoryContextType {
  memories: Record<string, MemoryItem[]>;
  addToMemory: (projectId: string, items: MemoryItem[]) => void;
  getMemory: (projectId: string) => MemoryItem[];
  isItemIntegrated: (projectId: string, sourceId: string) => boolean;
  getIntegrationStatus: (projectId: string, sourceId: string, linkedSourceIds?: string[]) => "integrated" | "partial" | "not";
}

const MEMORY_STORAGE_KEY = "trace-pm-project-memory";

function loadMemory(): Record<string, MemoryItem[]> {
  try {
    const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return {};
}

function saveMemory(memories: Record<string, MemoryItem[]>) {
  localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
  window.dispatchEvent(new CustomEvent("project-memory-updated"));
}

const ProjectMemoryContext = createContext<ProjectMemoryContextType | null>(null);

export function ProjectMemoryProvider({ children }: { children: React.ReactNode }) {
  const [memories, setMemories] = useState<Record<string, MemoryItem[]>>(loadMemory);

  useEffect(() => {
    const handleUpdate = () => setMemories(loadMemory());
    window.addEventListener("project-memory-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("project-memory-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const addToMemory = useCallback((projectId: string, items: MemoryItem[]) => {
    setMemories(prev => {
      const existing = prev[projectId] || [];
      const existingIds = new Set(existing.map(m => m.sourceId));
      const newItems = items.filter(item => !existingIds.has(item.sourceId));
      const updated = {
        ...prev,
        [projectId]: [...existing, ...newItems]
      };
      saveMemory(updated);
      return updated;
    });
  }, []);

  const getMemory = useCallback((projectId: string) => {
    return memories[projectId] || [];
  }, [memories]);

  const isItemIntegrated = useCallback((projectId: string, sourceId: string) => {
    const projectMemory = memories[projectId] || [];
    return projectMemory.some(m => m.sourceId === sourceId);
  }, [memories]);

  const getIntegrationStatus = useCallback((
    projectId: string, 
    sourceId: string, 
    linkedSourceIds?: string[]
  ): "integrated" | "partial" | "not" => {
    const projectMemory = memories[projectId] || [];
    const isIntegrated = projectMemory.some(m => m.sourceId === sourceId);
    
    if (!isIntegrated) return "not";
    
    if (linkedSourceIds && linkedSourceIds.length > 0) {
      const linkedIntegrated = linkedSourceIds.filter(id => 
        projectMemory.some(m => m.sourceId === id)
      );
      if (linkedIntegrated.length < linkedSourceIds.length) {
        return "partial";
      }
    }
    
    return "integrated";
  }, [memories]);

  return (
    <ProjectMemoryContext.Provider value={{ 
      memories, 
      addToMemory, 
      getMemory, 
      isItemIntegrated, 
      getIntegrationStatus 
    }}>
      {children}
    </ProjectMemoryContext.Provider>
  );
}

export function useProjectMemory() {
  const context = useContext(ProjectMemoryContext);
  if (!context) {
    throw new Error("useProjectMemory must be used within a ProjectMemoryProvider");
  }
  return context;
}
