import { ValidationPipe } from '@nestjs/common'
import type { CorsOptions } from '@nestjs/common/internal'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'

import { AppModule } from './app.module.js'

async function bootstrap() {
  // Build the application and its dependency graph from the root module.
  // Nest uses Express as the HTTP platform in this project.
  const app = await NestFactory.create(AppModule)

  // Helmet sets HTTP security headers. The CSP below restricts where browsers
  // can load resources from; HSTS tells HTTPS clients to keep using HTTPS.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Do not require COEP resource isolation.
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
    }),
  )

  // CORS controls which browser origins may read responses; it is not auth.
  app.enableCors({
    origin: (origin, callback) => {
      // CLI tools and server-to-server requests may have no Origin header.
      if (!origin) return callback(null, true)

      // Match comma-separated origins exactly. An unset variable allows all
      // origins; an empty string produces an allowlist containing only ''.
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['*']

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    credentials: true, // Allow browser requests that include credentials.
    maxAge: 86400, // Cache successful browser preflight checks for one day.
  } satisfies CorsOptions)

  // Apply validation to controller inputs globally. DTO classes and validation
  // decorators define the rules; the current routes have no DTO inputs.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Convert plain input objects into their DTO instances.
      whitelist: true, // Use validation decorators to identify allowed fields.
      forbidNonWhitelisted: true, // Reject extra fields instead of removing them.
    }),
  )

  // Describe the API and generate an OpenAPI document from controller metadata.
  // addBearerAuth documents a token scheme; it does not authenticate requests.
  const config = new DocumentBuilder()
    .setTitle('Marketplace API Gateway')
    .setDescription('API Gateway for Marketplace Microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  // Bind the HTTP server after all application-wide behavior is registered.
  const port = process.env.PORT ?? 8000
  await app.listen(port)

  console.log(`🚀 API Gateway is running on http://localhost:${port}`)
  console.log(`📕 Swagger docs available at http://localhost:${port}/api/docs`)
}
// Top-level await is supported because this project runs as an ES module.
await bootstrap()
