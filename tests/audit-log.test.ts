import { describe, expect, test } from "vitest";
import { buildAuditDiffPayload, sanitizeAuditJson } from "@/lib/audit/payload";

describe("audit payload", () => {
  test("undefinedを除外してJSON化する", () => {
    expect(sanitizeAuditJson({ a: 1, b: undefined, c: "x" })).toEqual({ a: 1, c: "x" });
  });

  test("空オブジェクトはnullにする", () => {
    expect(sanitizeAuditJson({})).toBeNull();
    expect(sanitizeAuditJson(undefined)).toBeNull();
  });

  test("before/afterを整形する", () => {
    expect(
      buildAuditDiffPayload({
        before: { amount: 1000, note: "旧" },
        after: { amount: 1200, note: "新" },
      }),
    ).toEqual({
      beforeJson: { amount: 1000, note: "旧" },
      afterJson: { amount: 1200, note: "新" },
    });
  });

  test("主要更新でbefore/after空の場合はnull扱い", () => {
    expect(buildAuditDiffPayload({ before: {}, after: {} })).toEqual({ beforeJson: null, afterJson: null });
  });
});
