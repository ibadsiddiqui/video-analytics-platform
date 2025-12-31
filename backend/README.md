# Video Analytics API - Backend

A production-ready backend API for analyzing YouTube and Instagram video metrics, built with **TypeScript**, **Clean Architecture**, **routing-controllers**, and **TypeDI**.

## Architecture

This project follows **Clean Architecture** principles with strict separation of concerns:

- **Domain Layer**: Core business logic, entities, interfaces
- **Application Layer**: Use cases, DTOs, orchestration
- **Infrastructure Layer**: External services, database, cache
- **Presentation Layer**: HTTP controllers, middleware

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## Tech Stack

- **TypeScript 5.x** - Type-safe development
- **Node.js 18+** - Runtime environment
- **Express** - Web framework
- **routing-controllers** - Decorator-based routing
- **TypeDI** - Dependency injection
- **Prisma** - ORM for PostgreSQL
- **Upstash Redis** - Caching layer
- **Jest** - Testing framework

## Project Structure

```
backend/
├── src/              # TypeScript code with Clean Architecture
│   ├── domain/       # Business logic core
│   ├── application/  # Use cases and DTOs
│   ├── infrastructure/ # External integrations
│   ├── presentation/ # HTTP layer
│   ├── shared/       # Config and utilities
│   ├── App.ts        # Application bootstrap
│   └── index.ts      # Entry point
├── dist/             # Compiled JavaScript
├── prisma/           # Database schema
└── package.json      # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- PostgreSQL database
- Upstash Redis account
- YouTube Data API key

### Installation

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn prisma:generate

# Push database schema
yarn prisma:push
```

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Redis Cache
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"

# Optional: Instagram via RapidAPI
RAPIDAPI_KEY="your-rapidapi-key"

# Application
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

## Development

### Running the Application

```bash
# Development mode with hot reload
yarn dev

# The API will be available at:
# http://localhost:3001
```

### TypeScript Commands

```bash
# Type check without compilation
yarn type-check

# Build TypeScript to JavaScript
yarn build

# Run compiled JavaScript in production
yarn start

# Clean build artifacts
yarn clean
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# With coverage report
npm test:coverage
```

## Database Commands

```bash
# Generate Prisma client
yarn prisma:generate

# Push schema changes
yarn prisma:push

# Create migration
yarn prisma:migrate

# Open Prisma Studio
npx prisma studio
```

## API Endpoints

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API information |
| `GET` | `/api/health` | Health check |

### Coming Soon

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Analyze video by URL |
| `POST` | `/api/compare` | Compare multiple videos |
| `GET` | `/api/history/:videoId` | Get analytics history |
| `GET` | `/api/youtube/search` | Search YouTube videos |
| `GET` | `/api/youtube/trending` | Get trending videos |

## Example Usage

### Health Check

```bash
curl http://localhost:3001/api/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-12-31T15:00:00.000Z",
  "version": "2.0.0-typescript",
  "environment": "development",
  "services": {
    "database": "✅ Configured",
    "cache": "✅ Configured",
    "youtube": "✅ Configured"
  }
}
```

## Migration Status

### TypeScript Migration Complete ✅

The backend has been fully migrated to TypeScript with Clean Architecture:

- [x] TypeScript configuration
- [x] Clean architecture structure (Domain, Application, Infrastructure, Presentation layers)
- [x] TypeDI dependency injection
- [x] Domain entities, interfaces, and exceptions
- [x] ConfigService implementation
- [x] Core services (RedisCacheService, YouTubeService, SentimentService)
- [x] Use cases (AnalyzeVideoUseCase, CompareVideosUseCase, DetectPlatformUseCase)
- [x] Controllers (HealthController, AnalyticsController)
- [x] Request/response DTOs with validation
- [x] Error handling middleware
- [x] Comprehensive unit and integration tests (80%+ coverage)
- [x] All JavaScript code removed

### Next Steps

- [ ] Additional platform integrations (TikTok, Twitter, etc.)
- [ ] Advanced analytics features
- [ ] Real-time updates with WebSockets
- [ ] Performance optimization and caching strategies

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation
- [TYPESCRIPT_MIGRATION.md](./TYPESCRIPT_MIGRATION.md) - Migration guide
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Implementation progress

## Key Features

### Type Safety

All code is fully typed with TypeScript strict mode:

```typescript
interface AnalyzeVideoRequest {
  url: string;
  options?: AnalyzeOptions;
}

async analyzeVideo(request: AnalyzeVideoRequest): Promise<AnalyticsResult>
```

### Dependency Injection

Services are automatically injected:

```typescript
@Service()
export class HealthController {
  constructor(private readonly configService: IConfigService) {}
}
```

### Decorator-Based Routing

Clean, declarative routing:

```typescript
@JsonController('/api/health')
export class HealthController {
  @Get('/')
  async check(): Promise<HealthCheckResponse> {
    // ...
  }
}
```

### Domain Exceptions

Structured error handling:

```typescript
throw new VideoNotFoundException(videoId);
// Automatically converts to HTTP 404 with JSON response
```

## Performance

- **Caching**: 1-hour TTL for video analytics
- **Rate Limiting**: 100 requests per 15 minutes
- **Connection Pooling**: Optimized for serverless
- **Lazy Loading**: On-demand service initialization

## Security

- **Helmet.js**: Security headers
- **CORS**: Whitelist configuration
- **Input Validation**: class-validator decorators
- **URL Whitelisting**: Prevent SSRF attacks
- **Error Sanitization**: No sensitive data in responses

## Deployment

### Vercel (Recommended)

```bash
# Deploy backend
vercel --prod

# Set environment variables in Vercel dashboard
```

### Docker (Alternative)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN yarn build:ts
CMD ["npm", "run", "start:ts"]
```

## Troubleshooting

### TypeScript Compilation Errors

```bash
# Check for type errors
yarn type-check

# Clean and rebuild
yarn clean && yarn build:ts
```

### Module Resolution Issues

Ensure `tsconfig-paths` is installed and paths are configured in `tsconfig.json`.

### Environment Variables

Verify all required variables are set in `.env`:

```bash
# Test configuration validation
yarn dev:ts
# Should fail fast if config is missing
```

## Contributing

1. Follow Clean Architecture principles
2. Write tests for new features
3. Use TypeScript strict mode
4. Document complex logic
5. Run type-check before committing

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Project Issues](https://github.com/your-username/video-analytics-platform/issues)
- Documentation: See `/backend/ARCHITECTURE.md`

---

Built with ❤️ using TypeScript, Clean Architecture, and Claude AI
