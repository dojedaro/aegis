import { Request, Response, NextFunction } from "express";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  request_id: string;
  user_id?: string;
  error?: string;
}

function formatLog(entry: LogEntry): string {
  // JSON structured logging for production (easy to parse with log aggregators)
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }

  // Human-readable format for development
  const status = entry.status >= 400 ? `\x1b[31m${entry.status}\x1b[0m` : `\x1b[32m${entry.status}\x1b[0m`;
  const method = entry.method.padEnd(6);
  const duration = `${entry.duration_ms}ms`.padStart(6);
  const user = entry.user_id ? ` [${entry.user_id}]` : "";

  return `${entry.timestamp} ${method} ${entry.path} ${status} ${duration}${user}`;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = (req as any).requestId || "unknown";

  // Capture response on finish
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const user = (req as any).user;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
      request_id: requestId,
      user_id: user?.id,
    };

    // Skip logging health check endpoints to reduce noise
    if (["/health", "/ready", "/live"].includes(req.path)) {
      return;
    }

    console.log(formatLog(logEntry));
  });

  next();
}
