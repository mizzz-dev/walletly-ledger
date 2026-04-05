import { describe, expect, test } from "vitest";
import { toCategoryOptions } from "@/lib/categories/format";

describe("toCategoryOptions", () => {
  test("カテゴリ行を画面向けの型へ変換する", () => {
    const rows = [{ id: "c1", name: "食費", color: "#fff", ledger_id: "l1" }];
    expect(toCategoryOptions(rows)).toEqual([{ id: "c1", name: "食費", color: "#fff", ledgerId: "l1" }]);
  });
});
