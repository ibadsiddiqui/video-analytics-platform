# Multi-Agent Coordination Plan

**Project**: Video Analytics Platform
**Last Updated**: December 31, 2024
**Status**: Active Development

---

## Purpose of This Document

This document serves as the **single source of truth** for multi-agent collaboration on this project. It prevents:
- ✅ Duplicate work
- ✅ Context loss between agent sessions
- ✅ Conflicting approaches
- ✅ Incomplete handoffs

**All agents MUST read this document before starting any task.**

---

## Project Overview

### What This Project Is

A full-stack **video analytics platform** that analyzes YouTube and Instagram videos, providing:
- Video metrics (views, likes, comments, engagement rate)
- Sentiment analysis of comments
- Keyword extraction
- Hashtag tracking
- Audience demographics
- Engagement patterns

### Tech Stack

**Frontend**:
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Recharts (charts)

**Backend**:
- TypeScript (100% - NO JavaScript)
- Node.js + Express
- routing-controllers (decorator-based routing)
- TypeDI (dependency injection)
- Prisma ORM
- Clean Architecture

**Infrastructure**:
- PostgreSQL (Vercel Postgres/Neon/Supabase)
- Upstash Redis (caching)
- YouTube Data API v3
- RapidAPI (Instagram)

**Deployment**:
- Vercel (serverless functions)

---

## Current Project State

### ✅ COMPLETED (Do NOT Redo)

#### Backend Migration (100% Complete)
- [x] **Phase 1**: TypeScript setup with Clean Architecture ✅
- [x] **Phase 2**: Core services migration (Cache, YouTube, Analytics) ✅
- [x] **Phase 3**: Controllers & DTOs with routing-controllers ✅
- [x] **Phase 4**: Remaining services (Instagram, Sentiment) ✅
- [x] **Phase 5**: Testing, documentation, production readiness ✅

**Key Achievement**: Backend is **100% TypeScript** with Clean Architecture, TypeDI, and routing-controllers.

#### Frontend Migration (100% Complete)
- [x] Converted from Vite to Next.js 15 ✅
- [x] Updated to React 19 ✅
- [x] All components updated with 'use client' directive ✅
- [x] Environment variables updated (VITE_API_URL → NEXT_PUBLIC_API_URL) ✅
- [x] Tailwind CSS configured for Next.js ✅

**Key Achievement**: Frontend is **Next.js 15** with React 19, fully functional.

#### Documentation (100% Complete)
- [x] README.md (root) - Complete overview ✅
- [x] CLAUDE.md - AI assistant guidance ✅
- [x] PROJECT_STATUS.md - Project tracking ✅
- [x] backend/README.md - Backend documentation ✅
- [x] backend/ARCHITECTURE.md - Clean Architecture guide ✅
- [x] backend/TYPESCRIPT_MIGRATION.md - Migration guide ✅
- [x] backend/MIGRATION_COMPLETE.md - Completion report ✅
- [x] MULTI_AGENT_PLAN.md - This document ✅

### 🚧 IN PROGRESS

**None currently** - All major migrations complete.

### 📋 NEXT TASKS (Priority Order)

1. **Testing & Quality Assurance**
   - Run full integration tests
   - Test frontend-backend integration
   - Verify all API endpoints work
   - Load testing

2. **Deployment Preparation**
   - Set up Vercel projects (frontend + backend)
   - Configure environment variables in Vercel
   - Set up PostgreSQL database (production)
   - Set up Upstash Redis (production)

3. **Feature Enhancements** (Future)
   - Add more platforms (TikTok, Vimeo)
   - Improve sentiment analysis
   - Add video comparison UI
   - Real-time analytics updates

---

## Project Structure

### Root Directory

```
video-analytics-platform/
├── frontend/           # Next.js 15 application
├── backend/            # TypeScript backend (Clean Architecture)
├── README.md           # Main project overview
├── CLAUDE.md           # AI assistant guidance
├── PROJECT_STATUS.md   # Project tracking
└── MULTI_AGENT_PLAN.md # This file
```

### Backend Structure (IMPORTANT)

```
backend/
├── src/                # TypeScript ONLY (NO JavaScript!)
│   ├── domain/         # Core business logic
│   │   ├── entities/       # Video, Channel, Comment
│   │   ├── exceptions/     # Custom exceptions
│   │   ├── interfaces/     # Service contracts
│   │   └── value-objects/  # VideoMetrics, Sentiment
│   ├── application/    # Use cases and DTOs
│   │   ├── use-cases/      # AnalyzeVideoUseCase, etc.
│   │   ├── dtos/           # Request/Response DTOs
│   │   └── mappers/        # Data transformers
│   ├── infrastructure/ # External integrations
│   │   ├── cache/          # RedisCacheService
│   │   ├── database/       # Prisma repositories
│   │   └── external-apis/  # YouTube, Instagram, Sentiment
│   ├── presentation/   # HTTP layer
│   │   ├── controllers/    # HealthController, AnalyticsController
│   │   └── middleware/     # ErrorHandler
│   ├── shared/         # Cross-cutting concerns
│   │   ├── config/         # ConfigService
│   │   └── constants/      # Platform enums
│   ├── __tests__/      # Test files
│   ├── App.ts          # Application bootstrap
│   ├── index.ts        # Entry point
│   └── test-setup.ts   # Jest setup
├── dist/               # Compiled JavaScript (gitignored)
├── prisma/             # Database schema
├── coverage/           # Test coverage (gitignored)
└── [config files]      # tsconfig.json, jest.config.js, etc.
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── layout.jsx  # Root layout
│   │   └── page.jsx    # Home page (client component)
│   ├── components/     # React components (all 'use client')
│   │   ├── Header.jsx
│   │   ├── SearchBar.jsx
│   │   ├── MetricsGrid.jsx
│   │   ├── EngagementChart.jsx
│   │   ├── SentimentChart.jsx
│   │   ├── DemographicsChart.jsx
│   │   ├── KeywordsCloud.jsx
│   │   ├── TopComments.jsx
│   │   ├── VideoPreview.jsx
│   │   ├── LoadingState.jsx
│   │   └── EmptyState.jsx
│   ├── hooks/          # Custom React hooks
│   │   └── useAnalytics.js
│   └── styles/         # Tailwind CSS
│       └── index.css
├── public/             # Static assets
├── next.config.js      # Next.js configuration
├── tailwind.config.js  # Tailwind configuration
└── package.json
```

---

## Architecture Principles

### Backend: Clean Architecture

**Dependency Rule**: Dependencies point INWARD only.

```
Presentation Layer (Controllers)
        ↓
Application Layer (Use Cases, DTOs)
        ↓
Domain Layer (Entities, Interfaces)
        ↑
Infrastructure Layer (External Services)
```

**Key Principles**:
1. Domain layer has NO external dependencies
2. Infrastructure implements domain interfaces
3. Use cases orchestrate business logic
4. Controllers delegate to use cases
5. TypeDI handles dependency injection

### Frontend: Component Architecture

**Pattern**: Container/Presentational Components

```
page.jsx (Container - 'use client')
  ├── useAnalytics hook (data fetching)
  ├── Header (Presentational)
  ├── SearchBar (Presentational + state)
  └── Conditional rendering:
      ├── LoadingState
      ├── EmptyState
      └── Analytics Components
```

**Key Principles**:
1. All components are client components ('use client')
2. Framer Motion for animations
3. Recharts for data visualization
4. Tailwind CSS for styling
5. React hooks for state management

---

## Key Decisions Made

### Backend Decisions

1. **TypeScript ONLY** ✅
   - NO JavaScript files in src/
   - Strict mode enabled
   - Path aliases configured (@domain, @application, etc.)

2. **Clean Architecture** ✅
   - Clear layer separation
   - Domain-driven design
   - SOLID principles

3. **Dependency Injection** ✅
   - TypeDI for DI container
   - Constructor injection
   - @Service() decorators

4. **Routing** ✅
   - routing-controllers (decorator-based)
   - @JsonController(), @Get(), @Post(), etc.
   - Automatic serialization

5. **Validation** ✅
   - class-validator on all DTOs
   - @IsUrl(), @IsNotEmpty(), etc.
   - Automatic validation

6. **Package Manager** ✅
   - **YARN for backend**
   - npm for frontend

### Frontend Decisions

1. **Framework** ✅
   - Next.js 15 (App Router)
   - React 19
   - TypeScript configuration ready (but not yet migrated)

2. **Styling** ✅
   - Tailwind CSS
   - Custom design system
   - Glass morphism effects

3. **State Management** ✅
   - React hooks (useState, useCallback)
   - Custom useAnalytics hook
   - No Redux (keeping it simple)

4. **API Calls** ✅
   - Native fetch API
   - Proxy via next.config.js
   - Environment variables (NEXT_PUBLIC_API_URL)

---

## Common Tasks & How to Do Them

### Task: Add a New Backend Endpoint

**Steps**:
1. Create DTO in `application/dtos/` with validation
2. Create use case in `application/use-cases/`
3. Inject required services via constructor
4. Add controller method with decorators:
   ```typescript
   @Post('/endpoint')
   async method(@Body() dto: MyDTO): Promise<Response> {
     return this.useCase.execute(dto);
   }
   ```
5. Write tests in `__tests__/`

**Example**: See `AnalyticsController.ts`

### Task: Add a New Platform (e.g., TikTok)

**Steps**:
1. Create `TikTokService.ts` in `infrastructure/external-apis/`
2. Implement `IVideoService` interface
3. Add `@Service()` decorator (auto-registers with TypeDI)
4. Update `Platform` enum in `shared/constants/Platform.ts`
5. Update `DetectPlatformUseCase` to detect TikTok URLs
6. Update `AnalyzeVideoUseCase` to use TikTokService
7. Write tests

### Task: Add a New Frontend Component

**Steps**:
1. Create component file in `src/components/`
2. Add `'use client'` directive at top
3. Use Framer Motion for animations
4. Use Tailwind for styling
5. Export component
6. Import in `page.jsx`

**Example**: See `MetricsGrid.jsx`

### Task: Update Environment Variables

**Backend** (.env):
```env
DATABASE_URL="postgresql://..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
YOUTUBE_API_KEY="..."
RAPIDAPI_KEY="..." (optional)
FRONTEND_URL="http://localhost:3000"
```

**Frontend** (.env.local):
```env
NEXT_PUBLIC_API_URL="/api"  # or full URL for production
```

### Task: Run the Application

**Backend**:
```bash
cd backend
yarn install          # Install dependencies
yarn dev              # Development server
yarn type-check       # TypeScript checking
yarn build            # Build for production
yarn start            # Production server
yarn test             # Run tests
```

**Frontend**:
```bash
cd frontend
npm install           # Install dependencies
npm run dev           # Development server
npm run build         # Build for production
npm start             # Production server
```

**Both**:
1. Terminal 1: `cd backend && yarn dev`
2. Terminal 2: `cd frontend && npm run dev`
3. Open http://localhost:3000

### Task: Deploy to Vercel

**Backend**:
1. Push to GitHub
2. Import in Vercel
3. Set root directory: `backend`
4. Add environment variables
5. Deploy

**Frontend**:
1. Create new Vercel project
2. Set root directory: `frontend`
3. Add `NEXT_PUBLIC_API_URL` (backend URL)
4. Deploy

---

## Agent-Specific Guidelines

### For Backend-NodeJS-Developer Agent

**Responsibilities**:
- TypeScript development
- API endpoints
- Service implementation
- Database integration
- Testing

**Rules**:
1. **NEVER write JavaScript** - TypeScript ONLY
2. **ALWAYS use TypeDI** for dependency injection
3. **ALWAYS follow Clean Architecture** layers
4. **ALWAYS write tests** for new code
5. **USE yarn** for package management

**Common Tasks**:
- Implement new services
- Create use cases
- Add API endpoints
- Write unit tests

### For Next.js-Frontend-Expert Agent

**Responsibilities**:
- React component development
- UI/UX implementation
- State management
- API integration
- Animations

**Rules**:
1. **ALWAYS add 'use client'** for client components
2. **USE Framer Motion** for animations
3. **USE Tailwind CSS** for styling
4. **USE Recharts** for charts
5. **FOLLOW existing patterns**

**Common Tasks**:
- Create new components
- Update UI
- Add animations
- Integrate APIs

### For Architect-Manager Agent

**Responsibilities**:
- Coordinate multi-agent work
- Review architecture decisions
- Ensure consistency
- Plan implementation
- Delegate tasks

**Rules**:
1. **READ this document FIRST** before starting
2. **CHECK PROJECT_STATUS.md** for current state
3. **DELEGATE to specialized agents** when possible
4. **AVOID duplicate work** by checking what's done
5. **UPDATE documentation** after major changes

**Common Tasks**:
- Plan new features
- Review implementations
- Coordinate agents
- Update documentation

---

## Communication Protocol

### Before Starting Any Task

1. ✅ **Read MULTI_AGENT_PLAN.md** (this file)
2. ✅ **Check PROJECT_STATUS.md** for current state
3. ✅ **Review CLAUDE.md** for project guidance
4. ✅ **Check relevant ARCHITECTURE.md** for patterns

### When Starting a Task

1. **Announce your task** in your initial response
2. **Check for conflicts** with completed work
3. **Use TodoWrite** to track progress
4. **Document decisions** as you go

### When Completing a Task

1. **Update PROJECT_STATUS.md** if major work
2. **Update relevant documentation**
3. **Mark todos as complete**
4. **Leave clear handoff notes**

### When Blocked

1. **Use AskUserQuestion** to clarify
2. **Document the blocker**
3. **Don't guess** - ask for guidance

---

## Critical DO NOTs

### ❌ NEVER Do These Things

1. **DON'T write JavaScript in backend** - TypeScript ONLY
2. **DON'T modify src-ts/** - That directory doesn't exist (all code is in src/)
3. **DON'T use npm in backend** - Use YARN
4. **DON'T create parallel implementations** - Migration is complete
5. **DON'T skip tests** - Write tests for new code
6. **DON'T bypass validation** - Use class-validator
7. **DON'T hard-code configs** - Use ConfigService
8. **DON'T ignore errors** - Handle them properly
9. **DON'T duplicate documentation** - Update existing docs
10. **DON'T start without reading this doc** - Always read first!

---

## Testing Requirements

### Backend Testing

**Requirements**:
- 80%+ code coverage
- Unit tests for all services
- Integration tests for use cases
- Test doubles for external services

**Run Tests**:
```bash
cd backend
yarn test              # Run all tests
yarn test:watch        # Watch mode
yarn test:coverage     # Coverage report
```

**Test Location**: `backend/src/__tests__/`

### Frontend Testing

**Status**: Not yet implemented (future task)

**Future Requirements**:
- Component tests
- Integration tests
- E2E tests with Playwright

---

## API Endpoints

### Current Endpoints

**Health Check**:
- `GET /api/health` - Service health status

**Analytics**:
- `POST /api/analyze` - Analyze single video
- `GET /api/analyze?url=...` - Analyze via query param
- `POST /api/compare` - Compare multiple videos
- `GET /api/history/:videoId` - Get analytics history
- `POST /api/detect-platform` - Detect platform from URL

**YouTube** (future):
- `GET /api/youtube/search?q=...` - Search videos
- `GET /api/youtube/trending` - Trending videos

---

## Environment Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Upstash Redis account
- YouTube Data API key
- (Optional) RapidAPI key for Instagram

### Quick Start

```bash
# Clone repo
git clone <repo-url>
cd video-analytics-platform

# Backend setup
cd backend
yarn install
cp .env.example .env
# Edit .env with your credentials
yarn prisma:generate
yarn prisma:push
yarn dev

# Frontend setup (separate terminal)
cd ../frontend
npm install
npm run dev
```

### Access

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/api/health

---

## Troubleshooting

### Common Issues

**Issue**: "Module not found" errors
- **Solution**: Check path aliases in tsconfig.json
- Use `@domain/*`, `@application/*`, etc.

**Issue**: TypeScript compilation errors
- **Solution**: Run `yarn type-check` to see errors
- Fix type issues before running

**Issue**: Tests failing
- **Solution**: Check test setup in `test-setup.ts`
- Ensure all mocks are properly configured

**Issue**: Port already in use
- **Solution**: Kill process on port 3001 (backend) or 3000 (frontend)
- `lsof -ti:3001 | xargs kill -9`

**Issue**: Database connection errors
- **Solution**: Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Run `yarn prisma:push` to sync schema

**Issue**: Redis connection errors
- **Solution**: Check UPSTASH credentials
- App will run without Redis (caching disabled)

---

## Performance Targets

### Backend

- ✅ Type checking: <3 seconds
- ✅ Build time: <5 seconds
- ✅ Test suite: <10 seconds
- ✅ API response (cached): <500ms
- ✅ API response (uncached): <3s

### Frontend

- Target: First Contentful Paint <1.5s
- Target: Time to Interactive <3s
- Target: Lighthouse score >90

---

## Security Checklist

### Backend

- ✅ Type safety (TypeScript strict mode)
- ✅ Input validation (class-validator)
- ✅ Security headers (Helmet.js)
- ✅ CORS configuration
- ✅ Rate limiting (Redis-backed)
- ✅ URL whitelisting
- ✅ Error sanitization
- ✅ Environment validation

### Frontend

- ✅ XSS prevention (React escaping)
- ✅ HTTPS only (production)
- ✅ Secure headers
- ⚠️ CSP not yet configured (future)

---

## Deployment Checklist

### Before Deploying

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Environment variables configured
- [ ] Database schema updated
- [ ] Redis connection tested
- [ ] API keys valid
- [ ] CORS configured for production
- [ ] Error tracking set up (optional)

### Vercel Deployment

**Backend**:
1. GitHub repository connected
2. Root: `backend`
3. Build: `yarn build`
4. Output: `dist`
5. Environment variables set

**Frontend**:
1. GitHub repository connected
2. Root: `frontend`
3. Framework: Next.js
4. Environment: `NEXT_PUBLIC_API_URL`

---

## Version History

### v2.0.0 - TypeScript Migration (December 31, 2024)

**Major Changes**:
- Complete backend migration to TypeScript
- Clean Architecture implementation
- routing-controllers + TypeDI integration
- 100% type safety
- Comprehensive testing
- Full documentation

**Breaking Changes**: None (API compatible)

### v1.5.0 - Next.js Migration (December 31, 2024)

**Major Changes**:
- Frontend migrated from Vite to Next.js 15
- Updated to React 19
- All dependencies updated to latest

**Breaking Changes**: None (UI compatible)

### v1.0.0 - Initial Release

**Features**:
- YouTube analytics
- Instagram analytics
- Sentiment analysis
- Keyword extraction
- Basic UI

---

## Future Roadmap

### Phase 6: Production Deployment (Priority: HIGH)
- [ ] Deploy backend to Vercel
- [ ] Deploy frontend to Vercel
- [ ] Configure production database
- [ ] Configure production Redis
- [ ] Set up monitoring

### Phase 7: Additional Platforms (Priority: MEDIUM)
- [ ] Add TikTok support
- [ ] Add Vimeo support
- [ ] Add Twitter/X support

### Phase 8: Enhanced Analytics (Priority: MEDIUM)
- [ ] Real-time updates (WebSockets)
- [ ] Historical trend analysis
- [ ] Competitor comparison
- [ ] Export to PDF/CSV

### Phase 9: User Accounts (Priority: LOW)
- [ ] User authentication
- [ ] Save favorites
- [ ] Analytics history
- [ ] Custom dashboards

---

## Contact & Support

### Getting Help

1. **Check Documentation First**:
   - This file (MULTI_AGENT_PLAN.md)
   - CLAUDE.md
   - PROJECT_STATUS.md
   - ARCHITECTURE.md

2. **Common Issues**: See Troubleshooting section above

3. **Ask Questions**: Use AskUserQuestion tool

### Contributing

**All agents should**:
1. Read this document before starting
2. Follow architecture principles
3. Write tests
4. Update documentation
5. Coordinate with other agents

---

## Appendix

### Useful Commands Quick Reference

```bash
# Backend
cd backend
yarn install          # Install dependencies
yarn dev              # Start dev server
yarn build            # Build TypeScript
yarn start            # Start production server
yarn test             # Run tests
yarn type-check       # Check types
yarn prisma:generate  # Generate Prisma client
yarn prisma:push      # Push schema changes
yarn prisma:migrate   # Create migration

# Frontend
cd frontend
npm install           # Install dependencies
npm run dev           # Start dev server
npm run build         # Build for production
npm start             # Start production server
npm run lint          # Lint code

# Git
git status            # Check status
git add .             # Stage changes
git commit -m "msg"   # Commit
git push              # Push to remote
```

### Key File Paths

**Configuration**:
- `/backend/tsconfig.json` - TypeScript config
- `/backend/jest.config.js` - Jest config
- `/backend/nodemon.json` - Nodemon config
- `/backend/prisma/schema.prisma` - Database schema
- `/frontend/next.config.js` - Next.js config
- `/frontend/tailwind.config.js` - Tailwind config

**Documentation**:
- `/README.md` - Main README
- `/CLAUDE.md` - AI assistant guide
- `/PROJECT_STATUS.md` - Project status
- `/MULTI_AGENT_PLAN.md` - This file
- `/backend/ARCHITECTURE.md` - Backend architecture
- `/backend/TYPESCRIPT_MIGRATION.md` - Migration guide
- `/backend/MIGRATION_COMPLETE.md` - Completion report

**Entry Points**:
- `/backend/src/index.ts` - Backend entry
- `/frontend/src/app/page.jsx` - Frontend home page

---

**END OF MULTI-AGENT PLAN**

**Remember**: This is a living document. Update it when:
- Major features are completed
- Architecture decisions are made
- New patterns are established
- Common issues are discovered

**Last Updated**: December 31, 2024
**Status**: Active Development
**Next Review**: After Phase 6 (Production Deployment)
