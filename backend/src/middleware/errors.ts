import { Request, Response, NextFunction } from "express";

// Custom error classes for better error handling
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string, code?: string): ApiError {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "Insufficient permissions"): ApiError {
    return new ApiError(403, message, "FORBIDDEN");
  }

  static notFound(resource = "Resource"): ApiError {
    return new ApiError(404, `${resource} not found`, "NOT_FOUND");
  }

  static tooManyRequests(message = "Rate limit exceeded"): ApiError {
    return new ApiError(429, message, "RATE_LIMITED");
  }

  static internal(message = "Internal server error"): ApiError {
    return new ApiError(500, message, "INTERNAL_ERROR");
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).requestId || "unknown";

  // Handle known API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      request_id: requestId,
    });
    return;
  }

  // Log unexpected errors
  console.error(`[${requestId}] Unexpected error:`, err);

  // Don't leak error details in production
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
    request_id: requestId,
  });
}
