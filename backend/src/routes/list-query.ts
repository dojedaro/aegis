import { z } from "zod";
import type { SqlValue } from "sql.js";

/** `?page=&limit=` with sane bounds (limit capped so one request can't dump a table). */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Build a parameterized WHERE clause. Column names come from code, never from the
 * request; values are always bound as parameters, so query strings cannot inject SQL.
 */
export function whereClause(filters: Record<string, SqlValue | undefined>): { sql: string; params: SqlValue[] } {
  const entries = Object.entries(filters).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return { sql: "", params: [] };
  return {
    sql: `WHERE ${entries.map(([column]) => `${column} = ?`).join(" AND ")}`,
    params: entries.map(([, value]) => value as SqlValue),
  };
}

export function pageParams({ page, limit }: Pagination): SqlValue[] {
  return [limit, (page - 1) * limit];
}
