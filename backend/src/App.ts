import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { useExpressServer } from 'routing-controllers';
import swaggerUi from 'swagger-ui-express';
import { getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { Container } from './shared/Container';
import { ConfigService } from '@shared/config';
import { HealthController, AnalyticsController } from '@presentation/controllers';
import { ErrorHandler } from '@presentation/middleware';

/**
 * Main Application Class
 * Bootstraps the Express server with routing-controllers and TypeDI
 */
export class App {
  private app: Application;
  private configService: ConfigService;

  constructor() {
    // Initialize TypeDI container
    Container.initialize();

    // Get configuration service
    this.configService = Container.getInstance().get(ConfigService);

    // Create Express app
    this.app = express();

    // Setup middleware and routing
    this.setupMiddleware();
    this.setupRoutingControllers();
    this.setupSwagger();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security headers
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false, // Disable for API
      })
    );

    // CORS
    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, Postman, etc.)
          if (!origin) return callback(null, true);

          const allowedOrigins = [
            this.configService.getFrontendUrl(),
            'http://localhost:3000',
            'http://localhost:5173',
            /\.vercel\.app$/,
          ];

          const allowed = allowedOrigins.some((allowed) => {
            if (allowed instanceof RegExp) return allowed.test(origin);
            return allowed === origin;
          });

          if (allowed) {
            callback(null, true);
          } else {
            callback(new Error('CORS not allowed'));
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // Parse JSON bodies
    this.app.use(express.json({ limit: '1mb' }));

    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      });

      next();
    });
  }

  /**
   * Setup routing-controllers
   */
  private setupRoutingControllers(): void {
    useExpressServer(this.app, {
      routePrefix: '/api', // Add /api prefix to all routes
      controllers: [HealthController, AnalyticsController],
      middlewares: [ErrorHandler],
      defaultErrorHandler: false, // Use our custom error handler
      validation: true, // Enable class-validator validation
      classTransformer: true, // Enable class-transformer
      cors: false, // We handle CORS manually above
    });

    // Root endpoint (outside /api prefix)
    this.app.get('/', (_req, res) => {
      res.json({
        name: 'Video Analytics API',
        version: '2.0.0-typescript',
        description: 'Analyze YouTube and Instagram video metrics',
        architecture: 'Clean Architecture with TypeScript',
        endpoints: {
          health: 'GET /api/health',
          analyze: 'POST /api/analyze | GET /api/analyze?url=...',
          compare: 'POST /api/compare',
          history: 'GET /api/history/:videoId?days=7',
          detectPlatform: 'POST /api/detect-platform | GET /api/detect-platform?url=...',
        },
        documentation: 'https://github.com/your-username/video-analytics-platform',
      });
    });

    console.log('✅ Routing controllers initialized');
  }

  /**
   * Setup Swagger/OpenAPI documentation
   */
  private setupSwagger(): void {
    // Generate schemas from class-validator decorators
    const schemas = validationMetadatasToSchemas({
      refPointerPrefix: '#/components/schemas/',
    });

    // Get routing-controllers metadata
    const storage = getMetadataArgsStorage();

    // Generate OpenAPI spec
    const spec = routingControllersToSpec(
      storage,
      {
        routePrefix: '/api',
        controllers: [HealthController, AnalyticsController],
        middlewares: [ErrorHandler],
      },
      {
        info: {
          title: 'Video Analytics API',
          version: '2.0.0',
          description: 'API for analyzing YouTube and Instagram video metrics with comprehensive analytics, sentiment analysis, and engagement tracking.',
          contact: {
            name: 'API Support',
            url: 'https://github.com/your-username/video-analytics-platform',
          },
        },
        servers: [
          {
            url: 'http://localhost:3001',
            description: 'Development server',
          },
          {
            url: 'https://your-production-url.vercel.app',
            description: 'Production server',
          },
        ],
        components: {
          schemas,
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        tags: [
          {
            name: 'Health',
            description: 'Health check endpoints',
          },
          {
            name: 'Analytics',
            description: 'Video analytics endpoints',
          },
        ],
      }
    );

    // Setup Swagger UI
    this.app.use('/api/spec-docs', ...(swaggerUi.serve as any));
    this.app.get('/api/spec-docs', swaggerUi.setup(spec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Video Analytics API Documentation',
      customfavIcon: '/favicon.ico',
    }) as any);

    // Serve OpenAPI JSON spec
    this.app.get('/api/spec.json', (_req, res) => {
      res.json(spec);
    });

    console.log('✅ Swagger documentation initialized at /api/spec-docs');
  }

  /**
   * Start the Express server
   */
  public start(): void {
    const port = this.configService.getPort();
    const env = this.configService.getNodeEnv();

    // Only start server if not in serverless environment (Vercel)
    if (process.env.VERCEL !== '1') {
      this.app.listen(port, () => {
        console.log(`
╔══════════════════════════════════════════╗
║   Video Analytics API v2.0               ║
║   TypeScript + Clean Architecture        ║
║   Running on http://localhost:${port}        ║
╚══════════════════════════════════════════╝

Environment: ${env}
Architecture: Clean Architecture
DI Container: TypeDI
Routing: routing-controllers
        `);
      });
    }
  }

  /**
   * Get Express app instance (for serverless export)
   */
  public getApp(): Application {
    return this.app;
  }
}
