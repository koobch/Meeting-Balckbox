# 🎯 Meeting Blackbox (TRACE PM)

> **AI 기반 회의 분석 및 의사결정 추적 플랫폼**  
> 회의 내용을 자동으로 분석하고, 의사결정을 추적하며, 논리적 근거를 관리하는 프로젝트 관리 도구

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📖 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [설치 및 실행](#-설치-및-실행)
- [환경 변수 설정](#-환경-변수-설정)
- [데이터베이스 스키마](#-데이터베이스-스키마)
- [API 통합](#-api-통합)
- [주요 페이지 및 라우트](#-주요-페이지-및-라우트)

---

## 🎯 프로젝트 소개

**Meeting Blackbox**는 회의의 모든 내용을 기록하고 분석하여 의사결정 과정을 투명하게 추적하는 AI 기반 프로젝트 관리 플랫폼입니다.

### 핵심 가치 제안

1. **자동 회의 분석**: 음성 녹음 → AI 전사 → 자동 요약 및 분석
2. **의사결정 추적**: 모든 결정사항을 근거와 함께 체계적으로 관리
3. **논리적 근거 관리**: 논리적 비약이나 증거 부족을 자동으로 감지
4. **투명한 프로젝트 관리**: 회의록, 액션 아이템, 진행 상황을 한눈에 파악

---

## ✨ 주요 기능

### 1. 🎙️ **회의 녹음 및 전사**
- 실시간 음성 녹음 (VoiceRecorder 컴포넌트)
- AI 기반 자동 전사 (Speaker Diarization 지원)
- 음성 파일 저장 및 관리 (Supabase Storage)

### 2. 📊 **회의 분석 및 요약**
- AI 기반 회의 요약 생성
- 단락별 중요 내용 추출
- 타임라인 기반 회의 흐름 분석
- 참여자별 발언 분석

### 3. 💡 **의사결정 추적 (Decisions)**
- 회의에서 도출된 결정사항 자동 추출
- 결정의 배경과 근거 기록
- 결정 통합 상태 관리 (`integrated` / `draft`)
- N8N Webhook을 통한 외부 시스템 연동

### 4. ⚠️ **논리 검증 (Logic Gaps)**
- 논리적 비약 자동 감지
- 증거 부족 경고
- 추가 조사 필요 항목 표시
- 심각도별 분류 (`high` / `medium` / `low`)
- 보완 완료 항목 추적

### 5. 📁 **외부 증거 관리 (External Evidences)**
- Google Drive 파일 통합
- 파일 메타데이터 및 요약 저장
- 의사결정과 연결된 증거 자료 관리

### 6. ✅ **액션 아이템 관리**
- 회의에서 도출된 할 일 자동 생성
- 담당자, 마감일, 우선순위 설정
- 진행 상황 추적 (완료/미완료)
- 캘린더 뷰로 진행 상황 시각화

### 7. 🗂️ **프로젝트 관리**
- 다중 프로젝트 지원
- 프로젝트별 회의, 의사결정, 근거 관리
- 프로젝트 개요 대시보드
- 팀원 및 리드 관리

---

## 🛠️ 기술 스택

### **Frontend**
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5.6](https://www.typescriptlang.org/)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query) (React Query)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### **Backend**
- **Runtime**: [Node.js](https://nodejs.org/)
- **Server**: [Express 5](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Supabase**: Database, Storage, Authentication
- **Session Management**: [express-session](https://github.com/expressjs/session) + [connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple)

### **AI & External Services**
- **AI Platform**: [OpenAI API](https://platform.openai.com/) (GPT-4)
- **Workflow Automation**: [N8N Webhooks](https://n8n.io/)
- **Text-to-Speech**: [ElevenLabs API](https://elevenlabs.io/)

### **Development Tools**
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Package Manager**: npm
- **Type Checking**: TypeScript
- **Database Migrations**: Drizzle Kit

---

## 📂 프로젝트 구조

```
Meeting-Blackbox/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions
│   │   └── meetings.ts           # 회의 관련 Server Actions
│   ├── api/                      # API Routes
│   ├── projects/                 # 프로젝트 관련 페이지
│   │   ├── page.tsx              # 프로젝트 목록 페이지
│   │   └── [projectId]/          # 동적 프로젝트 상세
│   │       ├── overview/         # 프로젝트 개요
│   │       ├── meetings/         # 회의 목록 및 상세
│   │       │   └── [meetingId]/  # 회의 상세 페이지
│   │       └── evidence/         # 외부 증거 관리
│   ├── globals.css               # 전역 스타일
│   ├── layout.tsx                # 루트 레이아웃
│   └── providers.tsx             # React Query Provider
│
├── components/                   # React 컴포넌트
│   ├── ui/                       # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── checkbox.tsx
│   │   └── ...                   # 기타 UI 컴포넌트
│   ├── VoiceRecorder.tsx         # 음성 녹음 컴포넌트
│   ├── app-shell.tsx             # 앱 레이아웃 쉘
│   ├── chat-launcher.tsx         # AI 채팅 런처
│   └── inline-editable-text.tsx  # 인라인 편집 텍스트
│
├── server/                       # Express 백엔드 서버
│   ├── index.ts                  # Express 서버 진입점
│   ├── routes.ts                 # API 라우트 정의
│   ├── storage.ts                # Supabase Storage 연동
│   ├── static.ts                 # 정적 파일 서빙
│   └── vite.ts                   # Vite 개발 서버 연동
│
├── shared/                       # 공유 모듈
│   └── schema.ts                 # Drizzle ORM 스키마 정의
│
├── lib/                          # 유틸리티 라이브러리
│   ├── utils.ts                  # 공통 유틸 함수
│   └── queryClient.ts            # React Query 클라이언트
│
├── hooks/                        # Custom React Hooks
│   └── use-toast.ts              # Toast 알림 훅
│
├── .env.local                    # 환경 변수 (로컬)
├── drizzle.config.ts             # Drizzle ORM 설정
├── next.config.js                # Next.js 설정
├── tailwind.config.ts            # Tailwind CSS 설정
├── tsconfig.json                 # TypeScript 설정
├── vite.config.ts                # Vite 설정
└── package.json                  # 프로젝트 의존성
```

---

## 🚀 설치 및 실행

### **1. 사전 요구사항**

- **Node.js** 20.x 이상
- **npm** 또는 **yarn**
- **PostgreSQL** 데이터베이스 (또는 Supabase 프로젝트)

### **2. 저장소 클론**

```bash
git clone <repository-url>
cd Meeting-Blackbox
```

### **3. 의존성 설치**

```bash
npm install
```

### **4. 환경 변수 설정**

`.env.local` 파일을 생성하고 아래 형식으로 환경 변수를 설정하세요. ([환경 변수 설정](#-환경-변수-설정) 섹션 참고)

```bash
cp .env.example .env.local
# .env.local 파일을 수정하여 실제 값 입력
```

### **5. 데이터베이스 마이그레이션**

```bash
npm run db:push
```

### **6. 개발 서버 실행**

```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하세요.

### **7. 프로덕션 빌드**

```bash
npm run build
npm run start
```

---

## 🔑 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정해야 합니다:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (회의 분석 AI)
# - 사용하지 않는 경우 생략 가능
# OPENAI_API_KEY=sk-...

# Anthropic Claude (AI 분석 백업)
ANTHROPIC_API_KEY=sk-ant-api03-...

# ElevenLabs (음성 합성)
ELEVENLABS_API_KEY=sk_...

# N8N Webhooks (워크플로우 통합)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/meeting_analysis
N8N_INTEGRATION_URL=https://your-n8n-instance.com/webhook/decisions_integration
N8N_CHAT_WEBHOOK_URL=https://your-n8n-instance.com/webhook/.../chat

# PostgreSQL Database (Supabase가 제공하는 경우 생략 가능)
# DATABASE_URL=postgresql://user:password@host:5432/database
```

### **환경 변수 설명**

| 변수명 | 설명 | 필수 여부 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ 필수 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 (서버 사이드) | ✅ 필수 |
| `ANTHROPIC_API_KEY` | Claude AI API 키 (회의 분석용) | ✅ 필수 |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS API 키 | 선택 |
| `N8N_WEBHOOK_URL` | 회의 분석 N8N Webhook URL | 선택 |
| `N8N_INTEGRATION_URL` | 의사결정 통합 N8N Webhook URL | 선택 |
| `N8N_CHAT_WEBHOOK_URL` | AI 채팅 N8N Webhook URL | 선택 |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | Supabase 사용 시 생략 가능 |

---

## 🗄️ 데이터베이스 스키마

### **주요 테이블**

#### **1. `meetings` - 회의 정보**
회의의 기본 정보와 분석 결과를 저장합니다.

```typescript
{
  id: uuid,                        // 회의 고유 ID
  projectId: uuid,                 // 소속 프로젝트 ID
  title: string,                   // 회의 제목
  meetingDate: timestamp,          // 회의 일시
  participants: string[],          // 참여자 목록
  audioStoragePath: string,        // 음성 파일 경로 (Supabase Storage)
  audioFilename: string,           // 음성 파일명
  audioSizeBytes: number,          // 파일 크기
  audioDurationSeconds: number,    // 녹음 길이
  transcriptWithSpeakers: text,    // 화자 포함 전사 내용
  timelineSummary: text,           // 타임라인 요약
  topics: string[],                // 회의 주제 태그
  status: 'pending' | 'completed', // 분석 상태
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **2. `decisions` - 의사결정**
회의에서 도출된 의사결정 내용을 관리합니다.

```typescript
{
  id: uuid,
  meetingId: uuid,                 // 소속 회의 ID
  content: text,                   // 결정 내용
  reasoning: text,                 // 결정 배경 및 근거
  isIntegrated: boolean,           // 통합 여부
  integratedAt: timestamp,         // 통합 일시
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **3. `logic_gaps` - 논리적 검증**
회의 중 논리적 비약이나 증거 부족을 추적합니다.

```typescript
{
  id: uuid,
  meetingId: uuid,
  speaker: string,                 // 발언자
  statement: text,                 // 문제가 된 발언
  issueType: string,               // 문제 유형 (예: 'logical_leap', 'no_evidence')
  severity: 'low' | 'medium' | 'high', // 심각도
  reason: text,                    // 문제 이유
  suggestedEvidence: text,         // 필요한 증거 제안
  context: text,                   // 문맥 정보
  researchType: string,            // 추가 조사 유형
  reviewStatus: string,            // 검토 상태 ('pending', 'done')
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **4. `action_items` - 액션 아이템**
회의에서 도출된 할 일을 추적합니다.

```typescript
{
  id: uuid,
  meetingId: uuid,
  assignee: string,                // 담당자
  task: text,                      // 할 일 내용
  dueDate: date,                   // 마감일
  priority: 'low' | 'medium' | 'high', // 우선순위
  status: 'pending' | 'completed', // 완료 상태
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **5. `external_evidences` - 외부 증거**
Google Drive 등 외부 파일 증거를 관리합니다.

```typescript
{
  id: uuid,
  projectId: uuid,
  driveFileId: string,             // Google Drive 파일 ID
  fileName: string,                // 파일명
  fileType: string,                // 파일 형식
  title: string,                   // 증거 제목
  summary: text,                   // 증거 요약
  isIntegrated: boolean,           // 통합 여부
  addedBy: string,                 // 추가한 사람
  fileSize: string,                // 파일 크기
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 🔌 API 통합

### **1. Supabase**

#### **Storage**
- 음성 파일 업로드 및 저장
- 파일 다운로드 및 스트리밍

#### **Database**
- PostgreSQL 데이터베이스 (Drizzle ORM 사용)
- 실시간 구독 (선택적)

### **2. OpenAI / Anthropic Claude**

- **회의 전사**: Whisper API (또는 서드파티 STT)
- **회의 분석**: GPT-4 / Claude를 통한 요약 및 의사결정 추출
- **논리 검증**: AI 기반 논리적 비약 감지

### **3. N8N Webhook**

프로젝트는 N8N 워크플로우 자동화와 통합되어 있습니다:

- **회의 분석 Webhook**: `N8N_WEBHOOK_URL`
  - 회의 분석 완료 시 외부 시스템에 알림
  
- **의사결정 통합 Webhook**: `N8N_INTEGRATION_URL`
  - 새로운 의사결정이 통합될 때 트리거
  
- **AI 채팅 Webhook**: `N8N_CHAT_WEBHOOK_URL`
  - 사용자와 AI 간 대화 처리

### **4. ElevenLabs (TTS)**

- 회의 요약을 음성으로 변환 (선택적 기능)

---

## 🗺️ 주요 페이지 및 라우트

### **프로젝트 관리**

| 경로 | 설명 |
|------|------|
| `/projects` | 프로젝트 목록 페이지 |
| `/projects/[projectId]/overview` | 프로젝트 개요 대시보드 |
| `/projects/[projectId]/meetings` | 회의 목록 |
| `/projects/[projectId]/meetings/[meetingId]` | 회의 상세 페이지 |
| `/projects/[projectId]/evidence` | 외부 증거 관리 |

### **주요 컴포넌트**

- **`VoiceRecorder`**: 음성 녹음 컴포넌트
- **`app-shell`**: 전체 앱 레이아웃 (사이드바, 헤더)
- **`chat-launcher`**: AI 채팅 런처 버튼
- **`inline-editable-text`**: 인라인 텍스트 편집 UI

---

## 📝 주요 스크립트

```json
{
  "dev": "next dev",           // 개발 서버 실행
  "build": "next build",       // 프로덕션 빌드
  "start": "next start",       // 프로덕션 서버 실행
  "check": "tsc",              // TypeScript 타입 체크
  "db:push": "drizzle-kit push" // 데이터베이스 스키마 푸시
}
```

---

## 🤝 기여 가이드

1. 이 저장소를 Fork 합니다.
2. Feature 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push 합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다.

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

## 📧 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ by TRACE PM Team**
