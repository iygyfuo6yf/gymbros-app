import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('dev_jwt_secret_replace_me_12345'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('file:./dev.db'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  APPLE_SERVICE_ID: z.string().optional(),
  SOCIAL_TOKEN_VALIDATION_MODE: z.enum(['strict', 'test']).default('strict'),
  NUTRITION_VLM_API_URL: z.string().url().optional(),
  NUTRITION_VLM_API_KEY: z.string().optional(),
  UPLOADS_DIR: z.string().default('uploads')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const reasons = parsedEnv.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${reasons}`);
}

export const env = parsedEnv.data;
