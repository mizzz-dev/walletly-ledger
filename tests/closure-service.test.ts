import { describe, expect, test } from "vitest";
import { validateCloseLedgerRequest } from "@/lib/accounting/closures/service";

describe("closure service validation", () => {
  test("work台帳以外で締めを拒否する", () => {
    expect(() => validateCloseLedgerRequest({ ledgerType: "family", actorUserId: "u1" })).toThrowError(
      "月次締めはwork台帳でのみ実行できます",
    );
  });

  test("actorが空なら拒否する", () => {
    expect(() => validateCloseLedgerRequest({ ledgerType: "work", actorUserId: "" })).toThrowError("実行ユーザーが不正です");
  });
});
