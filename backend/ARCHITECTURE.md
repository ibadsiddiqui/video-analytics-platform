# Backend Architecture Documentation

## Overview

The Video Analytics Platform backend follows **Clean Architecture** principles with **TypeScript**, providing a scalable, maintainable, and testable foundation for video analytics services.

## Architectural Principles

### Clean Architecture

Our architecture is based on Uncle Bob's Clean Architecture, organizing code into concentric layers with dependency rules:

```
┌─────────────────────────────────────┐
│         Presentation Layer          │  ← Controllers, Middleware
│    (routing-controllers)            │
├─────────────────────────────────────┤
│        Application Layer            │  ← Use Cases, DTOs, Mappers
│                                     │
├─────────────────────────────────────┤
│          Domain Layer               │  ← Entities, Interfaces, Exceptions
│      (Business Logic)               │
├─────────────────────────────────────┤
│      Infrastructure Layer           │  ← External Services, DB, Cache
│                                     │
└─────────────────────────────────────┘
```

**Dependency Rule**: Dependencies point inward. Inner layers know nothing about outer layers.

### SOLID Principles

1. **Single Responsibility**: Each class has one reason to change
2. **Open/Closed**: Open for extension, closed for modification
3. **Liskov Substitution**: Interfaces can be substituted with implementations
4. **Interface Segregation**: Small, focused interfaces
5. **Dependency Inversion**: Depend on abstractions, not concretions

## Layer Details

### Domain Layer (`domain/`)

The **core** of the application containing business logic.

**Components**:

- **Entities**: Core business objects (e.g., Video, Analytics)
- **Value Objects**: Immutable objects representing values (e.g., VideoId, Platform)
- **Interfaces**: Contracts for services (e.g., IVideoService, ICacheService)
- **Exceptions**: Domain-specific errors (e.g., VideoNotFoundException)

**Rules**:
- No external dependencies
- No framework code
- Pure business logic
- Framework-agnostic

**Example**:

```typescript
// domain/interfaces/IVideoService.ts
export interface IVideoService {
  extractVideoId(url: string): string | null;
  getVideoAnalytics(url: string): Promise<VideoAnalyticsData>;
  isEnabled(): boolean;
}
```

### Application Layer (`application/`)

Orchestrates business logic and coordinates domain objects.

**Components**:

- **Use Cases**: Application-specific business rules (e.g., AnalyzeVideoUseCase)
- **DTOs**: Data Transfer Objects for API contracts
- **Mappers**: Transform between domain entities and DTOs

**Rules**:
- Orchestrates domain objects
- No framework dependencies (except decorators)
- Contains application workflows
- Implements use cases

**Example**:

```typescript
// application/use-cases/AnalyzeVideoUseCase.ts
@Service()
export class AnalyzeVideoUseCase {
  constructor(
    private youtubeService: IVideoService,
    private cacheService: ICacheService,
    private sentimentService: ISentimentService
  ) {}

  async execute(url: string): Promise<AnalyticsResult> {
    // 1. Check cache
    // 2. Fetch from platform
    // 3. Analyze sentiment
    // 4. Cache results
    // 5. Return analytics
  }
}
```

### Infrastructure Layer (`infrastructure/`)

Implements technical capabilities.

**Components**:

- **Database**: Prisma ORM, repositories
- **Cache**: Redis/Upstash implementation
- **External APIs**: YouTube, Instagram, RapidAPI clients
- **Config**: Environment configuration

**Rules**:
- Implements domain interfaces
- Framework-specific code allowed
- Database access
- External service integration

**Example**:

```typescript
// infrastructure/cache/RedisCacheService.ts
@Service()
export class RedisCacheService implements ICacheService {
  private redis: Redis;

  async get<T>(key: string): Promise<T | null> {
    // Redis-specific implementation
  }
}
```

### Presentation Layer (`presentation/`)

Handles HTTP requests and responses.

**Components**:

- **Controllers**: HTTP endpoints using routing-controllers
- **Middleware**: Request processing, error handling
- **Validators**: Custom validation logic

**Rules**:
- HTTP-specific code
- Request/response handling
- Delegates to use cases
- No business logic

**Example**:

```typescript
// presentation/controllers/AnalyticsController.ts
@JsonController('/api/analytics')
export class AnalyticsController {
  constructor(private analyzeVideoUseCase: AnalyzeVideoUseCase) {}

  @Post('/analyze')
  async analyze(@Body() request: AnalyzeVideoRequest) {
    return await this.analyzeVideoUseCase.execute(request.url);
  }
}
```

### Shared Layer (`shared/`)

Common utilities and cross-cutting concerns.

**Components**:

- **Config**: ConfigService
- **Constants**: Enums, platform definitions
- **Utils**: Helper functions
- **Container**: Dependency injection setup

## Dependency Injection

### TypeDI Container

We use **TypeDI** for dependency injection:

```typescript
import { Service } from 'typedi';

@Service()
export class YouTubeService implements IVideoService {
  constructor(private configService: ConfigService) {
    // ConfigService automatically injected
  }
}
```

### Container Setup

```typescript
// shared/Container.ts
import { Container as TypeDIContainer } from 'typedi';
import { useContainer } from 'routing-controllers';

export class Container {
  static initialize(): void {
    useContainer(TypeDIContainer);
  }
}
```

### Benefits

- **Testability**: Easy to mock dependencies
- **Loose Coupling**: Depend on interfaces, not implementations
- **Single Responsibility**: Services focus on one thing
- **Configuration**: Centralized dependency management

## Request Flow

### Typical Request Flow

```
1. HTTP Request → Controller (Presentation)
2. Controller → Use Case (Application)
3. Use Case → Service (Domain Interface)
4. Service → Implementation (Infrastructure)
5. Implementation → External API/DB
6. Response flows back through layers
```

### Example: Analyze Video

```typescript
// 1. HTTP Request
POST /api/analyze { "url": "https://youtube.com/..." }

// 2. AnalyticsController (Presentation)
@Post('/analyze')
async analyze(@Body() request: AnalyzeVideoRequest) {
  return this.analyzeVideoUseCase.execute(request);
}

// 3. AnalyzeVideoUseCase (Application)
async execute(request: AnalyzeVideoRequest) {
  // Check cache
  const cached = await this.cacheService.get(key);
  if (cached) return cached;

  // Fetch analytics
  const data = await this.youtubeService.getVideoAnalytics(url);

  // Analyze sentiment
  const sentiment = await this.sentimentService.analyze(data.comments);

  // Cache and return
  await this.cacheService.set(key, result);
  return result;
}

// 4. YouTubeService (Infrastructure)
async getVideoAnalytics(url: string) {
  // Call YouTube API
  const response = await this.youtube.videos.list(...);
  return this.transform(response);
}
```

## Error Handling

### Domain Exceptions

```typescript
// domain/exceptions/VideoNotFoundException.ts
export class VideoNotFoundException extends DomainException {
  constructor(videoId: string) {
    super(`Video ${videoId} not found`, 'VIDEO_NOT_FOUND', 404);
  }
}
```

### Error Handler Middleware

```typescript
// presentation/middleware/ErrorHandler.ts
@Middleware({ type: 'after' })
export class ErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: any, request: Request, response: Response) {
    if (error instanceof DomainException) {
      return response.status(error.statusCode).json(error.toJSON());
    }
    // Handle other errors...
  }
}
```

### Usage

```typescript
// Throw domain exception
if (!video) {
  throw new VideoNotFoundException(videoId);
}

// Automatically converted to:
// HTTP 404 { "success": false, "error": "...", "code": "VIDEO_NOT_FOUND" }
```

## Configuration Management

### ConfigService

```typescript
@Service()
export class ConfigService implements IConfigService {
  constructor() {
    this.validateRequiredConfig(); // Fail-fast
  }

  getPort(): number { return parseInt(process.env.PORT); }
  getDatabaseConfig(): DatabaseConfig { ... }
  getYouTubeConfig(): YouTubeConfig { ... }
}
```

### Benefits

- **Type Safety**: Typed configuration access
- **Fail-Fast**: Validates on startup
- **Centralized**: Single source of truth
- **Testable**: Easy to mock in tests

## Testing Strategy

### Unit Tests

Test individual components in isolation:

```typescript
describe('YouTubeService', () => {
  let service: YouTubeService;
  let mockConfig: IConfigService;

  beforeEach(() => {
    mockConfig = {
      getYouTubeConfig: () => ({ apiKey: 'test-key' }),
    };
    service = new YouTubeService(mockConfig);
  });

  it('should extract video ID from URL', () => {
    const id = service.extractVideoId('https://youtube.com/watch?v=ABC123');
    expect(id).toBe('ABC123');
  });
});
```

### Integration Tests

Test multiple layers together:

```typescript
describe('Analyze Video Flow', () => {
  it('should analyze video end-to-end', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({ url: 'https://youtube.com/watch?v=ABC123' });

    expect(response.status).toBe(200);
    expect(response.body.data.video.platform).toBe('YOUTUBE');
  });
});
```

## Design Patterns

### Repository Pattern

```typescript
interface IVideoRepository {
  findById(id: string): Promise<Video | null>;
  save(video: Video): Promise<void>;
}
```

### Factory Pattern

```typescript
class VideoServiceFactory {
  create(platform: Platform): IVideoService {
    switch (platform) {
      case Platform.YOUTUBE: return new YouTubeService();
      case Platform.INSTAGRAM: return new InstagramService();
    }
  }
}
```

### Strategy Pattern

```typescript
interface ISentimentAnalyzer {
  analyze(text: string): SentimentResult;
}

class NaturalSentimentAnalyzer implements ISentimentAnalyzer { }
class OpenAISentimentAnalyzer implements ISentimentAnalyzer { }
```

## Best Practices

### 1. Depend on Abstractions

```typescript
// Good ✅
constructor(private videoService: IVideoService) {}

// Bad ❌
constructor(private youtubeService: YouTubeService) {}
```

### 2. Fail Fast

```typescript
// Good ✅
if (!config.apiKey) {
  throw new Error('API key required');
}

// Bad ❌
if (!config.apiKey) {
  console.warn('API key missing');
  // Continue anyway...
}
```

### 3. Use Value Objects

```typescript
// Good ✅
class VideoId {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new InvalidVideoIdException(value);
    }
  }
}

// Bad ❌
function analyzeVideo(videoId: string) { }
```

### 4. Keep Controllers Thin

```typescript
// Good ✅
@Post('/analyze')
async analyze(@Body() request: AnalyzeVideoRequest) {
  return this.analyzeVideoUseCase.execute(request);
}

// Bad ❌
@Post('/analyze')
async analyze(@Body() request: AnalyzeVideoRequest) {
  const cached = await redis.get(...);
  if (cached) return cached;
  const video = await youtube.get(...);
  // 50 lines of business logic...
}
```

## Performance Considerations

### Caching Strategy

- **Video Analytics**: 1 hour TTL
- **History**: 30 days retention
- **Cache-First**: Check cache before external API
- **Graceful Degradation**: Continue if cache fails

### Database Optimization

- **Connection Pooling**: Prisma with connection limits
- **Indexes**: On foreign keys and query fields
- **Selective Loading**: Only fetch needed fields

### API Rate Limiting

- **YouTube API**: 10,000 units/day quota
- **Aggressive Caching**: Reduce API calls
- **Quota Monitoring**: Track usage

## Security Considerations

### Input Validation

- **class-validator**: DTO validation with decorators
- **URL Whitelisting**: Only allowed domains
- **Sanitization**: XSS prevention

### Error Handling

- **No Sensitive Data**: Never expose internal details
- **Structured Errors**: Consistent error format
- **Production Mode**: Hide stack traces

### Configuration

- **Environment Variables**: Never commit secrets
- **Validation**: Fail if required config missing
- **Type Safety**: Prevent configuration errors

## Monitoring and Observability

### Logging

```typescript
console.log(`[${new Date().toISOString()}] ${method} ${path} - ${status}`);
```

### Error Tracking

- Integrate Sentry/Rollbar
- Capture exceptions
- Track performance

### Health Checks

```typescript
@Get('/health')
async check(): Promise<HealthCheckResponse> {
  return {
    status: 'healthy',
    services: {
      database: '✅',
      cache: '✅',
      youtube: '✅',
    }
  };
}
```

## Future Enhancements

1. **Event-Driven Architecture**: Pub/sub for analytics updates
2. **CQRS**: Separate read/write models
3. **Microservices**: Extract platform services
4. **GraphQL**: Alternative API layer
5. **WebSockets**: Real-time analytics updates

## References

- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
