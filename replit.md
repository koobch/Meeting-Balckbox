# TRACE PM

## Overview

TRACE PM is a project management tool designed to help teams track decisions, meetings, and evidence throughout their project lifecycle. The application provides a structured way to document project decisions with their supporting evidence, manage meeting records with transcripts, and maintain an evidence library linking research to decisions.

The system is built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with HMR support

The frontend follows a page-based structure under `client/src/pages/` with shared components in `client/src/components/`. The application uses a project-scoped layout pattern where routes are nested under `/projects/:projectId/`.

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints prefixed with `/api`
- **Session Management**: Express sessions with connect-pg-simple for PostgreSQL session storage

The server uses a clean separation between routing (`server/routes.ts`), storage (`server/storage.ts`), and static file serving (`server/static.ts`). In development, Vite middleware handles frontend assets; in production, pre-built static files are served.

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Migrations**: Drizzle Kit with migrations output to `./migrations`

The storage layer currently implements an in-memory storage interface (`MemStorage`) that can be swapped for a database-backed implementation using the Drizzle schema.

### Build System
- **Frontend Build**: Vite outputs to `dist/public`
- **Backend Build**: esbuild bundles server code to `dist/index.cjs`
- **Dependency Bundling**: Select server dependencies are bundled to reduce cold start times

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
- **Wouter**: Client-side routing
- **react-hook-form**: Form handling with @hookform/resolvers
- **date-fns**: Date formatting and manipulation
- **embla-carousel-react**: Carousel component
- **recharts**: Charting library
- **vaul**: Drawer component
- **cmdk**: Command palette component

### Development Tools
- **Vite**: Frontend dev server and bundler
- **esbuild**: Backend bundler for production
- **TypeScript**: Type checking across the stack
- **Drizzle Kit**: Database migration tooling