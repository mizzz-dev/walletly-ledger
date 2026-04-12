export const sanitizeAuditJson = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(([, entry]) => entry !== undefined);
  if (entries.length === 0) {
    return null;
  }

  return Object.fromEntries(entries);
};

export const buildAuditDiffPayload = ({ before, after }: { before?: unknown; after?: unknown }) => {
  return {
    beforeJson: sanitizeAuditJson(before),
    afterJson: sanitizeAuditJson(after),
  };
};
