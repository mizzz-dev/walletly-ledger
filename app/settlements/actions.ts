"use server";

import { revalidatePath } from "next/cache";
import { saveSettlementRecord } from "@/lib/settlements/service";

export interface SaveSettlementState {
  ok: boolean;
  message: string;
}

export const initialSaveSettlementState: SaveSettlementState = {
  ok: false,
  message: "",
};

export const saveSettlementAction = async (
  _prevState: SaveSettlementState,
  formData: FormData,
): Promise<SaveSettlementState> => {
  try {
    const householdId = String(formData.get("householdId") ?? "");
    const ledgerId = String(formData.get("ledgerId") ?? "");
    const createdBy = String(formData.get("createdBy") ?? "");
    const fromMemberId = String(formData.get("fromMemberId") ?? "");
    const toMemberId = String(formData.get("toMemberId") ?? "");
    const amount = Number(formData.get("amount") ?? 0);
    const method = String(formData.get("method") ?? "現金");
    const note = String(formData.get("note") ?? "");
    const settledOn = String(formData.get("settledOn") ?? new Date().toISOString().slice(0, 10));
    const validMemberIds = JSON.parse(String(formData.get("validMemberIds") ?? "[]")) as string[];

    await saveSettlementRecord({
      householdId,
      ledgerId,
      fromMemberId,
      toMemberId,
      amount,
      method,
      note,
      settledOn,
      createdBy,
      validMemberIds,
    });

    revalidatePath("/settlements");

    return { ok: true, message: "精算記録を保存しました" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "精算記録の保存に失敗しました";
    return { ok: false, message };
  }
};
