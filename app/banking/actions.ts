"use server";

import { revalidatePath } from "next/cache";
import { createBankConnection, syncBankConnection } from "@/lib/banking/service";
import { BankProvider } from "@/types/domain";

export const createBankConnectionAction = async (formData: FormData): Promise<void> => {
  const householdId = String(formData.get("householdId") ?? "");
  const ledgerId = String(formData.get("ledgerId") ?? "") || null;
  const userId = String(formData.get("userId") ?? "");
  const provider = String(formData.get("provider") ?? "mock") as BankProvider;

  await createBankConnection({ householdId, ledgerId, userId, provider });

  revalidatePath("/banking");
  revalidatePath("/banking/transactions");
};

export const syncBankConnectionAction = async (formData: FormData): Promise<void> => {
  const connectionId = String(formData.get("connectionId") ?? "");
  const householdId = String(formData.get("householdId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  await syncBankConnection({ connectionId, householdId, userId });

  revalidatePath("/banking");
  revalidatePath("/banking/transactions");
};
