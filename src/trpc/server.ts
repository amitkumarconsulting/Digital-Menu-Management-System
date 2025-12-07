import "server-only";

import {
  createTRPCProxyClient,
  loggerLink,
  unstable_httpBatchStreamLink,
} from "@trpc/client";
import { headers } from "next/headers";
import { type AppRouter } from "~/server/api/root";
import { getUrl, transformer } from "./shared";

export const api = createTRPCProxyClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    unstable_httpBatchStreamLink({
      url: getUrl(),
      transformer,
      headers() {
        const heads = new Map(headers());
        heads.set("x-trpc-source", "rsc");
        return Object.fromEntries(heads);
      },
    }),
  ],
});

