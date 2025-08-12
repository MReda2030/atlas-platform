# Atlas Travel Platform

A comprehensive performance marketing platform for Atlas Travel Business, enabling media buyers to track campaigns, sales agents, and ROI across multiple Gulf countries.

## 🚀 Features

- **Multi-Country Campaign Tracking**: UAE, KSA, Kuwait, Qatar, Bahrain, Oman
- **Sales Agent Performance**: 48+ agents across 4 branches
- **Platform Analytics**: Meta, Google, TikTok, Snapchat, Twitter
- **Destination Management**: 10 travel destinations
- **ROI Calculations**: Comprehensive performance analytics
- **Audit Trails**: Complete change tracking
- **Role-Based Access**: Admin and Media Buyer roles

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, NextAdmin-inspired design
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (planned)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualization

## 📁 Project Structure

```
atlas-platform/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seeding
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Homepage
│   ├── components/
│   │   └── ui/           # Reusable UI components
│   └── lib/
│       ├── constants.ts  # Master data constants
│       ├── database.ts   # Prisma client
│       └── utils.ts      # Utility functions
└── docs/                 # Documentation
```

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. **Clone and setup project**
   ```bash
   cd atlas-platform
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database connection:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/atlas_db"
   ```

3. **Setup database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed master data
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open application**
   Visit [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Master Data
- **Branches**: 4 Seasons, Amazonn, Fantastic, Skyline
- **Sales Agents**: 48 agents across branches
- **Countries**: 6 target + 10 destination countries
- **Platforms**: Meta, Google, TikTok, Snapchat, Twitter

### Core Data Flow
```
Media Report → Countries → Agents → Campaigns
Sales Report → Agent → Countries → Deals → Destinations
```

## 👥 Demo Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@atlas.com | password123 |
| Media Buyer | buyer@atlas.com | password123 |

## 🗂 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database commands
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database with master data
```

## 📈 Development Roadmap

### Phase 1: Foundation (Weeks 1-3) ✅
- [x] Project setup and database schema
- [x] UI component library
- [x] Authentication pages
- [x] Dashboard overview

### Phase 2: Core Features (Weeks 4-6)
- [ ] Media report entry system
- [ ] Sales report entry system
- [ ] Form validation and error handling

### Phase 3: Analytics (Weeks 7-9)
- [ ] ROI calculation engine
- [ ] Interactive charts and visualizations
- [ ] Performance comparison tools

### Phase 4: Advanced Features (Weeks 10-12)
- [ ] Audit trail system
- [ ] Performance optimization
- [ ] Mobile responsiveness

### Phase 5: Production (Weeks 13-14)
- [ ] Testing and security
- [ ] Deployment and monitoring

## 🔧 Development Notes

### UI Design
- Inspired by NextAdmin demo design patterns
- Professional dark/light theme support
- Responsive grid layouts
- Card-based component architecture

### Data Structure
- Complex hierarchical relationships
- Full audit trail for accountability
- Optimized for analytical queries
- Master data referential integrity

### Business Logic
- Multi-dimensional attribution model
- Country-specific agent assignment
- Platform performance tracking
- Quality rating system (5 tiers)

## 🤝 Contributing

This is an internal Atlas Travel platform. For development:

1. Follow conventional commit messages
2. Use TypeScript strict mode
3. Maintain 80%+ test coverage
4. Follow NextAdmin design patterns

## 📝 License

Internal Atlas Travel Business Platform - All Rights Reserved

---

**Atlas Travel Platform** - Transforming performance marketing through data-driven insights.
