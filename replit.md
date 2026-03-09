# Align

## Overview

Align is a premium, mobile-first interactive website designed to help professionals create personal portrait photoshoots. It guides users through a 6-step configurator to define their photoshoot concept, updating a visual gallery and concept summary in real time. The primary goal is to capture lead information via a booking form, with options for immediate booking requiring a 50% Stripe downpayment. The project aims to streamline the photoshoot planning process and provide a clear, personalized experience for clients.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The application uses a monorepo structure, separating the React frontend (`client/`), Express backend (`server/`), and shared code (`shared/`) for database schemas and types.

### Frontend
- **Framework & UI**: React with TypeScript, Vite, Wouter for routing, and shadcn/ui (New York style) built on Radix UI with Tailwind CSS for styling.
- **State & Forms**: Local React state for the configurator, TanStack React Query for server data, React Hook Form with Zod for form validation.
- **Visuals**: Framer Motion for animations, warm neutral color palette, and Google Fonts (Plus Jakarta Sans, Playfair Display).
- **Key Features**: A 6-step configurator with dynamic image previews (`ImageGallery`), a live `ConceptSummary`, and a `BookingForm` that handles both collaboration requests and secure session bookings with Stripe integration.

### Backend
- **Framework & API**: Express 5 on Node.js with TypeScript, providing a RESTful JSON API.
- **Admin Panel**: A password-protected `/admin` panel for managing photoshoots, galleries, edit tokens, featured professionals, and portfolio photos with tagging (environments, brand messages, emotional impacts, color palette).
- **File Management**: `multer` for file uploads, streaming to Replit Object Storage, with temporary files cleaned post-upload. Supports image uploads up to 50MB per file, with batched processing.
- **Notifications**: Google Mail for email notifications (bookings, collaborations, edit requests) and Web Push (VAPID) for real-time chat messages between clients and admins.
- **Stripe Integration**: Handles checkout sessions for downpayments and edit token purchases, and allows admins to create and send itemized invoices using the Stripe Invoicing API.

### Database
- **PostgreSQL**: The primary data store, managed with Drizzle ORM.
- **Schema**: Shared `schema.ts` defines tables for leads, shoots, galleries, edit tokens, edit requests, push subscriptions, nominations, and spaces.
- **Pricing**: `shared/pricing.ts` contains server-authoritative pricing logic.

### Build System
- **Development**: `tsx server/index.ts` with Vite middleware for HMR.
- **Production**: A custom build script uses Vite for the client and esbuild for the server, outputting to `dist/`.

### Design Patterns
- **Storage Interface**: An `IStorage` interface abstracts database operations for swappability.
- **Schema Sharing**: Drizzle table definitions and Zod schemas are shared between frontend and backend for consistent validation.

## External Dependencies

### Database
- **PostgreSQL**

### Key NPM Packages
- **drizzle-orm**, **drizzle-kit**
- **express**
- **@tanstack/react-query**
- **framer-motion**
- **react-hook-form**, **zod**
- **wouter**
- **shadcn/ui ecosystem** (Radix UI, Tailwind CSS)
- **react-day-picker**
- **vaul**
- **recharts**
- **embla-carousel-react**

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**
- **@replit/vite-plugin-cartographer**
- **@replit/vite-plugin-dev-banner**

### Fonts (External CDN)
- **Plus Jakarta Sans**
- **Playfair Display**

## AI Crawlability & SEO
- **robots.txt**: Server-rendered at `/robots.txt`, explicitly allows major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Anthropic, Applebot-Extended, Bytespider, CCBot). Blocks `/admin`, `/portal`, `/employee`, `/api/`.
- **sitemap.xml**: Dynamic server-rendered at `/sitemap.xml`, includes static pages and all featured professional profile URLs.
- **llms.txt**: Summary for LLMs at `/llms.txt` with business info, services, pricing, location, and key pages.
- **llms-full.txt**: Extended version at `/llms-full.txt` with full featured professionals directory.
- **Structured Data**: JSON-LD in `client/index.html` includes LocalBusiness (Photographer), FAQPage, and WebSite schemas.
- **Meta Tags**: OG, Twitter Card, geo, classification, and descriptive meta tags in `client/index.html`.
- **Canonical URL**: `https://alignphotodesign.com`

## Align Spaces
- **Landing Page**: `/spaces` — duplicate of main hero with workspace-focused messaging ("Your Space, Your Practice")
- **Browse Page**: `/spaces/browse` — filterable grid of spaces by type (office, gym, meeting), each card expandable with amenities, pricing, and host info
- **Database**: `spaces` table with fields for name, slug, type, description, address, neighborhood, price_per_hour, price_per_day, capacity, amenities array, image_urls array, target_profession, etc.
- **API**: `GET /api/spaces`, `GET /api/spaces/:slug`, `POST /api/admin/spaces`, `POST /api/admin/spaces/seed`
- **Sample Data**: 5 seeded spaces (2 therapy offices, 1 gym, 2 meeting rooms) in Miami neighborhoods
- **Concept**: Airbnb-style workspace rental for small business professionals in Miami

## Data Migrations
- `server/migrations.ts`: `fixPortfolioImageExtensions()` runs on startup — fixes `.jpg` → `.webp` in portfolio_photos table.