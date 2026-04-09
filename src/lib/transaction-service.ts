import { linkAttachmentToTransaction } from "@/lib/repositories/receipt-repository";
import { markBankTransactionImported } from "@/lib/banking/repositories/banking-repository";
import { createTransactionWithSplits, listTransactionsByLedger } from "@/lib/repositories/transaction-repository";
import { CreateTransactionInput, toSplitInsertPayloads, toTransactionInsertPayload } from "@/lib/transactions/payload";
import { TransactionListItem } from "@/types/domain";

export const createExpenseTransaction = async (input: CreateTransactionInput) => {
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
