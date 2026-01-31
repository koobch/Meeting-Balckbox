"use client";

import { useState, useRef } from "react";
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
import { FileText, ExternalLink, Calendar, Upload, Download, Trash2, File, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const initialEvidenceData: EvidenceItem[] = [
  {
    id: "ev-1",
    title: "사용자 인터뷰 녹취록",
    summary: "8명의 중소기업 PM 대상 심층 인터뷰. 온보딩 복잡성, 협업 기능, 가격에 대한 피드백 수집.",
    source: ".pdf",
    type: "interview",
    addedAt: "2025-01-29",
    linkedDecisions: ["dec-1", "dec-2"],
    fileName: "user_interviews.pdf",
    fileSize: "3.2 MB"
  },
  {
    id: "ev-2",
    title: "Nielsen Norman Group 온보딩 연구",
    summary: "SaaS 온보딩 황금 시간 3-5분. 5분 초과 시 이탈률 급증.",
    source: ".pdf",
    type: "external",
    addedAt: "2025-01-28",
    linkedDecisions: ["dec-1"],
    fileName: "nngroup_onboarding.pdf",
    fileSize: "1.8 MB"
  },
  {
    id: "ev-3",
    title: "ProductPlan 벤치마크 보고서",
    summary: "PM 도구 평균 Time-to-Value 7.2분, 상위 10% 제품 4분 미만.",
    source: ".xlsx",
    type: "external",
    addedAt: "2025-01-28",
    linkedDecisions: ["dec-1"],
    fileName: "productplan_benchmark.xlsx",
    fileSize: "2.1 MB"
  },
  {
    id: "ev-4",
    title: "경쟁사 분석 문서",
    summary: "Jira, Asana, Notion 기능 및 가격 비교 분석.",
    source: ".docx",
    type: "document",
    addedAt: "2025-01-27",
    linkedDecisions: ["dec-2", "dec-3"],
    fileName: "competitor_analysis.docx",
    fileSize: "2.4 MB"
  },
  {
    id: "ev-5",
    title: "기술 검토 회의록",
    summary: "실시간 편집 구현 복잡도 및 일정 영향 분석.",
    source: ".pdf",
    type: "meeting",
    addedAt: "2025-01-25",
    linkedDecisions: ["dec-3"],
    fileName: "tech_review_meeting.pdf",
    fileSize: "0.8 MB"
  }
];

const typeConfig = {
  interview: { label: "인터뷰", className: "bg-blue-100 text-blue-700" },
  external: { label: "외부 자료", className: "bg-violet-100 text-violet-700" },
  document: { label: "문서", className: "bg-emerald-100 text-emerald-700" },
  meeting: { label: "미팅", className: "bg-amber-100 text-amber-700" },
  file: { label: "첨부파일", className: "bg-slate-100 text-slate-700" }
};

export default function EvidencePage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evidenceData, setEvidenceData] = useState<EvidenceItem[]>(initialEvidenceData);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSummary, setUploadSummary] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EvidenceItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      setShowUploadDialog(true);
    }
  };

  const handleUpload = () => {
    if (!uploadFile) return;

    const fileExtension = uploadFile.name.includes('.') 
      ? '.' + uploadFile.name.split('.').pop()?.toLowerCase() 
      : '';

    const newEvidence: EvidenceItem = {
      id: `ev-${Date.now()}`,
      title: uploadTitle || uploadFile.name,
      summary: uploadSummary || "업로드된 파일",
      source: fileExtension || "파일",
      type: "file",
      addedAt: new Date().toISOString().split('T')[0],
      linkedDecisions: [],
      fileName: uploadFile.name,
      fileSize: formatFileSize(uploadFile.size)
    };

    setEvidenceData(prev => [newEvidence, ...prev]);
    setShowUploadDialog(false);
    setUploadFile(null);
    setUploadTitle("");
    setUploadSummary("");

    toast({
      title: "파일 업로드 완료",
      description: `${uploadFile.name} 파일이 업로드되었습니다.`
    });
  };

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

  const handleDelete = () => {
    if (!deleteTarget) return;

    setEvidenceData(prev => prev.filter(e => e.id !== deleteTarget.id));
    
    toast({
      title: "삭제 완료",
      description: `${deleteTarget.title} 자료가 삭제되었습니다.`
    });

    setDeleteTarget(null);
  };

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
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-file-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
              data-testid="button-upload-file"
            >
              <Upload className="w-4 h-4" />
              파일 업로드
            </Button>
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
          {evidenceData
            .filter(evidence => 
              searchQuery === "" || 
              evidence.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              evidence.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
              evidence.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(evidence => {
            const typeInfo = typeConfig[evidence.type as keyof typeof typeConfig];
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
                        <span>연결된 결정 {evidence.linkedDecisions.length}개</span>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(evidence)}
                        className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        data-testid={`button-delete-${evidence.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>파일 정보 입력</DialogTitle>
            <DialogDescription>업로드할 파일의 정보를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {uploadFile && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
                <File className="w-8 h-8 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">제목</label>
              <Input
                placeholder="자료 제목을 입력하세요"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                data-testid="input-upload-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">설명 (선택)</label>
              <Input
                placeholder="자료에 대한 간단한 설명"
                value={uploadSummary}
                onChange={(e) => setUploadSummary(e.target.value)}
                data-testid="input-upload-summary"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setUploadFile(null);
              }}
              data-testid="button-cancel-upload"
            >
              취소
            </Button>
            <Button
              onClick={handleUpload}
              data-testid="button-confirm-upload"
            >
              업로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" 자료를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
