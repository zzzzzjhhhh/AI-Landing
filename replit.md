# Oceanveo - AI Data Annotation Platform

## Overview

Oceanveo is a premium landing page for an AI data annotation company. The application is a modern, dark-themed marketing website featuring:

- A visually striking hero section with ocean-inspired gradients
- Capabilities showcase for annotation services (image/video, LLM evaluation, safety labeling, custom pipelines)
- Interactive workflow visualization
- Client testimonials carousel
- Key metrics display with animated counters
- Contact form with database persistence

The site targets enterprise AI teams seeking expert-powered data annotation and evaluation pipelines.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **Styling**: Tailwind CSS with custom ocean-themed color palette and CSS variables
- **Animation**: Framer Motion for scroll reveals, transitions, and micro-interactions
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **State Management**: TanStack React Query for server state
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints defined in shared route contracts
- **Validation**: Zod schemas shared between client and server for type-safe API contracts

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Migrations**: Drizzle Kit for schema management (`npm run db:push`)

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **TypeScript**: Single tsconfig with path aliases (`@/` for client, `@shared/` for shared code)

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (Navbar, Hero, Capabilities, etc.)
    components/ui # shadcn/ui primitives
    pages/        # Route components (Home, BookCall)
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Drizzle/PostgreSQL connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle table definitions and Zod schemas
  routes.ts       # API contract definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session store for PostgreSQL (available but not currently used)

### UI Framework
- **Radix UI**: Headless component primitives (dialog, dropdown, tabs, toast, etc.)
- **Embla Carousel**: Testimonials carousel functionality
- **Lucide React**: Icon library

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **Drizzle Kit**: Database schema management and migrations

### Fonts
- **Titillium Web**: Primary display/body font loaded via Google Fonts
- **DM Sans, Fira Code, Geist Mono**: Additional font families available