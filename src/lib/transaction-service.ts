import { linkAttachmentToTransaction } from "@/lib/repositories/receipt-repository";
import { markBankTransactionImported } from "@/lib/banking/repositories/banking-repository";
import { createTransactionWithSplits, listTransactionsByLedger } from "@/lib/repositories/transaction-repository";
import { CreateTransactionInput, toSplitInsertPayloads, toTransactionInsertPayload } from "@/lib/transactions/payload";
import { TransactionListItem } from "@/types/domain";
import { assertLedgerPeriodEditableIfWork } from "@/lib/accounting/closure-guard";
import { writeAuditLog } from "@/lib/audit/service";

export const createExpenseTransaction = async (input: CreateTransactionInput) => {
  await assertLedgerPeriodEditableIfWork({
    householdId: input.householdId,
    ledgerId: input.ledgerId,
    date: input.transactionDate,
    operationLabel: "取引の保存",
  });

  const transaction = toTransactionInsertPayload(input);
  const splitPayloads = toSplitInsertPayloads({
    householdId: input.householdId,
    ledgerId: input.ledgerId,
    transactionId: "",
    splitResults: input.splitResults,
  });

  const transactionId = await createTransactionWithSplits({ transaction, splits: splitPayloads });

  if (input.receiptAttachmentId) {
    await linkAttachmentToTransaction({
      attachmentId: input.receiptAttachmentId,
      transactionId,
      householdId: input.householdId,
      ledgerId: input.ledgerId,
    });
  }

  if (input.importedBankTransactionId) {
    await markBankTransactionImported({
      bankTransactionId: input.importedBankTransactionId,
      transactionId,
    });
  }

  await writeAuditLog({
    householdId: input.householdId,
    ledgerId: input.ledgerId,
    actorUserId: input.createdBy,
    entityType: "transaction",
    entityId: transactionId,
    action: "create",
    afterJson: {
      amount: input.amount,
      date: input.transactionDate,
      categoryId: input.categoryId,
      payerMembershipId: input.payerMembershipId,
      sourceType: input.sourceType,
    },
    metadataJson: {
      splitCount: input.splitResults.length,
      importedBankTransactionId: input.importedBankTransactionId,
      receiptAttachmentId: input.receiptAttachmentId,
    },
  });

  return transactionId;
};

export const listTransactionItems = async ({
  householdId,
  ledgerId,
}: {
  householdId: string;
  ledgerId: string;
}): Promise<TransactionListItem[]> => {
  const rows = await listTransactionsByLedger({ householdId, ledgerId });
  return rows.map((row) => {
    const payerUsers = Array.isArray(row.payer?.users) ? row.payer?.users[0] : row.payer?.users;
    return {
      id: row.id,
      date: row.transaction_date,
      categoryName: row.categories?.name ?? "未分類",
      amount: row.amount,
      payerName: payerUsers?.display_name ?? "不明",
      note: row.note ?? "",
      presetName: row.preset?.name ?? null,
    };
  });
};
