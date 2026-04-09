"use server";

import { revalidatePath } from "next/cache";
import { createBudgetItem, deleteBudgetItem, updateBudgetItem } from "@/lib/budgets/service";

const parseCategoryId = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "");
  return text ? text : null;
};

export const createBudgetAction = async (formData: FormData) => {
  const householdId = String(formData.get("householdId") ?? "");
  const ledgerId = String(formData.get("ledgerId") ?? "");
  const createdBy = String(formData.get("createdBy") ?? "");
  const categoryId = parseCategoryId(formData.get("categoryId"));
  const period = String(formData.get("period") ?? "");
  const amount = Number(formData.get("amount") ?? 0);

  await createBudgetItem({ householdId, ledgerId, createdBy, categoryId, period, amount });
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
};

export const updateBudgetAction = async (formData: FormData) => {
  const id = String(formData.get("id") ?? "");
  const categoryId = parseCategoryId(formData.get("categoryId"));
  const period = String(formData.get("period") ?? "");
  const amount = Number(formData.get("amount") ?? 0);

  await updateBudgetItem({ id, categoryId, period, amount });
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
};

export const deleteBudgetAction = async (formData: FormData) => {
  const id = String(formData.get("id") ?? "");
  await deleteBudgetItem(id);
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
};
