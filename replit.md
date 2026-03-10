# Oceanveo - Physical Intelligence Data Company

## Overview

Oceanveo is a premium marketing website for a Physical Intelligence data company providing VLA-ready video trajectories and real-world datasets for robotics and autonomy. The site features:

- A visually striking hero section with ocean-inspired gradients ("An Ocean of Real World Data")
- Capabilities showcase: Quality, Quantity, Diversity under "Engineered for Autonomy" heading
- Key metrics display with animated counters (10M+ labels, 99.7% QA, 500+ experts, 40% faster)
- Ocean wave visual with floating CTA ("Move your model forward — faster")
- Contact form with database persistence and email notifications
- Book a Call page with "The future is embodied" messaging
- Data Engine page explaining system workflow with video marquee hero, workflow steps, architecture diagram, capabilities, and CTA

The site targets enterprise AI teams, startups, and institutions seeking expert-powered data for autonomy and robotics.

## User Preferences

- Preferred communication style: Simple, everyday language
- Primary accent color: #8bdaef (used for subtitles and accent text)
- Subtitle/body text color: #8bdaef (blue)
- Form fields: transparent bg, white 1px bottom border, NO outline/ring on focus
- All buttons use rounded-xl styling
- Hero title font size: 70px (DO NOT ALTER)
- No testimonials/cooperators section (permanently removed)
- No workflow/stack section (permanently removed)
- Footer: "Sunnyvale, CA | Data for Physical Intelligence"

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
- **Email**: Resend for contact form notifications

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Migrations**: Drizzle Kit for schema management (`npm run db:push`)

### Email Notifications
- **Service**: Resend (resend.com)
- **API Key**: Stored as `RESEND_API_KEY` secret
- **Recipients**: sherelle.li@oceanveo.ai, jessie.jia@oceanveo.ai, andrew.marvel@oceanveo.ai, roger@oceanveo.ai
- **Note**: Domain verification required in Resend dashboard to send to all recipients. Add oceanveo.ai domain and update sender in `server/email.ts` from `onboarding@resend.dev` to custom domain sender.

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **TypeScript**: Single tsconfig with path aliases (`@/` for client, `@shared/` for shared code)

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (Navbar, Hero, Capabilities, Metrics, Footer)
    components/ui # shadcn/ui primitives
    pages/        # Route components (Home, BookCall, DataEngine)
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route handlers
  email.ts        # Resend email notification utility
  storage.ts      # Database access layer
  db.ts           # Drizzle/PostgreSQL connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle table definitions and Zod schemas
  routes.ts       # API contract definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable

### Email
- **Resend**: Transactional email service for contact form notifications

### UI Framework
- **Radix UI**: Headless component primitives (dialog, dropdown, tabs, toast, etc.)
- **Lucide React**: Icon library

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **Drizzle Kit**: Database schema management and migrations

### Fonts
- **Titillium Web**: Primary display/body font loaded via Google Fonts
