"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, ExternalLink, Calendar, Upload, Download, Trash2, File, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getExternalEvidences, uploadEvidence } from "@/app/actions/meetings";

interface EvidenceItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  type: "interview" | "external" | "document" | "meeting" | "file";
  addedAt: string;
  linkedDecisions: string[];
  fileName?: string;
  fileSize?: string;
}

// OLD: initialEvidenceData removed to use live data from Supabase

const typeConfig = {
  interview: { label: "인터뷰", className: "bg-blue-100 text-blue-700" },
  external: { label: "외부 자료", className: "bg-violet-100 text-violet-700" },
  document: { label: "문서", className: "bg-emerald-100 text-emerald-700" },
  meeting: { label: "미팅", className: "bg-amber-100 text-amber-700" },
  file: { label: "첨부파일", className: "bg-slate-100 text-slate-700" }
};

export default function EvidencePage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evidenceData, setEvidenceData] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadEvidences();
    }
  }, [projectId]);

  const loadEvidences = async () => {
    setLoading(true);
    console.log("[EvidencePage] Loading evidences for projectId:", projectId);
    try {
      const result = await getExternalEvidences(projectId);
      console.log("[EvidencePage] Fetch result:", result);

      if (result.success && result.data) {
        // Map Supabase fields to EvidenceItem interface
        const mappedData = result.data.map((item: any) => {
          // Determine the evidence type based on file_type or other criteria
          let type: EvidenceItem['type'] = "file";
          const fileType = item.file_type?.toLowerCase() || "";
          if (fileType.includes("interview")) type = "interview";
          else if (fileType.includes("pdf") || fileType.includes("doc")) type = "document";

          return {
            id: item.id,
            title: item.title || item.file_name || "제목 없음",
            summary: item.summary || "",
            source: item.file_type ? `.${item.file_type}` : '',
            type: type,
            addedAt: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : '',
            linkedDecisions: item.linked_decisions || [],
            fileName: item.file_name,
            fileSize: item.file_size ? `${item.file_size} KB` : '0 KB'
          };
        });

        console.log("[EvidencePage] Mapped data:", mappedData);
        setEvidenceData(mappedData);
      } else {
        console.error("[EvidencePage] Fetch failed:", result.error);
      }
    } catch (error) {
      console.error("[EvidencePage] Error loading evidences:", error);
      toast({
        title: "데이터 로드 실패",
        description: "자료를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    try {
      const result = await uploadEvidence(formData);
      if (result.success) {
        toast({
          title: "업로드 성공",
          description: "새로운 근거 자료가 등록되었습니다."
        });
        loadEvidences();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("[EvidencePage] Upload failed:", error);
      toast({
        title: "업로드 실패",
        description: error.message || "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const handleDownload = (evidence: EvidenceItem) => {
    if (evidence.fileName) {
      const blob = new Blob(["Sample file content for " + evidence.title], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = evidence.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "다운로드 시작",
        description: `${evidence.fileName} 파일을 다운로드합니다.`
      });
    }
  };

  // OLD: handleDelete removed as per user request to disable deletion

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="flex-shrink-0 border-b border-border bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">
              Evidence
            </h1>
            <p className="text-sm text-muted-foreground">프로젝트 근거 자료</p>
          </div>
          <div>
            <Button
              className="gap-2"
              onClick={handleFileSelect}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              파일 업로드
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="파일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-evidence"
          />
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>자료를 불러오는 중입니다...</p>
            </div>
          ) : evidenceData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
              <FileText className="w-12 h-12 mb-3 opacity-20" />
              <p>등록된 근거 자료가 없습니다.</p>
              <p className="text-xs">파일을 업로드하여 근거를 추가해보세요.</p>
            </div>
          ) : (
            evidenceData
              .filter(evidence =>
                searchQuery === "" ||
                evidence.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                evidence.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                evidence.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(evidence => {
                const typeInfo = typeConfig[evidence.type as keyof typeof typeConfig] || typeConfig.file;
                return (
                  <Card key={evidence.id} className="hover-elevate" data-testid={`evidence-card-${evidence.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                          {evidence.type === "file" ? (
                            <File className="w-4 h-4 text-slate-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium text-foreground">{evidence.title}</h3>
                            <Badge variant="secondary" className={`text-xs ${typeInfo.className}`}>
                              {typeInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{evidence.summary}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              {evidence.source}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {evidence.addedAt}
                            </span>
                            {evidence.fileName && (
                              <span className="flex items-center gap-1">
                                <File className="w-3 h-3" />
                                {evidence.fileSize}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(evidence)}
                            className="gap-1"
                            data-testid={`button-download-${evidence.id}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            다운로드
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </div>
      </div>

      {/* OLD: Upload Dialog removed */}

      {/* OLD: Delete Confirmation Dialog removed */}
    </div>
  );
}
