# Booking Demo

A professional web application for online booking and scheduling management, built with Next.js, Prisma, and Supabase.

This project has evolved from a front-end demo into a functional full-stack application featuring:
- **Public Landing Page:** Feature highlights and live dashboard preview.
- **Multitenant Architecture:** Shops can manage their own services, staff, and appointments.
- **Real-time Data:** Integrated with Prisma ORM and Supabase PostgreSQL.
- **Authentication:** Role-based access control (RBAC) via Supabase Auth.
- **Admin Panel:** Comprehensive management of appointments, clients, services, and staff.

## 🚀 Main Features

- **Guided Booking Flow:** 5-step wizard for customers (Service -> Staff -> Date -> Time -> Confirmation).
- **Admin Dashboard:** Real-time stats (citas hoy, ingreso estimado) fetched directly from the database.
- **Calendar Management:** Weekly and list views for appointment tracking.
- **Performance Analytics:** Staff performance metrics (ratings, revenue, booking volume).
- **Responsive Design:** Optimized for both desktop and mobile workflows.

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database & Auth:** [Supabase](https://supabase.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Styling:** Tailwind CSS 4 & shadcn/ui
- **Icons:** Lucide React
- **Date Handling:** date-fns

## 📁 Project Structure

```text
├── app/                  # Next.js App Router routes
│   ├── admin/            # Admin dashboard and management modules
│   ├── auth/             # Server actions for Auth (Login/Logout)
│   ├── schedule/         # Customer booking flow
│   └── login/            # Login page logic
├── components/           # React components
│   ├── admin/            # Admin-specific components
│   ├── landing/          # Landing page sections
│   └── ui/               # Reusable primitives (shadcn)
├── lib/                  # Shared utilities and clients
│   ├── prisma.ts         # Prisma global client
│   └── supabase/         # Supabase client configurations
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## 📖 Documentation

For detailed guides, please refer to:
- [Architectural Overview](docs/ARCHITECTURAL_OVERVIEW.md) - Understanding the data flow and RBAC.
- [Setup Guide](docs/SETUP_GUIDE.md) - Getting started with Supabase and Prisma.

## ⚡ Getting Started

### 1. Prerequisites
- Node.js 18+ 
- A Supabase project

### 2. Configure Environment
Create a `.env` file in the root:
```env
DATABASE_URL="your-connection-pooler-url"
DIRECT_URL="your-direct-connection-url"
NEXT_PUBLIC_SUPABASE_URL="your-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Installation & Setup
```bash
npm install
npx prisma generate
npm run dev
```

## 📜 Standards & Notes
- **Server Components:** Prioritized for data fetching to reduce client-side bundle size.
- **Type Safety:** Full end-to-end type safety using Prisma-generated types.
- **I18n:** Current UI copy is in Spanish (targeted at the LATAM/Spain market).
