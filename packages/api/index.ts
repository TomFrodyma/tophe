import { auth } from "@repo/auth";
import { logger } from "@repo/logs";
import { getBaseUrl } from "@repo/utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";

import { openApiHandler, rpcHandler } from "./orpc/handler";

export { router } from "./orpc/router";

export const app = new Hono()
	.basePath("/api")
	.use(honoLogger((message, ...rest) => logger.log(message, ...rest)))
	.use(
		cors({
			origin: getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000),
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["POST", "GET", "OPTIONS"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		}),
	)
	// Auth handler. The openAPI plugin's reference page + schema are dev tooling;
	// in production they're needless public surface, so they 404 here. (Kept inside
	// this handler: a separate .use() with a /auth/... pattern breaks Hono's
	// routing for the /auth/** route below.)
	.on(["POST", "GET"], "/auth/**", (c) => {
		if (
			process.env.NODE_ENV === "production" &&
			/^\/api\/auth\/(reference|open-api)($|\/)/.test(c.req.path)
		) {
			return c.notFound();
		}
		return auth.handler(c.req.raw);
	})
	.get("/health", (c) => c.text("OK"))
	.use("*", async (c, next) => {
		const context = {
			headers: c.req.raw.headers,
		};

		const isRpc = c.req.path.includes("/rpc/");

		const handler = isRpc ? rpcHandler : openApiHandler;

		const prefix = isRpc ? "/api/rpc" : "/api";

		const { matched, response } = await handler.handle(c.req.raw, {
			prefix,
			context,
		});

		if (matched) {
			return c.newResponse(response.body, response);
		}

		await next();
	});
