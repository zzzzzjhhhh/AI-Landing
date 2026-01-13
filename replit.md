# Oceanveo - AI Data Annotation Platform

## Overview

Oceanveo is a landing page and contact form application for an AI data annotation company. The platform showcases services including image/video annotation, LLM evaluation, safety labeling, and custom data pipelines. Built as a modern, dark-mode startup-style website with ocean-inspired gradients and premium design aesthetics.

The application consists of two main pages:
- **Home**: Marketing landing page with hero section, capabilities showcase, workflow visualization, testimonials, and metrics
- **Book a Call**: Contact form for potential clients to submit inquiries

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **Styling**: Tailwind CSS with custom ocean-themed color palette and CSS variables
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for scroll reveals and transitions
- **State Management**: TanStack React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: REST endpoints with Zod schema validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session**: Express sessions with PostgreSQL store (connect-pg-simple)

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components (Navbar, Hero, etc.)
    components/ui/# shadcn/ui components
    pages/        # Route pages (Home, BookCall)
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle table definitions and Zod schemas
  routes.ts       # API contract definitions
migrations/       # Drizzle database migrations
```

### API Design
- Type-safe API contracts defined in `shared/routes.ts`
- Request/response schemas validated with Zod
- Single endpoint: `POST /api/contact` for contact form submissions

### Database Schema
- `contact_requests` table: Stores contact form submissions with fields for name, email, company, phone, and message

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and queries
- **connect-pg-simple**: Session storage

### UI/Design
- **Google Fonts**: Titillium Web for typography
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel/slider functionality

### Development Tools
- **Vite**: Development server with HMR
- **esbuild**: Production bundling for server
- **drizzle-kit**: Database migrations (`npm run db:push`)

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development banner