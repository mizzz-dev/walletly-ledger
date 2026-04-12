"use server";

import { revalidatePath } from "next/cache";
import { closeLedgerMonthlyPeriod } from "@/lib/accounting/closures/service";

export interface ClosePeriodState {
  ok: boolean;
  message: string;
}

export const initialClosePeriodState: ClosePeriodState = {
  ok: false,
  message: "",
};

export const closePeriodAction = async (_prevState: ClosePeriodState, formData: FormData): Promise<ClosePeriodState> => {
  try {
    const householdId = String(formData.get("householdId") ?? "");
    const ledgerId = String(formData.get("ledgerId") ?? "");
    const actorUserId = String(formData.get("actorUserId") ?? "");
    const period = String(formData.get("period") ?? "");
    const note = String(formData.get("note") ?? "");

    await closeLedgerMonthlyPeriod({
      householdId,
      ledgerId,
      actorUserId,
      period,
      note,
    });

    revalidatePath("/accounting/closures");
    revalidatePath("/accounting/journals");

    return { ok: true, message: `月次締め（${period}）を実行しました` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "月次締めに失敗しました",
    };
  }
};
