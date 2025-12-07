import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    RESEND_API_KEY: z.string().min(1),
    NEXTAUTH_SECRET: z.string().optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    MASTER_CODE: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    MASTER_CODE: process.env.MASTER_CODE,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.NODE_ENV === "test",
  emptyStringAsUndefined: true,
});

