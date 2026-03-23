// ──────────────────────────────────────────────
// REX - Fastify Type Declarations
// ──────────────────────────────────────────────

import type { FastifyInstance } from "fastify";
import type { RequestContext } from "../middleware/auth.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    ctx: RequestContext;
  }
}
