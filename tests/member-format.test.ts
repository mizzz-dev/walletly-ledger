import { describe, expect, test } from "vitest";
import { formatMemberDisplayName, toMemberOptions } from "@/lib/memberships/format";

describe("membership format", () => {
  test("表示名が空の場合は暫定名を生成する", () => {
    expect(formatMemberDisplayName(null, "123456789")).toBe("ユーザー-12345678");
  });

  test("membership行を候補型へ変換する", () => {
    const rows = [{ id: "m1", user_id: "u1", role: "member", users: { display_name: "あや" } }];
    expect(toMemberOptions(rows)[0]?.name).toBe("あや");
  });
});
