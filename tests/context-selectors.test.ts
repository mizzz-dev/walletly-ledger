import { describe, expect, test } from "vitest";
import { resolveSelectedId } from "@/lib/context/selectors";

describe("resolveSelectedId", () => {
  test("候補が有効ならそのまま返す", () => {
    expect(resolveSelectedId("h2", ["h1", "h2"])).toBe("h2");
  });

  test("候補が無効なら先頭を返す", () => {
    expect(resolveSelectedId("x", ["h1", "h2"])).toBe("h1");
  });

  test("候補がない場合はnullを返す", () => {
    expect(resolveSelectedId(undefined, [])).toBeNull();
  });
});
