/**
 * Utility to serialize structured records into RFC 4180 compliant CSV.
 */
export function toCsvString(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]!);

  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = Array.isArray(val) ? val.join("; ") : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(",");
  const rowLines = rows.map((row) =>
    headers.map((h) => escapeCell(row[h])).join(",")
  );

  return [headerLine, ...rowLines].join("\r\n");
}
