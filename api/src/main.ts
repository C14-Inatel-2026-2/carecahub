import { ValidationPipe } from "@nestjs/common";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
// import { json, urlencoded } from 'express';
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./infra/exceptions.filter";
import { LoggingInterceptor } from "./infra/logging.interceptor";
import { ResponseValidatorInterceptor } from "./infra/response-validator.interceptor";
import { env } from "./providers/config/env";
import { CorrelationIdInterceptor } from "./providers/correlation-id";
import { CustomLogger } from "./providers/logger/custom-logger.service";

async function bootstrap() {
  const isProduction = env.ENV_SCOPE === "production";
  const logger = new CustomLogger("bootstrap");
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
    // Disabled due to Evolution webhook payload size
    // bodyParser: false,
  });
  app.enableShutdownHooks();
  app.set("trust proxy", "loopback"); // Trust requests from the loopback address

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle("CarecaHub API")
      .setDescription("Keep it simple and easy to use.")
      .addBearerAuth(
        { in: "header", type: "http", scheme: "bearer", bearerFormat: "JWT" },
        "Authorization",
      )
      .setVersion("1.0")
      .setExternalDoc("Postman Collection", "/docs-json")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  }

  const devOrigins = ["http://localhost:3000", "http://localhost:5173"];

  const allowedOrigins = [env.WEB_URL, ...(isProduction ? [] : devOrigins)];

  logger.verbose(`ENV_SCOPE: ${env.ENV_SCOPE}`);
  logger.verbose(`WEB_URL: ${env.WEB_URL}`);
  logger.verbose(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);

  if (isProduction) {
    app.use(helmet());
  } else {
    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
        crossOriginEmbedderPolicy: false, // Disable to allow cross-origin requests
        // contentSecurityPolicy: false, // Disable CSP in development for easier debugging
      }),
    );
  }

  app.use(cookieParser());

  if (env.ENV_SCOPE === "local") {
    const uploadDirectory = resolve(process.cwd(), env.LOCAL_UPLOAD_DIR);
    await mkdir(uploadDirectory, { recursive: true });
    app.useStaticAssets(uploadDirectory, { prefix: "/uploads" });
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Accept-Encoding",
      "Accept-Language",
    ],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(app.get(AllExceptionsFilter));
  app.useGlobalInterceptors(
    app.get(CorrelationIdInterceptor),
    app.get(LoggingInterceptor),
    app.get(ResponseValidatorInterceptor),
  );

  await app.listen(env.PORT, () => {
    logger.verbose(
      `Server initialized on port: ${env.PORT}, environment scope: ${env.ENV_SCOPE}, apiUrl: ${env.API_URL}`,
    );
  });
}

void bootstrap();
