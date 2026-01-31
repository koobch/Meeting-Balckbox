# TRACE PM

## Overview

TRACE PM is a project management tool designed to help teams track decisions, meetings, and evidence throughout their project lifecycle. The application provides a structured way to document project decisions with their supporting evidence, manage meeting records with transcripts, and maintain an evidence library linking research to decisions.

The system is built as a full-stack TypeScript application using **Next.js 14 with App Router**, with PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (2026-01-31)

- **Migrated from Vite + Express to Next.js 14 App Router**
- All pages moved from `client/src/pages/` to `app/` directory
- Routing changed from wouter to next/navigation
- All components updated with 'use client' directives
- Created startup script: `./start-next.sh` for Next.js development

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router + React 18 + TypeScript
- **Routing**: Next.js App Router with file-based routing
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)

The frontend follows Next.js App Router structure:
- `app/` - Pages and layouts
- `app/projects/[projectId]/` - Project-scoped pages with dynamic routing
- `components/` - Shared UI components
- `lib/` - Utility functions and context providers

### Backend Architecture
- **Framework**: Next.js API Routes (planned)
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under `/api` (to be implemented)

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Migrations**: Drizzle Kit with migrations output to `./migrations`

### Build System
- **Development**: `npx next dev -p 5000` or `./start-next.sh`
- **Production Build**: `npx next build`
- **Production Start**: `npx next start -p 5000`

## External Dependencies

### Database
- **PostgreSQL**: Primary database (connection via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Database queries and schema management
- **connect-pg-simple**: Session storage in PostgreSQL

### UI Framework
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-styled component library using Radix primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Frontend Libraries
- **TanStack React Query**: Data fetching and caching
- **next/navigation**: Client-side routing (replaced wouter)
- **react-hook-form**: Form handling with @hookform/resolvers
- **date-fns**: Date formatting and manipulation
- **embla-carousel-react**: Carousel component
- **recharts**: Charting library
- **vaul**: Drawer component
- **cmdk**: Command palette component

### Development Tools
- **Next.js**: Full-stack React framework with App Router
- **TypeScript**: Type checking across the stack
- **Drizzle Kit**: Database migration tooling

## File Structure

```
app/
├── layout.tsx           # Root layout
├── page.tsx             # Home (redirects to /projects)
├── not-found.tsx        # 404 page
├── providers.tsx        # Client providers (QueryClient, etc.)
├── globals.css          # Global styles
└── projects/
    ├── page.tsx         # Projects list
    └── [projectId]/
        ├── layout.tsx   # Project layout with sidebar
        ├── overview/
        │   └── page.tsx # Project overview
        ├── meetings/
        │   ├── page.tsx # Meetings list
        │   └── [meetingId]/
        │       └── page.tsx  # Meeting detail
        └── evidence/
            └── page.tsx # Evidence page

components/              # Shared UI components
├── app-shell.tsx        # Main app shell with sidebar
├── chat-launcher.tsx    # PM assistant chat
├── inline-editable-text.tsx
└── ui/                  # shadcn/ui components

lib/                     # Utilities and contexts
├── queryClient.ts
├── project-context.tsx
├── project-memory-context.tsx
└── utils.ts
```