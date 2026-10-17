import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { Actor, getActor } from "./auth";
import { RoleType } from "./validations/common";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN"
  | "RULE_VIOLATION"
  | "INTERNAL"
  | "BAD_REQUEST";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: ApiErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource conflict or stale version", details?: unknown) {
    super(409, "CONFLICT", message, details);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden: Insufficient permissions") {
    super(403, "FORBIDDEN", message);
  }
}

export class RuleViolationError extends ApiError {
  constructor(message = "Business rule violation", details?: unknown) {
    super(422, "RULE_VIOLATION", message, details);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request", details?: unknown) {
    super(400, "BAD_REQUEST", message, details);
  }
}

export interface ApiSuccessEnvelope<T> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorEnvelope {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  const envelope: ApiSuccessEnvelope<T> = {
    ok: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return NextResponse.json(envelope, { status });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  statusCode = 500,
  details?: unknown
) {
  const envelope: ApiErrorEnvelope = {
    ok: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return NextResponse.json(envelope, { status: statusCode });
}

export interface WithApiOptions<TBody, TQuery> {
  schema?: ZodSchema<TBody>;
  querySchema?: ZodSchema<TQuery>;
  roles?: RoleType[];
}

export interface ApiHandlerContext<TBody = unknown, TQuery = unknown> {
  actor: Actor;
  body: TBody;
  query: TQuery;
  params: Record<string, string>;
  req: Request;
}

export function withApi<TBody = unknown, TQuery = unknown, TRes = unknown>(
  handler: (ctx: ApiHandlerContext<TBody, TQuery>) => Promise<{ data: TRes; meta?: Record<string, unknown>; status?: number } | void>,
  options?: WithApiOptions<TBody, TQuery>
) {
  return async (req: Request, { params }: { params?: Promise<Record<string, string>> | Record<string, string> } = {}) => {
    try {
      const resolvedParams = params ? (params instanceof Promise ? await params : params) : {};
      const actor = await getActor(req);

      // RBAC check
      if (options?.roles && !options.roles.includes(actor.role)) {
        throw new ForbiddenError(`Role ${actor.role} is not permitted for this endpoint`);
      }

      // Query parsing
      let parsedQuery = {} as TQuery;
      if (options?.querySchema) {
        const url = new URL(req.url);
        const queryObj: Record<string, unknown> = {};
        url.searchParams.forEach((val, key) => {
          if (key.endsWith("[]")) {
            const cleanKey = key.slice(0, -2);
            if (!queryObj[cleanKey]) queryObj[cleanKey] = [];
            (queryObj[cleanKey] as string[]).push(val);
          } else if (queryObj[key]) {
            if (Array.isArray(queryObj[key])) {
              (queryObj[key] as string[]).push(val);
            } else {
              queryObj[key] = [queryObj[key], val];
            }
          } else {
            queryObj[key] = val;
          }
        });

        const parseResult = options.querySchema.safeParse(queryObj);
        if (!parseResult.success) {
          return apiError(
            "VALIDATION_ERROR",
            "Invalid query parameters",
            422,
            parseResult.error.issues
          );
        }
        parsedQuery = parseResult.data;
      }

      // Body parsing
      let parsedBody = {} as TBody;
      if (options?.schema && ["POST", "PATCH", "PUT"].includes(req.method)) {
        let rawBody: unknown;
        try {
          rawBody = await req.json();
        } catch {
          return apiError("BAD_REQUEST", "Malformed JSON body", 400);
        }

        const parseResult = options.schema.safeParse(rawBody);
        if (!parseResult.success) {
          return apiError(
            "VALIDATION_ERROR",
            "Validation failed",
            422,
            parseResult.error.issues
          );
        }
        parsedBody = parseResult.data;
      }

      const result = await handler({
        actor,
        body: parsedBody,
        query: parsedQuery,
        params: resolvedParams,
        req,
      });

      if (!result) {
        return new NextResponse(null, { status: 204 });
      }

      return apiSuccess(result.data, result.meta, result.status || 200);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        return apiError(err.code, err.message, err.statusCode, err.details);
      }
      if (err instanceof ZodError) {
        return apiError("VALIDATION_ERROR", "Validation failed", 422, err.issues);
      }

      console.error("Unhandled API exception:", err);
      return apiError(
        "INTERNAL",
        process.env.NODE_ENV === "production"
          ? "An unexpected internal server error occurred"
          : (err as Error).message || "Internal server error",
        500
      );
    }
  };
}
