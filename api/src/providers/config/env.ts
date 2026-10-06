import { config } from "dotenv";
import z from "zod";

if (process.env.NODE_ENV === "test") {
  config({ path: ".env.test", quiet: true });
} else {
  config({ quiet: true });
}

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  ENV_SCOPE: z
    .enum(["local", "development", "test", "production"])
    .default("local"),
  PORT: z.coerce.number().default(3030),
  DOMAIN_URL: z.string().optional(),
  WEB_URL: z.string().default("http://localhost:5173"),
  API_URL: z.string().default("http://localhost:3030"),
  LOCAL_UPLOAD_DIR: z.string().default("uploads"),

  // Storage
  DATABASE_URL: z.string(),
  CACHE_ADDR: z.string().default("redis://localhost:6379"),

  // AWS
  AWS_REGION: z.string().default("us-east-1"),
  AWS_PUBLIC_BUCKET: z.string(),
  AWS_PRIVATE_BUCKET: z.string(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // Security
  API_SECRET: z.string(),
  JWT_SECRET: z.string(),

  // Mail
  MAIL_ENABLED: z.stringbool().default(false),
  MAIL_HOST: z.string(),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_USER: z.string(),
  MAIL_PASS: z.string(),
  MAIL_FROM: z.string().optional(),

  // GitHub
  GITHUB_BASE_URL: z.string().default("https://api.github.com"),
  GITHUB_TOKEN: z.string(),
  GITHUB_TIMEOUT: z.coerce.number().default(5000),
});

const mockEnv: z.infer<typeof envSchema> = {
  // Server
  NODE_ENV: "test",
  ENV_SCOPE: "test",
  PORT: 3030,
  DOMAIN_URL: "http://localhost:3030",
  WEB_URL: "http://localhost:5173",
  API_URL: "http://localhost:3030",
  LOCAL_UPLOAD_DIR: "uploads",

  // Storage
  DATABASE_URL: "postgres://user:password@localhost:5432/db",
  CACHE_ADDR: "redis://localhost:6379",

  // AWS
  AWS_REGION: "us-east-1",
  AWS_PUBLIC_BUCKET: "my-bucket",
  AWS_PRIVATE_BUCKET: "my-private-bucket",
  AWS_ACCESS_KEY_ID: "access-key-id",
  AWS_SECRET_ACCESS_KEY: "secret-access-key",

  // Security
  API_SECRET: "api-secret",
  JWT_SECRET: "jwt-secret",

  // Mail
  MAIL_ENABLED: false,
  MAIL_HOST: "smtp.example.com",
  MAIL_PORT: 587,
  MAIL_USER: "user@example.com",
  MAIL_PASS: "password",
  MAIL_FROM: "Admin Example <admin@example.com>",

  // GitHub
  GITHUB_BASE_URL: "https://api.github.com",
  GITHUB_TOKEN: "github-token",
  GITHUB_TIMEOUT: 5000,
};

const _env = envSchema.safeParse(process.env);

if (!_env.success && process.env.NODE_ENV !== "test") {
  console.error("🚧 Invalid environment variables", _env.error.format());

  process.exit(1);
}

// biome-ignore lint/style/noNonNullAssertion: if undefined will exit
export const env = process.env.NODE_ENV === "test" ? mockEnv : _env.data!;
